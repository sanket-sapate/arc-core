package handler

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/arc-self/apps/discovery-service/internal/client"
	coreMw "github.com/arc-self/packages/go-core/middleware"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

// proxyTo creates a generic Echo handler that proxies a request to the scanner at the given
// scannerPath (which may include Echo param placeholders such as ":id").
// The scannerPath is a function so params can be resolved at call time.
func proxyTo(
	scanner client.ScannerClient,
	method string,
	buildPath func(c echo.Context) string,
	successStatus int,
	logger *zap.Logger,
) echo.HandlerFunc {
	return func(c echo.Context) error {
		tenantID, _ := coreMw.GetOrgID(c.Request().Context())
		path := buildPath(c)

		var body interface{}
		if method == http.MethodPost || method == http.MethodPut || method == http.MethodPatch {
			if err := c.Bind(&body); err != nil {
				return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
			}
		}

		// Forward query params (pagination, filters) onto the scanner path.
		if qp := c.QueryString(); qp != "" {
			if method == http.MethodGet || method == http.MethodDelete {
				path = path + "?" + qp
			}
		}

		raw, err := scanner.ProxyRequest(c.Request().Context(), tenantID, method, path, body)
		if err != nil {
			logger.Error("scanner proxy failed", zap.String("path", path), zap.Error(err))
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		if len(raw) == 0 {
			switch method {
			case http.MethodDelete:
				return c.NoContent(http.StatusNoContent)
			default:
				raw = []byte("[]")
			}
		}

		// Normalize JSON response keys for frontend compatibility
		var data interface{}
		if err := json.Unmarshal(raw, &data); err != nil {
			return c.JSONBlob(successStatus, raw)
		}

		// Custom dashboard normalization
		if strings.Contains(path, "/dashboard") {
			data = normalizeDashboard(data)
		} else {
			// Generic normalization
			if m, ok := data.(map[string]interface{}); ok {
				normalizeMap(m)
			} else if slice, ok := data.([]interface{}); ok {
				for _, item := range slice {
					if m, ok := item.(map[string]interface{}); ok {
						normalizeMap(m)
					}
				}
			}
		}

		return c.JSON(successStatus, data)
	}
}

func normalizeMap(m map[string]interface{}) {
	// Rename camelCase to snake_case
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}

	for _, k := range keys {
		val := m[k]
		newK := k
		switch k {
		case "createdAt":
			newK = "created_at"
		case "updatedAt":
			newK = "updated_at"
		case "workerGroup":
			newK = "worker_group"
		case "jobId":
			newK = "job_id"
		case "isActive":
			newK = "enabled"
		case "ruleId":
			newK = "rule_id"
		case "sourceId":
			newK = "source_id"
		case "findingsCount":
			newK = "findings_count"
		}

		if newK != k {
			m[newK] = val
			delete(m, k)
		}

		// Decurse if it's a map
		if innerM, ok := val.(map[string]interface{}); ok {
			normalizeMap(innerM)
		}

		// Handle data source configuration base64
		if newK == "configuration" {
			if cfgStr, ok := val.(string); ok && cfgStr != "" {
				if decoded, err := base64.StdEncoding.DecodeString(cfgStr); err == nil {
					var cfgMap map[string]interface{}
					if err := json.Unmarshal(decoded, &cfgMap); err == nil {
						m["configuration"] = cfgMap
					}
				}
			}
		}
	}
}

func normalizeDashboard(data interface{}) interface{} {
	m, ok := data.(map[string]interface{})
	if !ok {
		return data
	}

	res := make(map[string]interface{})

	// Map inventory
	if inv, ok := m["inventory"].(map[string]interface{}); ok {
		res["total_sources"] = inv["total"]
		res["total_registered"] = inv["registered"]
	}

	// Map scanning
	if scan, ok := m["scanning"].(map[string]interface{}); ok {
		res["total_jobs"] = scan["total_scans"]
		res["jobs_completed"] = scan["total_scans"] // approximation
		res["jobs_running"] = scan["active_scans"]
		res["jobs_failed"] = scan["failed_scans"]
		res["total_findings"] = scan["total_risks_found"]
	}

	return res
}

// static path helper — no params
func static(path string) func(c echo.Context) string {
	return func(_ echo.Context) string { return path }
}

// param helper — builds path using one Echo param
func withParam(prefix, paramName, suffix string) func(c echo.Context) string {
	return func(c echo.Context) string {
		return fmt.Sprintf("%s/%s%s", prefix, c.Param(paramName), suffix)
	}
}

// twoParams — builds path using two Echo params
func twoParams(prefix, p1, mid, p2, suffix string) func(c echo.Context) string {
	return func(c echo.Context) string {
		return fmt.Sprintf("%s/%s%s/%s%s", prefix, c.Param(p1), mid, c.Param(p2), suffix)
	}
}

// RegisterProxyRoutes mounts all scanner pass-through routes.
func RegisterProxyRoutes(e *echo.Echo, scanner client.ScannerClient, logger *zap.Logger) {
	// ── Dashboard ─────────────────────────────────────────────────────────────
	e.GET("/dashboard", proxyTo(scanner, http.MethodGet, static("/admin/dashboard"), http.StatusOK, logger))

	// ── Scans (triggered per-source) ─────────────────────────────────────────
	e.POST("/scans/trigger", TriggerScanProxyHandler(scanner, logger))

	// ── Rules ─────────────────────────────────────────────────────────────────
	rules := e.Group("/rules")
	rules.GET("", proxyTo(scanner, http.MethodGet, static("/admin/rules"), http.StatusOK, logger))
	rules.POST("", proxyTo(scanner, http.MethodPost, static("/admin/rules"), http.StatusCreated, logger))
	rules.PUT("/:id", proxyTo(scanner, http.MethodPut, withParam("/admin/rules", "id", ""), http.StatusOK, logger))
	rules.DELETE("/:id", proxyTo(scanner, http.MethodDelete, withParam("/admin/rules", "id", ""), http.StatusNoContent, logger))

	// ── Scan Profiles ─────────────────────────────────────────────────────────
	profiles := e.Group("/profiles")
	profiles.GET("", proxyTo(scanner, http.MethodGet, static("/admin/profiles"), http.StatusOK, logger))
	profiles.POST("", proxyTo(scanner, http.MethodPost, static("/admin/profiles"), http.StatusCreated, logger))
	profiles.PUT("/:id", proxyTo(scanner, http.MethodPut, withParam("/admin/profiles", "id", ""), http.StatusOK, logger))
	profiles.DELETE("/:id", proxyTo(scanner, http.MethodDelete, withParam("/admin/profiles", "id", ""), http.StatusNoContent, logger))
	profiles.POST("/:id/rules", proxyTo(scanner, http.MethodPost, withParam("/admin/profiles", "id", "/rules"), http.StatusCreated, logger))
	profiles.DELETE("/:id/rules/:rule_id", proxyTo(scanner, http.MethodDelete, twoParams("/admin/profiles", "id", "/rules", "rule_id", ""), http.StatusNoContent, logger))

	// ── Source Groups ─────────────────────────────────────────────────────────
	groups := e.Group("/groups")
	groups.GET("", proxyTo(scanner, http.MethodGet, static("/admin/groups"), http.StatusOK, logger))
	groups.POST("", proxyTo(scanner, http.MethodPost, static("/admin/groups"), http.StatusCreated, logger))
	groups.GET("/:id", proxyTo(scanner, http.MethodGet, withParam("/admin/groups", "id", ""), http.StatusOK, logger))
	groups.DELETE("/:id", proxyTo(scanner, http.MethodDelete, withParam("/admin/groups", "id", ""), http.StatusNoContent, logger))
	groups.POST("/:id/sources", proxyTo(scanner, http.MethodPost, withParam("/admin/groups", "id", "/sources"), http.StatusCreated, logger))
	groups.DELETE("/:id/sources/:source_id", proxyTo(scanner, http.MethodDelete, twoParams("/admin/groups", "id", "/sources", "source_id", ""), http.StatusNoContent, logger))

	// ── Schedules ─────────────────────────────────────────────────────────────
	schedules := e.Group("/schedules")
	schedules.GET("", proxyTo(scanner, http.MethodGet, static("/admin/schedules"), http.StatusOK, logger))
	schedules.POST("", proxyTo(scanner, http.MethodPost, static("/admin/schedules"), http.StatusCreated, logger))
	schedules.DELETE("/:id", proxyTo(scanner, http.MethodDelete, withParam("/admin/schedules", "id", ""), http.StatusNoContent, logger))

	// ── Agents ────────────────────────────────────────────────────────────────
	agents := e.Group("/agents")
	agents.GET("", proxyTo(scanner, http.MethodGet, static("/admin/agents"), http.StatusOK, logger))
	agents.GET("/:id/latest-report", proxyTo(scanner, http.MethodGet, withParam("/admin/agents", "id", "/latest-report"), http.StatusOK, logger))
	agents.GET("/:id/report/summary", proxyTo(scanner, http.MethodGet, withParam("/admin/agents", "id", "/report/summary"), http.StatusOK, logger))
	agents.GET("/:id/report/violations", proxyTo(scanner, http.MethodGet, withParam("/admin/agents", "id", "/report/violations"), http.StatusOK, logger))

	// ── Global Findings ───────────────────────────────────────────────────────
	findings := e.Group("/findings")
	findings.GET("", proxyTo(scanner, http.MethodGet, static("/admin/findings"), http.StatusOK, logger))
	findings.POST("/remediate", proxyTo(scanner, http.MethodPost, static("/admin/findings/remediate"), http.StatusOK, logger))

	// ── Mask ─────────────────────────────────────────────────────────────────
	e.POST("/mask", proxyTo(scanner, http.MethodPost, static("/admin/mask"), http.StatusOK, logger))

	// ── Extended Sources ──────────────────────────────────────────────────────
	e.PATCH("/sources/:id", proxyTo(scanner, http.MethodPatch, withParam("/admin/sources", "id", ""), http.StatusOK, logger))
	e.DELETE("/sources/:id", proxyTo(scanner, http.MethodDelete, withParam("/admin/sources", "id", ""), http.StatusNoContent, logger))
	e.GET("/sources/:id/browse", proxyTo(scanner, http.MethodGet, withParam("/admin/sources", "id", "/browse"), http.StatusOK, logger))
	e.GET("/sources/:id/preview", proxyTo(scanner, http.MethodGet, withParam("/admin/sources", "id", "/preview"), http.StatusOK, logger))
	e.POST("/sources/:id/query", proxyTo(scanner, http.MethodPost, withParam("/admin/sources", "id", "/query"), http.StatusOK, logger))

	// ── Extended Jobs ─────────────────────────────────────────────────────────
	e.DELETE("/jobs/:id", proxyTo(scanner, http.MethodDelete, withParam("/admin/jobs", "id", ""), http.StatusNoContent, logger))
	e.GET("/jobs/:id/structure", proxyTo(scanner, http.MethodGet, withParam("/admin/jobs", "id", "/structure"), http.StatusOK, logger))
	e.POST("/jobs/:id/refine", proxyTo(scanner, http.MethodPost, withParam("/admin/jobs", "id", "/refine"), http.StatusOK, logger))
	e.GET("/jobs/:id/artifacts", proxyTo(scanner, http.MethodGet, withParam("/admin/jobs", "id", "/artifacts"), http.StatusOK, logger))
	e.POST("/jobs/:id/artifacts/sign_path", proxyTo(scanner, http.MethodPost, withParam("/admin/jobs", "id", "/artifacts/sign_path"), http.StatusOK, logger))

	// ── Artifacts ─────────────────────────────────────────────────────────────
	e.GET("/artifacts/:id/download", proxyTo(scanner, http.MethodGet, withParam("/admin/artifacts", "id", "/download"), http.StatusOK, logger))
}
