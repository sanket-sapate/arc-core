-- name: ListBreaches :many
SELECT * FROM breaches
WHERE organization_id = $1
ORDER BY created_at DESC;

-- name: GetBreachByID :one
SELECT * FROM breaches
WHERE id = $1 AND organization_id = $2;

-- name: CreateBreach :one
INSERT INTO breaches (
    organization_id, title, severity, status, incident_date, description, remediation_plan
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING *;

-- name: UpdateBreach :one
UPDATE breaches
SET
    title = COALESCE($3, title),
    severity = COALESCE($4, severity),
    status = COALESCE($5, status),
    incident_date = COALESCE($6, incident_date),
    description = COALESCE($7, description),
    remediation_plan = COALESCE($8, remediation_plan),
    updated_at = NOW()
WHERE id = $1 AND organization_id = $2
RETURNING *;

-- name: DeleteBreach :exec
DELETE FROM breaches
WHERE id = $1 AND organization_id = $2;
