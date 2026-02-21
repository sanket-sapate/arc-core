CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID UNIQUE NOT NULL, -- Crucial for idempotency (maps to outbox_events.id)
    organization_id UUID NOT NULL,
    source_service VARCHAR(50) NOT NULL, -- e.g., 'iam', 'privacy', 'trm'
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    actor_id UUID, -- Extracted from payload if human-initiated
    created_at TIMESTAMPTZ NOT NULL
);

-- Indexes for high-performance querying and filtering
CREATE INDEX idx_audit_org_service ON audit_logs(organization_id, source_service);
CREATE INDEX idx_audit_org_aggregate ON audit_logs(organization_id, aggregate_type, aggregate_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);
