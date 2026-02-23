package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"go.uber.org/zap"

	"github.com/arc-self/apps/discovery-service/internal/client"
	"github.com/arc-self/apps/discovery-service/internal/service"
	coreMw "github.com/arc-self/packages/go-core/middleware"
)

// RegisterRoutes mounts all discovery-service HTTP endpoints onto the Echo instance.
// This function is called from main.go and kept separate to keep main.go tidy.
func RegisterRoutes(e *echo.Echo, dict service.DictionaryService, scan service.ScanService, scanner client.ScannerClient, logger *zap.Logger) {
	e.Use(coreMw.NullToEmptyArray())
	e.Use(InternalContextMiddleware())

	// Health probe – used by Kubernetes liveness/readiness checks.
	e.GET("/healthz", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	// ── Data Dictionary ────────────────────────────────────────────────────
	dg := e.Group("/dictionary")
	dg.POST("", createDictionaryItemHandler(dict, logger))
	dg.GET("", listDictionaryItemsHandler(dict, logger))
	dg.GET("/:id", getDictionaryItemHandler(dict, logger))

	// ── Scan Jobs ──────────────────────────────────────────────────────────
	sg := e.Group("/scans")
	sg.POST("", triggerScanHandler(scan, logger))
	sg.POST("/network", networkScanHandler(scan, logger))
	sg.GET("/:id", getScanJobHandler(scan, logger))

	// ── Sources Proxy ──────────────────────────────────────────────────────
	scg := e.Group("/sources")
	scg.POST("", CreateSourceHandler(scanner, logger))
	scg.GET("", ListSourcesHandler(scanner, logger))

	// ── Jobs & Findings Proxy ──────────────────────────────────────────────
	jg := e.Group("/jobs")
	jg.GET("", ListJobsHandler(scanner, logger))
	jg.GET("/:job_id/findings", GetJobFindingsProxyHandler(scanner, logger))

	// ── All remaining scanner pass-throughs ────────────────────────────────
	RegisterProxyRoutes(e, scanner, logger)
}

// ── Dictionary handlers ────────────────────────────────────────────────────

type createDictionaryItemRequest struct {
	Name        string `json:"name"`
	Category    string `json:"category"`
	Sensitivity string `json:"sensitivity"`
	Pattern     string `json:"pattern"`
}

func createDictionaryItemHandler(svc service.DictionaryService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req createDictionaryItemRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		}
		if req.Name == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "name is required"})
		}

		item, err := svc.CreateDictionaryItem(c.Request().Context(), service.CreateDictionaryItemInput{
			Name:        req.Name,
			Category:    req.Category,
			Sensitivity: req.Sensitivity,
			Pattern:     req.Pattern,
		})
		if err != nil {
			logger.Error("CreateDictionaryItem failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusCreated, item)
	}
}

func listDictionaryItemsHandler(svc service.DictionaryService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		items, err := svc.ListDictionaryItems(c.Request().Context())
		if err != nil {
			logger.Error("ListDictionaryItems failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, items)
	}
}

func getDictionaryItemHandler(svc service.DictionaryService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		id := c.Param("id")
		item, err := svc.GetDictionaryItem(c.Request().Context(), id)
		if err != nil {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, item)
	}
}

// ── Scan handlers ──────────────────────────────────────────────────────────

type triggerScanRequest struct {
	SourceID   string `json:"source_id"`
	SourceName string `json:"source_name"`
}

func triggerScanHandler(svc service.ScanService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req triggerScanRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		}
		if req.SourceID == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "source_id is required"})
		}

		job, err := svc.TriggerScan(c.Request().Context(), service.TriggerScanInput{
			SourceID:   req.SourceID,
			SourceName: req.SourceName,
		})
		if err != nil {
			logger.Error("TriggerScan failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusCreated, job)
	}
}

func getScanJobHandler(svc service.ScanService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		id := c.Param("id")
		job, err := svc.GetScanJob(c.Request().Context(), id)
		if err != nil {
			return c.JSON(http.StatusNotFound, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, job)
	}
}

type networkScanRequest struct {
	TargetRange string `json:"target_range"`
	Ports       []int  `json:"ports"`
}

func networkScanHandler(svc service.ScanService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req networkScanRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		}
		if req.TargetRange == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "target_range is required"})
		}

		err := svc.NetworkScan(c.Request().Context(), service.NetworkScanInput{
			TargetRange: req.TargetRange,
			Ports:       req.Ports,
		})
		if err != nil {
			logger.Error("NetworkScan failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		
		return c.JSON(http.StatusAccepted, map[string]string{"message": "Network discovery scan queued"})
	}
}
