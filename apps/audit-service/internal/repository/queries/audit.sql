-- name: InsertAuditLog :exec
INSERT INTO audit_logs (
    event_id, organization_id, source_service, aggregate_type, aggregate_id,
    event_type, payload, actor_id, created_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9
) ON CONFLICT (event_id) DO NOTHING;

-- name: ListAuditLogs :many
SELECT id, event_id, organization_id, source_service, aggregate_type, aggregate_id,
       event_type, payload, actor_id, created_at
FROM audit_logs
WHERE organization_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: ListAuditLogsByAggregate :many
SELECT id, event_id, organization_id, source_service, aggregate_type, aggregate_id,
       event_type, payload, actor_id, created_at
FROM audit_logs
WHERE organization_id = $1
  AND aggregate_type = $2
  AND aggregate_id = $3
ORDER BY created_at DESC
LIMIT $4 OFFSET $5;
