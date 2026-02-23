-- Up Migration for DSRs and Grievances

-- Add due_date to privacy_requests (DSRs)
ALTER TABLE privacy_requests
ADD COLUMN due_date TIMESTAMPTZ;

-- Create grievances table based on legacy schema
CREATE TABLE grievances (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id   UUID NOT NULL,
    reporter_email    TEXT,
    issue_type        TEXT NOT NULL,
    description       TEXT,
    status            TEXT DEFAULT 'open',
    priority          TEXT DEFAULT 'medium',
    resolution        TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for multi-tenant hot paths
CREATE INDEX idx_grievances_org ON grievances(organization_id);
