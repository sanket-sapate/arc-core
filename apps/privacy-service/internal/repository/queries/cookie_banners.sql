-- name: CreateCookieBanner :one
INSERT INTO cookie_banners (
    id, organization_id, domain, name, title, message,
    accept_button_text, reject_button_text, settings_button_text,
    theme, position, active, config
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
) RETURNING *;

-- name: GetCookieBanner :one
SELECT * FROM cookie_banners
WHERE id = $1 AND organization_id = $2;

-- name: GetCookieBannerByDomain :one
SELECT * FROM cookie_banners
WHERE organization_id = $1 AND domain = $2;

-- name: ListCookieBanners :many
SELECT * FROM cookie_banners
WHERE organization_id = $1
ORDER BY created_at DESC;

-- name: UpdateCookieBanner :one
UPDATE cookie_banners
SET name = $3, title = $4, message = $5,
    accept_button_text = $6, reject_button_text = $7, settings_button_text = $8,
    theme = $9, position = $10, active = $11, config = $12,
    updated_at = NOW()
WHERE id = $1 AND organization_id = $2
RETURNING *;

-- name: DeleteCookieBanner :exec
DELETE FROM cookie_banners
WHERE id = $1 AND organization_id = $2;
