-- Migration 000005: Assign standard read/write permissions to the 'member' role.
--
-- Root cause of POST /api/trm/vendors 403: migration 000004 only seeds
-- permissions for the 'Admin' role.  Standard users are assigned the
-- 'member' role by SyncService, but that role had zero permissions,
-- causing every authz check to fail.
--
-- This migration grants members the same read/write scopes that the
-- APISIX gateway routes demand, minus destructive (delete) and
-- admin-only (iam:manage) permissions.

INSERT INTO role_permissions (role_id, permission_slug)
SELECT r.id, p.slug
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'member' AND p.slug IN (
    -- Third-Party Risk Management
    'trm:read',
    'trm:write',
    -- Privacy
    'privacy:read',
    'privacy:write',
    -- Data Discovery
    'discovery:read',
    'discovery:write',
    -- ABC domain
    'item:read',
    'item:write',
    -- DEF domain
    'task:read',
    -- Settings (read-only for members)
    'settings:read'
)
ON CONFLICT (role_id, permission_slug) DO NOTHING;
