-- Migration 000007: Granular CRUD Permissions Refactor
-- Replace broad module-level permissions with fine-grained resource-level CRUD permissions

-- Insert all granular CRUD permissions for each resource
INSERT INTO permissions (slug, name, description) VALUES
-- Vendors
('vendors.create', 'Create Vendors', 'Create new vendor records'),
('vendors.read', 'Read Vendors', 'View vendor information'),
('vendors.update', 'Update Vendors', 'Modify existing vendor records'),
('vendors.delete', 'Delete Vendors', 'Remove vendor records'),

-- Frameworks
('frameworks.create', 'Create Frameworks', 'Create new assessment frameworks'),
('frameworks.read', 'Read Frameworks', 'View assessment frameworks'),
('frameworks.update', 'Update Frameworks', 'Modify existing frameworks'),
('frameworks.delete', 'Delete Frameworks', 'Remove frameworks'),

-- Assessments
('assessments.create', 'Create Assessments', 'Create new vendor assessments'),
('assessments.read', 'Read Assessments', 'View vendor assessments'),
('assessments.update', 'Update Assessments', 'Modify assessment status and answers'),
('assessments.delete', 'Delete Assessments', 'Remove assessments'),

-- DPAs (Data Processing Agreements)
('dpas.create', 'Create DPAs', 'Create new data processing agreements'),
('dpas.read', 'Read DPAs', 'View data processing agreements'),
('dpas.update', 'Update DPAs', 'Modify and sign DPAs'),
('dpas.delete', 'Delete DPAs', 'Remove DPAs'),

-- Audit Cycles
('audit_cycles.create', 'Create Audit Cycles', 'Create new audit cycles'),
('audit_cycles.read', 'Read Audit Cycles', 'View audit cycles'),
('audit_cycles.update', 'Update Audit Cycles', 'Modify audit cycles'),
('audit_cycles.delete', 'Delete Audit Cycles', 'Remove audit cycles'),

-- Consents (Banners, Forms, Purposes)
('consents.create', 'Create Consents', 'Create consent banners, forms, and purposes'),
('consents.read', 'Read Consents', 'View consent configurations'),
('consents.update', 'Update Consents', 'Modify consent settings'),
('consents.delete', 'Delete Consents', 'Remove consent configurations'),

-- Script Blocking
('script_blocking.create', 'Create Script Rules', 'Create script blocking rules'),
('script_blocking.read', 'Read Script Rules', 'View script blocking rules'),
('script_blocking.update', 'Update Script Rules', 'Modify script blocking rules'),
('script_blocking.delete', 'Delete Script Rules', 'Remove script blocking rules'),

-- ROPA (Records of Processing Activities)
('ropa.create', 'Create ROPA', 'Create processing activity records'),
('ropa.read', 'Read ROPA', 'View processing activity records'),
('ropa.update', 'Update ROPA', 'Modify processing activity records'),
('ropa.delete', 'Delete ROPA', 'Remove processing activity records'),

-- DPIA (Data Protection Impact Assessments)
('dpia.create', 'Create DPIA', 'Create impact assessments'),
('dpia.read', 'Read DPIA', 'View impact assessments'),
('dpia.update', 'Update DPIA', 'Modify impact assessments'),
('dpia.delete', 'Delete DPIA', 'Remove impact assessments'),

-- DSR (Data Subject Requests)
('dsr.create', 'Create DSR', 'Create data subject requests'),
('dsr.read', 'Read DSR', 'View data subject requests'),
('dsr.update', 'Update DSR', 'Process and update DSRs'),
('dsr.delete', 'Delete DSR', 'Remove data subject requests'),

-- Breaches
('breaches.create', 'Create Breaches', 'Report new data breaches'),
('breaches.read', 'Read Breaches', 'View breach reports'),
('breaches.update', 'Update Breaches', 'Modify breach reports'),
('breaches.delete', 'Delete Breaches', 'Remove breach reports'),

-- Data Discovery
('discovery.create', 'Create Discovery Jobs', 'Create data discovery scans'),
('discovery.read', 'Read Discovery', 'View discovery results and jobs'),
('discovery.update', 'Update Discovery', 'Modify discovery configurations'),
('discovery.delete', 'Delete Discovery', 'Remove discovery jobs'),

-- Data Sources
('sources.create', 'Create Data Sources', 'Add new data sources'),
('sources.read', 'Read Data Sources', 'View data sources'),
('sources.update', 'Update Data Sources', 'Modify data source configurations'),
('sources.delete', 'Delete Data Sources', 'Remove data sources'),

-- Data Dictionary
('dictionary.create', 'Create Dictionary Entries', 'Add data classification entries'),
('dictionary.read', 'Read Dictionary', 'View data dictionary'),
('dictionary.update', 'Update Dictionary', 'Modify dictionary entries'),
('dictionary.delete', 'Delete Dictionary', 'Remove dictionary entries'),

-- Cookie Scanner
('cookie_scanner.create', 'Create Cookie Scans', 'Initiate cookie scans'),
('cookie_scanner.read', 'Read Cookie Scans', 'View cookie scan results'),
('cookie_scanner.update', 'Update Cookie Scans', 'Modify scan configurations'),
('cookie_scanner.delete', 'Delete Cookie Scans', 'Remove scan results'),

-- Users (IAM)
('users.create', 'Create Users', 'Invite and create new users'),
('users.read', 'Read Users', 'View user accounts'),
('users.update', 'Update Users', 'Modify user details and roles'),
('users.delete', 'Delete Users', 'Remove user accounts'),

-- Roles (IAM)
('roles.create', 'Create Roles', 'Create custom roles'),
('roles.read', 'Read Roles', 'View roles and permissions'),
('roles.update', 'Update Roles', 'Modify role permissions'),
('roles.delete', 'Delete Roles', 'Remove custom roles'),

-- API Keys
('api_keys.create', 'Create API Keys', 'Generate API keys'),
('api_keys.read', 'Read API Keys', 'View API keys'),
('api_keys.update', 'Update API Keys', 'Modify API key settings'),
('api_keys.delete', 'Delete API Keys', 'Revoke API keys'),

-- Integrations
('integrations.create', 'Create Integrations', 'Add new integrations'),
('integrations.read', 'Read Integrations', 'View integration settings'),
('integrations.update', 'Update Integrations', 'Modify integration configurations'),
('integrations.delete', 'Delete Integrations', 'Remove integrations'),

-- Audit Logs
('audit_logs.read', 'Read Audit Logs', 'View system audit logs')

ON CONFLICT (slug) DO NOTHING;

-- Grant all granular permissions to Admin role
INSERT INTO role_permissions (role_id, permission_slug)
SELECT r.id, p.slug
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Admin' AND p.slug LIKE '%.%'
ON CONFLICT (role_id, permission_slug) DO NOTHING;

-- Grant read/write permissions to member role (excluding delete and admin operations)
INSERT INTO role_permissions (role_id, permission_slug)
SELECT r.id, p.slug
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'member' AND p.slug IN (
    -- Vendors
    'vendors.create', 'vendors.read', 'vendors.update',
    -- Frameworks
    'frameworks.read',
    -- Assessments
    'assessments.create', 'assessments.read', 'assessments.update',
    -- DPAs
    'dpas.create', 'dpas.read', 'dpas.update',
    -- Audit Cycles
    'audit_cycles.read',
    -- Consents
    'consents.create', 'consents.read', 'consents.update',
    -- Script Blocking
    'script_blocking.read', 'script_blocking.update',
    -- ROPA
    'ropa.create', 'ropa.read', 'ropa.update',
    -- DPIA
    'dpia.create', 'dpia.read', 'dpia.update',
    -- DSR
    'dsr.create', 'dsr.read', 'dsr.update',
    -- Breaches
    'breaches.create', 'breaches.read', 'breaches.update',
    -- Discovery
    'discovery.create', 'discovery.read', 'discovery.update',
    -- Sources
    'sources.read',
    -- Dictionary
    'dictionary.read',
    -- Cookie Scanner
    'cookie_scanner.create', 'cookie_scanner.read',
    -- Users (read-only for members)
    'users.read',
    -- Roles (read-only for members)
    'roles.read',
    -- Integrations (read-only for members)
    'integrations.read',
    -- Audit Logs
    'audit_logs.read'
)
ON CONFLICT (role_id, permission_slug) DO NOTHING;
