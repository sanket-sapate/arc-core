-- name: CreateConsentForm :one
INSERT INTO consent_forms (id, organization_id, name, description, active, form_config, purposes)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetConsentForm :one
SELECT * FROM consent_forms
WHERE id = $1 AND organization_id = $2;

-- name: ListConsentForms :many
SELECT * FROM consent_forms
WHERE organization_id = $1
ORDER BY created_at DESC;

-- name: UpdateConsentForm :one
UPDATE consent_forms
SET name = $3, description = $4, active = $5, form_config = $6, purposes = $7, updated_at = NOW()
WHERE id = $1 AND organization_id = $2
RETURNING *;
