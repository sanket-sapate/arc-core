-- name: ListAuditLogs :many
SELECT * FROM audit_logs
WHERE organization_id = $1
ORDER BY timestamp DESC;

-- name: CreateAuditLog :one
INSERT INTO audit_logs (
    organization_id, action, actor_email, target_entity, target_id
) VALUES (
    $1, $2, $3, $4, $5
) RETURNING *;
