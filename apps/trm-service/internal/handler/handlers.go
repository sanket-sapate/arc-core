package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"go.uber.org/zap"

	"github.com/arc-self/apps/trm-service/internal/service"
	coreMw "github.com/arc-self/packages/go-core/middleware"
)

// RegisterRoutes mounts all trm-service HTTP endpoints onto the Echo instance.
func RegisterRoutes(
	e *echo.Echo,
	vendorSvc service.VendorService,
	dpaSvc service.DPAService,
	assessmentSvc service.AssessmentService,
	frameworkSvc service.FrameworkService,
	auditCycleSvc service.AuditCycleService,
	logger *zap.Logger,
) {
	e.Use(coreMw.NullToEmptyArray())
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
	dg.GET("", listDPAsHandler(dpaSvc, logger))
	dg.POST("", createDPATopLevelHandler(dpaSvc, logger))
	dg.GET("/:id", getDPAHandler(dpaSvc, logger))
	dg.PUT("/:id", updateDPAStatusTopLevelHandler(dpaSvc, logger))
	dg.DELETE("/:id", deleteDPAHandler(dpaSvc, logger))
	dg.POST("/:id/sign", signDPAHandler(dpaSvc, logger))
	dg.POST("/:id/data-scope", addDPADataScopeHandler(dpaSvc, logger))
	dg.GET("/:id/data-scope", listDPADataScopeHandler(dpaSvc, logger))

	// ── Assessments detail ─────────────────────────────────────────────────
	ag := e.Group("/assessments")
	ag.GET("", listAssessmentsHandler(assessmentSvc, logger))
	ag.GET("/:id", getAssessmentHandler(assessmentSvc, logger))
	ag.PATCH("/:id/status", updateAssessmentStatusHandler(assessmentSvc, logger))
	ag.PATCH("/:id/cycle", updateAssessmentCycleHandler(assessmentSvc, logger))
	ag.POST("/:id/answers", upsertAssessmentAnswerHandler(assessmentSvc, logger))
	ag.GET("/:id/answers", listAssessmentAnswersHandler(assessmentSvc, logger))

	// ── Frameworks ─────────────────────────────────────────────────────────
	fg := e.Group("/frameworks")
	fg.POST("", createFrameworkHandler(frameworkSvc, logger))
	fg.GET("", listFrameworksHandler(frameworkSvc, logger))
	fg.GET("/:id", getFrameworkHandler(frameworkSvc, logger))
	fg.PUT("/:id", updateFrameworkHandler(frameworkSvc, logger))
	fg.DELETE("/:id", deleteFrameworkHandler(frameworkSvc, logger))
	fg.POST("/:framework_id/questions", createFrameworkQuestionHandler(frameworkSvc, logger))
	fg.GET("/:framework_id/questions", listFrameworkQuestionsHandler(frameworkSvc, logger))
	fg.POST("/:framework_id/questions/import", importFrameworkQuestionsHandler(frameworkSvc, logger))

	// ── Audit Cycles ───────────────────────────────────────────────────────
	acg := e.Group("/audit-cycles")
	acg.POST("", createAuditCycleHandler(auditCycleSvc, logger))
	acg.GET("", listAuditCyclesHandler(auditCycleSvc, logger))
	acg.GET("/:id", getAuditCycleHandler(auditCycleSvc, logger))
	acg.PUT("/:id", updateAuditCycleHandler(auditCycleSvc, logger))
	acg.DELETE("/:id", deleteAuditCycleHandler(auditCycleSvc, logger))
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
		if !coreMw.HasPermission(c.Request().Context(), "vendors.create") {
			return c.JSON(http.StatusForbidden, errResp("missing vendors.create permission"))
		}
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
		if !coreMw.HasPermission(c.Request().Context(), "vendors.read") {
			return c.JSON(http.StatusForbidden, errResp("missing vendors.read permission"))
		}
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
		if !coreMw.HasPermission(c.Request().Context(), "vendors.read") {
			return c.JSON(http.StatusForbidden, errResp("missing vendors.read permission"))
		}
		v, err := svc.GetVendor(c.Request().Context(), c.Param("id"))
		if err != nil {
			return c.JSON(http.StatusNotFound, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, v)
	}
}

func updateVendorHandler(svc service.VendorService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		if !coreMw.HasPermission(c.Request().Context(), "vendors.update") {
			return c.JSON(http.StatusForbidden, errResp("missing vendors.update permission"))
		}
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
		if !coreMw.HasPermission(c.Request().Context(), "vendors.delete") {
			return c.JSON(http.StatusForbidden, errResp("missing vendors.delete permission"))
		}
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
		if !coreMw.HasPermission(c.Request().Context(), "dpas.create") {
			return c.JSON(http.StatusForbidden, errResp("missing dpas.create permission"))
		}
		vendorID := c.Param("vendor_id")
		dpa, err := svc.CreateDPA(c.Request().Context(), service.CreateDPAInput{VendorID: vendorID})
		if err != nil {
			logger.Error("CreateDPA failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.JSON(http.StatusCreated, dpa)
	}
}

func listDPAsHandler(svc service.DPAService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		if !coreMw.HasPermission(c.Request().Context(), "dpas.read") {
			return c.JSON(http.StatusForbidden, errResp("missing dpas.read permission"))
		}
		dpas, err := svc.ListDPAs(c.Request().Context())
		if err != nil {
			logger.Error("ListDPAs failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		if dpas == nil {
			return c.JSON(http.StatusOK, []interface{}{})
		}
		return c.JSON(http.StatusOK, dpas)
	}
}

type createDPATopLevelRequest struct {
	VendorID string `json:"vendor_id"`
}

func createDPATopLevelHandler(svc service.DPAService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		if !coreMw.HasPermission(c.Request().Context(), "dpas.create") {
			return c.JSON(http.StatusForbidden, errResp("missing dpas.create permission"))
		}
		var req createDPATopLevelRequest
		if err := c.Bind(&req); err != nil || req.VendorID == "" {
			return c.JSON(http.StatusBadRequest, errResp("vendor_id is required"))
		}
		dpa, err := svc.CreateDPA(c.Request().Context(), service.CreateDPAInput{VendorID: req.VendorID})
		if err != nil {
			logger.Error("CreateDPA (top-level) failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.JSON(http.StatusCreated, dpa)
	}
}

type updateDPARequest struct {
	Status string `json:"status"`
}

func updateDPAStatusTopLevelHandler(svc service.DPAService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		if !coreMw.HasPermission(c.Request().Context(), "dpas.update") {
			return c.JSON(http.StatusForbidden, errResp("missing dpas.update permission"))
		}
		var req updateDPARequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, errResp("invalid request body"))
		}
		id := c.Param("id")
		if req.Status == "signed" {
			dpa, err := svc.SignDPA(c.Request().Context(), id)
			if err != nil {
				logger.Error("UpdateDPA (sign) failed", zap.Error(err))
				return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
			}
			return c.JSON(http.StatusOK, dpa)
		}
		// For non-sign status updates, use GetDPA + update pattern
		dpa, err := svc.GetDPA(c.Request().Context(), id)
		if err != nil {
			return c.JSON(http.StatusNotFound, errResp("dpa not found"))
		}
		// Return existing DPA with acknowledged status (status stored client-side for now)
		_ = req.Status
		return c.JSON(http.StatusOK, dpa)
	}
}

func deleteDPAHandler(svc service.DPAService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		if !coreMw.HasPermission(c.Request().Context(), "dpas.delete") {
			return c.JSON(http.StatusForbidden, errResp("missing dpas.delete permission"))
		}
		if err := svc.DeleteDPA(c.Request().Context(), c.Param("id")); err != nil {
			logger.Error("DeleteDPA failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.NoContent(http.StatusNoContent)
	}
}

func listDPAsByVendorHandler(svc service.DPAService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		if !coreMw.HasPermission(c.Request().Context(), "dpas.read") {
			return c.JSON(http.StatusForbidden, errResp("missing dpas.read permission"))
		}
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
		if !coreMw.HasPermission(c.Request().Context(), "dpas.read") {
			return c.JSON(http.StatusForbidden, errResp("missing dpas.read permission"))
		}
		dpa, err := svc.GetDPA(c.Request().Context(), c.Param("id"))
		if err != nil {
			return c.JSON(http.StatusNotFound, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, dpa)
	}
}

func signDPAHandler(svc service.DPAService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		if !coreMw.HasPermission(c.Request().Context(), "dpas.update") {
			return c.JSON(http.StatusForbidden, errResp("missing dpas.update permission"))
		}
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
		if !coreMw.HasPermission(c.Request().Context(), "dpas.update") {
			return c.JSON(http.StatusForbidden, errResp("missing dpas.update permission"))
		}
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
		if !coreMw.HasPermission(c.Request().Context(), "dpas.read") {
			return c.JSON(http.StatusForbidden, errResp("missing dpas.read permission"))
		}
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
		if !coreMw.HasPermission(c.Request().Context(), "assessments.create") {
			return c.JSON(http.StatusForbidden, errResp("missing assessments.create permission"))
		}
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
		if !coreMw.HasPermission(c.Request().Context(), "assessments.read") {
			return c.JSON(http.StatusForbidden, errResp("missing assessments.read permission"))
		}
		a, err := svc.GetAssessment(c.Request().Context(), c.Param("id"))
		if err != nil {
			return c.JSON(http.StatusNotFound, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, a)
	}
}

func listAssessmentsByVendorHandler(svc service.AssessmentService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		if !coreMw.HasPermission(c.Request().Context(), "assessments.read") {
			return c.JSON(http.StatusForbidden, errResp("missing assessments.read permission"))
		}
		items, err := svc.ListAssessmentsByVendor(c.Request().Context(), c.Param("vendor_id"))
		if err != nil {
			logger.Error("ListAssessmentsByVendor failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, items)
	}
}

func listAssessmentsHandler(svc service.AssessmentService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		if !coreMw.HasPermission(c.Request().Context(), "assessments.read") {
			return c.JSON(http.StatusForbidden, errResp("missing assessments.read permission"))
		}
		items, err := svc.ListAssessments(c.Request().Context())
		if err != nil {
			logger.Error("ListAssessments failed", zap.Error(err))
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
		if !coreMw.HasPermission(c.Request().Context(), "assessments.update") {
			return c.JSON(http.StatusForbidden, errResp("missing assessments.update permission"))
		}
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
