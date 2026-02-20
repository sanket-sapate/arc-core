CREATE TABLE audit_logs (
    event_id UUID PRIMARY KEY,
    aggregate_type VARCHAR(255) NOT NULL,
    aggregate_id UUID NOT NULL,
    actor_id UUID NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_aggregate ON audit_logs(aggregate_type, aggregate_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
