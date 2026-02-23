-- name: CreateGrievance :one
INSERT INTO grievances (
    id, organization_id, reporter_email, issue_type, description, status, priority, resolution, due_date
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: GetGrievance :one
SELECT * FROM grievances
WHERE id = $1 AND organization_id = $2;

-- name: ListGrievances :many
SELECT * FROM grievances
WHERE organization_id = $1
ORDER BY created_at DESC;

-- name: UpdateGrievance :one
UPDATE grievances
SET status = $3, resolution = $4, priority = $5, updated_at = NOW()
WHERE id = $1 AND organization_id = $2
RETURNING *;

-- name: ListUserGrievances :many
SELECT * FROM grievances
WHERE reporter_email = $1
ORDER BY created_at DESC;
