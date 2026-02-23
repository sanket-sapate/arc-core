-- name: GetUserByID :one
SELECT id, email, created_at
FROM users
WHERE id = $1;

-- name: GetUserOrganizations :many
SELECT
    o.id   AS organization_id,
    o.name AS organization_name,
    r.name AS role_name
FROM user_organization_roles uor
JOIN organizations o ON uor.organization_id = o.id
JOIN roles r ON uor.role_id = r.id
WHERE uor.user_id = $1;


