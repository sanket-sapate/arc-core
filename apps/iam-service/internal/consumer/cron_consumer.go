// Package consumer provides the NATS-based cron event consumer for the
// iam-service.
//
// It subscribes to SYSTEM_EVENTS.cron.hourly (published by the
// notification-service cron scheduler) and executes periodic maintenance
// tasks such as revoking expired API keys.
package consumer

import (
	"context"
	"time"

	"github.com/nats-io/nats.go"
	"go.uber.org/zap"

	db "github.com/arc-self/apps/iam-service/internal/repository/db"
	"github.com/arc-self/packages/go-core/natsclient"
)

const (
	cronSubject = "SYSTEM_EVENTS.cron.hourly"
	durableName = "iam-cron-hourly-consumer"
	fetchBatch  = 1
	fetchWait   = 30 * time.Second
)

// CronConsumer listens for hourly cron ticks and runs scheduled tasks.
type CronConsumer struct {
	nc      *natsclient.Client
	querier db.Querier
	logger  *zap.Logger
}

// NewCronConsumer creates a CronConsumer.
func NewCronConsumer(nc *natsclient.Client, q db.Querier, logger *zap.Logger) *CronConsumer {
	return &CronConsumer{
		nc:      nc,
		querier: q,
		logger:  logger,
	}
}

// Start subscribes to the hourly cron subject and processes ticks until
// ctx is cancelled.
func (c *CronConsumer) Start(ctx context.Context) error {
	// SYSTEM_EVENTS is a plain NATS subject (not JetStream) published by
	// the notification-service cron scheduler. We use a regular queue
	// subscription (not a pull consumer) so only one iam-service instance
	// processes each tick.
	_, err := c.nc.Conn.QueueSubscribe(cronSubject, durableName, func(msg *nats.Msg) {
		c.processTick(ctx, msg)
	})
	if err != nil {
		return err
	}

	c.logger.Info("iam cron consumer started",
		zap.String("subject", cronSubject),
		zap.String("queue", durableName),
	)

	// Block until context is cancelled.
	go func() {
		<-ctx.Done()
		c.logger.Info("iam cron consumer stopping")
	}()

	return nil
}

// processTick runs all hourly maintenance tasks.
func (c *CronConsumer) processTick(ctx context.Context, msg *nats.Msg) {
	c.logger.Info("received hourly cron tick")

	// ── Task: Revoke expired API keys ──────────────────────────────────
	rowsAffected, err := c.querier.RevokeExpiredAPIKeys(ctx)
	if err != nil {
		c.logger.Error("RevokeExpiredAPIKeys failed", zap.Error(err))
		return
	}

	if rowsAffected > 0 {
		c.logger.Info("auto-revoked expired API keys",
			zap.Int64("count", rowsAffected),
		)
	} else {
		c.logger.Debug("no expired API keys to revoke")
	}
}
