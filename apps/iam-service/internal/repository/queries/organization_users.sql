-- name: ListOrganizationUsers :many
SELECT
    u.id,
    u.email,
    r.id AS role_id,
    r.name AS role_name,
    u.created_at
FROM user_organization_roles uor
JOIN users u ON uor.user_id = u.id
JOIN roles r ON uor.role_id = r.id
WHERE uor.organization_id = $1
ORDER BY u.email;

-- name: AddUserRole :exec
INSERT INTO user_organization_roles (user_id, organization_id, role_id)
VALUES ($1, $2, $3)
ON CONFLICT (user_id, organization_id, role_id) DO NOTHING;

-- name: RemoveUserRole :exec
DELETE FROM user_organization_roles
WHERE user_id = $1 AND organization_id = $2 AND role_id = $3;

-- name: RemoveUserFromOrganization :exec
DELETE FROM user_organization_roles
WHERE user_id = $1 AND organization_id = $2;
