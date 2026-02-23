-- name: CreateScan :one
INSERT INTO cookie_scans (id, tenant_id, url, status, created_at, updated_at)
VALUES ($1, $2, $3, 'pending', NOW(), NOW())
RETURNING *;

-- name: GetScan :one
SELECT * FROM cookie_scans WHERE id = $1;

-- name: ListScans :many
SELECT * FROM cookie_scans
WHERE tenant_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: UpdateScanStatus :one
UPDATE cookie_scans
SET
    status       = $2,
    error        = $3,
    started_at   = $4,
    completed_at = $5,
    updated_at   = NOW()
WHERE id = $1
RETURNING *;

-- name: InsertCookies :copyfrom
INSERT INTO scanned_cookies (
    id, scan_id, name, domain, path, value,
    expiration, secure, http_only, same_site,
    source, category, description
) VALUES (
    $1, $2, $3, $4, $5, $6,
    $7, $8, $9, $10,
    $11, $12, $13
);

-- name: GetCookiesByScan :many
SELECT * FROM scanned_cookies
WHERE scan_id = $1
ORDER BY category, name;
