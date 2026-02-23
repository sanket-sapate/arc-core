INSERT INTO permissions (slug, name, description) VALUES
('trm:vendors:read', 'Read Vendors', 'View vendors'),
('trm:vendors:write', 'Manage Vendors', 'Create and edit vendors'),
('trm:vendors:delete', 'Delete Vendors', 'Delete vendors'),
('trm:assessments:read', 'Read Assessments', 'View assessments'),
('trm:assessments:write', 'Manage Assessments', 'Create and edit assessments'),
('privacy:dsr:read', 'Read DSRs', 'View data subject requests'),
('privacy:dsr:write', 'Manage DSRs', 'Manage data subject requests'),
('privacy:ropa:read', 'Read ROPAs', 'View records of processing activities'),
('privacy:ropa:write', 'Manage ROPAs', 'Manage records of processing activities'),
('iam:users:read', 'Read Users', 'View IAM users'),
('iam:users:write', 'Manage Users', 'Manage IAM users'),
('iam:roles:read', 'Read Roles', 'View IAM roles'),
('iam:roles:write', 'Manage Roles', 'Manage IAM roles'),
('trm:delete', 'Delete TRM', 'Delete TRM'),
('discovery:read', 'Read Discovery', 'Read Discovery'),
('discovery:write', 'Write Discovery', 'Write Discovery'),
('discovery:delete', 'Delete Discovery', 'Delete Discovery'),
('item:read', 'Read Item', 'Read Item'),
('item:write', 'Write Item', 'Write Item'),
('item:delete', 'Delete Item', 'Delete Item'),
('task:read', 'Read Task', 'Read Task')
ON CONFLICT (slug) DO NOTHING;

-- Map permissions to the 'Admin' role automatically
-- Insert role permissions for the 'Admin' role for all organizations
INSERT INTO role_permissions (role_id, permission_slug)
SELECT r.id, p.slug
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Admin' AND p.slug IN (
    'trm:vendors:read', 'trm:vendors:write', 'trm:vendors:delete',
    'trm:assessments:read', 'trm:assessments:write',
    'privacy:dsr:read', 'privacy:dsr:write',
    'privacy:ropa:read', 'privacy:ropa:write',
    'iam:users:read', 'iam:users:write',
    'iam:roles:read', 'iam:roles:write',
    'trm:read', 'trm:write', 'trm:delete',
    'privacy:read', 'privacy:write', 'privacy:delete',
    'discovery:read', 'discovery:write', 'discovery:delete',
    'settings:read', 'settings:write', 'iam:manage',
    'item:read', 'item:write', 'item:delete', 'task:read'
)
ON CONFLICT (role_id, permission_slug) DO NOTHING;
