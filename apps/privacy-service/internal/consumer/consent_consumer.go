// Package consumer contains the NATS JetStream pull consumer that ingests
// cookie consent events published by the public-api-service and persists
// them asynchronously to Postgres.
//
// Design mirrors audit-service and trm-service consumers:
//   - Pull-based subscription for backpressure control.
//   - msg.Ack() is called ONLY after the Postgres INSERT commits.
//   - msg.Term() discards poison-pill messages (malformed JSON / bad UUIDs).
//   - msg.Nak() requeues transient failures (DB down, network blip).
//   - UUID fields decoded as plain strings; parsed to pgtype.UUID explicitly
//     to avoid the silent zero-value bug in pgtype.UUID.UnmarshalJSON.
package consumer

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/nats-io/nats.go"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"

	"github.com/arc-self/apps/privacy-service/internal/repository/db"
	"github.com/arc-self/packages/go-core/natsclient"
)

// subjectConsentSubmitted is the NATS subject published by public-api-service.
// MUST match the publisher exactly — both must use "DOMAIN_EVENTS.public.consent.submitted".
const subjectConsentSubmitted = "DOMAIN_EVENTS.public.consent.submitted"

// durableConsentConsumer identifies this consumer group in JetStream.
// All privacy-service replicas share this name (competing consumers).
const durableConsentConsumer = "privacy-consent-consumer"

// ConsentConsumer pulls consent events from JetStream and persists them.
type ConsentConsumer struct {
	nats    *natsclient.Client
	querier db.Querier
	logger  *zap.Logger
	tracer  trace.Tracer
}

// NewConsentConsumer constructs a ConsentConsumer.
func NewConsentConsumer(n *natsclient.Client, q db.Querier, l *zap.Logger) *ConsentConsumer {
	return &ConsentConsumer{
		nats:    n,
		querier: q,
		logger:  l,
		tracer:  otel.Tracer("privacy-consent-consumer"),
	}
}

// Start initialises a durable pull subscription and launches the processing
// loop in a background goroutine. Returns immediately.
func (c *ConsentConsumer) Start(ctx context.Context) error {
	sub, err := c.nats.JS.PullSubscribe(
		subjectConsentSubmitted,
		durableConsentConsumer,
		nats.BindStream(natsclient.StreamDomainEvents),
	)
	if err != nil {
		return fmt.Errorf("consent consumer: PullSubscribe: %w", err)
	}

	c.logger.Info("consent consumer initialised",
		zap.String("stream", natsclient.StreamDomainEvents),
		zap.String("durable", durableConsentConsumer),
		zap.String("subject", subjectConsentSubmitted),
	)

	go func() {
		for {
			select {
			case <-ctx.Done():
				c.logger.Info("consent consumer stopping")
				return
			default:
				msgs, err := sub.Fetch(10, nats.Context(ctx))
				if err != nil {
					// nats.ErrTimeout means the queue is empty — not an error.
					continue
				}
				for _, msg := range msgs {
					c.processMessage(ctx, msg)
				}
			}
		}
	}()

	return nil
}

// ── message dispatch ──────────────────────────────────────────────────────

// processMessage handles ACK / NAK / Term and keeps processEvent pure
// (no NATS dependency) for unit-testability.
func (c *ConsentConsumer) processMessage(ctx context.Context, msg *nats.Msg) {
	err := c.processEvent(ctx, msg.Data)
	if err != nil {
		switch err.(type) {
		case *poisonPillError:
			c.logger.Warn("terminating poison-pill consent event", zap.Error(err))
			msg.Term()
		default:
			c.logger.Error("NAK consent event (transient error)", zap.Error(err))
			msg.Nak()
		}
		return
	}
	// Ack ONLY after successful DB commit.
	msg.Ack()
}

// ── event parsing and persistence ─────────────────────────────────────────

// consentEvent is the payload published by public-api-service.
// UUID fields are plain strings — same rationale as audit-service OutboxEvent.
type consentEvent struct {
	OrganizationID string          `json:"organization_id"`
	AnonymousID    string          `json:"anonymous_id"`
	Consents       json.RawMessage `json:"consents"`
	IPAddress      string          `json:"ip_address"`
	UserAgent      string          `json:"user_agent"`
	SubmittedAt    time.Time       `json:"submitted_at"`
}

// processEvent deserialises the raw NATS payload and inserts the consent
// record into Postgres.
func (c *ConsentConsumer) processEvent(ctx context.Context, data []byte) error {
	// ── 1. Decode envelope ────────────────────────────────────────────────
	var event consentEvent
	if err := json.Unmarshal(data, &event); err != nil {
		return &poisonPillError{msg: fmt.Sprintf("unmarshal: %v", err)}
	}

	if event.OrganizationID == "" {
		return &poisonPillError{msg: "organization_id is empty"}
	}

	// ── 2. Parse UUID ─────────────────────────────────────────────────────
	orgID, err := parseStringUUID(event.OrganizationID)
	if err != nil {
		return &poisonPillError{msg: fmt.Sprintf("invalid organization_id %q: %v", event.OrganizationID, err)}
	}

	// ── 3. Trace ──────────────────────────────────────────────────────────
	ctx, span := c.tracer.Start(ctx, "privacy.consent.insert")
	defer span.End()

	// ── 4. Persist ────────────────────────────────────────────────────────
	// Consents is json.RawMessage — cast to []byte for the JSONB column.
	consentsBytes := []byte(event.Consents)
	if len(consentsBytes) == 0 {
		consentsBytes = []byte("{}")
	}

	if err := c.querier.InsertCookieConsent(ctx, db.InsertCookieConsentParams{
		OrganizationID: orgID,
		AnonymousID:    pgtype.Text{String: event.AnonymousID, Valid: event.AnonymousID != ""},
		Consents:       consentsBytes,
		IpAddress:      pgtype.Text{String: event.IPAddress, Valid: event.IPAddress != ""},
		UserAgent:      pgtype.Text{String: event.UserAgent, Valid: event.UserAgent != ""},
	}); err != nil {
		span.RecordError(err)
		return fmt.Errorf("InsertCookieConsent: %w", err)
	}

	c.logger.Info("consent persisted",
		zap.String("organization_id", event.OrganizationID),
		zap.String("anonymous_id", event.AnonymousID),
	)
	return nil
}

// ── helpers ───────────────────────────────────────────────────────────────

// poisonPillError wraps structural parse failures. processMessage terminates
// messages of this type so they are never redelivered.
type poisonPillError struct{ msg string }

func (e *poisonPillError) Error() string { return "poison pill: " + e.msg }

// parseStringUUID converts a hex UUID string to pgtype.UUID.
func parseStringUUID(s string) (pgtype.UUID, error) {
	var u pgtype.UUID
	if err := u.Scan(s); err != nil {
		return pgtype.UUID{}, fmt.Errorf("parse UUID %q: %w", s, err)
	}
	return u, nil
}
