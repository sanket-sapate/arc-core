CREATE TABLE nominees (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email        TEXT NOT NULL,
    nominee_name      TEXT NOT NULL,
    nominee_email     TEXT NOT NULL,
    nominee_relation  TEXT NOT NULL,
    status            TEXT DEFAULT 'pending', -- pending, accepted, rejected
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_nominees_user_email ON nominees(user_email);

-- Add due_date to grievances for SLAs
ALTER TABLE grievances
ADD COLUMN due_date TIMESTAMPTZ;
