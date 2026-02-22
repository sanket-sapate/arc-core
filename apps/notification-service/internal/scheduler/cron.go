// Package scheduler provides a global cron-based event emitter for the
// notification-service.
//
// It publishes lightweight tick events to NATS so that other services can
// react to scheduled intervals without running their own cron schedulers:
//
//	@hourly → SYSTEM_EVENTS.cron.hourly   (e.g. API key expiry check)
//	@daily  → SYSTEM_EVENTS.cron.daily    (e.g. consent review reminders)
//
// Other services subscribe to these subjects to trigger periodic work.
package scheduler

import (
	"encoding/json"
	"time"

	"github.com/robfig/cron/v3"
	"go.uber.org/zap"

	"github.com/arc-self/packages/go-core/natsclient"
)

const (
	subjectHourly = "SYSTEM_EVENTS.cron.hourly"
	subjectDaily  = "SYSTEM_EVENTS.cron.daily"
)

// cronPayload is the JSON envelope published for each tick.
type cronPayload struct {
	Event     string `json:"event"`
	Timestamp string `json:"timestamp"`
}

// CronScheduler wraps robfig/cron and publishes tick events to NATS.
type CronScheduler struct {
	cron   *cron.Cron
	nats   *natsclient.Client
	logger *zap.Logger
}

// NewCronScheduler creates and configures the scheduler.
func NewCronScheduler(nc *natsclient.Client, logger *zap.Logger) *CronScheduler {
	return &CronScheduler{
		cron:   cron.New(cron.WithSeconds()),
		nats:   nc,
		logger: logger,
	}
}

// Start registers the cron jobs and starts the scheduler.
// Call Stop() to gracefully shut down.
func (s *CronScheduler) Start() error {
	if _, err := s.cron.AddFunc("@hourly", s.publishHourly); err != nil {
		return err
	}
	if _, err := s.cron.AddFunc("@daily", s.publishDaily); err != nil {
		return err
	}

	s.cron.Start()
	s.logger.Info("cron scheduler started",
		zap.String("hourly_subject", subjectHourly),
		zap.String("daily_subject", subjectDaily),
	)
	return nil
}

// Stop gracefully stops the cron scheduler.
func (s *CronScheduler) Stop() {
	ctx := s.cron.Stop()
	<-ctx.Done()
	s.logger.Info("cron scheduler stopped")
}

func (s *CronScheduler) publishHourly() {
	s.publish(subjectHourly, "cron.hourly")
}

func (s *CronScheduler) publishDaily() {
	s.publish(subjectDaily, "cron.daily")
}

func (s *CronScheduler) publish(subject, event string) {
	payload := cronPayload{
		Event:     event,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}

	data, err := json.Marshal(payload)
	if err != nil {
		s.logger.Error("failed to marshal cron payload", zap.Error(err))
		return
	}

	// Publish via plain NATS (not JetStream) — cron ticks are ephemeral
	// signals, not events that need at-least-once delivery guarantees.
	if err := s.nats.Conn.Publish(subject, data); err != nil {
		s.logger.Error("failed to publish cron event",
			zap.String("subject", subject),
			zap.Error(err),
		)
		return
	}

	s.logger.Info("cron tick published",
		zap.String("subject", subject),
		zap.String("event", event),
	)
}
