// Package consumer contains JetStream pull consumers for the audit-service.
//
// GlobalAuditConsumer is the primary consumer. It subscribes to the wildcard
// subject "DOMAIN_EVENTS.>" which captures every event published by every
// service in the platform. It extracts the source_service from the NATS
// subject token (e.g. "DOMAIN_EVENTS.iam.user.created" → "iam") and
// persists each event as an immutable AuditLog record.
//
// Idempotency guarantee:
//   - The audit_logs table has a UNIQUE constraint on event_id.
//   - InsertAuditLog uses ON CONFLICT DO NOTHING.
//   - Therefore NATS re-delivery of any message is safely ignored at the DB
//     level — exactly-once processing semantics without distributed transactions.
//
// Poison-pill handling:
//   - Structurally invalid messages (bad JSON, unparseable UUIDs) are
//     msg.Term()'d so they are never redelivered.
//   - Transient failures (DB down, constraint violations other than event_id)
//     trigger msg.Nak() so the message is requeued with back-off.
package consumer

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/nats-io/nats.go"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"

	db "github.com/arc-self/apps/audit-service/internal/repository/db"
	"github.com/arc-self/packages/go-core/natsclient"
)

// globalDurable is the JetStream consumer name for this consumer group.
// All audit-service replicas share this name → competing consumers, each
// event processed exactly once.
const globalDurable = "audit-service-global"

// GlobalAuditConsumer subscribes to every event on the platform stream and
// writes them all into the immutable audit_logs table.
type GlobalAuditConsumer struct {
	nats    *natsclient.Client
	querier db.Querier
	logger  *zap.Logger
	tracer  trace.Tracer
}

// NewGlobalAuditConsumer constructs a GlobalAuditConsumer.
func NewGlobalAuditConsumer(n *natsclient.Client, q db.Querier, l *zap.Logger) *GlobalAuditConsumer {
	return &GlobalAuditConsumer{
		nats:    n,
		querier: q,
		logger:  l,
		tracer:  otel.Tracer("audit-global-consumer"),
	}
}

// Start creates a durable pull subscription on the wildcard "DOMAIN_EVENTS.>"
// subject hierarchy and launches the processing loop in a background
// goroutine. It returns immediately.
func (c *GlobalAuditConsumer) Start(ctx context.Context) error {
	sub, err := c.nats.JS.PullSubscribe(
		"DOMAIN_EVENTS.>",
		globalDurable,
		nats.BindStream(natsclient.StreamDomainEvents),
	)
	if err != nil {
		return fmt.Errorf("global audit consumer: PullSubscribe: %w", err)
	}

	c.logger.Info("global audit consumer initialised",
		zap.String("stream", natsclient.StreamDomainEvents),
		zap.String("durable", globalDurable),
		zap.String("subject", "DOMAIN_EVENTS.>"),
	)

	go func() {
		for {
			select {
			case <-ctx.Done():
				c.logger.Info("global audit consumer stopping")
				return
			default:
				msgs, err := sub.Fetch(20, nats.Context(ctx))
				if err != nil {
					continue // nats.ErrTimeout on empty queue — not an error
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

// processMessage dispatches a single NATS message and handles ACK/NAK/Term.
func (c *GlobalAuditConsumer) processMessage(ctx context.Context, msg *nats.Msg) {
	// Extract source_service from the routing subject before passing to
	// processEvent, which has no NATS dependency (for testability).
	sourceService := extractSourceService(msg.Subject)

	err := c.processEvent(ctx, msg.Data, msg.Subject, sourceService)
	if err != nil {
		var ppe *globalPoisonPillError
		if isGlobalPoisonPill(err, &ppe) {
			c.logger.Warn("terminating poison-pill audit event",
				zap.String("subject", msg.Subject),
				zap.Error(err),
			)
			msg.Term()
			return
		}
		c.logger.Error("NAK audit event (transient error)",
			zap.String("subject", msg.Subject),
			zap.Error(err),
		)
		msg.Nak()
		return
	}
	// Ack ONLY after the DB row is committed (ON CONFLICT DO NOTHING ensures
	// idempotency, so acking a redelivered message is also safe).
	msg.Ack()
}

// ── event payload envelope ────────────────────────────────────────────────

// globalOutboxEvent is the structured envelope that the CDC worker publishes
// to every DOMAIN_EVENTS.* subject.
//
// UUID fields use plain strings — same reasoning as AuditConsumer.OutboxEvent.
type globalOutboxEvent struct {
	ID             string          `json:"id"`
	OrganizationID string          `json:"organization_id"`
	AggregateType  string          `json:"aggregate_type"`
	AggregateID    string          `json:"aggregate_id"`
	EventType      string          `json:"event_type"`
	// Legacy field names used by older services
	Type    string          `json:"type"`
	ActorID string          `json:"actor_id"`
	Payload json.RawMessage `json:"payload"`
}

// eventType returns the canonical event type, preferring EventType (new
// services) over Type (older abc/iam-service convention).
func (e *globalOutboxEvent) eventType() string {
	if e.EventType != "" {
		return e.EventType
	}
	return e.Type
}

// aggregateID returns the string aggregate ID.
func (e *globalOutboxEvent) aggregateIDStr() string {
	return e.AggregateID
}

// ── core processing ───────────────────────────────────────────────────────

// processEvent is the pure business logic: parse → map → persist.
// It has no NATS dependency so it can be called directly from unit tests.
//
//   - subject   — raw NATS subject (e.g. "DOMAIN_EVENTS.iam.user.created")
//   - sourceService — already extracted from the subject by processMessage
func (c *GlobalAuditConsumer) processEvent(ctx context.Context, data []byte, subject, sourceService string) error {
	// ── 1. Decode envelope ────────────────────────────────────────────────
	var event globalOutboxEvent
	if err := json.Unmarshal(data, &event); err != nil {
		return &globalPoisonPillError{msg: fmt.Sprintf("unmarshal envelope [%s]: %v", subject, err)}
	}

	// event_id is mandatory for idempotency.
	if event.ID == "" {
		return &globalPoisonPillError{msg: fmt.Sprintf("missing event id [%s]", subject)}
	}

	// ── 2. Parse UUIDs ────────────────────────────────────────────────────
	eventID, err := parseStringUUID(event.ID)
	if err != nil {
		return &globalPoisonPillError{msg: fmt.Sprintf("invalid event_id %q: %v", event.ID, err)}
	}

	// organization_id is best-effort: zero-value if absent (legacy services).
	var orgID pgtype.UUID
	if event.OrganizationID != "" {
		orgID, err = parseStringUUID(event.OrganizationID)
		if err != nil {
			return &globalPoisonPillError{msg: fmt.Sprintf("invalid organization_id %q: %v", event.OrganizationID, err)}
		}
	}

	// actor_id is optional (system-generated events have no actor).
	var actorID pgtype.UUID
	if event.ActorID != "" {
		actorID, err = parseStringUUID(event.ActorID)
		if err != nil {
			// Non-fatal: log and proceed with zero-value rather than discarding.
			c.logger.Warn("unparseable actor_id, persisting without it",
				zap.String("actor_id", event.ActorID),
				zap.Error(err),
			)
		}
	}

	// ── 3. Restore trace context ──────────────────────────────────────────
	ctx = globalExtractTraceContext(ctx, event.Payload)
	_, span := c.tracer.Start(ctx, "audit.global.processEvent")
	defer span.End()

	// ── 4. Persist ────────────────────────────────────────────────────────
	// ON CONFLICT DO NOTHING means this is safe to call on NATS redelivery.
	if err := c.querier.InsertAuditLog(ctx, db.InsertAuditLogParams{
		EventID:        eventID,
		OrganizationID: orgID,
		SourceService:  sourceService,
		AggregateType:  event.AggregateType,
		AggregateID:    event.aggregateIDStr(),
		EventType:      event.eventType(),
		Payload:        []byte(event.Payload),
		ActorID:        actorID,
		CreatedAt:      time.Now().UTC(),
	}); err != nil {
		span.RecordError(err)
		return fmt.Errorf("InsertAuditLog [%s]: %w", subject, err)
	}

	c.logger.Debug("audit log written",
		zap.String("event_id", event.ID),
		zap.String("source", sourceService),
		zap.String("event_type", event.eventType()),
	)
	return nil
}

// ── helpers ───────────────────────────────────────────────────────────────

// extractSourceService splits "DOMAIN_EVENTS.iam.user.created" and returns
// the first token after the stream prefix, i.e. "iam".
// Returns "unknown" when the subject does not contain a service token.
//
//	"DOMAIN_EVENTS.iam.user.created" → "iam"
//	"DOMAIN_EVENTS.privacy.cookie_banner.created" → "privacy"
//	"outbox.>" → "unknown"
func extractSourceService(subject string) string {
	// Strip the "DOMAIN_EVENTS." prefix first.
	const prefix = "DOMAIN_EVENTS."
	trimmed := strings.TrimPrefix(subject, prefix)
	if trimmed == subject {
		// Prefix not present (e.g. bare "outbox.*" subjects).
		return "unknown"
	}
	// First token is the service name.
	parts := strings.SplitN(trimmed, ".", 2)
	if len(parts) == 0 || parts[0] == "" {
		return "unknown"
	}
	return parts[0]
}

// globalPoisonPillError marks a message as structurally unrecoverable.
// processMessage calls msg.Term() on these instead of msg.Nak().
type globalPoisonPillError struct{ msg string }

func (e *globalPoisonPillError) Error() string { return "poison pill: " + e.msg }

// isGlobalPoisonPill type-asserts err to *globalPoisonPillError.
func isGlobalPoisonPill(err error, out **globalPoisonPillError) bool {
	ppe, ok := err.(*globalPoisonPillError)
	if ok && out != nil {
		*out = ppe
	}
	return ok
}

// globalExtractTraceContext reconstructs the OTel span context from trace_id /
// span_id embedded in the event payload, enabling Jaeger to link async spans
// back to their originating synchronous trace.
func globalExtractTraceContext(ctx context.Context, payload json.RawMessage) context.Context {
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
