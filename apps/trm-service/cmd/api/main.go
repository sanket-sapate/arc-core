// @title        TRM Service API
// @version      1.0
// @description  Third-Party Risk Management: vendors, DPAs, assessments, and Data Dictionary replication.
// @host         localhost:8088
// @BasePath     /
package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/exaring/otelpgx"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"go.opentelemetry.io/contrib/instrumentation/github.com/labstack/echo/otelecho"
	"go.uber.org/zap"

	"github.com/arc-self/apps/trm-service/internal/consumer"
	"github.com/arc-self/apps/trm-service/internal/handler"
	db "github.com/arc-self/apps/trm-service/internal/repository/db"
	"github.com/arc-self/apps/trm-service/internal/service"
	"github.com/arc-self/packages/go-core/config"
	"github.com/arc-self/packages/go-core/natsclient"
	"github.com/arc-self/packages/go-core/telemetry"
)

func main() {
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// ── OpenTelemetry ──────────────────────────────────────────────────────
	otelEndpoint := os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
	if otelEndpoint != "" {
		tp, err := telemetry.InitTracer(context.Background(), "trm-service", otelEndpoint)
		if err != nil {
			logger.Error("failed to init OTel tracer", zap.Error(err))
		} else {
			defer tp.Shutdown(context.Background())
			logger.Info("OTel tracer initialized", zap.String("endpoint", otelEndpoint))
		}
	}

	// ── Vault secrets ──────────────────────────────────────────────────────
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
		secretPath = "secret/data/arc/trm-service"
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

	// ── Database ───────────────────────────────────────────────────────────
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
	logger.Info("connected to database (OTel-instrumented)")

	// ── NATS JetStream ─────────────────────────────────────────────────────
	natsClient, err := natsclient.NewClient(natsURL, logger)
	if err != nil {
		logger.Fatal("NATS initialization failed", zap.Error(err))
	}
	defer natsClient.Close()

	// Ensure the DOMAIN_EVENTS stream exists before the consumer subscribes.
	if err := natsClient.ProvisionStreams(); err != nil {
		logger.Fatal("NATS stream provisioning failed", zap.Error(err))
	}

	// ── Repository & Services ──────────────────────────────────────────────
	querier := db.New(pool)
	vendorSvc := service.NewVendorService(pool, querier)
	dpaSvc := service.NewDPAService(pool, querier)
	assessmentSvc := service.NewAssessmentService(pool, querier)
	frameworkSvc := service.NewFrameworkService(pool, querier)
	auditCycleSvc := service.NewAuditCycleService(pool, querier)

	// ── NATS Dictionary Consumer ───────────────────────────────────────────
	// The consumer runs in its own goroutine managed by a cancellable context.
	consumerCtx, consumerCancel := context.WithCancel(context.Background())
	defer consumerCancel()

	dictConsumer := consumer.NewDictionaryConsumer(natsClient, querier, logger)
	if err := dictConsumer.Start(consumerCtx); err != nil {
		logger.Fatal("Failed to start dictionary consumer", zap.Error(err))
	}
	logger.Info("dictionary NATS consumer started")

	// ── HTTP Server ────────────────────────────────────────────────────────
	e := echo.New()
	e.HideBanner = true
	e.Use(otelecho.Middleware("trm-service"))
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

	handler.RegisterRoutes(e, vendorSvc, dpaSvc, assessmentSvc, frameworkSvc, auditCycleSvc, logger)

	go func() {
		logger.Info("trm-service HTTP server listening on :8080")
		if err := e.Start(":8080"); err != nil && err != http.ErrServerClosed {
			logger.Fatal("HTTP server failure", zap.Error(err))
		}
	}()

	// ── Graceful Shutdown ──────────────────────────────────────────────────
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit
	logger.Info("initiating graceful shutdown")

	consumerCancel() // drain the NATS consumer loop

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := e.Shutdown(shutdownCtx); err != nil {
		logger.Error("Echo shutdown error", zap.Error(err))
	}
	logger.Info("trm-service shut down cleanly")
}
