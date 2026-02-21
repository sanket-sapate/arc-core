-- name: CreateDPIA :one
INSERT INTO dpias (id, organization_id, name, vendor_id, status, risk_level, form_data)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetDPIA :one
SELECT * FROM dpias
WHERE id = $1 AND organization_id = $2;

-- name: ListDPIAs :many
SELECT * FROM dpias
WHERE organization_id = $1
ORDER BY created_at DESC;

-- name: UpdateDPIA :one
UPDATE dpias
SET name = $3, vendor_id = $4, status = $5, risk_level = $6, form_data = $7, updated_at = NOW()
WHERE id = $1 AND organization_id = $2
RETURNING *;
