-- name: InsertOutboxEvent :exec
INSERT INTO outbox_events (id, aggregate_type, aggregate_id, actor_id, type, payload)
VALUES ($1, $2, $3, $4, $5, $6);
