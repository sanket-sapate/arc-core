package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"go.uber.org/zap"

	"github.com/arc-self/apps/trm-service/internal/service"
)

// RegisterRoutes mounts all trm-service HTTP endpoints onto the Echo instance.
func RegisterRoutes(
	e *echo.Echo,
	vendorSvc service.VendorService,
	dpaSvc service.DPAService,
	assessmentSvc service.AssessmentService,
	logger *zap.Logger,
) {
	e.Use(InternalContextMiddleware())

	e.GET("/healthz", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	// ── Vendors ────────────────────────────────────────────────────────────
	v := e.Group("/vendors")
	v.POST("", createVendorHandler(vendorSvc, logger))
	v.GET("", listVendorsHandler(vendorSvc, logger))
	v.GET("/:id", getVendorHandler(vendorSvc, logger))
	v.PUT("/:id", updateVendorHandler(vendorSvc, logger))
	v.DELETE("/:id", deleteVendorHandler(vendorSvc, logger))

	// ── Assessments (nested under vendor) ─────────────────────────────────
	v.GET("/:vendor_id/assessments", listAssessmentsByVendorHandler(assessmentSvc, logger))
	v.POST("/:vendor_id/assessments", createAssessmentHandler(assessmentSvc, logger))

	// ── DPAs (nested under vendor) ─────────────────────────────────────────
	v.GET("/:vendor_id/dpas", listDPAsByVendorHandler(dpaSvc, logger))
	v.POST("/:vendor_id/dpas", createDPAHandler(dpaSvc, logger))

	// ── DPA detail & data scope ────────────────────────────────────────────
	dg := e.Group("/dpas")
	dg.GET("/:id", getDPAHandler(dpaSvc, logger))
	dg.POST("/:id/sign", signDPAHandler(dpaSvc, logger))
	dg.POST("/:id/data-scope", addDPADataScopeHandler(dpaSvc, logger))
	dg.GET("/:id/data-scope", listDPADataScopeHandler(dpaSvc, logger))

	// ── Assessments detail ─────────────────────────────────────────────────
	ag := e.Group("/assessments")
	ag.GET("/:id", getAssessmentHandler(assessmentSvc, logger))
	ag.PATCH("/:id/status", updateAssessmentStatusHandler(assessmentSvc, logger))
}

// ── Vendor handlers ────────────────────────────────────────────────────────

type createVendorRequest struct {
	Name             string `json:"name"`
	ContactEmail     string `json:"contact_email"`
	ComplianceStatus string `json:"compliance_status"`
	RiskLevel        string `json:"risk_level"`
}

func createVendorHandler(svc service.VendorService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req createVendorRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, errResp("invalid request body"))
		}
		vendor, err := svc.CreateVendor(c.Request().Context(), service.CreateVendorInput{
			Name:             req.Name,
			ContactEmail:     req.ContactEmail,
			ComplianceStatus: req.ComplianceStatus,
			RiskLevel:        req.RiskLevel,
		})
		if err != nil {
			logger.Error("CreateVendor failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.JSON(http.StatusCreated, vendor)
	}
}

func listVendorsHandler(svc service.VendorService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		vendors, err := svc.ListVendors(c.Request().Context())
		if err != nil {
			logger.Error("ListVendors failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, vendors)
	}
}

func getVendorHandler(svc service.VendorService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		v, err := svc.GetVendor(c.Request().Context(), c.Param("id"))
		if err != nil {
			return c.JSON(http.StatusNotFound, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, v)
	}
}

func updateVendorHandler(svc service.VendorService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req createVendorRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, errResp("invalid request body"))
		}
		v, err := svc.UpdateVendor(c.Request().Context(), c.Param("id"), service.UpdateVendorInput{
			Name:             req.Name,
			ContactEmail:     req.ContactEmail,
			ComplianceStatus: req.ComplianceStatus,
			RiskLevel:        req.RiskLevel,
		})
		if err != nil {
			logger.Error("UpdateVendor failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, v)
	}
}

func deleteVendorHandler(svc service.VendorService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		if err := svc.DeleteVendor(c.Request().Context(), c.Param("id")); err != nil {
			logger.Error("DeleteVendor failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.NoContent(http.StatusNoContent)
	}
}

// ── DPA handlers ───────────────────────────────────────────────────────────

func createDPAHandler(svc service.DPAService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		vendorID := c.Param("vendor_id")
		dpa, err := svc.CreateDPA(c.Request().Context(), service.CreateDPAInput{VendorID: vendorID})
		if err != nil {
			logger.Error("CreateDPA failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.JSON(http.StatusCreated, dpa)
	}
}

func listDPAsByVendorHandler(svc service.DPAService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		dpas, err := svc.ListDPAsByVendor(c.Request().Context(), c.Param("vendor_id"))
		if err != nil {
			logger.Error("ListDPAsByVendor failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, dpas)
	}
}

func getDPAHandler(svc service.DPAService, _ *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		dpa, err := svc.GetDPA(c.Request().Context(), c.Param("id"))
		if err != nil {
			return c.JSON(http.StatusNotFound, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, dpa)
	}
}

func signDPAHandler(svc service.DPAService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		dpa, err := svc.SignDPA(c.Request().Context(), c.Param("id"))
		if err != nil {
			logger.Error("SignDPA failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, dpa)
	}
}

type addDataScopeRequest struct {
	DictionaryID  string `json:"dictionary_id"`
	Justification string `json:"justification"`
}

func addDPADataScopeHandler(svc service.DPAService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req addDataScopeRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, errResp("invalid request body"))
		}
		if err := svc.AddDataScope(c.Request().Context(), c.Param("id"), req.DictionaryID, req.Justification); err != nil {
			logger.Error("AddDataScope failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.NoContent(http.StatusNoContent)
	}
}

func listDPADataScopeHandler(svc service.DPAService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		rows, err := svc.ListDataScope(c.Request().Context(), c.Param("id"))
		if err != nil {
			logger.Error("ListDataScope failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, rows)
	}
}

// ── Assessment handlers ────────────────────────────────────────────────────

type createAssessmentRequest struct {
	FrameworkID string `json:"framework_id"`
	Status      string `json:"status"`
}

func createAssessmentHandler(svc service.AssessmentService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req createAssessmentRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, errResp("invalid request body"))
		}
		a, err := svc.CreateAssessment(c.Request().Context(), service.CreateAssessmentInput{
			VendorID:    c.Param("vendor_id"),
			FrameworkID: req.FrameworkID,
			Status:      req.Status,
		})
		if err != nil {
			logger.Error("CreateAssessment failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.JSON(http.StatusCreated, a)
	}
}

func getAssessmentHandler(svc service.AssessmentService, _ *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		a, err := svc.GetAssessment(c.Request().Context(), c.Param("id"))
		if err != nil {
			return c.JSON(http.StatusNotFound, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, a)
	}
}

func listAssessmentsByVendorHandler(svc service.AssessmentService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		items, err := svc.ListAssessmentsByVendor(c.Request().Context(), c.Param("vendor_id"))
		if err != nil {
			logger.Error("ListAssessmentsByVendor failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, items)
	}
}

type updateAssessmentStatusRequest struct {
	Status string `json:"status"`
	Score  *int32 `json:"score"`
}

func updateAssessmentStatusHandler(svc service.AssessmentService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req updateAssessmentStatusRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, errResp("invalid request body"))
		}
		a, err := svc.UpdateStatus(c.Request().Context(), c.Param("id"), req.Status, req.Score)
		if err != nil {
			logger.Error("UpdateAssessmentStatus failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, a)
	}
}

// ── helpers ────────────────────────────────────────────────────────────────

func errResp(msg string) map[string]string {
	return map[string]string{"error": msg}
}
