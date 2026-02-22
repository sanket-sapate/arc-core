// Package dispatcher (webhook) provides HMAC-signed webhook delivery for
// the notification-service.
//
// Every outbound webhook:
//  1. Serialises the payload as JSON.
//  2. Computes an HMAC-SHA256 signature using the endpoint's secret_key.
//  3. POSTs the payload with an X-Arc-Signature header.
//  4. Logs success/failure to delivery_logs.
package dispatcher

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"go.uber.org/zap"

	db "github.com/arc-self/apps/notification-service/internal/repository/db"
)

// WebhookDispatcher delivers signed webhook payloads to external endpoints.
type WebhookDispatcher struct {
	querier db.Querier
	logger  *zap.Logger
	client  *http.Client
}

// NewWebhookDispatcher creates a WebhookDispatcher with a default 10s timeout.
func NewWebhookDispatcher(q db.Querier, logger *zap.Logger) *WebhookDispatcher {
	return &WebhookDispatcher{
		querier: q,
		logger:  logger,
		client:  &http.Client{Timeout: 10 * time.Second},
	}
}

// Dispatch sends a JSON payload to the given URL, signed with the HMAC-SHA256
// of the secret. It records the delivery status in delivery_logs.
func (d *WebhookDispatcher) Dispatch(ctx context.Context, orgID pgtype.UUID, url, secret string, payload interface{}) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal payload: %w", err)
	}

	// ── HMAC-SHA256 Signature ──────────────────────────────────────────
	sig := computeHMAC(secret, body)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Arc-Signature", sig)

	resp, err := d.client.Do(req)

	status := "success"
	var errMsg pgtype.Text

	if err != nil {
		status = "failed"
		errMsg = pgtype.Text{String: err.Error(), Valid: true}
		d.logger.Warn("webhook delivery failed",
			zap.String("url", url),
			zap.Error(err),
		)
	} else {
		defer resp.Body.Close()
		if resp.StatusCode >= 400 {
			status = "failed"
			errMsg = pgtype.Text{String: fmt.Sprintf("HTTP %d", resp.StatusCode), Valid: true}
			d.logger.Warn("webhook non-2xx response",
				zap.String("url", url),
				zap.Int("status", resp.StatusCode),
			)
		} else {
			d.logger.Info("webhook delivered",
				zap.String("url", url),
				zap.Int("status", resp.StatusCode),
			)
		}
	}

	// ── Persist delivery log ───────────────────────────────────────────
	if logErr := d.querier.InsertDeliveryLog(ctx, db.InsertDeliveryLogParams{
		OrganizationID: orgID,
		DeliveryType:   "webhook",
		Recipient:      url,
		Status:         status,
		ErrorMessage:   errMsg,
	}); logErr != nil {
		d.logger.Error("failed to log webhook delivery", zap.Error(logErr))
	}

	if status == "failed" {
		return fmt.Errorf("webhook delivery to %s failed: %s", url, errMsg.String)
	}
	return nil
}

// computeHMAC generates a hex-encoded HMAC-SHA256 of the body using the given secret.
func computeHMAC(secret string, body []byte) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	return hex.EncodeToString(mac.Sum(nil))
}
