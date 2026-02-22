// @title        IAM Service API
// @version      1.0
// @description  Identity and Access Management service — webhook ingress and gRPC authorization.
// @host         localhost:8083
// @BasePath     /
package main

import (
	"context"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/exaring/otelpgx"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	echoSwagger "github.com/swaggo/echo-swagger"
	"go.opentelemetry.io/contrib/instrumentation/github.com/labstack/echo/otelecho"
	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"go.uber.org/zap"
	"google.golang.org/grpc"

	_ "github.com/arc-self/apps/iam-service/docs"
	"github.com/arc-self/apps/iam-service/internal/consumer"
	"github.com/arc-self/apps/iam-service/internal/handler"
	db "github.com/arc-self/apps/iam-service/internal/repository/db"
	"github.com/arc-self/apps/iam-service/internal/service"
	"github.com/arc-self/packages/go-core/config"
	"github.com/arc-self/packages/go-core/natsclient"
	pb "github.com/arc-self/packages/go-core/proto/iam/v1"
	"github.com/arc-self/packages/go-core/telemetry"
)

func main() {
	// --- Structured Logger ---
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// --- OpenTelemetry Tracer ---
	otelEndpoint := os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
	if otelEndpoint != "" {
		tp, err := telemetry.InitTracer(context.Background(), "iam-service", otelEndpoint)
		if err != nil {
			logger.Error("failed to init OTel tracer", zap.Error(err))
		} else {
			defer tp.Shutdown(context.Background())
			logger.Info("OTel tracer initialized", zap.String("endpoint", otelEndpoint))
		}
	}

	// --- Vault Secret Loading ---
	vaultAddr := os.Getenv("VAULT_ADDR")
	if vaultAddr == "" {
		vaultAddr = "http://localhost:8200"
	}
	vaultToken := os.Getenv("VAULT_TOKEN")
	if vaultToken == "" {
		vaultToken = "root"
	}
	secretPath := os.Getenv("VAULT_SECRET_PATH")
	if secretPath == "" {
		secretPath = "secret/data/arc/iam-service"
	}

	vaultManager, err := config.NewSecretManager(vaultAddr, vaultToken)
	if err != nil {
		logger.Fatal("Vault connection failed", zap.Error(err))
	}

	secrets, err := vaultManager.GetKV2(secretPath)
	if err != nil {
		logger.Fatal("Failed to load secrets from Vault", zap.Error(err))
	}

	pgURL := secrets["PG_URL"].(string)
	natsURL := secrets["NATS_URL"].(string)

	// --- Database Connection Pool (instrumented with OTel) ---
	poolCfg, err := pgxpool.ParseConfig(pgURL)
	if err != nil {
		logger.Fatal("failed to parse PG_URL", zap.Error(err))
	}
	poolCfg.ConnConfig.Tracer = otelpgx.NewTracer()

	pool, err := pgxpool.NewWithConfig(context.Background(), poolCfg)
	if err != nil {
		logger.Fatal("failed to connect to database", zap.Error(err))
	}
	defer pool.Close()
	logger.Info("connected to database (OTel-instrumented)", zap.String("url", pgURL))

	// --- NATS JetStream ---
	natsClient, err := natsclient.NewClient(natsURL, logger)
	if err != nil {
		logger.Fatal("NATS initialization failed", zap.Error(err))
	}
	defer natsClient.Close()

	if err := natsClient.ProvisionStreams(); err != nil {
		logger.Fatal("NATS stream provisioning failed", zap.Error(err))
	}

	// --- Repository & Service Layers ---
	querier := db.New(pool)

	// --- Cron Consumer (API key expiry, triggered by notification-service) ---
	consumerCtx, consumerCancel := context.WithCancel(context.Background())
	defer consumerCancel()

	cronConsumer := consumer.NewCronConsumer(natsClient, querier, logger)
	if err := cronConsumer.Start(consumerCtx); err != nil {
		logger.Fatal("cron consumer start failed", zap.Error(err))
	}

	// --- Sync Service (Keycloak → IAM) ---
	webhookPSK := ""
	if v, ok := secrets["WEBHOOK_PSK"]; ok {
		webhookPSK = v.(string)
	}
	if envPSK := os.Getenv("WEBHOOK_PSK"); envPSK != "" {
		webhookPSK = envPSK
	}
	if webhookPSK == "" {
		webhookPSK = "dev-psk-change-me" // safe default for local dev only
		logger.Warn("WEBHOOK_PSK not configured, using insecure default")
	}

	syncSvc := service.NewSyncService(querier, logger, service.SyncConfig{
		DefaultOrgName:    "default",
		EmailDomainOrgMap: map[string]string{}, // extend via config
	})

	// --- gRPC Server (port 50051, OTel-instrumented) ---
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		logger.Fatal("failed to listen on gRPC port", zap.Error(err))
	}

	grpcServer := grpc.NewServer(
		grpc.StatsHandler(otelgrpc.NewServerHandler()),
	)
	pb.RegisterIAMServiceServer(grpcServer, handler.NewGRPCAuthzHandler(querier))

	go func() {
		logger.Info("iam-service gRPC server listening on :50051")
		if err := grpcServer.Serve(lis); err != nil {
			logger.Fatal("failed to serve gRPC", zap.Error(err))
		}
	}()

	// --- HTTP Server (Echo, port 8080) ---
	e := echo.New()
	e.HideBanner = true
	// OTel tracing middleware (must be first)
	e.Use(otelecho.Middleware("iam-service"))

	e.Use(middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
		LogURI:    true,
		LogStatus: true,
		LogValuesFunc: func(c echo.Context, v middleware.RequestLoggerValues) error {
			logger.Info("HTTP request",
				zap.String("URI", v.URI),
				zap.Int("status", v.Status),
			)
			return nil
		},
	}))
	e.Use(middleware.Recover())

	// Bind webhook handler (bypasses APISIX authz, uses PSK)
	webhookHandler := handler.NewWebhookHandler(syncSvc, logger, webhookPSK)
	webhookHandler.Register(e)

	// Swagger UI at /swagger/*
	e.GET("/swagger/*", echoSwagger.WrapHandler)

	go func() {
		logger.Info("iam-service HTTP server listening on :8080")
		if err := e.Start(":8080"); err != nil && err != http.ErrServerClosed {
			logger.Fatal("HTTP server failure", zap.Error(err))
		}
	}()

	logger.Info("iam-service started", zap.String("grpc", ":50051"), zap.String("http", ":8080"))

	// --- Graceful Shutdown ---
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	logger.Info("Initiating graceful shutdown")

	// Stop cron consumer
	consumerCancel()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Drain HTTP connections
	if err := e.Shutdown(shutdownCtx); err != nil {
		logger.Error("Echo shutdown error", zap.Error(err))
	}

	// Stop accepting new gRPC RPCs; wait for in-flight to complete
	grpcServer.GracefulStop()

	// Close NATS
	natsClient.Close()

	// Drain database pool
	pool.Close()

	logger.Info("iam-service shut down cleanly")
}
