-- name: GetTask :one
SELECT id, tenant_id, title, body, priority, status, created_at, updated_at
FROM tasks
WHERE id = $1 AND tenant_id = $2;

-- name: ListTasksByTenant :many
SELECT id, tenant_id, title, body, priority, status, created_at, updated_at
FROM tasks
WHERE tenant_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: CreateTask :one
INSERT INTO tasks (tenant_id, title, body, priority, status)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, tenant_id, title, body, priority, status, created_at, updated_at;

-- name: UpdateTask :one
UPDATE tasks
SET title = $3, body = $4, priority = $5, status = $6, updated_at = NOW()
WHERE id = $1 AND tenant_id = $2
RETURNING id, tenant_id, title, body, priority, status, created_at, updated_at;

-- name: DeleteTask :exec
DELETE FROM tasks
WHERE id = $1 AND tenant_id = $2;
