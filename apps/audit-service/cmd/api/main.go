// @title        Audit Service API
// @version      1.0
// @description  Immutable compliance ledger — global sink for all domain events.
// @host         localhost:8089
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

	"github.com/arc-self/apps/audit-service/internal/consumer"
	"github.com/arc-self/apps/audit-service/internal/handler"
	db "github.com/arc-self/apps/audit-service/internal/repository/db"
	"github.com/arc-self/packages/go-core/config"
	"github.com/arc-self/packages/go-core/natsclient"
	"github.com/arc-self/packages/go-core/telemetry"
)

func main() {
	// ── Structured Logger ──────────────────────────────────────────────────
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// ── OpenTelemetry Tracer ───────────────────────────────────────────────
	otelEndpoint := os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
	if otelEndpoint != "" {
		tp, err := telemetry.InitTracer(context.Background(), "audit-service", otelEndpoint)
		if err != nil {
			logger.Error("failed to init OTel tracer", zap.Error(err))
		} else {
			defer tp.Shutdown(context.Background())
			logger.Info("OTel tracer initialized", zap.String("endpoint", otelEndpoint))
		}
	}

	// ── Vault Secret Loading ───────────────────────────────────────────────
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
		secretPath = "secret/data/arc/audit-service"
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

	// ── Database Connection Pool (OTel-instrumented) ───────────────────────
	poolCfg, err := pgxpool.ParseConfig(pgURL)
	if err != nil {
		logger.Fatal("failed to parse PG_URL", zap.Error(err))
	}
	poolCfg.ConnConfig.Tracer = otelpgx.NewTracer()
	pool, err := pgxpool.NewWithConfig(context.Background(), poolCfg)
	if err != nil {
		logger.Fatal("Database connection failed", zap.Error(err))
	}
	defer pool.Close()
	logger.Info("connected to database (OTel-instrumented)")

	querier := db.New(pool)

	// ── NATS JetStream ─────────────────────────────────────────────────────
	natsClient, err := natsclient.NewClient(natsURL, logger)
	if err != nil {
		logger.Fatal("NATS connection failed", zap.Error(err))
	}
	defer natsClient.Close()

	if err := natsClient.ProvisionStreams(); err != nil {
		logger.Fatal("NATS stream provisioning failed", zap.Error(err))
	}

	// ── Consumers ─────────────────────────────────────────────────────────
	// Both consumers share a single cancellable context so they shut down
	// together with the process.
	consumerCtx, consumerCancel := context.WithCancel(context.Background())
	defer consumerCancel()

	// Legacy consumer: subscribes to un-routed "outbox.>" messages from
	// services that do not yet publish on "DOMAIN_EVENTS.*".
	legacyConsumer := consumer.NewAuditConsumer(natsClient, querier, logger)
	if err := legacyConsumer.Start(consumerCtx); err != nil {
		logger.Fatal("Failed to start legacy audit consumer", zap.Error(err))
	}
	logger.Info("legacy audit consumer started (outbox.>)")

	// Global consumer: subscribes to "DOMAIN_EVENTS.>" — the canonical
	// platform-wide routing key that carries source_service in the subject.
	globalConsumer := consumer.NewGlobalAuditConsumer(natsClient, querier, logger)
	if err := globalConsumer.Start(consumerCtx); err != nil {
		logger.Fatal("Failed to start global audit consumer", zap.Error(err))
	}
	logger.Info("global audit consumer started (DOMAIN_EVENTS.>)")

	// ── HTTP Server ────────────────────────────────────────────────────────
	e := echo.New()
	e.HideBanner = true
	e.Use(otelecho.Middleware("audit-service"))
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

	handler.RegisterRoutes(e, querier, logger)

	go func() {
		logger.Info("audit-service HTTP server listening on :8080")
		if err := e.Start(":8080"); err != nil && err != http.ErrServerClosed {
			logger.Fatal("HTTP server failure", zap.Error(err))
		}
	}()

	// ── Graceful Shutdown ──────────────────────────────────────────────────
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit
	logger.Info("initiating graceful shutdown")

	consumerCancel() // stop both consumer loops

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := e.Shutdown(shutdownCtx); err != nil {
		logger.Error("Echo shutdown error", zap.Error(err))
	}
	logger.Info("audit-service shut down cleanly")
}
