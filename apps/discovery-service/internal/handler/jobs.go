package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/arc-self/apps/discovery-service/internal/client"
	coreMw "github.com/arc-self/packages/go-core/middleware"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

// TriggerScanProxyHandler proxies POST /scans/trigger → scanner POST /admin/scans.
// It injects the required `type` field and forwards `profile_id` if provided.
func TriggerScanProxyHandler(scanner client.ScannerClient, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		tenantIDStr, _ := coreMw.GetOrgID(c.Request().Context())

		var body map[string]interface{}
		if err := c.Bind(&body); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		}

		// scanner requires `type` field – use source type from request, fallback to "postgres"
		if t, ok := body["type"].(string); !ok || t == "" {
			body["type"] = "postgres"
		}

		rawJSON, err := scanner.ProxyRequest(c.Request().Context(), tenantIDStr, http.MethodPost, "/admin/scans", body)
		if err != nil {
			logger.Error("failed to trigger scan on scanner", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		var result map[string]interface{}
		if err := json.Unmarshal(rawJSON, &result); err == nil {
			return c.JSON(http.StatusCreated, result)
		}
		return c.JSONBlob(http.StatusCreated, rawJSON)
	}
}

// ListJobsHandler proxies GET /jobs → scanner /admin/jobs with pagination.
// Returns the raw JSON bytes to preserve the array type exactly.
func ListJobsHandler(scanner client.ScannerClient, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		tenantIDStr, _ := coreMw.GetOrgID(c.Request().Context())

		page := c.QueryParam("page")
		pageSize := c.QueryParam("page_size")

		path := "/admin/jobs"
		if page != "" && pageSize != "" {
			path = fmt.Sprintf("%s?page=%s&page_size=%s", path, page, pageSize)
		}

		rawJSON, err := scanner.ProxyRequest(c.Request().Context(), tenantIDStr, http.MethodGet, path, nil)
		if err != nil {
			logger.Error("failed to list jobs from scanner", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		var jobs []map[string]interface{}
		if err := json.Unmarshal(rawJSON, &jobs); err != nil {
			return c.JSON(http.StatusOK, []interface{}{})
		}

		for _, j := range jobs {
			// Map job_id to id for frontend compatibility
			if val, ok := j["job_id"]; ok {
				j["id"] = val
			}
			// Normalize case if needed
			if val, ok := j["createdAt"]; ok {
				j["created_at"] = val
				delete(j, "createdAt")
			}
			if val, ok := j["completedAt"]; ok {
				j["completed_at"] = val
				delete(j, "completedAt")
			}
		}

		return c.JSON(http.StatusOK, jobs)
	}
}

// GetJobFindingsProxyHandler proxies GET /jobs/:job_id/findings → scanner /admin/jobs/:id/findings.
func GetJobFindingsProxyHandler(scanner client.ScannerClient, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		tenantIDStr, _ := coreMw.GetOrgID(c.Request().Context())

		jobID := c.Param("job_id")
		if jobID == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "job_id is required"})
		}

		page := c.QueryParam("page")
		pageSize := c.QueryParam("page_size")

		path := fmt.Sprintf("/admin/jobs/%s/findings", jobID)
		if page != "" && pageSize != "" {
			path = fmt.Sprintf("%s?page=%s&page_size=%s", path, page, pageSize)
		}

		rawJSON, err := scanner.ProxyRequest(c.Request().Context(), tenantIDStr, http.MethodGet, path, nil)
		if err != nil {
			logger.Error("failed to get job findings from scanner", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		var data interface{}
		if err := json.Unmarshal(rawJSON, &data); err != nil {
			return c.JSON(http.StatusOK, []interface{}{})
		}

		// Normalize findings if it's an array or an object with findings array
		if findings, ok := data.([]interface{}); ok {
			for _, f := range findings {
				if fm, ok := f.(map[string]interface{}); ok {
					normalizeFinding(fm)
				}
			}
		} else if m, ok := data.(map[string]interface{}); ok {
			if findings, ok := m["findings"].([]interface{}); ok {
				for _, f := range findings {
					if fm, ok := f.(map[string]interface{}); ok {
						normalizeFinding(fm)
					}
				}
			}
		}

		return c.JSON(http.StatusOK, data)
	}
}

func normalizeFinding(f map[string]interface{}) {
	// Map scanner fields to frontend expected fields
	if val, ok := f["rule_name"]; ok {
		f["info_type"] = val
	}
	if val, ok := f["table_name"]; ok {
		f["table"] = val
	}
	if val, ok := f["column_name"]; ok {
		f["column"] = val
	}
	if val, ok := f["match_value"]; ok {
		f["sample_value"] = val
	}
	if val, ok := f["file_path"]; ok {
		f["path"] = val
	}
}
