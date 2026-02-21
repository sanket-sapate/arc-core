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

	"github.com/arc-self/apps/audit-service/internal/repository/db"
	"github.com/arc-self/packages/go-core/natsclient"
)

// AuditConsumer pulls events from JetStream and persists them as audit logs.
type AuditConsumer struct {
	nats    *natsclient.Client
	querier db.Querier
	logger  *zap.Logger
	tracer  trace.Tracer
}

// OutboxEvent is the canonical envelope published by the CDC worker to NATS.
//
// IMPORTANT: UUID fields (ID, AggregateID, ActorID) use plain string types
// here because the CDC worker encodes them as standard hex UUID strings
// (e.g. "550e8400-e29b-41d4-a716-446655440000"). Using pgtype.UUID here
// would cause silent zero-value deserialization because pgtype.UUID.UnmarshalJSON
// expects the Postgres wire-format, not a hex string.
//
// Payload uses json.RawMessage so it is preserved verbatim from the CDC JSON —
// if it were []byte, encoding/json would base64-encode the raw JSON object,
// breaking extractTraceContext and the downstream JSONB insertion.
//
// Fixes: FLAW-1.1 (UUID zero-value), FLAW-1.2 (base64-encoded payload).
type OutboxEvent struct {
	ID            string          `json:"id"`
	AggregateType string          `json:"aggregate_type"`
	AggregateID   string          `json:"aggregate_id"`
	ActorID       string          `json:"actor_id"`
	Type          string          `json:"type"`
	Payload       json.RawMessage `json:"payload"`
}

// NewAuditConsumer creates a new consumer bound to the given NATS client and DB querier.
func NewAuditConsumer(n *natsclient.Client, q db.Querier, l *zap.Logger) *AuditConsumer {
	return &AuditConsumer{
		nats:    n,
		querier: q,
		logger:  l,
		tracer:  otel.Tracer("audit-consumer"),
	}
}

// Start initializes a pull-based JetStream subscription and begins
// processing messages in a background goroutine.
func (c *AuditConsumer) Start(ctx context.Context) error {
	sub, err := c.nats.JS.PullSubscribe(
		"outbox.>",
		"audit-service-group",
		nats.BindStream(natsclient.StreamDomainEvents),
	)
	if err != nil {
		return err
	}

	c.logger.Info("Audit consumer initialized",
		zap.String("stream", natsclient.StreamDomainEvents),
		zap.String("durable", "audit-service-group"),
	)

	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			default:
				msgs, err := sub.Fetch(10, nats.Context(ctx))
				if err != nil {
					continue // timeout or ctx cancel — retry
				}
				for _, msg := range msgs {
					c.processMessage(ctx, msg)
				}
			}
		}
	}()

	return nil
}

// processMessage handles NATS acknowledgment based on the result of processEvent.
// This separation allows processEvent to be tested without a live NATS connection.
func (c *AuditConsumer) processMessage(ctx context.Context, msg *nats.Msg) {
	err := c.processEvent(ctx, msg.Data)
	if err != nil {
		if err.Error() == "malformed payload" {
			msg.Term() // Terminate poison pill — don't redeliver
			return
		}
		msg.Nak() // Requeue for retry
		return
	}
	msg.Ack()
}

// processEvent deserializes a raw event payload and inserts it into
// the audit_logs table, mapping string UUIDs from the NATS envelope
// to pgtype.UUID at insertion time.
func (c *AuditConsumer) processEvent(ctx context.Context, data []byte) error {
	var event OutboxEvent
	if err := json.Unmarshal(data, &event); err != nil {
		c.logger.Error("Malformed event payload", zap.Error(err))
		return fmt.Errorf("malformed payload")
	}

	// Parse string UUIDs into pgtype.UUID for the DB layer.
	// Invalid UUIDs are treated as poison-pill events and terminated.
	//
	// Fixes FLAW-1.1: previously pgtype.UUID was used directly in OutboxEvent,
	// causing silent zero-value deserialization for all UUID fields.
	eventID, err := parseStringUUID(event.ID)
	if err != nil {
		c.logger.Error("Invalid event ID UUID", zap.String("id", event.ID), zap.Error(err))
		return fmt.Errorf("malformed payload")
	}
	aggregateID := event.AggregateID

	// actor_id is optional — parse it if present; leave zero-value if empty.
	var actorID pgtype.UUID
	if event.ActorID != "" {
		actorID, err = parseStringUUID(event.ActorID)
		if err != nil {
			c.logger.Error("Invalid actor_id UUID", zap.String("actor_id", event.ActorID), zap.Error(err))
			return fmt.Errorf("malformed payload")
		}
	}

	// Extract trace context from the event payload (json.RawMessage preserves
	// the original JSON object, so extractTraceContext can unmarshal it cleanly).
	// Fixes FLAW-3.4 / FLAW-1.2: payload was previously base64-encoded, making
	// trace extraction always fail.
	ctx = c.extractTraceContext(ctx, []byte(event.Payload))

	// Create a child span linked to the original trace
	ctx, span := c.tracer.Start(ctx, "audit.processEvent",
		trace.WithAttributes(),
	)
	defer span.End()

	// organization_id may not be present in legacy events — zero UUID is acceptable.
	var orgID pgtype.UUID
	// Best-effort: extract from payload if the producing service embedded it.
	var payloadMap map[string]interface{}
	if err := json.Unmarshal(event.Payload, &payloadMap); err == nil {
		if oid, ok := payloadMap["organization_id"].(string); ok && oid != "" {
			orgID, _ = parseStringUUID(oid)
		}
	}

	err = c.querier.InsertAuditLog(ctx, db.InsertAuditLogParams{
		EventID:        eventID,
		OrganizationID: orgID,
		SourceService:  "legacy", // this consumer handles un-routed outbox.> messages
		AggregateType:  event.AggregateType,
		AggregateID:    aggregateID,
		EventType:      event.Type,
		Payload:        []byte(event.Payload), // json.RawMessage → []byte: zero-copy, correct JSONB value
		ActorID:        actorID,
		CreatedAt:      time.Now().UTC(),
	})

	if err != nil {
		c.logger.Error("Database insertion failed", zap.Error(err))
		span.RecordError(err)
		return fmt.Errorf("db error: %w", err)
	}

	return nil
}

// parseStringUUID converts a standard hex UUID string (e.g. "550e8400-...")
// into a pgtype.UUID suitable for pgx queries.
func parseStringUUID(s string) (pgtype.UUID, error) {
	var u pgtype.UUID
	if err := u.Scan(s); err != nil {
		return pgtype.UUID{}, fmt.Errorf("parse UUID %q: %w", s, err)
	}
	return u, nil
}

// extractTraceContext parses trace_id and span_id from the outbox event
// payload (injected by the producing service) and reconstructs a remote
// span context. This creates a new root span linked to the original trace,
// enabling Jaeger to display the full distributed trace across the
// synchronous → async boundary.
func (c *AuditConsumer) extractTraceContext(ctx context.Context, payload []byte) context.Context {
	var payloadMap map[string]interface{}
	if err := json.Unmarshal(payload, &payloadMap); err != nil {
		return ctx
	}

	traceIDStr, _ := payloadMap["trace_id"].(string)
	spanIDStr, _ := payloadMap["span_id"].(string)

	if traceIDStr == "" || spanIDStr == "" {
		return ctx
	}

	traceID, err := trace.TraceIDFromHex(traceIDStr)
	if err != nil {
		c.logger.Debug("invalid trace_id in payload", zap.Error(err))
		return ctx
	}

	spanID, err := trace.SpanIDFromHex(spanIDStr)
	if err != nil {
		c.logger.Debug("invalid span_id in payload", zap.Error(err))
		return ctx
	}

	// Reconstruct a remote span context
	remoteSpanCtx := trace.NewSpanContext(trace.SpanContextConfig{
		TraceID:    traceID,
		SpanID:     spanID,
		TraceFlags: trace.FlagsSampled,
		Remote:     true,
	})

	return trace.ContextWithRemoteSpanContext(ctx, remoteSpanCtx)
}
