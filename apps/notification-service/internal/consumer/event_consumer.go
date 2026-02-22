// Package consumer provides the NATS JetStream consumer for the
// notification-service.
//
// It subscribes to DOMAIN_EVENTS.> (all domain events) and, for each
// message, looks up active webhooks whose subscribed_events match the
// event type extracted from the NATS subject. Matching webhooks are
// dispatched via the WebhookDispatcher.
package consumer

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"github.com/nats-io/nats.go"
	"go.uber.org/zap"

	db "github.com/arc-self/apps/notification-service/internal/repository/db"
	"github.com/arc-self/apps/notification-service/internal/dispatcher"
	"github.com/arc-self/packages/go-core/natsclient"
)

const (
	durableName     = "notification-event-consumer"
	subject         = "DOMAIN_EVENTS.>"
	fetchBatch      = 10
	fetchTimeout    = 5 * time.Second
)

// EventConsumer listens to domain events and dispatches webhooks.
type EventConsumer struct {
	nc         *natsclient.Client
	querier    db.Querier
	webhookDsp *dispatcher.WebhookDispatcher
	logger     *zap.Logger
}

// NewEventConsumer creates an EventConsumer.
func NewEventConsumer(
	nc *natsclient.Client,
	q db.Querier,
	wd *dispatcher.WebhookDispatcher,
	logger *zap.Logger,
) *EventConsumer {
	return &EventConsumer{
		nc:         nc,
		querier:    q,
		webhookDsp: wd,
		logger:     logger,
	}
}

// Start subscribes to DOMAIN_EVENTS.> as a durable pull consumer and
// processes messages until ctx is cancelled.
func (c *EventConsumer) Start(ctx context.Context) error {
	sub, err := c.nc.JS.PullSubscribe(
		subject,
		durableName,
		nats.AckExplicit(),
		nats.ManualAck(),
	)
	if err != nil {
		return err
	}

	c.logger.Info("notification event consumer started",
		zap.String("subject", subject),
		zap.String("durable", durableName),
	)

	go func() {
		for {
			select {
			case <-ctx.Done():
				c.logger.Info("notification event consumer stopping")
				return
			default:
			}

			msgs, err := sub.Fetch(fetchBatch, nats.MaxWait(fetchTimeout))
			if err != nil {
				// Timeout is expected when there are no messages.
				if err == nats.ErrTimeout {
					continue
				}
				c.logger.Error("fetch error", zap.Error(err))
				continue
			}

			for _, msg := range msgs {
				c.processMessage(ctx, msg)
			}
		}
	}()

	return nil
}

// processMessage extracts the event type from the NATS subject and
// dispatches to matching webhooks.
func (c *EventConsumer) processMessage(ctx context.Context, msg *nats.Msg) {
	// Extract event type from subject:
	//   DOMAIN_EVENTS.privacy.consent.submitted → privacy.consent.submitted
	eventType := extractEventType(msg.Subject)

	c.logger.Info("processing domain event",
		zap.String("subject", msg.Subject),
		zap.String("event_type", eventType),
	)

	// Look up all active webhooks subscribed to this event type.
	hooks, err := c.querier.GetActiveWebhooksByEvent(ctx, eventType)
	if err != nil {
		c.logger.Error("lookup webhooks failed", zap.Error(err))
		msg.Nak()
		return
	}

	if len(hooks) == 0 {
		// No webhooks registered for this event — still ACK the message
		// so it doesn't pile up.
		msg.Ack()
		return
	}

	// Unmarshal the raw payload to forward as-is.
	var payload json.RawMessage
	if err := json.Unmarshal(msg.Data, &payload); err != nil {
		c.logger.Warn("malformed event payload (terminating)", zap.Error(err))
		msg.Term()
		return
	}

	// Envelope to send to each webhook endpoint.
	envelope := map[string]interface{}{
		"event":     eventType,
		"payload":   payload,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	}

	allOK := true
	for _, hook := range hooks {
		if err := c.webhookDsp.Dispatch(ctx, hook.OrganizationID, hook.EndpointUrl, hook.SecretKey, envelope); err != nil {
			c.logger.Error("webhook dispatch failed",
				zap.String("url", hook.EndpointUrl),
				zap.Error(err),
			)
			allOK = false
		}
	}

	if allOK {
		msg.Ack()
	} else {
		// NAK so we can retry transient failures.
		msg.Nak()
	}
}

// extractEventType strips the "DOMAIN_EVENTS." prefix from a NATS subject
// to produce a dotted event name.
//
//	"DOMAIN_EVENTS.privacy.consent.submitted" → "privacy.consent.submitted"
func extractEventType(subj string) string {
	const prefix = "DOMAIN_EVENTS."
	if strings.HasPrefix(subj, prefix) {
		return subj[len(prefix):]
	}
	return subj
}
