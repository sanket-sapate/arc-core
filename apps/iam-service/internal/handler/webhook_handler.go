package handler

import (
	"crypto/subtle"
	"net/http"

	"github.com/labstack/echo/v4"
	"go.uber.org/zap"

	"github.com/arc-self/apps/iam-service/internal/service"
)

// WebhookHandler processes inbound Keycloak event listener webhooks.
// This endpoint bypasses the APISIX Go Runner authorization plugin;
// authentication is done via a pre-shared key (PSK) in the
// X-Webhook-Secret header.
type WebhookHandler struct {
	syncSvc *service.SyncService
	logger  *zap.Logger
	psk     string
}

// NewWebhookHandler creates a handler with PSK-based authentication.
func NewWebhookHandler(syncSvc *service.SyncService, logger *zap.Logger, psk string) *WebhookHandler {
	return &WebhookHandler{
		syncSvc: syncSvc,
		logger:  logger,
		psk:     psk,
	}
}

// Register binds the webhook routes to the Echo instance.
func (h *WebhookHandler) Register(e *echo.Echo) {
	g := e.Group("/webhooks")
	g.POST("/keycloak", h.HandleKeycloakEvent)
}

// keycloakEvent represents the payload sent by the Keycloak event
// listener SPI (keycloak-event-listener-http).
type keycloakEvent struct {
	Type   string `json:"type"`
	UserID string `json:"userId"`
	Details struct {
		Email    string `json:"email"`
		Username string `json:"username"`
	} `json:"details"`
}

// HandleKeycloakEvent godoc
// @Summary      Keycloak Event Webhook
// @Description  Receives and processes identity synchronization events from Keycloak. Authenticated via a pre-shared key in the X-Webhook-Secret header (not via APISIX authz plugin).
// @ID           handle-keycloak-event
// @Tags         webhooks
// @Accept       json
// @Produce      json
// @Param        X-Webhook-Secret  header  string         true  "Pre-shared Key"
// @Param        payload           body    keycloakEvent  true  "Keycloak Event Payload"
// @Success      200  {object}  map[string]string  "Processed"
// @Failure      400  {object}  map[string]string  "Invalid Payload"
// @Failure      401  {object}  map[string]string  "Unauthorized"
// @Failure      500  {object}  map[string]string  "Sync Failure"
// @Router       /webhooks/keycloak [post]
func (h *WebhookHandler) HandleKeycloakEvent(c echo.Context) error {
	// --- PSK Authentication ---
	secret := c.Request().Header.Get("X-Webhook-Secret")
	if subtle.ConstantTimeCompare([]byte(secret), []byte(h.psk)) != 1 {
		h.logger.Warn("webhook request rejected: invalid PSK")
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	// --- Parse Event ---
	var event keycloakEvent
	if err := c.Bind(&event); err != nil {
		h.logger.Error("failed to parse keycloak event", zap.Error(err))
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid payload"})
	}

	h.logger.Info("keycloak event received",
		zap.String("type", event.Type),
		zap.String("userId", event.UserID),
	)

	// --- Route by Event Type ---
	switch event.Type {
	case "REGISTER":
		email := event.Details.Email
		if email == "" {
			email = event.Details.Username // fallback
		}
		if email == "" || event.UserID == "" {
			h.logger.Warn("REGISTER event missing userId or email, skipping")
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "missing userId or email"})
		}

		if err := h.syncSvc.SyncUser(c.Request().Context(), event.UserID, email); err != nil {
			h.logger.Error("user sync failed",
				zap.String("userId", event.UserID),
				zap.Error(err),
			)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "sync failed"})
		}

		return c.JSON(http.StatusOK, map[string]string{"status": "synced"})

	default:
		// Acknowledge but ignore unhandled event types
		h.logger.Debug("ignoring unhandled event type", zap.String("type", event.Type))
		return c.JSON(http.StatusOK, map[string]string{"status": "ignored"})
	}
}
