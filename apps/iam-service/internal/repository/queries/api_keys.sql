-- name: RevokeExpiredAPIKeys :execrows
UPDATE api_keys
SET revoked = true
WHERE revoked = false AND expires_at IS NOT NULL AND expires_at < NOW();
