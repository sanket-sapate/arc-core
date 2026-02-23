-- name: CreatePurpose :one
INSERT INTO purposes (id, organization_id, name, description, legal_basis, active, data_objects)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *, cardinality(data_objects)::int AS data_objects_count;

-- name: GetPurpose :one
SELECT *, cardinality(data_objects)::int AS data_objects_count FROM purposes
WHERE id = $1 AND organization_id = $2;

-- name: ListPurposes :many
SELECT *, cardinality(data_objects)::int AS data_objects_count FROM purposes
WHERE organization_id = $1
ORDER BY name ASC;

-- name: UpdatePurpose :one
UPDATE purposes
SET name = $3, description = $4, legal_basis = $5, active = $6, data_objects = $7, updated_at = NOW()
WHERE id = $1 AND organization_id = $2
RETURNING *, cardinality(data_objects)::int AS data_objects_count;
