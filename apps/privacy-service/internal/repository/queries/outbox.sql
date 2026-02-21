-- name: InsertOutboxEvent :exec
INSERT INTO outbox_events (id, organization_id, aggregate_type, aggregate_id, event_type, payload)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (id) DO NOTHING;
