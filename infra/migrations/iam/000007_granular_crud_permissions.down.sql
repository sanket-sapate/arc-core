-- Rollback: Remove granular CRUD permissions
DELETE FROM role_permissions WHERE permission_slug LIKE '%.%';
DELETE FROM permissions WHERE slug LIKE '%.%';
