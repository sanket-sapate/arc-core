// Package dispatcher provides email sending capabilities for the
// notification-service.
//
// The current implementation uses a mock/stub that logs the email. Replace
// the HTTP POST body with a real Resend (or SendGrid, SES) API call when
// you're ready to go live.
package dispatcher

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"
	"go.uber.org/zap"

	db "github.com/arc-self/apps/notification-service/internal/repository/db"
)

// EmailDispatcher sends emails and logs delivery results.
type EmailDispatcher struct {
	querier db.Querier
	logger  *zap.Logger
	// TODO: add a real HTTP client + Resend API key here.
	// apiKey  string
}

// NewEmailDispatcher creates an EmailDispatcher.
func NewEmailDispatcher(q db.Querier, logger *zap.Logger) *EmailDispatcher {
	return &EmailDispatcher{querier: q, logger: logger}
}

// SendEmail dispatches an email and records the result in delivery_logs.
//
// Currently a stub — replace the body of this function with an actual
// HTTP POST to the Resend (or equivalent) API:
//
//	POST https://api.resend.com/emails
//	Authorization: Bearer <api_key>
//	{ "from": "...", "to": [...], "subject": "...", "html": "..." }
func (d *EmailDispatcher) SendEmail(ctx context.Context, orgID pgtype.UUID, to, subject, htmlBody string) error {
	// ── Stub: log instead of sending ───────────────────────────────────
	d.logger.Info("email dispatched (stub)",
		zap.String("to", to),
		zap.String("subject", subject),
	)

	// Record success in delivery log.
	status := "success"
	var errMsg pgtype.Text

	// TODO: Replace stub with real HTTP call. On failure set:
	//   status = "failed"
	//   errMsg = pgtype.Text{String: err.Error(), Valid: true}

	if err := d.querier.InsertDeliveryLog(ctx, db.InsertDeliveryLogParams{
		OrganizationID: orgID,
		DeliveryType:   "email",
		Recipient:      to,
		Status:         status,
		ErrorMessage:   errMsg,
	}); err != nil {
		d.logger.Error("failed to log email delivery", zap.Error(err))
	}

	return nil
}

// SendEmailBatch sends the same email to multiple recipients.
func (d *EmailDispatcher) SendEmailBatch(ctx context.Context, orgID pgtype.UUID, recipients []string, subject, htmlBody string) error {
	var firstErr error
	for _, to := range recipients {
		if err := d.SendEmail(ctx, orgID, to, subject, htmlBody); err != nil {
			d.logger.Error("batch email error", zap.String("to", to), zap.Error(err))
			if firstErr == nil {
				firstErr = fmt.Errorf("batch email: %w", err)
			}
		}
	}
	return firstErr
}
