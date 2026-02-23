package handler

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"

	db "github.com/arc-self/apps/audit-service/internal/repository/db"
	coreMw "github.com/arc-self/packages/go-core/middleware"
)

const (
	defaultLimit = 50
	maxLimit     = 500
)

// RegisterRoutes mounts all audit-service HTTP endpoints.
// All API routes are read-only — the audit-service never mutates data via HTTP.
func RegisterRoutes(e *echo.Echo, querier db.Querier, logger *zap.Logger) {
	e.Use(coreMw.NullToEmptyArray())
	e.Use(InternalContextMiddleware())

	e.GET("/healthz", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	v1 := e.Group("/v1")

	// GET /v1/audit-logs?limit=50&offset=0
	v1.GET("/audit-logs", listAuditLogsHandler(querier, logger))

	// GET /v1/audit-logs/:aggregate_type/:aggregate_id?limit=50&offset=0
	v1.GET("/audit-logs/:aggregate_type/:aggregate_id", listAuditLogsByAggregateHandler(querier, logger))
}

// ── handlers ──────────────────────────────────────────────────────────────

func listAuditLogsHandler(querier db.Querier, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		orgID, err := mustGetOrgID(c)
		if err != nil {
			return c.JSON(http.StatusUnauthorized, errResp(err.Error()))
		}

		limit, offset := parsePagination(c)

		logs, err := querier.ListAuditLogs(c.Request().Context(), db.ListAuditLogsParams{
			OrganizationID: orgID,
			Limit:          limit,
			Offset:         offset,
		})
		if err != nil {
			logger.Error("ListAuditLogs failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp("failed to list audit logs"))
		}

		return c.JSON(http.StatusOK, map[string]interface{}{
			"data":   logs,
			"limit":  limit,
			"offset": offset,
			"count":  len(logs),
		})
	}
}

func listAuditLogsByAggregateHandler(querier db.Querier, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		orgID, err := mustGetOrgID(c)
		if err != nil {
			return c.JSON(http.StatusUnauthorized, errResp(err.Error()))
		}

		aggregateType := c.Param("aggregate_type")
		aggregateID := c.Param("aggregate_id")
		if aggregateType == "" || aggregateID == "" {
			return c.JSON(http.StatusBadRequest, errResp("aggregate_type and aggregate_id are required"))
		}

		limit, offset := parsePagination(c)

		logs, err := querier.ListAuditLogsByAggregate(c.Request().Context(), db.ListAuditLogsByAggregateParams{
			OrganizationID: orgID,
			AggregateType:  aggregateType,
			AggregateID:    aggregateID,
			Limit:          limit,
			Offset:         offset,
		})
		if err != nil {
			logger.Error("ListAuditLogsByAggregate failed",
				zap.String("aggregate_type", aggregateType),
				zap.String("aggregate_id", aggregateID),
				zap.Error(err),
			)
			return c.JSON(http.StatusInternalServerError, errResp("failed to list audit logs"))
		}

		return c.JSON(http.StatusOK, map[string]interface{}{
			"data":           logs,
			"aggregate_type": aggregateType,
			"aggregate_id":   aggregateID,
			"limit":          limit,
			"offset":         offset,
			"count":          len(logs),
		})
	}
}

// ── helpers ───────────────────────────────────────────────────────────────

// mustGetOrgID extracts the organisation ID from the request context (set by
// InternalContextMiddleware) and converts it to a pgtype.UUID.
// Returns an error if the header was not set — callers must treat this as 401.
func mustGetOrgID(c echo.Context) (pgtype.UUID, error) {
	orgIDStr, ok := coreMw.GetOrgID(c.Request().Context())
	if !ok || orgIDStr == "" {
		return pgtype.UUID{}, fmt.Errorf("missing organization context — X-Internal-Org-Id header required")
	}
	var u pgtype.UUID
	if err := u.Scan(orgIDStr); err != nil {
		return pgtype.UUID{}, fmt.Errorf("invalid organization_id: %w", err)
	}
	return u, nil
}

// parsePagination reads limit and offset query parameters, applying a
// max-limit cap and defaulting to sensible values.
func parsePagination(c echo.Context) (int32, int32) {
	limit := int32(defaultLimit)
	offset := int32(0)

	if v := c.QueryParam("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			limit = int32(n)
		}
	}
	if limit > maxLimit {
		limit = maxLimit
	}
	if v := c.QueryParam("offset"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n >= 0 {
			offset = int32(n)
		}
	}
	return limit, offset
}

func errResp(msg string) map[string]string {
	return map[string]string{"error": msg}
}
