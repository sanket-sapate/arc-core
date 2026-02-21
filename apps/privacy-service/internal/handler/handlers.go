package handler

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v4"

	"github.com/arc-self/apps/privacy-service/internal/service"
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
	b, err := h.svc.Get(c.Request().Context(), c.Param("id"))
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, b)
}

func (h *CookieBannerHandler) List(c echo.Context) error {
	banners, err := h.svc.List(c.Request().Context())
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, banners)
}

func (h *CookieBannerHandler) Update(c echo.Context) error {
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
	p, err := h.svc.Get(c.Request().Context(), c.Param("id"))
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, p)
}

func (h *PurposeHandler) List(c echo.Context) error {
	ps, err := h.svc.List(c.Request().Context())
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, ps)
}

func (h *PurposeHandler) Update(c echo.Context) error {
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
	f, err := h.svc.Get(c.Request().Context(), c.Param("id"))
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, f)
}

func (h *ConsentFormHandler) List(c echo.Context) error {
	fs, err := h.svc.List(c.Request().Context())
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, fs)
}

func (h *ConsentFormHandler) Update(c echo.Context) error {
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
	d, err := h.svc.Get(c.Request().Context(), c.Param("id"))
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, d)
}

func (h *DPIAHandler) List(c echo.Context) error {
	ds, err := h.svc.List(c.Request().Context())
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, ds)
}

func (h *DPIAHandler) Update(c echo.Context) error {
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
	r, err := h.svc.Get(c.Request().Context(), c.Param("id"))
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, r)
}

func (h *ROPAHandler) List(c echo.Context) error {
	rs, err := h.svc.List(c.Request().Context())
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, rs)
}

func (h *ROPAHandler) Update(c echo.Context) error {
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
	g.POST("/:id/resolve", h.Resolve)
}

func (h *PrivacyRequestHandler) Create(c echo.Context) error {
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
	req, err := h.svc.Get(c.Request().Context(), c.Param("id"))
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, req)
}

func (h *PrivacyRequestHandler) List(c echo.Context) error {
	reqs, err := h.svc.List(c.Request().Context())
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, reqs)
}

func (h *PrivacyRequestHandler) Resolve(c echo.Context) error {
	var body struct {
		Resolution string `json:"resolution"`
	}
	if err := c.Bind(&body); err != nil {
		return errResponse(c, http.StatusBadRequest, "invalid request body")
	}
	req, err := h.svc.Resolve(c.Request().Context(), c.Param("id"), body.Resolution)
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, req)
}
