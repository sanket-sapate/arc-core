CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL, -- e.g., 'breach_alert', 'consent_reminder'
    subject_template TEXT NOT NULL,
    body_html_template TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    endpoint_url TEXT NOT NULL,
    secret_key TEXT NOT NULL, -- Used for HMAC signing
    subscribed_events TEXT[] NOT NULL, -- e.g., '{"consent.submitted", "assessment.completed"}'
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE delivery_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    delivery_type VARCHAR(50) NOT NULL, -- 'email' or 'webhook'
    recipient TEXT NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'success', 'failed'
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
