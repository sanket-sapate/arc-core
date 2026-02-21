CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Standard Outbox for CDC
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Read-Only Replica (Populated via NATS)
CREATE TABLE replicated_data_dictionary (
    id UUID PRIMARY KEY, -- Source UUID from discovery-service
    organization_id UUID NOT NULL,
    name TEXT NOT NULL,
    sensitivity TEXT NOT NULL,
    active BOOLEAN NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

-- Core TRM Tables
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    name TEXT NOT NULL,
    contact_email TEXT,
    compliance_status VARCHAR(50) DEFAULT 'pending',
    risk_level VARCHAR(50) DEFAULT 'low',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE frameworks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL, -- e.g., 'SOC 2 Type II', 'ISO 27001'
    version VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    framework_id UUID REFERENCES frameworks(id) ON DELETE RESTRICT,
    status VARCHAR(50) DEFAULT 'draft',
    score INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE dpas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Junction table linking a DPA to the replicated Data Dictionary
CREATE TABLE dpa_data_scope (
    dpa_id UUID REFERENCES dpas(id) ON DELETE CASCADE,
    dictionary_id UUID REFERENCES replicated_data_dictionary(id) ON DELETE CASCADE,
    justification TEXT,
    PRIMARY KEY (dpa_id, dictionary_id)
);
