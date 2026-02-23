CREATE TABLE IF NOT EXISTS script_rules (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID        NOT NULL,
    purpose_id    UUID        NOT NULL REFERENCES purposes(id) ON DELETE CASCADE,
    name          TEXT        NOT NULL,
    script_domain TEXT        NOT NULL,
    rule_type     TEXT        NOT NULL, -- 'regex', 'exact', 'contains'
    active        BOOLEAN     NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_script_rules_tenant_id ON script_rules(tenant_id);

CREATE TRIGGER update_script_rules_updated_at
BEFORE UPDATE ON script_rules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
