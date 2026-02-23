package handler

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"

	db "github.com/arc-self/apps/privacy-service/internal/repository/db"
)

type AuditLogsHandler struct {
	querier db.Querier
}

func NewAuditLogsHandler(q db.Querier) *AuditLogsHandler {
	return &AuditLogsHandler{querier: q}
}

func (h *AuditLogsHandler) Register(e *echo.Echo) {
	g := e.Group("/api/v1/audit-logs")
	g.GET("", h.List)
}

func (h *AuditLogsHandler) List(c echo.Context) error {
	tenantID := c.Request().Header.Get("X-Tenant-Id")
	if tenantID == "" {
		return errResponse(c, http.StatusUnauthorized, "missing X-Tenant-Id header")
	}

	var orgID pgtype.UUID
	if err := orgID.Scan(tenantID); err != nil {
		return errResponse(c, http.StatusBadRequest, "invalid organization id")
	}

	logs, err := h.querier.ListAuditLogs(c.Request().Context(), orgID)
	if err != nil {
		return errResponse(c, http.StatusInternalServerError, "failed to fetch audit logs")
	}

	return c.JSON(http.StatusOK, logs)
}
