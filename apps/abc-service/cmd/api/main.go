// @title        ABC Service API
// @version      1.0
// @description  Domain service for items and categories.
// @host         localhost:8080
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
	echoSwagger "github.com/swaggo/echo-swagger"
	"go.opentelemetry.io/contrib/instrumentation/github.com/labstack/echo/otelecho"
	"go.uber.org/zap"

	_ "github.com/arc-self/apps/abc-service/docs"
	"github.com/arc-self/apps/abc-service/internal/handler"
	db "github.com/arc-self/apps/abc-service/internal/repository/db"
	"github.com/arc-self/apps/abc-service/internal/service"
	"github.com/arc-self/packages/go-core/config"
	"github.com/arc-self/packages/go-core/natsclient"
	"github.com/arc-self/packages/go-core/telemetry"
)

func main() {
	// --- Structured Logger ---
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// --- OpenTelemetry Tracer ---
	otelEndpoint := os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
	if otelEndpoint != "" {
		tp, err := telemetry.InitTracer(context.Background(), "abc-service", otelEndpoint)
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
		secretPath = "secret/data/arc/abc-service"
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
	itemSvc := service.NewItemService(pool, querier)

	// --- HTTP Server (Echo, port 8080) ---
	e := echo.New()
	e.HideBanner = true

	// OTel tracing middleware (must be first to capture full request lifecycle)
	e.Use(otelecho.Middleware("abc-service"))

	// Propagate X-Internal-* headers from APISIX Go Runner into Go context.
	// Must run before any handler that calls coreMw.GetUserID / coreMw.GetOrgID.
	// Fixes FLAW-3.2 — without this, CreateItem/TransitionItemStatus always fail.
	e.Use(handler.InternalContextMiddleware())

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

	// Bind item handler routes
	itemHandler := handler.NewItemHandler(itemSvc)
	itemHandler.Register(e)

	// Swagger UI at /swagger/*
	e.GET("/swagger/*", echoSwagger.WrapHandler)

	go func() {
		logger.Info("abc-service HTTP server listening on :8080")
		if err := e.Start(":8080"); err != nil && err != http.ErrServerClosed {
			logger.Fatal("HTTP server failure", zap.Error(err))
		}
	}()

	logger.Info("abc-service started", zap.String("http", ":8080"))

	// --- Graceful Shutdown ---
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	logger.Info("Initiating graceful shutdown")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := e.Shutdown(shutdownCtx); err != nil {
		logger.Error("Echo shutdown error", zap.Error(err))
	}

	// NOTE: natsClient and pool are closed by the deferred calls registered at
	// startup (defer pool.Close(), defer natsClient.Close()). Do NOT call them
	// again here — pgxpool.Close() is not idempotent and panics on a second call.
	// Fixes FLAW-2.5.

	logger.Info("abc-service shut down cleanly")
}
