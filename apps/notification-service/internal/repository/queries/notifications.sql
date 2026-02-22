-- ── Notification Templates ────────────────────────────────────────────────

-- name: CreateNotificationTemplate :one
INSERT INTO notification_templates (organization_id, name, subject_template, body_html_template)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetNotificationTemplate :one
SELECT * FROM notification_templates
WHERE id = $1 AND organization_id = $2;

-- name: GetNotificationTemplateByName :one
SELECT * FROM notification_templates
WHERE organization_id = $1 AND name = $2;

-- name: ListNotificationTemplates :many
SELECT * FROM notification_templates
WHERE organization_id = $1
ORDER BY created_at DESC;

-- name: UpdateNotificationTemplate :one
UPDATE notification_templates
SET subject_template = $3, body_html_template = $4
WHERE id = $1 AND organization_id = $2
RETURNING *;

-- name: DeleteNotificationTemplate :exec
DELETE FROM notification_templates
WHERE id = $1 AND organization_id = $2;

-- ── Webhooks ──────────────────────────────────────────────────────────────

-- name: CreateWebhook :one
INSERT INTO webhooks (organization_id, endpoint_url, secret_key, subscribed_events)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetWebhook :one
SELECT * FROM webhooks
WHERE id = $1 AND organization_id = $2;

-- name: ListWebhooks :many
SELECT * FROM webhooks
WHERE organization_id = $1
ORDER BY created_at DESC;

-- name: UpdateWebhook :one
UPDATE webhooks
SET endpoint_url = $2, secret_key = $3, subscribed_events = $4, active = $5
WHERE id = $1
RETURNING *;

-- name: DeleteWebhook :exec
DELETE FROM webhooks WHERE id = $1 AND organization_id = $2;

-- name: GetActiveWebhooksByEvent :many
SELECT * FROM webhooks
WHERE active = true AND $1 = ANY(subscribed_events);

-- ── Delivery Logs ─────────────────────────────────────────────────────────

-- name: InsertDeliveryLog :exec
INSERT INTO delivery_logs (organization_id, delivery_type, recipient, status, error_message)
VALUES ($1, $2, $3, $4, $5);
