package handler

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/arc-self/apps/privacy-service/internal/service"
	coreMw "github.com/arc-self/packages/go-core/middleware"
)

// ── Shared error response helper ─────────────────────────────────────────

type errResp struct {
	Error string `json:"error"`
}

func errResponse(c echo.Context, status int, msg string) error {
	return c.JSON(status, errResp{Error: msg})
}

func handleSvcError(c echo.Context, err error) error {
	switch {
	case errors.Is(err, service.ErrNotFound):
		return errResponse(c, http.StatusNotFound, err.Error())
	case errors.Is(err, service.ErrInvalidInput):
		return errResponse(c, http.StatusUnprocessableEntity, err.Error())
	default:
		return errResponse(c, http.StatusInternalServerError, "internal error")
	}
}

// ── CookieBanner Handler ──────────────────────────────────────────────────

type CookieBannerHandler struct{ svc service.CookieBannerService }

func NewCookieBannerHandler(svc service.CookieBannerService) *CookieBannerHandler {
	return &CookieBannerHandler{svc: svc}
}

func (h *CookieBannerHandler) Register(e *echo.Echo) {
	g := e.Group("/api/v1/cookie-banners")
	g.GET("", h.List)
	g.POST("", h.Create)
	g.GET("/:id", h.Get)
	g.PUT("/:id", h.Update)
	g.DELETE("/:id", h.Delete)
}

func (h *CookieBannerHandler) Create(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "consents.create") {
		return errResponse(c, http.StatusForbidden, "missing consents.create permission")
	}
	var input service.CreateCookieBannerInput
	if err := c.Bind(&input); err != nil {
		return errResponse(c, http.StatusBadRequest, "invalid request body")
	}
	banner, err := h.svc.Create(c.Request().Context(), input)
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusCreated, banner)
}

func (h *CookieBannerHandler) Get(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "consents.read") {
		return errResponse(c, http.StatusForbidden, "missing consents.read permission")
	}
	b, err := h.svc.Get(c.Request().Context(), c.Param("id"))
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, b)
}

func (h *CookieBannerHandler) List(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "consents.read") {
		return errResponse(c, http.StatusForbidden, "missing consents.read permission")
	}
	banners, err := h.svc.List(c.Request().Context())
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, banners)
}

func (h *CookieBannerHandler) Update(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "consents.update") {
		return errResponse(c, http.StatusForbidden, "missing consents.update permission")
	}
	var input service.UpdateCookieBannerInput
	if err := c.Bind(&input); err != nil {
		return errResponse(c, http.StatusBadRequest, "invalid request body")
	}
	banner, err := h.svc.Update(c.Request().Context(), c.Param("id"), input)
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, banner)
}

func (h *CookieBannerHandler) Delete(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "consents.delete") {
		return errResponse(c, http.StatusForbidden, "missing consents.delete permission")
	}
	if err := h.svc.Delete(c.Request().Context(), c.Param("id")); err != nil {
		return handleSvcError(c, err)
	}
	return c.NoContent(http.StatusNoContent)
}

// ── Purpose Handler ───────────────────────────────────────────────────────

type PurposeHandler struct{ svc service.PurposeService }

func NewPurposeHandler(svc service.PurposeService) *PurposeHandler {
	return &PurposeHandler{svc: svc}
}

func (h *PurposeHandler) Register(e *echo.Echo) {
	g := e.Group("/api/v1/purposes")
	g.GET("", h.List)
	g.POST("", h.Create)
	g.GET("/:id", h.Get)
	g.PUT("/:id", h.Update)
}

func (h *PurposeHandler) Create(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "consents.create") {
		return errResponse(c, http.StatusForbidden, "missing consents.create permission")
	}
	var input service.CreatePurposeInput
	if err := c.Bind(&input); err != nil {
		return errResponse(c, http.StatusBadRequest, "invalid request body")
	}
	p, err := h.svc.Create(c.Request().Context(), input)
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusCreated, p)
}

func (h *PurposeHandler) Get(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "consents.read") {
		return errResponse(c, http.StatusForbidden, "missing consents.read permission")
	}
	p, err := h.svc.Get(c.Request().Context(), c.Param("id"))
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, p)
}

func (h *PurposeHandler) List(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "consents.read") {
		return errResponse(c, http.StatusForbidden, "missing consents.read permission")
	}
	ps, err := h.svc.List(c.Request().Context())
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, ps)
}

func (h *PurposeHandler) Update(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "consents.update") {
		return errResponse(c, http.StatusForbidden, "missing consents.update permission")
	}
	var input service.UpdatePurposeInput
	if err := c.Bind(&input); err != nil {
		return errResponse(c, http.StatusBadRequest, "invalid request body")
	}
	p, err := h.svc.Update(c.Request().Context(), c.Param("id"), input)
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, p)
}

// ── ConsentForm Handler ───────────────────────────────────────────────────

type ConsentFormHandler struct{ svc service.ConsentFormService }

func NewConsentFormHandler(svc service.ConsentFormService) *ConsentFormHandler {
	return &ConsentFormHandler{svc: svc}
}

func (h *ConsentFormHandler) Register(e *echo.Echo) {
	g := e.Group("/api/v1/consent-forms")
	g.GET("", h.List)
	g.POST("", h.Create)
	g.GET("/:id", h.Get)
	g.PUT("/:id", h.Update)
}

func (h *ConsentFormHandler) Create(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "consents.create") {
		return errResponse(c, http.StatusForbidden, "missing consents.create permission")
	}
	var input service.CreateConsentFormInput
	if err := c.Bind(&input); err != nil {
		return errResponse(c, http.StatusBadRequest, "invalid request body")
	}
	f, err := h.svc.Create(c.Request().Context(), input)
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusCreated, f)
}

func (h *ConsentFormHandler) Get(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "consents.read") {
		return errResponse(c, http.StatusForbidden, "missing consents.read permission")
	}
	f, err := h.svc.Get(c.Request().Context(), c.Param("id"))
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, f)
}

func (h *ConsentFormHandler) List(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "consents.read") {
		return errResponse(c, http.StatusForbidden, "missing consents.read permission")
	}
	fs, err := h.svc.List(c.Request().Context())
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, fs)
}

func (h *ConsentFormHandler) Update(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "consents.update") {
		return errResponse(c, http.StatusForbidden, "missing consents.update permission")
	}
	var input service.UpdateConsentFormInput
	if err := c.Bind(&input); err != nil {
		return errResponse(c, http.StatusBadRequest, "invalid request body")
	}
	f, err := h.svc.Update(c.Request().Context(), c.Param("id"), input)
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, f)
}

// ── DPIA Handler ──────────────────────────────────────────────────────────

type DPIAHandler struct{ svc service.DPIAService }

func NewDPIAHandler(svc service.DPIAService) *DPIAHandler { return &DPIAHandler{svc: svc} }

func (h *DPIAHandler) Register(e *echo.Echo) {
	g := e.Group("/api/v1/dpias")
	g.GET("", h.List)
	g.POST("", h.Create)
	g.GET("/:id", h.Get)
	g.PUT("/:id", h.Update)
}

func (h *DPIAHandler) Create(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "dpia.create") {
		return errResponse(c, http.StatusForbidden, "missing dpia.create permission")
	}
	var input service.CreateDPIAInput
	if err := c.Bind(&input); err != nil {
		return errResponse(c, http.StatusBadRequest, "invalid request body")
	}
	d, err := h.svc.Create(c.Request().Context(), input)
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusCreated, d)
}

func (h *DPIAHandler) Get(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "dpia.read") {
		return errResponse(c, http.StatusForbidden, "missing dpia.read permission")
	}
	d, err := h.svc.Get(c.Request().Context(), c.Param("id"))
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, d)
}

func (h *DPIAHandler) List(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "dpia.read") {
		return errResponse(c, http.StatusForbidden, "missing dpia.read permission")
	}
	ds, err := h.svc.List(c.Request().Context())
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, ds)
}

func (h *DPIAHandler) Update(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "dpia.update") {
		return errResponse(c, http.StatusForbidden, "missing dpia.update permission")
	}
	var input service.UpdateDPIAInput
	if err := c.Bind(&input); err != nil {
		return errResponse(c, http.StatusBadRequest, "invalid request body")
	}
	d, err := h.svc.Update(c.Request().Context(), c.Param("id"), input)
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, d)
}

// ── ROPA Handler ──────────────────────────────────────────────────────────

type ROPAHandler struct{ svc service.ROPAService }

func NewROPAHandler(svc service.ROPAService) *ROPAHandler { return &ROPAHandler{svc: svc} }

func (h *ROPAHandler) Register(e *echo.Echo) {
	g := e.Group("/api/v1/ropas")
	g.GET("", h.List)
	g.POST("", h.Create)
	g.GET("/:id", h.Get)
	g.PUT("/:id", h.Update)
}

func (h *ROPAHandler) Create(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "ropa.create") {
		return errResponse(c, http.StatusForbidden, "missing ropa.create permission")
	}
	var input service.CreateROPAInput
	if err := c.Bind(&input); err != nil {
		return errResponse(c, http.StatusBadRequest, "invalid request body")
	}
	r, err := h.svc.Create(c.Request().Context(), input)
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusCreated, r)
}

func (h *ROPAHandler) Get(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "ropa.read") {
		return errResponse(c, http.StatusForbidden, "missing ropa.read permission")
	}
	r, err := h.svc.Get(c.Request().Context(), c.Param("id"))
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, r)
}

func (h *ROPAHandler) List(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "ropa.read") {
		return errResponse(c, http.StatusForbidden, "missing ropa.read permission")
	}
	rs, err := h.svc.List(c.Request().Context())
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, rs)
}

func (h *ROPAHandler) Update(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "ropa.update") {
		return errResponse(c, http.StatusForbidden, "missing ropa.update permission")
	}
	var input service.UpdateROPAInput
	if err := c.Bind(&input); err != nil {
		return errResponse(c, http.StatusBadRequest, "invalid request body")
	}
	r, err := h.svc.Update(c.Request().Context(), c.Param("id"), input)
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, r)
}

// ── PrivacyRequest Handler ────────────────────────────────────────────────

type PrivacyRequestHandler struct{ svc service.PrivacyRequestService }

func NewPrivacyRequestHandler(svc service.PrivacyRequestService) *PrivacyRequestHandler {
	return &PrivacyRequestHandler{svc: svc}
}

func (h *PrivacyRequestHandler) Register(e *echo.Echo) {
	g := e.Group("/api/v1/privacy-requests")
	g.GET("", h.List)
	g.POST("", h.Create)
	g.GET("/:id", h.Get)
	g.PATCH("/:id/status", h.Update)
}

func (h *PrivacyRequestHandler) Create(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "dsr.create") {
		return errResponse(c, http.StatusForbidden, "missing dsr.create permission")
	}
	var input service.CreatePrivacyRequestInput
	if err := c.Bind(&input); err != nil {
		return errResponse(c, http.StatusBadRequest, "invalid request body")
	}
	req, err := h.svc.Create(c.Request().Context(), input)
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusCreated, req)
}

func (h *PrivacyRequestHandler) Get(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "dsr.read") {
		return errResponse(c, http.StatusForbidden, "missing dsr.read permission")
	}
	req, err := h.svc.Get(c.Request().Context(), c.Param("id"))
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, req)
}

func (h *PrivacyRequestHandler) List(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "dsr.read") {
		return errResponse(c, http.StatusForbidden, "missing dsr.read permission")
	}
	reqs, err := h.svc.List(c.Request().Context())
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, reqs)
}

func (h *PrivacyRequestHandler) Update(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "dsr.update") {
		return errResponse(c, http.StatusForbidden, "missing dsr.update permission")
	}
	var input service.UpdatePrivacyRequestInput
	if err := c.Bind(&input); err != nil {
		return errResponse(c, http.StatusBadRequest, "invalid request body")
	}
	req, err := h.svc.Update(c.Request().Context(), c.Param("id"), input)
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, req)
}

// ── Grievance Handler ───────────────────────────────────────────────────

type GrievanceHandler struct{ svc service.GrievanceService }

func NewGrievanceHandler(svc service.GrievanceService) *GrievanceHandler { return &GrievanceHandler{svc: svc} }

func (h *GrievanceHandler) Register(e *echo.Echo) {
	g := e.Group("/api/v1/grievances")
	g.GET("", h.List)
	g.POST("", h.Create)
	g.GET("/:id", h.Get)
	g.PATCH("/:id/status", h.Update)
}

func (h *GrievanceHandler) Create(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "dsr.create") {
		return errResponse(c, http.StatusForbidden, "missing dsr.create permission")
	}
	var input service.CreateGrievanceInput
	if err := c.Bind(&input); err != nil {
		return errResponse(c, http.StatusBadRequest, "invalid request body")
	}
	r, err := h.svc.Create(c.Request().Context(), input)
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusCreated, r)
}

func (h *GrievanceHandler) Get(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "dsr.read") {
		return errResponse(c, http.StatusForbidden, "missing dsr.read permission")
	}
	r, err := h.svc.Get(c.Request().Context(), c.Param("id"))
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, r)
}

func (h *GrievanceHandler) List(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "dsr.read") {
		return errResponse(c, http.StatusForbidden, "missing dsr.read permission")
	}
	rs, err := h.svc.List(c.Request().Context())
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, rs)
}

func (h *GrievanceHandler) Update(c echo.Context) error {
	if !coreMw.HasPermission(c.Request().Context(), "dsr.update") {
		return errResponse(c, http.StatusForbidden, "missing dsr.update permission")
	}
	var input service.UpdateGrievanceInput
	if err := c.Bind(&input); err != nil {
		return errResponse(c, http.StatusBadRequest, "invalid request body")
	}
	r, err := h.svc.Update(c.Request().Context(), c.Param("id"), input)
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, r)
}
