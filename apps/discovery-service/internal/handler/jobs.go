package handler

import (
	"fmt"
	"net/http"

	"github.com/arc-self/apps/discovery-service/internal/client"
	coreMw "github.com/arc-self/packages/go-core/middleware"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

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

		if len(rawJSON) == 0 {
			rawJSON = []byte("[]")
		}

		return c.JSONBlob(http.StatusOK, rawJSON)
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

		if len(rawJSON) == 0 {
			rawJSON = []byte("[]")
		}

		return c.JSONBlob(http.StatusOK, rawJSON)
	}
}
