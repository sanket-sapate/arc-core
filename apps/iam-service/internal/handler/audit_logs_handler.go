package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

type AuditLogsHandler struct {
	auditServiceURL string
	logger          *zap.Logger
	httpClient      *http.Client
}

func NewAuditLogsHandler(auditServiceURL string, logger *zap.Logger) *AuditLogsHandler {
	return &AuditLogsHandler{
		auditServiceURL: auditServiceURL,
		logger:          logger,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (h *AuditLogsHandler) Register(e *echo.Echo) {
	e.GET("/api/iam/admin/audit-logs", h.ListAuditLogs)
}

// auditServiceRow matches exactly what the audit-service JSON-encodes for each AuditLog row.
// pgtype.UUID serializes as a plain UUID string (or null for zero value).
// pgtype.Timestamptz serializes as an RFC3339 string.
// Payload is []byte so it is base64-encoded by encoding/json.
type auditServiceRow struct {
	ID             *string `json:"ID"`
	EventID        *string `json:"EventID"`
	OrganizationID *string `json:"OrganizationID"`
	SourceService  string  `json:"SourceService"`
	AggregateType  string  `json:"AggregateType"`
	AggregateID    string  `json:"AggregateID"`
	EventType      string  `json:"EventType"`
	Payload        []byte  `json:"Payload"` // base64-encoded by encoding/json
	ActorID        *string `json:"ActorID"`
	CreatedAt      *string `json:"CreatedAt"`
}

// auditLogResponse is the shape the frontend expects.
type auditLogResponse struct {
	ID         string                 `json:"id"`
	Action     string                 `json:"action"`
	EntityType string                 `json:"entity_type"`
	EntityID   string                 `json:"entity_id"`
	ActorID    string                 `json:"actor_id"`
	ActorEmail string                 `json:"actor_email"`
	Metadata   map[string]interface{} `json:"metadata"`
	CreatedAt  string                 `json:"created_at"`
}

func (h *AuditLogsHandler) ListAuditLogs(c echo.Context) error {
	orgID, err := getOrgID(c)
	if err != nil || !orgID.Valid {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "missing or invalid organization ID"})
	}

	// Issue #9: Validate limit and offset as positive integers
	limitStr := c.QueryParam("limit")
	if limitStr == "" {
		limitStr = "50"
	}
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 0 || limit > 1000 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "limit must be a positive integer (max 1000)"})
	}

	offsetStr := c.QueryParam("offset")
	if offsetStr == "" {
		offsetStr = "0"
	}
	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "offset must be a non-negative integer"})
	}

	url := fmt.Sprintf("%s/v1/audit-logs?limit=%d&offset=%d", h.auditServiceURL, limit, offset)

	req, err := http.NewRequestWithContext(c.Request().Context(), "GET", url, nil)
	if err != nil {
		h.logger.Error("failed to create audit-service request", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to fetch audit logs"})
	}

	req.Header.Set("X-Internal-Org-Id", pgUUIDToString(orgID))
	// Forward user identity so audit-service knows who's requesting
	if userID := c.Request().Header.Get("X-Internal-User-Id"); userID != "" {
		req.Header.Set("X-Internal-User-Id", userID)
	}

	resp, err := h.httpClient.Do(req)
	if err != nil {
		h.logger.Error("failed to call audit-service", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to fetch audit logs"})
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		h.logger.Error("failed to read audit-service response body", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to read audit logs"})
	}

	if resp.StatusCode != http.StatusOK {
		h.logger.Error("audit-service returned error",
			zap.Int("status", resp.StatusCode),
			zap.String("body", string(body)),
		)
		// Don't expose upstream status code directly — normalize to 502
		return c.JSON(http.StatusBadGateway, map[string]string{"error": "audit service unavailable"})
	}

	// audit-service wraps rows in {"data":[...],"count":N}
	var envelope struct {
		Data  json.RawMessage `json:"data"`
		Count int             `json:"count"`
	}
	if err := json.Unmarshal(body, &envelope); err != nil {
		h.logger.Error("failed to decode audit envelope", zap.Error(err), zap.String("body", string(body)))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to parse audit logs"})
	}

	var rows []auditServiceRow
	if err := json.Unmarshal(envelope.Data, &rows); err != nil {
		h.logger.Error("failed to decode audit rows", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to parse audit log rows"})
	}

	out := make([]auditLogResponse, 0, len(rows))
	for _, row := range rows {
		// Payload is base64-decoded []byte containing the original JSON object
		var metadata map[string]interface{}
		_ = json.Unmarshal(row.Payload, &metadata)

		actorEmail := ""
		if metadata != nil {
			if email, ok := metadata["actor_email"].(string); ok {
				actorEmail = email
			}
		}

		createdAt := ""
		if row.CreatedAt != nil {
			createdAt = *row.CreatedAt
		}

		id := ""
		if row.ID != nil {
			id = *row.ID
		}
		actorID := ""
		if row.ActorID != nil {
			actorID = *row.ActorID
		}

		out = append(out, auditLogResponse{
			ID:         id,
			Action:     row.EventType,
			EntityType: row.AggregateType,
			EntityID:   row.AggregateID,
			ActorID:    actorID,
			ActorEmail: actorEmail,
			Metadata:   metadata,
			CreatedAt:  createdAt,
		})
	}

	return c.JSON(http.StatusOK, out)
}
