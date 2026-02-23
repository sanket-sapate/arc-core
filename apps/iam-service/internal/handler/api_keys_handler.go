package handler

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"

	db "github.com/arc-self/apps/iam-service/internal/repository/db"
)

type ApiKeysHandler struct {
	querier db.Querier
	logger  *zap.Logger
}

func NewApiKeysHandler(q db.Querier, logger *zap.Logger) *ApiKeysHandler {
	return &ApiKeysHandler{querier: q, logger: logger}
}

func (h *ApiKeysHandler) Register(e *echo.Echo) {
	g := e.Group("/api-keys")
	g.GET("", h.ListApiKeys)
	g.POST("", h.CreateApiKey)
	g.DELETE("/:id", h.RevokeApiKey)
}

func (h *ApiKeysHandler) ListApiKeys(c echo.Context) error {
	orgID, err := getOrgIDFromContext(c)
	if err != nil || !orgID.Valid {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "missing organization ID"})
	}

	keys, err := h.querier.ListApiKeys(c.Request().Context(), orgID)
	if err != nil {
		h.logger.Error("failed to list api keys", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to list api keys"})
	}

	type apiKeyResponse struct {
		ID        string     `json:"id"`
		Name      string     `json:"name"`
		KeyPrefix string     `json:"key_prefix"`
		ExpiresAt *time.Time `json:"expires_at"`
		CreatedAt time.Time  `json:"created_at"`
	}

	resp := make([]apiKeyResponse, 0, len(keys))
	for _, k := range keys {
		var expiresAt *time.Time
		if k.ExpiresAt.Valid {
			t := k.ExpiresAt.Time
			expiresAt = &t
		}
		resp = append(resp, apiKeyResponse{
			ID:        pgUUIDToString(k.ID),
			Name:      k.Name,
			KeyPrefix: k.KeyPrefix,
			ExpiresAt: expiresAt,
			CreatedAt: k.CreatedAt.Time,
		})
	}

	return c.JSON(http.StatusOK, resp)
}

type CreateApiKeyRequest struct {
	Name      string `json:"name"`
	ExpiresIn int    `json:"expires_in_days"` // e.g. 30, 90, 365, or 0 for never
}

func generateSecureToken() (string, string) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		panic(err)
	}
	secret := hex.EncodeToString(bytes)
	rawKey := "arc_" + secret

	hasher := sha256.New()
	hasher.Write([]byte(rawKey))
	keyHash := hex.EncodeToString(hasher.Sum(nil))

	return rawKey, keyHash
}

func (h *ApiKeysHandler) CreateApiKey(c echo.Context) error {
	orgID, err := getOrgIDFromContext(c)
	if err != nil || !orgID.Valid {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "missing organization ID"})
	}

	var req CreateApiKeyRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	if req.Name == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "name is required"})
	}

	var expiresAt pgtype.Timestamptz
	if req.ExpiresIn > 0 {
		expiresAt = pgtype.Timestamptz{
			Time:  time.Now().AddDate(0, 0, req.ExpiresIn),
			Valid: true,
		}
	} else {
		expiresAt = pgtype.Timestamptz{Valid: false}
	}

	// Generate the token
	rawKey, keyHash := generateSecureToken()
	prefix := rawKey[:8] + "..." + rawKey[len(rawKey)-4:]

	// Try to get creator ID from APISIX header
	var creatorID pgtype.UUID
	if creatorStr := c.Request().Header.Get("X-Internal-User-Id"); creatorStr != "" {
		_ = creatorID.Scan(creatorStr)
	}

	params := db.CreateApiKeyParams{
		OrganizationID: orgID,
		Name:           req.Name,
		KeyPrefix:      prefix,
		KeyHash:        keyHash,
		CreatedBy:      creatorID,
		ExpiresAt:      expiresAt,
	}

	key, err := h.querier.CreateApiKey(c.Request().Context(), params)
	if err != nil {
		h.logger.Error("failed to create api key", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to create api key"})
	}

	var respExpiresAt *time.Time
	if key.ExpiresAt.Valid {
		t := key.ExpiresAt.Time
		respExpiresAt = &t
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"id":         pgUUIDToString(key.ID),
		"name":       key.Name,
		"key_prefix": key.KeyPrefix,
		"raw_key":    rawKey, // returned only once
		"expires_at": respExpiresAt,
		"created_at": key.CreatedAt.Time,
	})
}

func (h *ApiKeysHandler) RevokeApiKey(c echo.Context) error {
	orgID, err := getOrgIDFromContext(c)
	if err != nil || !orgID.Valid {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "missing organization ID"})
	}

	keyIDStr := c.Param("id")
	var keyID pgtype.UUID
	if err := keyID.Scan(keyIDStr); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid key id"})
	}

	params := db.RevokeApiKeyParams{
		ID:             keyID,
		OrganizationID: orgID,
	}

	if err := h.querier.RevokeApiKey(c.Request().Context(), params); err != nil {
		h.logger.Error("failed to revoke api key", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to revoke api key"})
	}

	return c.NoContent(http.StatusNoContent)
}
