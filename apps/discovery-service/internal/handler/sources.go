package handler

import (
	"net/http"

	"github.com/arc-self/apps/discovery-service/internal/client"
	coreMw "github.com/arc-self/packages/go-core/middleware"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

// ListSourcesHandler proxies GET /sources → scanner /admin/sources.
// Returns the raw JSON bytes from the scanner so the array type is preserved exactly.
func ListSourcesHandler(scanner client.ScannerClient, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		tenantIDStr, _ := coreMw.GetOrgID(c.Request().Context())

		rawJSON, err := scanner.ProxyRequest(c.Request().Context(), tenantIDStr, http.MethodGet, "/admin/sources", nil)
		if err != nil {
			logger.Error("failed to list sources from scanner", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		// If the scanner returned an empty body, normalise to an empty JSON array.
		if len(rawJSON) == 0 {
			rawJSON = []byte("[]")
		}

		return c.JSONBlob(http.StatusOK, rawJSON)
	}
}

// CreateSourceHandler proxies POST /sources → scanner /admin/sources.
func CreateSourceHandler(scanner client.ScannerClient, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		tenantIDStr, _ := coreMw.GetOrgID(c.Request().Context())

		var req interface{}
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		}

		rawJSON, err := scanner.ProxyRequest(c.Request().Context(), tenantIDStr, http.MethodPost, "/admin/sources", req)
		if err != nil {
			logger.Error("failed to create source on scanner", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		if len(rawJSON) == 0 {
			rawJSON = []byte("{}")
		}

		return c.JSONBlob(http.StatusCreated, rawJSON)
	}
}
