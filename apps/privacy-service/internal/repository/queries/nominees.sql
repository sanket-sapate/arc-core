-- name: CreateNominee :one
INSERT INTO nominees (
    id, user_email, nominee_name, nominee_email, nominee_relation, status
) VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetUserNominees :many
SELECT * FROM nominees
WHERE user_email = $1
ORDER BY created_at DESC;

-- name: UpdateNomineeStatus :one
UPDATE nominees
SET status = $3, updated_at = NOW()
WHERE id = $1 AND user_email = $2
RETURNING *;
