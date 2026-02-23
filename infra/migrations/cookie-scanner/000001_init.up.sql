-- Cookie Scanner Service Schema
CREATE TABLE IF NOT EXISTS cookie_scans (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID        NOT NULL,
    url         TEXT        NOT NULL,
    status      TEXT        NOT NULL DEFAULT 'pending',  -- pending | running | completed | failed
    error       TEXT,
    started_at  TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scanned_cookies (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id     UUID        NOT NULL REFERENCES cookie_scans(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    domain      TEXT,
    path        TEXT,
    value       TEXT,
    expiration  TIMESTAMPTZ,
    secure      BOOLEAN     NOT NULL DEFAULT FALSE,
    http_only   BOOLEAN     NOT NULL DEFAULT FALSE,
    same_site   TEXT,
    source      TEXT        NOT NULL DEFAULT 'headless_browser',
    category    TEXT        NOT NULL DEFAULT 'unknown',
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cookie_scans_tenant_id   ON cookie_scans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cookie_scans_status       ON cookie_scans(status);
CREATE INDEX IF NOT EXISTS idx_scanned_cookies_scan_id   ON scanned_cookies(scan_id);

-- Trigger: keep updated_at fresh on cookie_scans
CREATE OR REPLACE FUNCTION update_cookie_scans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER cookie_scans_updated_at
    BEFORE UPDATE ON cookie_scans
    FOR EACH ROW EXECUTE FUNCTION update_cookie_scans_updated_at();
