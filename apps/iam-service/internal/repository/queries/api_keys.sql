-- name: RevokeExpiredAPIKeys :execrows
UPDATE api_keys
SET revoked = true
WHERE revoked = false AND expires_at IS NOT NULL AND expires_at < NOW();

-- name: CreateApiKey :one
INSERT INTO api_keys (organization_id, name, key_prefix, key_hash, created_by, expires_at)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, organization_id, name, key_prefix, key_hash, created_by, revoked, expires_at, created_at;

-- name: ListApiKeys :many
SELECT id, organization_id, name, key_prefix, created_by, revoked, expires_at, created_at
FROM api_keys
WHERE organization_id = $1 AND revoked = false
ORDER BY created_at DESC;

-- name: RevokeApiKey :exec
UPDATE api_keys
SET revoked = true
WHERE id = $1 AND organization_id = $2;

-- name: GetApiKeyByHash :one
SELECT id, organization_id, name, key_prefix, created_by, revoked, expires_at, created_at
FROM api_keys
WHERE key_hash = $1 AND revoked = false;
