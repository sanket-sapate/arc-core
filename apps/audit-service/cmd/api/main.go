package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"github.com/exaring/otelpgx"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"

	"github.com/arc-self/apps/audit-service/internal/consumer"
	db "github.com/arc-self/apps/audit-service/internal/repository/db"
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
		tp, err := telemetry.InitTracer(context.Background(), "audit-service", otelEndpoint)
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

	// --- Database Connection Pool (instrumented with OTel) ---
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
	logger.Info("connected to database (OTel-instrumented)", zap.String("url", pgURL))

	querier := db.New(pool)

	// --- NATS JetStream ---
	natsClient, err := natsclient.NewClient(natsURL, logger)
	if err != nil {
		logger.Fatal("NATS connection failed", zap.Error(err))
	}
	defer natsClient.Close()

	// --- Start Audit Consumer ---
	consumerCtx, consumerCancel := context.WithCancel(context.Background())
	auditConsumer := consumer.NewAuditConsumer(natsClient, querier, logger)
	if err := auditConsumer.Start(consumerCtx); err != nil {
		logger.Fatal("Failed to start audit consumer", zap.Error(err))
	}

	logger.Info("audit-service started (consumer active)")

	// --- Graceful Shutdown ---
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	logger.Info("Initiating graceful shutdown")

	// Stop the consumer loop
	consumerCancel()

	// Close NATS
	natsClient.Close()

	// Drain database pool
	pool.Close()

	logger.Info("audit-service shut down cleanly")
}
