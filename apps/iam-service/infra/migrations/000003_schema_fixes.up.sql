-- 1. Add FK constraint on api_keys.organization_id
ALTER TABLE api_keys
    ADD CONSTRAINT fk_api_keys_organization_id
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- 2. Add DEFAULT gen_random_uuid() to roles.id
ALTER TABLE roles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Add DEFAULT gen_random_uuid() to organizations.id
ALTER TABLE organizations ALTER COLUMN id SET DEFAULT gen_random_uuid();
