package handler

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"

	"github.com/arc-self/apps/cookie-scanner/internal/service"
	coreMw "github.com/arc-self/packages/go-core/middleware"
)

type ScanHandler struct {
	svc    *service.ScannerService
	logger *zap.Logger
}

func NewScanHandler(svc *service.ScannerService, logger *zap.Logger) *ScanHandler {
	return &ScanHandler{svc: svc, logger: logger}
}

// RegisterRoutes mounts all cookie-scanner HTTP routes.
func RegisterRoutes(e *echo.Echo, svc *service.ScannerService, logger *zap.Logger) {
	h := NewScanHandler(svc, logger)
	e.POST("/scans", h.StartScan)
	e.GET("/scans", h.ListScans)
	e.GET("/scans/:id", h.GetScan)
}

// resolveTenantID extracts the org/tenant ID from context, falling back to a zero UUID.
func resolveTenantID(c echo.Context) uuid.UUID {
	orgID, _ := coreMw.GetOrgID(c.Request().Context())
	if orgID == "" {
		return uuid.Nil
	}
	id, err := uuid.Parse(orgID)
	if err != nil {
		return uuid.Nil
	}
	return id
}

// POST /scans  { "url": "https://example.com" }
func (h *ScanHandler) StartScan(c echo.Context) error {
	tid := resolveTenantID(c)

	var req struct {
		URL string `json:"url"`
	}
	if err := c.Bind(&req); err != nil || req.URL == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "url is required"})
	}

	scan, err := h.svc.StartScan(c.Request().Context(), tid, req.URL)
	if err != nil {
		h.logger.Error("StartScan failed", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusAccepted, scan)
}

// GET /scans
func (h *ScanHandler) ListScans(c echo.Context) error {
	tid := resolveTenantID(c)

	scans, err := h.svc.ListScans(c.Request().Context(), tid, 50, 0)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	if scans == nil {
		return c.JSON(http.StatusOK, []interface{}{})
	}
	return c.JSON(http.StatusOK, scans)
}

// GET /scans/:id
func (h *ScanHandler) GetScan(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid scan id"})
	}

	scan, cookies, err := h.svc.GetScan(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "scan not found"})
	}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"scan":    scan,
		"cookies": cookies,
	})
}
