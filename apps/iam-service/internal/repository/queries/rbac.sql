-- name: CheckUserPermission :one
SELECT EXISTS (
    SELECT 1 
    FROM user_organization_roles uor
    JOIN roles r ON uor.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    WHERE uor.user_id = $1 
      AND uor.organization_id = $2 
      AND rp.permission_slug = $3
);

-- name: GetUserPermissionsInOrg :many
SELECT DISTINCT rp.permission_slug
FROM user_organization_roles uor
JOIN roles r ON uor.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
WHERE uor.user_id = $1 AND uor.organization_id = $2;
