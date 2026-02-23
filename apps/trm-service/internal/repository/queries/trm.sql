-- ── Vendors ───────────────────────────────────────────────────────────────

-- name: CreateVendor :one
INSERT INTO vendors (id, organization_id, name, contact_email, compliance_status, risk_level)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetVendor :one
SELECT * FROM vendors
WHERE id = $1 AND organization_id = $2;

-- name: ListVendors :many
SELECT * FROM vendors
WHERE organization_id = $1
ORDER BY name ASC;

-- name: UpdateVendor :one
UPDATE vendors
SET name = $3, contact_email = $4, compliance_status = $5, risk_level = $6, updated_at = NOW()
WHERE id = $1 AND organization_id = $2
RETURNING *;

-- name: DeleteVendor :exec
DELETE FROM vendors
WHERE id = $1 AND organization_id = $2;

-- ── Frameworks ────────────────────────────────────────────────────────────

-- name: CreateFramework :one
INSERT INTO frameworks (id, organization_id, name, version)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetFramework :one
SELECT * FROM frameworks
WHERE id = $1 AND organization_id = $2;

-- name: ListFrameworks :many
SELECT * FROM frameworks
WHERE organization_id = $1
ORDER BY name ASC;

-- ── Assessments ───────────────────────────────────────────────────────────

-- name: CreateAssessment :one
INSERT INTO assessments (id, organization_id, vendor_id, framework_id, status, score)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetAssessment :one
SELECT * FROM assessments
WHERE id = $1 AND organization_id = $2;

-- name: ListAssessmentsByVendor :many
SELECT * FROM assessments
WHERE vendor_id = $1 AND organization_id = $2
ORDER BY created_at DESC;

-- name: ListAssessments :many
SELECT * FROM assessments
WHERE organization_id = $1
ORDER BY created_at DESC;

-- name: UpdateAssessmentStatus :one
UPDATE assessments
SET status = $3, score = $4, updated_at = NOW()
WHERE id = $1 AND organization_id = $2
RETURNING *;

-- ── DPAs ──────────────────────────────────────────────────────────────────

-- name: CreateDPA :one
INSERT INTO dpas (id, organization_id, vendor_id, status)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetDPA :one
SELECT * FROM dpas
WHERE id = $1 AND organization_id = $2;

-- name: ListDPAsByVendor :many
SELECT * FROM dpas
WHERE vendor_id = $1 AND organization_id = $2
ORDER BY created_at DESC;

-- name: UpdateDPAStatus :one
UPDATE dpas
SET status = $3, signed_at = $4, updated_at = NOW()
WHERE id = $1 AND organization_id = $2
RETURNING *;

-- name: AddDPADataScope :exec
INSERT INTO dpa_data_scope (dpa_id, dictionary_id, justification)
VALUES ($1, $2, $3)
ON CONFLICT (dpa_id, dictionary_id) DO UPDATE SET justification = EXCLUDED.justification;

-- name: ListDPADataScope :many
SELECT d.*, r.name AS dict_name, r.sensitivity
FROM dpa_data_scope d
JOIN replicated_data_dictionary r ON r.id = d.dictionary_id
WHERE d.dpa_id = $1;

-- ── Replicated Data Dictionary ────────────────────────────────────────────

-- name: UpsertReplicatedDictionary :exec
INSERT INTO replicated_data_dictionary (id, organization_id, name, sensitivity, active, updated_at)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    sensitivity = EXCLUDED.sensitivity,
    active = EXCLUDED.active,
    updated_at = EXCLUDED.updated_at;

-- name: DeleteReplicatedDictionary :exec
DELETE FROM replicated_data_dictionary
WHERE id = $1;

-- name: GetReplicatedDictionaryItem :one
SELECT * FROM replicated_data_dictionary
WHERE id = $1;

-- name: ListReplicatedDictionary :many
SELECT * FROM replicated_data_dictionary
WHERE organization_id = $1 AND active = true
ORDER BY name ASC;

-- ── Outbox ────────────────────────────────────────────────────────────────

-- name: InsertOutboxEvent :exec
INSERT INTO outbox_events (id, organization_id, aggregate_type, aggregate_id, event_type, payload)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (id) DO NOTHING;
