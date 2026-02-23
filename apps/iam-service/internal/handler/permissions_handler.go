package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"go.uber.org/zap"

	db "github.com/arc-self/apps/iam-service/internal/repository/db"
)

type PermissionsHandler struct {
	querier db.Querier
	logger  *zap.Logger
}

func NewPermissionsHandler(q db.Querier, logger *zap.Logger) *PermissionsHandler {
	return &PermissionsHandler{querier: q, logger: logger}
}

func (h *PermissionsHandler) Register(e *echo.Echo) {
	g := e.Group("/permissions")
	g.GET("", h.ListPermissions)
}

func (h *PermissionsHandler) ListPermissions(c echo.Context) error {
	perms, err := h.querier.ListPermissions(c.Request().Context())
	if err != nil {
		h.logger.Error("failed to list permissions", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to list permissions"})
	}

	type permResponse struct {
		Slug        string `json:"slug"`
		Name        string `json:"name"`
		Description string `json:"description"`
	}

	resp := make([]permResponse, 0, len(perms))
	for _, p := range perms {
		resp = append(resp, permResponse{
			Slug:        p.Slug,
			Name:        p.Name,
			Description: p.Description,
		})
	}

	return c.JSON(http.StatusOK, resp)
}
