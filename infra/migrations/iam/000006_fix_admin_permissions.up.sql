-- Migration 000006: Fix admin role permissions.
--
-- Root cause: migration 000004 used WHERE r.name = 'Admin' (capital A)
-- but the seeded role name is 'admin' (lowercase). This caused trm:write,
-- trm:delete, and several other permissions to never be assigned to the
-- admin role.

INSERT INTO role_permissions (role_id, permission_slug)
SELECT r.id, p.slug
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin' AND p.slug IN (
    'trm:read', 'trm:write', 'trm:delete',
    'privacy:read', 'privacy:write', 'privacy:delete',
    'discovery:read', 'discovery:write', 'discovery:delete',
    'settings:read', 'settings:write', 'iam:manage',
    'item:read', 'item:write', 'item:delete', 'task:read'
)
ON CONFLICT (role_id, permission_slug) DO NOTHING;
