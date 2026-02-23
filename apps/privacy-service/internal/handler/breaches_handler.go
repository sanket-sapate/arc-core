package handler

import (
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"

	db "github.com/arc-self/apps/privacy-service/internal/repository/db"
)

type BreachesHandler struct {
	querier db.Querier
}

func NewBreachesHandler(q db.Querier) *BreachesHandler {
	return &BreachesHandler{querier: q}
}

func (h *BreachesHandler) Register(e *echo.Echo) {
	g := e.Group("/api/v1/breaches")
	g.GET("", h.List)
	g.POST("", h.Create)
	g.GET("/:id", h.Get)
	g.PUT("/:id", h.Update)
	g.DELETE("/:id", h.Delete)
}

type breachCreateReq struct {
	Title           string    `json:"title"`
	Severity        string    `json:"severity"`
	Status          string    `json:"status"`
	IncidentDate    time.Time `json:"incident_date"`
	Description     string    `json:"description"`
	RemediationPlan string    `json:"remediation_plan"`
}

type breachUpdateReq struct {
	Title           string    `json:"title"`
	Severity        string    `json:"severity"`
	Status          string    `json:"status"`
	IncidentDate    time.Time `json:"incident_date"`
	Description     string    `json:"description"`
	RemediationPlan string    `json:"remediation_plan"`
}

func (h *BreachesHandler) getOrgID(c echo.Context) (pgtype.UUID, error) {
	tenantID := c.Request().Header.Get("X-Tenant-Id")
	var orgID pgtype.UUID
	if tenantID == "" || orgID.Scan(tenantID) != nil {
		return orgID, echo.NewHTTPError(http.StatusUnauthorized, "invalid tenant id")
	}
	return orgID, nil
}

func (h *BreachesHandler) List(c echo.Context) error {
	orgID, err := h.getOrgID(c)
	if err != nil {
		return err
	}

	breaches, err := h.querier.ListBreaches(c.Request().Context(), orgID)
	if err != nil {
		return errResponse(c, http.StatusInternalServerError, "failed to list breaches")
	}

	return c.JSON(http.StatusOK, breaches)
}

func (h *BreachesHandler) Get(c echo.Context) error {
	orgID, err := h.getOrgID(c)
	if err != nil {
		return err
	}

	var id pgtype.UUID
	if err := id.Scan(c.Param("id")); err != nil {
		return errResponse(c, http.StatusBadRequest, "invalid breach id")
	}

	breach, err := h.querier.GetBreachByID(c.Request().Context(), db.GetBreachByIDParams{
		ID:             id,
		OrganizationID: orgID,
	})
	if err != nil {
		return errResponse(c, http.StatusNotFound, "breach not found")
	}

	return c.JSON(http.StatusOK, breach)
}

func (h *BreachesHandler) Create(c echo.Context) error {
	orgID, err := h.getOrgID(c)
	if err != nil {
		return err
	}

	var req breachCreateReq
	if err := c.Bind(&req); err != nil {
		return errResponse(c, http.StatusBadRequest, "invalid request")
	}

	breach, err := h.querier.CreateBreach(c.Request().Context(), db.CreateBreachParams{
		OrganizationID: orgID,
		Title:          req.Title,
		Severity:       pgtype.Text{String: req.Severity, Valid: req.Severity != ""},
		Status:         pgtype.Text{String: req.Status, Valid: req.Status != ""},
		IncidentDate:   pgtype.Timestamptz{Time: req.IncidentDate, Valid: !req.IncidentDate.IsZero()},
		Description:    pgtype.Text{String: req.Description, Valid: req.Description != ""},
		RemediationPlan: pgtype.Text{String: req.RemediationPlan, Valid: req.RemediationPlan != ""},
	})
	if err != nil {
		return errResponse(c, http.StatusInternalServerError, "failed to create breach")
	}

	return c.JSON(http.StatusCreated, breach)
}

func (h *BreachesHandler) Update(c echo.Context) error {
	orgID, err := h.getOrgID(c)
	if err != nil {
		return err
	}

	var id pgtype.UUID
	if err := id.Scan(c.Param("id")); err != nil {
		return errResponse(c, http.StatusBadRequest, "invalid breach id")
	}

	var req breachUpdateReq
	if err := c.Bind(&req); err != nil {
		return errResponse(c, http.StatusBadRequest, "invalid request")
	}

	breach, err := h.querier.UpdateBreach(c.Request().Context(), db.UpdateBreachParams{
		ID:             id,
		OrganizationID: orgID,
		Title:          req.Title,
		Severity:       pgtype.Text{String: req.Severity, Valid: req.Severity != ""},
		Status:         pgtype.Text{String: req.Status, Valid: req.Status != ""},
		IncidentDate:   pgtype.Timestamptz{Time: req.IncidentDate, Valid: !req.IncidentDate.IsZero()},
		Description:    pgtype.Text{String: req.Description, Valid: req.Description != ""},
		RemediationPlan: pgtype.Text{String: req.RemediationPlan, Valid: req.RemediationPlan != ""},
	})
	if err != nil {
		return errResponse(c, http.StatusInternalServerError, "failed to update breach")
	}

	return c.JSON(http.StatusOK, breach)
}

func (h *BreachesHandler) Delete(c echo.Context) error {
	orgID, err := h.getOrgID(c)
	if err != nil {
		return err
	}

	var id pgtype.UUID
	if err := id.Scan(c.Param("id")); err != nil {
		return errResponse(c, http.StatusBadRequest, "invalid breach id")
	}

	if err := h.querier.DeleteBreach(c.Request().Context(), db.DeleteBreachParams{
		ID:             id,
		OrganizationID: orgID,
	}); err != nil {
		return errResponse(c, http.StatusInternalServerError, "failed to delete breach")
	}

	return c.NoContent(http.StatusNoContent)
}
