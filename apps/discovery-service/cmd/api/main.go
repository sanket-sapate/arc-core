// @title        Discovery Service API
// @version      1.0
// @description  Third-party scanning adapter and Master Data Dictionary management.
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

	"github.com/exaring/otelpgx"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"go.opentelemetry.io/contrib/instrumentation/github.com/labstack/echo/otelecho"
	"go.uber.org/zap"

	"github.com/arc-self/apps/discovery-service/internal/client"
	"github.com/arc-self/apps/discovery-service/internal/handler"
	db "github.com/arc-self/apps/discovery-service/internal/repository/db"
	"github.com/arc-self/apps/discovery-service/internal/service"
	"github.com/arc-self/apps/discovery-service/internal/worker"
	"github.com/arc-self/packages/go-core/config"
	"github.com/arc-self/packages/go-core/telemetry"
)

func main() {
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// ── OpenTelemetry ──────────────────────────────────────────────────────
	otelEndpoint := os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
	if otelEndpoint != "" {
		tp, err := telemetry.InitTracer(context.Background(), "discovery-service", otelEndpoint)
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
		secretPath = "secret/data/arc/discovery-service"
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
	scannerBaseURL := secrets["SCANNER_BASE_URL"].(string)
	scannerAPIKey, _ := secrets["SCANNER_API_KEY"].(string)

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

	// ── Third-party scanner client ─────────────────────────────────────────
	scannerClient := client.NewScannerClient(scannerBaseURL, scannerAPIKey)

	// ── Repository & Services ──────────────────────────────────────────────
	querier := db.New(pool)
	dictionarySvc := service.NewDictionaryService(pool, querier, scannerClient)
	scanSvc := service.NewScanService(pool, querier, scannerClient)

	// ── Background poller (graceful shutdown via context) ──────────────────
	pollerCtx, pollerCancel := context.WithCancel(context.Background())
	defer pollerCancel()

	poller := worker.NewScanPoller(pool, querier, scannerClient, 60*time.Second, logger)
	go poller.Run(pollerCtx)
	logger.Info("scan poller started in background")

	// ── HTTP Server ────────────────────────────────────────────────────────
	e := echo.New()
	e.HideBanner = true
	e.Use(otelecho.Middleware("discovery-service"))
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

	handler.RegisterRoutes(e, dictionarySvc, scanSvc, scannerClient, logger)

	go func() {
		logger.Info("discovery-service HTTP server listening on :8080")
		if err := e.Start(":8080"); err != nil && err != http.ErrServerClosed {
			logger.Fatal("HTTP server failure", zap.Error(err))
		}
	}()

	// ── Graceful Shutdown ──────────────────────────────────────────────────
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit
	logger.Info("initiating graceful shutdown")

	pollerCancel() // stop the background poller

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := e.Shutdown(shutdownCtx); err != nil {
		logger.Error("Echo shutdown error", zap.Error(err))
	}
	logger.Info("discovery-service shut down cleanly")
}
