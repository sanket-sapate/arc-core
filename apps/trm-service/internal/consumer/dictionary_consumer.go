// Package consumer contains the NATS JetStream pull consumer that replicates
// Data Dictionary events from the discovery-service into the trm-service's
// local read-replica table (replicated_data_dictionary).
//
// Design principles (mirrored from audit-service):
//   - Pull-based subscription (not push) for backpressure control.
//   - msg.Ack() is called ONLY if the Postgres upsert commits successfully.
//   - msg.Nak() requeues transient failures; msg.Term() discards poison pills.
//   - UUID fields are decoded as plain strings and parsed explicitly to avoid
//     silent zero-value truncation that bgtype.UUID.UnmarshalJSON exhibits.
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

	db "github.com/arc-self/apps/trm-service/internal/repository/db"
	"github.com/arc-self/packages/go-core/natsclient"
)

// subjectFilter is the wildcard that matches all Data Dictionary events
// published by the discovery-service's CDC worker.
const subjectFilter = "outbox.>"

// durableName identifies this consumer group in JetStream.
// All trm-service replicas share the same durable name so that only one
// instance processes each message (competing consumers).
const durableName = "trm-service-dictionary-consumer"

// DictionaryConsumer replicates DataDictionaryItemCreated /
// DataDictionaryItemUpdated events into the local replicated_data_dictionary table.
type DictionaryConsumer struct {
	nats    *natsclient.Client
	querier db.Querier
	logger  *zap.Logger
	tracer  trace.Tracer
}

// NewDictionaryConsumer constructs a DictionaryConsumer.
func NewDictionaryConsumer(n *natsclient.Client, q db.Querier, l *zap.Logger) *DictionaryConsumer {
	return &DictionaryConsumer{
		nats:    n,
		querier: q,
		logger:  l,
		tracer:  otel.Tracer("trm-dictionary-consumer"),
	}
}

// Start creates a durable pull subscription and launches the processing loop
// in a background goroutine. It returns immediately.
//
// The subscription is bound to the existing DOMAIN_EVENTS stream provisioned
// by the go-core natsclient package, which means the stream must already exist
// before Start is called (guaranteed by calling natsClient.ProvisionStreams()).
func (c *DictionaryConsumer) Start(ctx context.Context) error {
	sub, err := c.nats.JS.PullSubscribe(
		subjectFilter,
		durableName,
		nats.BindStream(natsclient.StreamDomainEvents),
	)
	if err != nil {
		return fmt.Errorf("dictionary consumer: PullSubscribe: %w", err)
	}

	c.logger.Info("dictionary consumer initialised",
		zap.String("stream", natsclient.StreamDomainEvents),
		zap.String("durable", durableName),
		zap.String("subject", subjectFilter),
	)

	go func() {
		for {
			select {
			case <-ctx.Done():
				c.logger.Info("dictionary consumer stopping")
				return
			default:
				msgs, err := sub.Fetch(10, nats.Context(ctx))
				if err != nil {
					// Fetch returns nats.ErrTimeout on empty queue — not an error.
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

// processMessage dispatches a single NATS message, handles ACK/NAK/Term, and
// keeps processEvent pure (no NATS dependency) for unit-testability.
func (c *DictionaryConsumer) processMessage(ctx context.Context, msg *nats.Msg) {
	err := c.processEvent(ctx, msg.Data)
	if err != nil {
		switch err.(type) {
		case *poisonPillError:
			// Malformed — terminate so it is never redelivered.
			c.logger.Warn("terminating poison-pill dictionary event", zap.Error(err))
			msg.Term()
		default:
			// Transient error (DB down, etc.) — NAK to redeliver after back-off.
			c.logger.Error("NAK dictionary event (transient error)", zap.Error(err))
			msg.Nak()
		}
		return
	}
	// Ack ONLY after the DB transaction commits successfully.
	msg.Ack()
}

// ── event parsing & persistence ───────────────────────────────────────────

// dictionaryOutboxEvent is the envelope emitted by the discovery-service CDC
// worker onto the DOMAIN_EVENTS stream.
//
// UUID fields are plain strings — same reasoning as audit-service OutboxEvent.
type dictionaryOutboxEvent struct {
	ID             string          `json:"id"`
	OrganizationID string          `json:"organization_id"`
	AggregateType  string          `json:"aggregate_type"`
	AggregateID    string          `json:"aggregate_id"`
	EventType      string          `json:"event_type"`
	Payload        json.RawMessage `json:"payload"`
}

// dictionaryItemPayload is the inner JSON written by dictionary_service.go.
type dictionaryItemPayload struct {
	Name        string `json:"name"`
	Sensitivity string `json:"sensitivity"`
	Active      *bool  `json:"active"` // pointer so we can detect absence
}

// processEvent decodes a raw NATS message, decides whether to act on it, and
// executes the upsert within the same Postgres call.
//
// Returns a *poisonPillError for structurally invalid messages (wrong JSON
// shape, unparseable UUIDs) and a plain error for transient failures (DB
// unreachable, constraint violations).
func (c *DictionaryConsumer) processEvent(ctx context.Context, data []byte) error {
	// ── 1. Decode the outer envelope ──────────────────────────────────────
	var event dictionaryOutboxEvent
	if err := json.Unmarshal(data, &event); err != nil {
		return &poisonPillError{msg: fmt.Sprintf("unmarshal envelope: %v", err)}
	}

	// ── 2. Route by event_type ────────────────────────────────────────────
	switch event.EventType {
	case "DataDictionaryItemCreated", "DataDictionaryItemUpdated":
		return c.handleUpsert(ctx, event)
	case "DataDictionaryItemDeleted":
		return c.handleDelete(ctx, event)
	default:
		// Not a dictionary event — skip silently and ack (don't block the queue).
		c.logger.Debug("skipping non-dictionary event",
			zap.String("event_type", event.EventType),
			zap.String("aggregate_type", event.AggregateType),
		)
		return nil
	}
}

// handleUpsert processes DataDictionaryItemCreated / DataDictionaryItemUpdated.
func (c *DictionaryConsumer) handleUpsert(ctx context.Context, event dictionaryOutboxEvent) error {
	// Parse UUIDs from string — avoids silent zero-value from pgtype.UUID.UnmarshalJSON.
	dictID, err := parseStringUUID(event.AggregateID)
	if err != nil {
		return &poisonPillError{msg: fmt.Sprintf("invalid aggregate_id UUID %q: %v", event.AggregateID, err)}
	}
	orgID, err := parseStringUUID(event.OrganizationID)
	if err != nil {
		return &poisonPillError{msg: fmt.Sprintf("invalid organization_id UUID %q: %v", event.OrganizationID, err)}
	}

	// ── Decode inner payload ───────────────────────────────────────────────
	var payload dictionaryItemPayload
	if err := json.Unmarshal(event.Payload, &payload); err != nil {
		return &poisonPillError{msg: fmt.Sprintf("unmarshal payload: %v", err)}
	}
	if payload.Name == "" {
		return &poisonPillError{msg: "payload.name is empty"}
	}

	sensitivity := payload.Sensitivity
	if sensitivity == "" {
		sensitivity = "medium"
	}
	active := true
	if payload.Active != nil {
		active = *payload.Active
	}

	// ── Attach trace context from the payload ─────────────────────────────
	ctx = extractTraceContext(ctx, event.Payload)
	_, span := c.tracer.Start(ctx, "trm.dictionary.upsert")
	defer span.End()

	// ── Upsert — the critical DB write ────────────────────────────────────
	// Ack is withheld until this call returns nil.
	if err := c.querier.UpsertReplicatedDictionary(ctx, db.UpsertReplicatedDictionaryParams{
		ID:             dictID,
		OrganizationID: orgID,
		Name:           payload.Name,
		Sensitivity:    sensitivity,
		Active:         active,
		UpdatedAt:      pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
	}); err != nil {
		span.RecordError(err)
		return fmt.Errorf("UpsertReplicatedDictionary: %w", err)
	}

	c.logger.Info("replicated dictionary item",
		zap.String("id", event.AggregateID),
		zap.String("name", payload.Name),
		zap.String("event_type", event.EventType),
	)
	return nil
}

// handleDelete processes DataDictionaryItemDeleted events.
func (c *DictionaryConsumer) handleDelete(ctx context.Context, event dictionaryOutboxEvent) error {
	dictID, err := parseStringUUID(event.AggregateID)
	if err != nil {
		return &poisonPillError{msg: fmt.Sprintf("invalid aggregate_id UUID %q: %v", event.AggregateID, err)}
	}

	ctx = extractTraceContext(ctx, event.Payload)
	_, span := c.tracer.Start(ctx, "trm.dictionary.delete")
	defer span.End()

	if err := c.querier.DeleteReplicatedDictionary(ctx, dictID); err != nil {
		span.RecordError(err)
		return fmt.Errorf("DeleteReplicatedDictionary: %w", err)
	}

	c.logger.Info("deleted replicated dictionary item", zap.String("id", event.AggregateID))
	return nil
}

// ── helpers ───────────────────────────────────────────────────────────────

// poisonPillError wraps structural parse failures. processMessage terminates
// (rather than NAKs) messages wrapped in this type.
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

// extractTraceContext reads trace_id / span_id from the raw JSON payload and
// reconstructs a remote span context so that Jaeger can link the async span
// back to the originating synchronous trace.
func extractTraceContext(ctx context.Context, payload json.RawMessage) context.Context {
	var m map[string]interface{}
	if err := json.Unmarshal(payload, &m); err != nil {
		return ctx
	}
	traceIDStr, _ := m["trace_id"].(string)
	spanIDStr, _ := m["span_id"].(string)
	if traceIDStr == "" || spanIDStr == "" {
		return ctx
	}
	traceID, err := trace.TraceIDFromHex(traceIDStr)
	if err != nil {
		return ctx
	}
	spanID, err := trace.SpanIDFromHex(spanIDStr)
	if err != nil {
		return ctx
	}
	remoteSpanCtx := trace.NewSpanContext(trace.SpanContextConfig{
		TraceID:    traceID,
		SpanID:     spanID,
		TraceFlags: trace.FlagsSampled,
		Remote:     true,
	})
	return trace.ContextWithRemoteSpanContext(ctx, remoteSpanCtx)
}
