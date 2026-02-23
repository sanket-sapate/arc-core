package handler

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/arc-self/apps/privacy-service/internal/service"
)

type PortalAuthHandler struct {
	svc service.PortalAuthService
}

func NewPortalAuthHandler(svc service.PortalAuthService) *PortalAuthHandler {
	return &PortalAuthHandler{svc: svc}
}

func (h *PortalAuthHandler) Register(e *echo.Echo) {
	g := e.Group("/api/portal/auth")
	g.POST("/request", h.RequestMagicLink)
	g.POST("/verify", h.VerifyMagicLink)
}

type RequestMagicLinkInput struct {
	Email string `json:"email"`
}

func (h *PortalAuthHandler) RequestMagicLink(c echo.Context) error {
	var input RequestMagicLinkInput
	if err := c.Bind(&input); err != nil {
		return errResponse(c, http.StatusBadRequest, "invalid request body")
	}

	if err := h.svc.RequestMagicLink(c.Request().Context(), input.Email); err != nil {
		return handleSvcError(c, err)
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Magic link requested (check backend logs)"})
}

type VerifyMagicLinkInput struct {
	Token string `json:"token"`
}

func (h *PortalAuthHandler) VerifyMagicLink(c echo.Context) error {
	var input VerifyMagicLinkInput
	if err := c.Bind(&input); err != nil {
		return errResponse(c, http.StatusBadRequest, "invalid request body")
	}

	jwtToken, err := h.svc.VerifyMagicLink(c.Request().Context(), input.Token)
	if err != nil {
		if err == service.ErrInvalidToken {
			return errResponse(c, http.StatusUnauthorized, err.Error())
		}
		return handleSvcError(c, err)
	}

	// Set HttpOnly cookie
	cookie := new(http.Cookie)
	cookie.Name = "portal_jwt"
	cookie.Value = jwtToken
	cookie.Expires = time.Now().Add(24 * time.Hour)
	cookie.Path = "/"
	cookie.HttpOnly = true
	cookie.Secure = false // Set to true in production
	cookie.SameSite = http.SameSiteStrictMode
	c.SetCookie(cookie)

	return c.JSON(http.StatusOK, map[string]string{"message": "Successfully authenticated"})
}
