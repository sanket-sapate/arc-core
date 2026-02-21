-- name: CreateROPA :one
INSERT INTO ropas (id, organization_id, name, processing_activity, legal_basis, data_categories, status)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetROPA :one
SELECT * FROM ropas
WHERE id = $1 AND organization_id = $2;

-- name: ListROPAs :many
SELECT * FROM ropas
WHERE organization_id = $1
ORDER BY created_at DESC;

-- name: UpdateROPA :one
UPDATE ropas
SET name = $3, processing_activity = $4, legal_basis = $5,
    data_categories = $6, status = $7, updated_at = NOW()
WHERE id = $1 AND organization_id = $2
RETURNING *;
