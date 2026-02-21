-- name: CreatePurpose :one
INSERT INTO purposes (id, organization_id, name, description, legal_basis, active)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetPurpose :one
SELECT * FROM purposes
WHERE id = $1 AND organization_id = $2;

-- name: ListPurposes :many
SELECT * FROM purposes
WHERE organization_id = $1
ORDER BY name ASC;

-- name: UpdatePurpose :one
UPDATE purposes
SET name = $3, description = $4, legal_basis = $5, active = $6, updated_at = NOW()
WHERE id = $1 AND organization_id = $2
RETURNING *;
