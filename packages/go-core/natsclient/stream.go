package natsclient

import (
	"fmt"

	"github.com/nats-io/nats.go"
	"go.uber.org/zap"
)

const (
	// StreamDomainEvents is the durable stream that captures all outbox events.
	StreamDomainEvents = "DOMAIN_EVENTS"
	// SubjectOutbox is the wildcard subject hierarchy for outbox messages.
	SubjectOutbox = "outbox.>"
)

// ProvisionStreams idempotently creates the required JetStream streams.
func (c *Client) ProvisionStreams() error {
	_, err := c.JS.StreamInfo(StreamDomainEvents)
	if err == nil {
		c.Log.Info("NATS stream exists", zap.String("stream", StreamDomainEvents))
		return nil
	}

	if err != nats.ErrStreamNotFound {
		return fmt.Errorf("failed to check stream info: %w", err)
	}

	cfg := &nats.StreamConfig{
		Name:      StreamDomainEvents,
		Subjects:  []string{SubjectOutbox},
		Storage:   nats.FileStorage,
		Retention: nats.LimitsPolicy,
	}

	_, err = c.JS.AddStream(cfg)
	if err != nil {
		return fmt.Errorf("failed to create stream: %w", err)
	}

	c.Log.Info("NATS stream provisioned", zap.String("stream", StreamDomainEvents))
	return nil
}
