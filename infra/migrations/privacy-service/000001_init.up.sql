CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Standard Outbox for CDC
CREATE TABLE outbox_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    aggregate_type  VARCHAR(100) NOT NULL,
    aggregate_id    VARCHAR(255) NOT NULL,
    event_type      VARCHAR(100) NOT NULL,
    payload         JSONB NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Consent & Cookie Management (Pushes to Redis on mutate)
CREATE TABLE cookie_banners (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id      UUID NOT NULL,
    domain               TEXT NOT NULL,
    name                 TEXT,
    title                TEXT,
    message              TEXT,
    accept_button_text   TEXT,
    reject_button_text   TEXT,
    settings_button_text TEXT,
    theme                TEXT,
    position             TEXT,
    active               BOOLEAN DEFAULT true,
    config               JSONB DEFAULT '{}'::jsonb,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, domain)
);

CREATE TABLE purposes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    legal_basis     TEXT,
    active          BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE consent_forms (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    active          BOOLEAN DEFAULT true,
    form_config     JSONB DEFAULT '{}'::jsonb,
    purposes        UUID[] DEFAULT '{}'::uuid[],
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Privacy Operations (ROPA, DPIA, Grievances)
CREATE TABLE dpias (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    name            TEXT NOT NULL,
    vendor_id       UUID,       -- Soft link to trm-service. NO FOREIGN KEY.
    status          TEXT DEFAULT 'draft',
    risk_level      TEXT DEFAULT 'medium',
    form_data       JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ropas (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL,
    name                TEXT NOT NULL,
    processing_activity TEXT,
    legal_basis         TEXT,
    data_categories     TEXT[],
    status              TEXT DEFAULT 'active',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE privacy_requests (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id  UUID NOT NULL,
    type             TEXT NOT NULL,
    status           TEXT DEFAULT 'pending',
    requester_email  TEXT,
    requester_name   TEXT,
    description      TEXT,
    resolution       TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for multi-tenant hot paths
CREATE INDEX idx_cookie_banners_org ON cookie_banners(organization_id);
CREATE INDEX idx_purposes_org       ON purposes(organization_id);
CREATE INDEX idx_consent_forms_org  ON consent_forms(organization_id);
CREATE INDEX idx_dpias_org          ON dpias(organization_id);
CREATE INDEX idx_ropas_org          ON ropas(organization_id);
CREATE INDEX idx_privacy_requests_org ON privacy_requests(organization_id);
CREATE INDEX idx_outbox_events_org  ON outbox_events(organization_id, created_at);
