-- Rollback: remove member role permissions added in 000005.
DELETE FROM role_permissions
WHERE role_id IN (SELECT id FROM roles WHERE name = 'member')
  AND permission_slug IN (
    'trm:read', 'trm:write',
    'privacy:read', 'privacy:write',
    'discovery:read', 'discovery:write',
    'item:read', 'item:write',
    'task:read',
    'settings:read'
);
