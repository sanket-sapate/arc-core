-- name: CreateMagicToken :one
INSERT INTO magic_tokens (
    id, email, token, expires_at
) VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetMagicToken :one
SELECT * FROM magic_tokens
WHERE token = $1 AND used_at IS NULL AND expires_at > NOW();

-- name: MarkMagicTokenUsed :exec
UPDATE magic_tokens
SET used_at = NOW()
WHERE id = $1;
