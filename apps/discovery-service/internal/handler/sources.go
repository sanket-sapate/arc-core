package handler

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
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

		var sources []map[string]interface{}
		if err := json.Unmarshal(rawJSON, &sources); err != nil {
			// If it's not an array, maybe it's null or empty
			return c.JSON(http.StatusOK, []interface{}{})
		}

		for _, s := range sources {
			normalizeSource(s)
		}

		return c.JSON(http.StatusOK, sources)
	}
}

func normalizeSource(s map[string]interface{}) {
	// Rename camelCase to snake_case
	if val, ok := s["workerGroup"]; ok {
		s["worker_group"] = val
		delete(s, "workerGroup")
	}
	if val, ok := s["createdAt"]; ok {
		s["created_at"] = val
		delete(s, "createdAt")
	}
	if val, ok := s["updatedAt"]; ok {
		s["updated_at"] = val
		delete(s, "updatedAt")
	}

	// Decode configuration if it's base64 string
	if cfg, ok := s["configuration"].(string); ok && cfg != "" {
		if decoded, err := base64.StdEncoding.DecodeString(cfg); err == nil {
			var cfgMap map[string]interface{}
			if err := json.Unmarshal(decoded, &cfgMap); err == nil {
				s["configuration"] = cfgMap
			}
		}
	}
}

// CreateSourceHandler proxies POST /sources → scanner /admin/sources.
func CreateSourceHandler(scanner client.ScannerClient, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		tenantIDStr, _ := coreMw.GetOrgID(c.Request().Context())

		var body map[string]interface{}
		if err := c.Bind(&body); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		}

		// Normalize: Ensure configuration fields match scanner expectations
		if cfg, ok := body["configuration"].(map[string]interface{}); ok {
			// Port: ensure string
			if port, exists := cfg["port"]; exists {
				switch p := port.(type) {
				case float64:
					cfg["port"] = fmt.Sprintf("%.0f", p)
				case int:
					cfg["port"] = fmt.Sprintf("%d", p)
				}
			}
			// User: frontend sends 'username', scanner wants 'user'
			if u, ok := cfg["username"]; ok {
				cfg["user"] = u
				delete(cfg, "username")
			}
			// Database: frontend sends 'database', scanner wants 'dbname'
			if db, ok := cfg["database"]; ok {
				cfg["dbname"] = db
				delete(cfg, "database")
			}
		}

		rawJSON, err := scanner.ProxyRequest(c.Request().Context(), tenantIDStr, http.MethodPost, "/admin/sources", body)
		if err != nil {
			logger.Error("failed to create source on scanner", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		var source map[string]interface{}
		if err := json.Unmarshal(rawJSON, &source); err == nil {
			normalizeSource(source)
			return c.JSON(http.StatusCreated, source)
		}

		return c.JSONBlob(http.StatusCreated, rawJSON)
	}
}
