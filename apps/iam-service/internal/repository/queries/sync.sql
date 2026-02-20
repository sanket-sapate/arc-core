-- name: UpsertUser :one
INSERT INTO users (id, email)
VALUES ($1, $2)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
RETURNING id, email, created_at;

-- name: GetOrganizationByName :one
SELECT * FROM organizations
WHERE name = $1;

-- name: GetDefaultRole :one
SELECT * FROM roles
WHERE organization_id = $1 AND name = 'member';

-- name: AssignUserRole :exec
INSERT INTO user_organization_roles (user_id, organization_id, role_id)
VALUES ($1, $2, $3)
ON CONFLICT (user_id, organization_id, role_id) DO NOTHING;
