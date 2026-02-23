package handler

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"

	"github.com/arc-self/apps/privacy-service/internal/repository/db"
	coreMw "github.com/arc-self/packages/go-core/middleware"
)

type ScriptRuleHandler struct {
	queries *db.Queries
	logger  *zap.Logger
}

func NewScriptRuleHandler(queries *db.Queries, logger *zap.Logger) *ScriptRuleHandler {
	return &ScriptRuleHandler{queries: queries, logger: logger}
}

func (h *ScriptRuleHandler) Register(e *echo.Echo) {
	g := e.Group("/api/v1/script-rules")
	g.GET("", h.ListScriptRules)
	g.POST("", h.CreateScriptRule)
	g.GET("/:id", h.GetScriptRule)
	g.PUT("/:id", h.UpdateScriptRule)
	g.DELETE("/:id", h.DeleteScriptRule)
}

type ScriptRuleRequest struct {
	PurposeID    uuid.UUID `json:"purpose_id" validate:"required"`
	Name         string    `json:"name" validate:"required"`
	ScriptDomain string    `json:"script_domain" validate:"required"`
	RuleType     string    `json:"rule_type" validate:"required"`
	Active       bool      `json:"active"`
}

type UpdateScriptRuleRequest struct {
	PurposeID    *uuid.UUID `json:"purpose_id,omitempty"`
	Name         *string    `json:"name,omitempty"`
	ScriptDomain *string    `json:"script_domain,omitempty"`
	RuleType     *string    `json:"rule_type,omitempty"`
	Active       *bool      `json:"active,omitempty"`
}

func (h *ScriptRuleHandler) CreateScriptRule(c echo.Context) error {
	orgIDStr, ok := coreMw.GetOrgID(c.Request().Context())
	if !ok {
		h.logger.Warn("Missing org ID")
		return echo.ErrUnauthorized
	}
	tenantID, err := uuid.Parse(orgIDStr)
	if err != nil {
		h.logger.Warn("Invalid org ID", zap.Error(err))
		return echo.ErrUnauthorized
	}

	var req ScriptRuleRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request payload")
	}

	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	uid := uuid.New()
	rule, err := h.queries.CreateScriptRule(c.Request().Context(), db.CreateScriptRuleParams{
		ID:           pgtype.UUID{Bytes: uid, Valid: true},
		TenantID:     pgtype.UUID{Bytes: tenantID, Valid: true},
		PurposeID:    pgtype.UUID{Bytes: req.PurposeID, Valid: true},
		Name:         req.Name,
		ScriptDomain: req.ScriptDomain,
		RuleType:     req.RuleType,
		Active:       req.Active,
	})

	if err != nil {
		h.logger.Error("Failed to create script rule", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create script rule")
	}

	return c.JSON(http.StatusCreated, rule)
}

func (h *ScriptRuleHandler) ListScriptRules(c echo.Context) error {
	orgIDStr, ok := coreMw.GetOrgID(c.Request().Context())
	if !ok {
		h.logger.Warn("Missing org ID")
		return echo.ErrUnauthorized
	}
	tenantID, err := uuid.Parse(orgIDStr)
	if err != nil {
		h.logger.Warn("Invalid org ID", zap.Error(err))
		return echo.ErrUnauthorized
	}

	rules, err := h.queries.ListScriptRules(c.Request().Context(), pgtype.UUID{Bytes: tenantID, Valid: true})
	if err != nil {
		// sqlc returns nil slice on no rows, but just in case
		if errors.Is(err, sql.ErrNoRows) {
			return c.JSON(http.StatusOK, []db.ScriptRule{})
		}
		h.logger.Error("Failed to list script rules", zap.Error(err))
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to list script rules")
	}

	if rules == nil {
		rules = []db.ScriptRule{}
	}

	return c.JSON(http.StatusOK, rules)
}

func (h *ScriptRuleHandler) GetScriptRule(c echo.Context) error {
	orgIDStr, ok := coreMw.GetOrgID(c.Request().Context())
	if !ok {
		h.logger.Warn("Missing org ID")
		return echo.ErrUnauthorized
	}
	tenantID, err := uuid.Parse(orgIDStr)
	if err != nil {
		h.logger.Warn("Invalid org ID", zap.Error(err))
		return echo.ErrUnauthorized
	}

	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid script rule ID")
	}

	rule, err := h.queries.GetScriptRule(c.Request().Context(), db.GetScriptRuleParams{
		ID:       pgtype.UUID{Bytes: id, Valid: true},
		TenantID: pgtype.UUID{Bytes: tenantID, Valid: true},
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return echo.NewHTTPError(http.StatusNotFound, "Script rule not found")
		}
		h.logger.Error("Failed to get script rule", zap.Error(err), zap.String("id", idStr))
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to get script rule")
	}

	return c.JSON(http.StatusOK, rule)
}

func (h *ScriptRuleHandler) UpdateScriptRule(c echo.Context) error {
	orgIDStr, ok := coreMw.GetOrgID(c.Request().Context())
	if !ok {
		h.logger.Warn("Missing org ID")
		return echo.ErrUnauthorized
	}
	tenantID, err := uuid.Parse(orgIDStr)
	if err != nil {
		h.logger.Warn("Invalid org ID", zap.Error(err))
		return echo.ErrUnauthorized
	}

	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid script rule ID")
	}

	var req UpdateScriptRuleRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request payload")
	}

	params := db.UpdateScriptRuleParams{
		ID:       pgtype.UUID{Bytes: id, Valid: true},
		TenantID: pgtype.UUID{Bytes: tenantID, Valid: true},
	}

	if req.PurposeID != nil {
		params.PurposeID = pgtype.UUID{Bytes: *req.PurposeID, Valid: true}
	} else {
		// Sent zero UUID to represent skipped/nullish coalescing fallback logic in our specific update sql form
		params.PurposeID = pgtype.UUID{Bytes: uuid.Nil, Valid: true}
	}
	if req.Name != nil {
		params.Name = *req.Name
	}
	if req.ScriptDomain != nil {
		params.ScriptDomain = *req.ScriptDomain
	}
	if req.RuleType != nil {
		params.RuleType = *req.RuleType
	}
	if req.Active != nil {
		params.Active = *req.Active
	}

	rule, err := h.queries.UpdateScriptRule(c.Request().Context(), params)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return echo.NewHTTPError(http.StatusNotFound, "Script rule not found")
		}
		h.logger.Error("Failed to update script rule", zap.Error(err), zap.String("id", idStr))
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to update script rule")
	}

	return c.JSON(http.StatusOK, rule)
}

func (h *ScriptRuleHandler) DeleteScriptRule(c echo.Context) error {
	orgIDStr, ok := coreMw.GetOrgID(c.Request().Context())
	if !ok {
		h.logger.Warn("Missing org ID")
		return echo.ErrUnauthorized
	}
	tenantID, err := uuid.Parse(orgIDStr)
	if err != nil {
		h.logger.Warn("Invalid org ID", zap.Error(err))
		return echo.ErrUnauthorized
	}

	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid script rule ID")
	}

	err = h.queries.DeleteScriptRule(c.Request().Context(), db.DeleteScriptRuleParams{
		ID:       pgtype.UUID{Bytes: id, Valid: true},
		TenantID: pgtype.UUID{Bytes: tenantID, Valid: true},
	})
	if err != nil {
		h.logger.Error("Failed to delete script rule", zap.Error(err), zap.String("id", idStr))
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to delete script rule")
	}

	return c.NoContent(http.StatusNoContent)
}
