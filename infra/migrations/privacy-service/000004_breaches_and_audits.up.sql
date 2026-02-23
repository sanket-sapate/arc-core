-- Up Migration for Breaches and Audit Logs

CREATE TABLE breaches (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id   UUID NOT NULL,
    title             TEXT NOT NULL,
    severity          TEXT DEFAULT 'low',
    status            TEXT DEFAULT 'investigating',
    incident_date     TIMESTAMPTZ,
    description       TEXT,
    remediation_plan  TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_breaches_org ON breaches(organization_id);

CREATE TABLE audit_logs (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id   UUID NOT NULL,
    action            TEXT NOT NULL,
    actor_email       TEXT,
    target_entity     TEXT,
    target_id         TEXT,
    timestamp         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
