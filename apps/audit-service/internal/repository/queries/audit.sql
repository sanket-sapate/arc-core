-- name: InsertAuditLog :exec
INSERT INTO audit_logs (event_id, aggregate_type, aggregate_id, actor_id, event_type, payload)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (event_id) DO NOTHING;
