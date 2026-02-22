-- name: InsertCookieConsent :exec
INSERT INTO cookie_consents (
    organization_id,
    anonymous_id,
    consents,
    ip_address,
    user_agent
) VALUES (
    $1, $2, $3, $4, $5
);
