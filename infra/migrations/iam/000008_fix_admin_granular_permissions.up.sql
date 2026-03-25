-- Migration 000008: Fix admin role granular permissions.
--
-- Root cause: migration 000007 used WHERE r.name = 'Admin' (capital A)
-- but the seeded role name is 'admin' (lowercase), so no granular dot-style
-- permissions were ever assigned to the admin role.
-- This migration assigns all granular CRUD permissions (slug LIKE '%.%')
-- to the 'admin' role (lowercase) for all organizations.

INSERT INTO role_permissions (role_id, permission_slug)
SELECT r.id, p.slug
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin' AND p.slug LIKE '%.%'
ON CONFLICT (role_id, permission_slug) DO NOTHING;
