-- name: ListPermissions :many
SELECT slug, name, description
FROM permissions
ORDER BY slug;
