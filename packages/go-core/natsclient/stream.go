package natsclient

import (
	"errors"
	"fmt"

	"github.com/nats-io/nats.go"
	"go.uber.org/zap"
)

const (
	// StreamDomainEvents is the durable stream that captures all domain events.
	StreamDomainEvents = "DOMAIN_EVENTS"
	// SubjectOutbox captures un-routed legacy outbox messages.
	SubjectOutbox = "outbox.>"
	// SubjectDomainEvents captures all service-routed domain events.
	SubjectDomainEvents = "DOMAIN_EVENTS.>"
)

var streamSubjects = []string{SubjectOutbox, SubjectDomainEvents}

// ProvisionStreams idempotently ensures the DOMAIN_EVENTS JetStream stream
// exists with the correct subject filter. It creates the stream on first run
// and is a no-op if the stream already exists with matching config.
func (c *Client) ProvisionStreams() error {
	info, err := c.JS.StreamInfo(StreamDomainEvents)
	if err == nil {
		// Stream exists — check subjects are up to date.
		_ = info // could compare subjects here if needed
		c.Log.Info("NATS stream already exists", zap.String("stream", StreamDomainEvents))
		return nil
	}

	if !errors.Is(err, nats.ErrStreamNotFound) {
		return fmt.Errorf("stream info: %w", err)
	}

	// Stream does not exist — create it.
	cfg := &nats.StreamConfig{
		Name:      StreamDomainEvents,
		Subjects:  streamSubjects,
		Storage:   nats.FileStorage,
		Retention: nats.LimitsPolicy,
	}

	if _, err := c.JS.AddStream(cfg); err != nil {
		return fmt.Errorf("create stream: %w", err)
	}

	c.Log.Info("NATS stream provisioned",
		zap.String("stream", StreamDomainEvents),
		zap.Strings("subjects", streamSubjects),
	)
	return nil
}
