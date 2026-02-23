-- name: RecordConsentReceipt :one
INSERT INTO consent_receipts (
    organization_id,
    domain,
    anonymous_id,
    consents,
    ip_address,
    user_agent
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;
