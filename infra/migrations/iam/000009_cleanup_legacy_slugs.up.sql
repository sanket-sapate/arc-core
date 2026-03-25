-- Migration 000009: Remove legacy colon-style permission slugs from all roles.
-- APISIX now uses granular dot-style slugs (e.g. vendors.read) exclusively.
-- The old broad module-level slugs (e.g. trm:read, privacy:read, iam:manage)
-- are no longer referenced by any APISIX route and should be removed from
-- role_permissions to keep the UI clean and authoritative.

DELETE FROM role_permissions
WHERE permission_slug IN (
    'trm:read', 'trm:write', 'trm:delete',
    'privacy:read', 'privacy:write', 'privacy:delete',
    'discovery:read', 'discovery:write', 'discovery:delete',
    'settings:read', 'settings:write',
    'iam:manage',
    'iam:users:read', 'iam:users:write',
    'iam:roles:read', 'iam:roles:write',
    'item:read', 'item:write', 'item:delete',
    'task:read',
    'trm:vendors:read', 'trm:vendors:write', 'trm:vendors:delete',
    'trm:assessments:read', 'trm:assessments:write',
    'privacy:dsr:read', 'privacy:dsr:write',
    'privacy:ropa:read', 'privacy:ropa:write'
);
