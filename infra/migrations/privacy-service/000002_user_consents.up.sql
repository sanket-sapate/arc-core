-- cookie_consents stores user consent payloads published by the public-api-service
-- via NATS JetStream and asynchronously consumed by this service.
-- No foreign keys to other services — organization_id is a soft reference only.

CREATE TABLE cookie_consents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    anonymous_id    TEXT,
    consents        JSONB    NOT NULL DEFAULT '{}'::jsonb,
    ip_address      TEXT,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cookie_consents_org ON cookie_consents(organization_id);
CREATE INDEX idx_cookie_consents_ts  ON cookie_consents(created_at DESC);
