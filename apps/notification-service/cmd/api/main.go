// Package main is the entry point for the notification-service — the central
// hub for email dispatch, webhook delivery, and global cron scheduling.
//
// Dependencies:
//   - Postgres: notification_templates, webhooks, delivery_logs
//   - NATS: consumes DOMAIN_EVENTS.>, publishes SYSTEM_EVENTS.cron.*
//   - (Future) Resend/SES: transactional email API
//
// @title        Notification Service
// @version      1.0
// @description  Central notification hub: email dispatch, HMAC-signed webhook delivery, and global cron scheduler.
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

	"github.com/arc-self/apps/notification-service/internal/consumer"
	"github.com/arc-self/apps/notification-service/internal/dispatcher"
	db "github.com/arc-self/apps/notification-service/internal/repository/db"
	"github.com/arc-self/apps/notification-service/internal/scheduler"
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
		tp, err := telemetry.InitTracer(context.Background(), "notification-service", otelEndpoint)
		if err != nil {
			logger.Error("OTel tracer init failed", zap.Error(err))
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
		secretPath = "secret/data/arc/notification-service"
	}

	vaultManager, err := config.NewSecretManager(vaultAddr, vaultToken)
	if err != nil {
		logger.Fatal("Vault connection failed", zap.Error(err))
	}
	secrets, err := vaultManager.GetKV2(secretPath)
	if err != nil {
		logger.Fatal("failed to load secrets", zap.Error(err))
	}

	pgURL := secrets["PG_URL"].(string)
	natsURL := secrets["NATS_URL"].(string)

	// ── Postgres ───────────────────────────────────────────────────────────
	poolCfg, err := pgxpool.ParseConfig(pgURL)
	if err != nil {
		logger.Fatal("bad PG_URL", zap.Error(err))
	}
	poolCfg.ConnConfig.Tracer = otelpgx.NewTracer()

	pool, err := pgxpool.NewWithConfig(context.Background(), poolCfg)
	if err != nil {
		logger.Fatal("Postgres connection failed", zap.Error(err))
	}
	defer pool.Close()
	logger.Info("Postgres connected")

	queries := db.New(pool)

	// ── NATS JetStream ─────────────────────────────────────────────────────
	natsClient, err := natsclient.NewClient(natsURL, logger)
	if err != nil {
		logger.Fatal("NATS connection failed", zap.Error(err))
	}
	defer natsClient.Close()

	if err := natsClient.ProvisionStreams(); err != nil {
		logger.Fatal("NATS stream provisioning failed", zap.Error(err))
	}
	logger.Info("NATS JetStream ready")

	// ── Dispatchers ────────────────────────────────────────────────────────
	emailDsp := dispatcher.NewEmailDispatcher(queries, logger)
	webhookDsp := dispatcher.NewWebhookDispatcher(queries, logger)

	// Silence unused variable linter — emailDsp will be used when we
	// wire email template rendering to specific domain events.
	_ = emailDsp

	// ── NATS Event Consumer ────────────────────────────────────────────────
	consumerCtx, consumerCancel := context.WithCancel(context.Background())
	defer consumerCancel()

	eventConsumer := consumer.NewEventConsumer(natsClient, queries, webhookDsp, logger)
	if err := eventConsumer.Start(consumerCtx); err != nil {
		logger.Fatal("event consumer start failed", zap.Error(err))
	}

	// ── Cron Scheduler ─────────────────────────────────────────────────────
	cronScheduler := scheduler.NewCronScheduler(natsClient, logger)
	if err := cronScheduler.Start(); err != nil {
		logger.Fatal("cron scheduler start failed", zap.Error(err))
	}

	// ── HTTP Server ────────────────────────────────────────────────────────
	e := echo.New()
	e.HideBanner = true
	e.Use(otelecho.Middleware("notification-service"))
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

	e.GET("/healthz", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	go func() {
		logger.Info("notification-service listening on :8080")
		if err := e.Start(":8080"); err != nil && err != http.ErrServerClosed {
			logger.Fatal("HTTP server failure", zap.Error(err))
		}
	}()

	// ── Graceful Shutdown ──────────────────────────────────────────────────
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit
	logger.Info("initiating graceful shutdown")

	consumerCancel()
	cronScheduler.Stop()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := e.Shutdown(shutdownCtx); err != nil {
		logger.Error("Echo shutdown error", zap.Error(err))
	}
	logger.Info("notification-service shut down cleanly")
}
