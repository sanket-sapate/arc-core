-- name: CreatePrivacyRequest :one
INSERT INTO privacy_requests (
    id, organization_id, type, status, requester_email, requester_name, description, due_date
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: GetPrivacyRequest :one
SELECT * FROM privacy_requests
WHERE id = $1 AND organization_id = $2;

-- name: ListPrivacyRequests :many
SELECT * FROM privacy_requests
WHERE organization_id = $1
ORDER BY created_at DESC;

-- name: UpdatePrivacyRequest :one
UPDATE privacy_requests
SET status = $3, resolution = $4, due_date = $5, updated_at = NOW()
WHERE id = $1 AND organization_id = $2
RETURNING *;

-- name: ListUserPrivacyRequests :many
SELECT * FROM privacy_requests
WHERE requester_email = $1
ORDER BY created_at DESC;
