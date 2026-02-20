CREATE TABLE categories (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, name)
);

ALTER TABLE items ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE RESTRICT;
ALTER TABLE items ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE items DROP COLUMN tenant_id;
ALTER TABLE items ADD COLUMN organization_id UUID NOT NULL;

-- Reset status default and enforce valid state machine values
ALTER TABLE items ALTER COLUMN status SET DEFAULT 'DRAFT';
ALTER TABLE items ADD CONSTRAINT valid_status CHECK (status IN ('DRAFT', 'AVAILABLE', 'ALLOCATED', 'MAINTENANCE', 'RETIRED'));

DROP INDEX IF EXISTS idx_items_tenant_id;
CREATE INDEX idx_items_org_status ON items(organization_id, status) WHERE deleted_at IS NULL;
