// Package handler contains the Echo HTTP handlers for the public-api-service.
//
// All handlers are unauthenticated or API-key authenticated — they serve
// embedded JavaScript widgets on third-party domains, so standard
// session/JWT auth cannot be assumed.
package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/nats-io/nats.go"
	"github.com/redis/go-redis/v9"
	"go.opentelemetry.io/otel"
	"go.uber.org/zap"

	"github.com/arc-self/packages/go-core/natsclient"
)

// subjectConsentSubmitted is the NATS JetStream subject used to publish
// consent payloads received from client widgets.
//
// IMPORTANT: This subject MUST begin with "DOMAIN_EVENTS." to be captured
// by the existing DOMAIN_EVENTS JetStream stream (configured with subject
// filter "DOMAIN_EVENTS.>"). Using any other prefix (e.g. "PUBLIC_EVENTS.")
// would cause messages to be silently dropped by the stream.
const subjectConsentSubmitted = "DOMAIN_EVENTS.public.consent.submitted"

// redisBannerKeyFmt is the Redis key template for widget banner configs.
// Keys are written by the privacy-service whenever a CookieBanner is
// created or updated via its admin API.
const redisBannerKeyFmt = "widget:banner:%s:%s" // org_id, domain

// SDKHandler handles public-facing widget endpoints.
type SDKHandler struct {
	redis  *redis.Client
	nats   *natsclient.Client
	logger *zap.Logger
}

// NewSDKHandler constructs an SDKHandler.
func NewSDKHandler(r *redis.Client, n *natsclient.Client, l *zap.Logger) *SDKHandler {
	return &SDKHandler{redis: r, nats: n, logger: l}
}

// Register mounts the SDK routes on the provided Echo instance.
func (h *SDKHandler) Register(e *echo.Echo) {
	v1 := e.Group("/v1/sdk")
	v1.GET("/banner/:organization_id/:domain", h.GetBanner)
	v1.POST("/consent", h.SubmitConsent)
}

// ── GET /v1/sdk/banner/:organization_id/:domain ───────────────────────────

// GetBanner returns the active cookie banner configuration for an
// organisation/domain pair, served directly from Redis with aggressive
// cache headers.
//
// A Redis miss returns 404. There is NO synchronous database fallback —
// this is intentional to protect Postgres from public traffic spikes.
// The privacy-service is responsible for keeping Redis warm via its
// cache-aside write-through on every CookieBanner mutation.
//
// @Summary      Get cookie banner config
// @Description  Returns the cached banner configuration for a given organization and domain from Redis. Returns 404 on cache miss (no DB fallback).
// @ID           get-banner
// @Tags         SDK
// @Produce      json
// @Param        organization_id  path      string  true  "Organization UUID"
// @Param        domain           path      string  true  "Website domain (e.g. example.com)"
// @Success      200  {object}  map[string]interface{}  "Banner configuration JSON"
// @Failure      404  {object}  map[string]string       "Banner not found in cache"
// @Failure      503  {object}  map[string]string       "Redis unavailable"
// @Router       /v1/sdk/banner/{organization_id}/{domain} [get]
func (h *SDKHandler) GetBanner(c echo.Context) error {
	ctx, span := otel.Tracer("public-api").Start(c.Request().Context(), "sdk.GetBanner")
	defer span.End()

	orgID := c.Param("organization_id")
	domain := c.Param("domain")

	key := fmt.Sprintf(redisBannerKeyFmt, orgID, domain)

	val, err := h.redis.Get(ctx, key).Result()
	if err == redis.Nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "banner not found"})
	}
	if err != nil {
		h.logger.Error("redis GET failed", zap.String("key", key), zap.Error(err))
		return c.JSON(http.StatusServiceUnavailable, map[string]string{"error": "service unavailable"})
	}

	// Aggressive caching — widget JS can cache this for 5 minutes.
	c.Response().Header().Set("Cache-Control", "public, max-age=300, stale-while-revalidate=60")
	c.Response().Header().Set("Content-Type", "application/json")
	return c.String(http.StatusOK, val)
}

// ── POST /v1/sdk/consent ─────────────────────────────────────────────────

// consentPayload is the body accepted from the widget SDK.
type consentPayload struct {
	OrganizationID string          `json:"organization_id"`
	AnonymousID    string          `json:"anonymous_id"`
	Consents       json.RawMessage `json:"consents"`    // arbitrary k/v pairs
	IPAddress      string          `json:"ip_address"`
	UserAgent      string          `json:"user_agent"`
}

// natsConsentEvent is the envelope published to NATS JetStream.
// Including created_at allows the consumer to record the exact client-side
// submission time rather than the DB insertion time.
type natsConsentEvent struct {
	OrganizationID string          `json:"organization_id"`
	AnonymousID    string          `json:"anonymous_id"`
	Consents       json.RawMessage `json:"consents"`
	IPAddress      string          `json:"ip_address"`
	UserAgent      string          `json:"user_agent"`
	SubmittedAt    time.Time       `json:"submitted_at"`
}

// SubmitConsent accepts a widget consent payload, publishes it to NATS
// JetStream, and immediately returns 202 Accepted without waiting for
// a database write.
//
// The privacy-service is subscribed to DOMAIN_EVENTS.public.consent.submitted
// and will asynchronously persist the record to Postgres.
//
// @Summary      Submit user consent
// @Description  Accepts consent choices from the widget SDK and publishes them to NATS JetStream for async persistence. Returns 202 immediately.
// @ID           submit-consent
// @Tags         SDK
// @Accept       json
// @Produce      json
// @Param        body  body      consentPayload         true  "Consent payload"
// @Success      202   {object}  map[string]string      "Consent queued"
// @Failure      400   {object}  map[string]string      "Invalid request body"
// @Failure      503   {object}  map[string]string      "NATS unavailable"
// @Router       /v1/sdk/consent [post]
func (h *SDKHandler) SubmitConsent(c echo.Context) error {
	ctx, span := otel.Tracer("public-api").Start(c.Request().Context(), "sdk.SubmitConsent")
	defer span.End()

	var req consentPayload
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}
	if req.OrganizationID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "organization_id is required"})
	}
	// Use real IP / User-Agent from the request if not provided in the body.
	if req.IPAddress == "" {
		req.IPAddress = c.RealIP()
	}
	if req.UserAgent == "" {
		req.UserAgent = c.Request().UserAgent()
	}

	event := natsConsentEvent{
		OrganizationID: req.OrganizationID,
		AnonymousID:    req.AnonymousID,
		Consents:       req.Consents,
		IPAddress:      req.IPAddress,
		UserAgent:      req.UserAgent,
		SubmittedAt:    time.Now().UTC(),
	}

	data, err := json.Marshal(event)
	if err != nil {
		h.logger.Error("failed to marshal consent event", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "internal error"})
	}

	// Publish to JetStream — fire and forget.
	// The stream guarantees at-least-once delivery to the privacy-service consumer.
	_ = ctx // OTel span already started; NATS publish doesn't take a context
	if _, err := h.nats.JS.Publish(subjectConsentSubmitted, data, nats.Context(ctx)); err != nil {
		h.logger.Error("NATS publish failed",
			zap.String("subject", subjectConsentSubmitted),
			zap.Error(err),
		)
		// Return 503 so the widget SDK can retry — don't silently swallow failures.
		return c.JSON(http.StatusServiceUnavailable, map[string]string{"error": "could not queue consent, please retry"})
	}

	h.logger.Info("consent event published",
		zap.String("organization_id", req.OrganizationID),
		zap.String("subject", subjectConsentSubmitted),
	)

	return c.JSON(http.StatusAccepted, map[string]string{"status": "queued"})
}
