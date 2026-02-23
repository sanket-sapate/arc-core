-- name: ListRolesForOrganization :many
SELECT id, name, created_at
FROM roles
WHERE organization_id = $1
ORDER BY name;

-- name: GetRolePermissions :many
SELECT permission_slug
FROM role_permissions
WHERE role_id = $1;

-- name: CreateRole :one
INSERT INTO roles (organization_id, name, description)
VALUES ($1, $2, $3)
RETURNING id, name, description, created_at;

-- name: UpdateRole :one
UPDATE roles
SET name = $2, description = $3
WHERE id = $1 AND organization_id = $4
RETURNING id, name, description, created_at;

-- name: InsertRolePermission :exec
INSERT INTO role_permissions (role_id, permission_slug)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;

-- name: DeleteRolePermissions :exec
DELETE FROM role_permissions
WHERE role_id = $1;
