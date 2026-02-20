DROP INDEX IF EXISTS idx_items_org_status;
ALTER TABLE items DROP CONSTRAINT IF EXISTS valid_status;
ALTER TABLE items ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE items DROP COLUMN IF EXISTS organization_id;
ALTER TABLE items ADD COLUMN tenant_id UUID NOT NULL;
ALTER TABLE items DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE items DROP COLUMN IF EXISTS category_id;
CREATE INDEX idx_items_tenant_id ON items(tenant_id);
DROP TABLE IF EXISTS categories;
