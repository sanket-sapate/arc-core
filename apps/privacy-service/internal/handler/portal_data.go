package handler

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"github.com/arc-self/apps/privacy-service/internal/service"
)

type PortalDataHandler struct {
	svc          service.PortalDataService
	privacyReq   service.PrivacyRequestService
	grievanceSvc service.GrievanceService
}

func NewPortalDataHandler(svc service.PortalDataService, prSvc service.PrivacyRequestService, grSvc service.GrievanceService) *PortalDataHandler {
	if os.Getenv("PORTAL_JWT_SECRET") == "" {
		log.Fatalf("PORTAL_JWT_SECRET environment variable is not set")
	}
	return &PortalDataHandler{svc: svc, privacyReq: prSvc, grievanceSvc: grSvc}
}

// extractEmailFromJWT validates the JWT and extracts the user email
// We decode and validate it here since APISIX doesn't have portal users as consumers for jwt-auth
func extractEmailFromJWT(c echo.Context) (string, error) {
	cookie, err := c.Cookie("portal_jwt")
	if err != nil {
		return "", err
	}

	secret := os.Getenv("PORTAL_JWT_SECRET")
	if secret == "" {
		log.Println("PORTAL_JWT_SECRET not set")
		return "", fmt.Errorf("internal auth configuration error")
	}

	token, err := jwt.Parse(cookie.Value, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return []byte(secret), nil
	})

	if err != nil {
		return "", fmt.Errorf("invalid token: %w", err)
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return "", fmt.Errorf("invalid token claims")
	}

	email, ok := claims["email"].(string)
	if !ok || email == "" {
		return "", fmt.Errorf("email missing from jwt claims")
	}

	return email, nil
}

func (h *PortalDataHandler) Register(e *echo.Echo) {
	// These routes are protected by APISIX's jwt-auth plugin using the portal_jwt cookie.
	g := e.Group("/api/portal/data")
	
	g.GET("/consents", h.GetConsents)
	g.GET("/grievances", h.GetGrievances)
	g.POST("/grievances", h.CreateGrievance)
	g.GET("/requests", h.GetRequests)
	g.POST("/requests", h.CreateRequest)
	g.GET("/nominees", h.GetNominees)
	g.POST("/nominees", h.CreateNominee)
	g.GET("/dashboard/summary", h.GetSummary)
}

func (h *PortalDataHandler) GetConsents(c echo.Context) error {
	email, err := extractEmailFromJWT(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	consents, err := h.svc.GetUserConsents(c.Request().Context(), email)
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, consents)
}

func (h *PortalDataHandler) GetGrievances(c echo.Context) error {
	email, err := extractEmailFromJWT(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	grievances, err := h.svc.GetUserGrievances(c.Request().Context(), email)
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, grievances)
}

func (h *PortalDataHandler) GetRequests(c echo.Context) error {
	email, err := extractEmailFromJWT(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	requests, err := h.svc.GetUserPrivacyRequests(c.Request().Context(), email)
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, requests)
}

func (h *PortalDataHandler) CreateRequest(c echo.Context) error {
	email, err := extractEmailFromJWT(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	var p service.CreatePrivacyRequestInput
	if err := c.Bind(&p); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid format"})
	}
	// Force email from token
	p.RequesterEmail = email

	req, err := h.privacyReq.Create(c.Request().Context(), p)
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusCreated, req)
}

func (h *PortalDataHandler) CreateGrievance(c echo.Context) error {
	email, err := extractEmailFromJWT(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	var p service.CreateGrievanceInput
	if err := c.Bind(&p); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid format"})
	}
	// Force email from token
	p.ReporterEmail = email

	g, err := h.grievanceSvc.Create(c.Request().Context(), p)
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusCreated, g)
}

func (h *PortalDataHandler) GetNominees(c echo.Context) error {
	email, err := extractEmailFromJWT(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	nominees, err := h.svc.GetUserNominees(c.Request().Context(), email)
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusOK, nominees)
}

type CreateNomineeInput struct {
	NomineeName     string `json:"nominee_name"`
	NomineeEmail    string `json:"nominee_email"`
	NomineeRelation string `json:"nominee_relation"`
}

func (h *PortalDataHandler) CreateNominee(c echo.Context) error {
	email, err := extractEmailFromJWT(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	var input CreateNomineeInput
	if err := c.Bind(&input); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid format"})
	}

	n, err := h.svc.CreateUserNominee(c.Request().Context(), email, input.NomineeName, input.NomineeEmail, input.NomineeRelation)
	if err != nil {
		return handleSvcError(c, err)
	}
	return c.JSON(http.StatusCreated, n)
}

func (h *PortalDataHandler) GetSummary(c echo.Context) error {
	email, err := extractEmailFromJWT(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}
	ctx := c.Request().Context()
	
	consents, err := h.svc.GetUserConsents(ctx, email)
	if err != nil {
		log.Printf("Dashboard summary error (consents): %v", err)
		return handleSvcError(c, err)
	}
	requests, err := h.svc.GetUserPrivacyRequests(ctx, email)
	if err != nil {
		log.Printf("Dashboard summary error (requests): %v", err)
		return handleSvcError(c, err)
	}
	grievances, err := h.svc.GetUserGrievances(ctx, email)
	if err != nil {
		log.Printf("Dashboard summary error (grievances): %v", err)
		return handleSvcError(c, err)
	}

	activeRequests := 0
	for _, r := range requests {
		if r.Status.String != "resolved" && r.Status.String != "closed" && r.Status.String != "rejected" {
			activeRequests++
		}
	}

	openGrievances := 0
	for _, g := range grievances {
		if g.Status.String == "open" || g.Status.String == "in_progress" {
			openGrievances++
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"total_consents":  len(consents),
		"active_requests": activeRequests,
		"open_grievances": openGrievances,
	})
}
