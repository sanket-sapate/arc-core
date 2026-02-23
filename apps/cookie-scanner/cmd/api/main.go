package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"go.uber.org/zap"

	"github.com/arc-self/apps/cookie-scanner/internal/handler"
	db "github.com/arc-self/apps/cookie-scanner/internal/repository/db"
	"github.com/arc-self/apps/cookie-scanner/internal/service"
	"github.com/arc-self/packages/go-core/config"
)

func main() {
	logger, _ := zap.NewProduction()
	defer logger.Sync()

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
		secretPath = "secret/data/arc/cookie-scanner"
	}

	vaultManager, err := config.NewSecretManager(vaultAddr, vaultToken)
	if err != nil {
		logger.Fatal("Vault connection failed", zap.Error(err))
	}
	secrets, err := vaultManager.GetKV2(secretPath)
	if err != nil {
		logger.Fatal("Failed to load secrets from Vault", zap.Error(err))
	}

	pgURL, _ := secrets["PG_URL"].(string)
	if pgURL == "" {
		logger.Fatal("PG_URL not found in Vault")
	}

	// ── Database ───────────────────────────────────────────────────────────
	pool, err := pgxpool.New(context.Background(), pgURL)
	if err != nil {
		logger.Fatal("failed to connect to database", zap.Error(err))
	}
	defer pool.Close()
	logger.Info("connected to database")

	querier := db.New(pool)
	svc := service.NewScannerService(pool, querier, logger)

	// ── HTTP Server ────────────────────────────────────────────────────────
	e := echo.New()
	e.HideBanner = true
	e.Use(middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
		LogURI:    true,
		LogStatus: true,
		LogValuesFunc: func(c echo.Context, v middleware.RequestLoggerValues) error {
			logger.Info("request", zap.String("uri", v.URI), zap.Int("status", v.Status))
			return nil
		},
	}))
	e.Use(middleware.Recover())

	handler.RegisterRoutes(e, svc, logger)

	go func() {
		logger.Info("cookie-scanner listening on :8080")
		if err := e.Start(":8080"); err != nil && err != http.ErrServerClosed {
			logger.Fatal("server error", zap.Error(err))
		}
	}()

	// ── Graceful Shutdown ──────────────────────────────────────────────────
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	shutCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := e.Shutdown(shutCtx); err != nil {
		logger.Error("shutdown error", zap.Error(err))
	}
	logger.Info("cookie-scanner shut down cleanly")
}
