CREATE TABLE consent_receipts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    domain          TEXT NOT NULL,
    anonymous_id    TEXT NOT NULL,
    consents        JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address      TEXT,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consent_receipts_org_domain ON consent_receipts(organization_id, domain);
CREATE INDEX idx_consent_receipts_ts ON consent_receipts(created_at DESC);
