// Package main is the entry point for the public-api-service — the edge/SDK
// service that handles high-throughput public traffic from embedded client
// widgets.
//
// Design constraints (enforced here):
//   - NO Postgres dependency. This service must start and serve traffic with
//     only Redis and NATS available.
//   - Banner reads: from Redis only. A cache miss returns 404 — no DB fallback.
//   - Consent writes: published to NATS JetStream, return 202 immediately.
//     The privacy-service asynchronously persists to Postgres.
//   - CORS is permissive (*) because widgets are embedded on arbitrary domains.
// @title        Public API Service (SDK/Widget)
// @version      1.0
// @description  Edge service for embedded consent widgets. Reads banners from Redis, publishes consent events to NATS JetStream. Zero Postgres dependency.
// @host         localhost:8087
// @BasePath     /
package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/redis/go-redis/v9"
	"go.opentelemetry.io/contrib/instrumentation/github.com/labstack/echo/otelecho"
	"go.uber.org/zap"

	"github.com/arc-self/apps/public-api-service/internal/handler"
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
		tp, err := telemetry.InitTracer(context.Background(), "public-api-service", otelEndpoint)
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
		secretPath = "secret/data/arc/public-api-service"
	}

	vaultManager, err := config.NewSecretManager(vaultAddr, vaultToken)
	if err != nil {
		logger.Fatal("Vault connection failed", zap.Error(err))
	}
	secrets, err := vaultManager.GetKV2(secretPath)
	if err != nil {
		logger.Fatal("Failed to load secrets from Vault", zap.Error(err))
	}

	redisURL := secrets["REDIS_URL"].(string)
	natsURL := secrets["NATS_URL"].(string)

	// ── Redis Client ───────────────────────────────────────────────────────
	// Used exclusively for banner reads — no writes.
	redisOpts, err := redis.ParseURL(redisURL)
	if err != nil {
		logger.Fatal("failed to parse REDIS_URL", zap.Error(err))
	}
	redisClient := redis.NewClient(redisOpts)
	defer redisClient.Close()

	if err := redisClient.Ping(context.Background()).Err(); err != nil {
		logger.Fatal("Redis connection failed", zap.Error(err))
	}
	logger.Info("Redis connected", zap.String("addr", redisOpts.Addr))

	// ── NATS JetStream ─────────────────────────────────────────────────────
	// Used exclusively for consent publishes — no subscriptions in this service.
	natsClient, err := natsclient.NewClient(natsURL, logger)
	if err != nil {
		logger.Fatal("NATS connection failed", zap.Error(err))
	}
	defer natsClient.Close()

	// Idempotent — ensures the DOMAIN_EVENTS stream exists before we publish.
	if err := natsClient.ProvisionStreams(); err != nil {
		logger.Fatal("NATS stream provisioning failed", zap.Error(err))
	}
	logger.Info("NATS JetStream ready")

	// ── HTTP Server ────────────────────────────────────────────────────────
	e := echo.New()
	e.HideBanner = true

	// OTel tracing middleware
	e.Use(otelecho.Middleware("public-api-service"))

	// Permissive CORS — required because the client widget is embedded on
	// arbitrary third-party domains that are different from the API origin.
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodOptions},
		AllowHeaders: []string{
			echo.HeaderContentType,
			echo.HeaderAccept,
			"X-Organization-ID",
		},
		MaxAge: 3600,
	}))

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

	// Register SDK routes
	handler.NewSDKHandler(redisClient, natsClient, logger).Register(e)

	go func() {
		logger.Info("public-api-service listening on :8080")
		if err := e.Start(":8080"); err != nil && err != http.ErrServerClosed {
			logger.Fatal("HTTP server failure", zap.Error(err))
		}
	}()

	// ── Graceful Shutdown ──────────────────────────────────────────────────
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit
	logger.Info("initiating graceful shutdown")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := e.Shutdown(shutdownCtx); err != nil {
		logger.Error("Echo shutdown error", zap.Error(err))
	}
	logger.Info("public-api-service shut down cleanly")
}
