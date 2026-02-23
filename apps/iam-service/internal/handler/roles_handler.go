package handler

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"

	db "github.com/arc-self/apps/iam-service/internal/repository/db"
)

type RolesHandler struct {
	pool    *pgxpool.Pool
	querier db.Querier
	logger  *zap.Logger
}

func NewRolesHandler(pool *pgxpool.Pool, q db.Querier, logger *zap.Logger) *RolesHandler {
	return &RolesHandler{pool: pool, querier: q, logger: logger}
}

func (h *RolesHandler) Register(e *echo.Echo) {
	g := e.Group("/roles")
	g.GET("", h.ListOrganizationRoles)
	g.POST("", h.CreateRole)
	g.PUT("/:id", h.UpdateRole)
}

func getOrgID(c echo.Context) (pgtype.UUID, error) {
	orgIDHeader := c.Request().Header.Get("X-Tenant-Id")
	if orgIDHeader == "" {
		orgIDHeader = c.Request().Header.Get("X-Organization-Id")
	}
	var orgID pgtype.UUID
	err := orgID.Scan(orgIDHeader)
	return orgID, err
}

func (h *RolesHandler) ListOrganizationRoles(c echo.Context) error {
	orgID, err := getOrgID(c)
	if err != nil || !orgID.Valid {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "missing or invalid organization ID"})
	}

	roles, err := h.querier.ListRolesForOrganization(c.Request().Context(), orgID)
	if err != nil {
		h.logger.Error("failed to list roles", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to list roles"})
	}

	type roleResponse struct {
		ID          string   `json:"id"`
		Name        string   `json:"name"`
		Permissions []string `json:"permissions"`
	}

	resp := make([]roleResponse, 0, len(roles))
	for _, r := range roles {
		perms, err := h.querier.GetRolePermissions(c.Request().Context(), r.ID)
		if err != nil {
			perms = []string{}
		}
		resp = append(resp, roleResponse{
			ID:          pgUUIDToString(r.ID),
			Name:        r.Name,
			Permissions: perms,
		})
	}

	return c.JSON(http.StatusOK, resp)
}

type CreateRoleRequest struct {
	Name          string   `json:"name"`
	Description   string   `json:"description"`
	PermissionIDs []string `json:"permission_ids"`
}

func (h *RolesHandler) CreateRole(c echo.Context) error {
	orgID, err := getOrgID(c)
	if err != nil || !orgID.Valid {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "missing or invalid organization ID"})
	}

	var req CreateRoleRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request format"})
	}

	if req.Name == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "role name is required"})
	}

	ctx := c.Request().Context()
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to begin transaction"})
	}
	defer tx.Rollback(ctx)

	qtx := h.querier.(*db.Queries).WithTx(tx)

	// Create role
	newID := uuid.New()
	var roleID pgtype.UUID
	err = roleID.Scan(newID.String())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to generate role ID"})
	}

	role, err := qtx.CreateRole(ctx, db.CreateRoleParams{
		OrganizationID: orgID,
		Name:           req.Name,
		Description:    req.Description,
	})
	if err != nil {
		h.logger.Error("failed to create role", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to create role"})
	}

	for _, perm := range req.PermissionIDs {
		err := qtx.InsertRolePermission(ctx, db.InsertRolePermissionParams{
			RoleID:         roleID,
			PermissionSlug: perm,
		})
		if err != nil {
			h.logger.Error("failed to attach permission to role", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to attach permission to role"})
		}
	}

	if err := tx.Commit(ctx); err != nil {
		h.logger.Error("failed to commit transaction", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to commit transaction"})
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"id":          pgUUIDToString(role.ID),
		"name":        role.Name,
		"description": role.Description,
	})
}

type UpdateRoleRequest struct {
	Name          string   `json:"name"`
	Description   string   `json:"description"`
	PermissionIDs []string `json:"permission_ids"`
}

func (h *RolesHandler) UpdateRole(c echo.Context) error {
	orgID, err := getOrgID(c)
	if err != nil || !orgID.Valid {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "missing or invalid organization ID"})
	}

	roleIDStr := c.Param("id")
	var roleID pgtype.UUID
	if err := roleID.Scan(roleIDStr); err != nil || !roleID.Valid {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid role ID"})
	}

	var req UpdateRoleRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request format"})
	}

	ctx := c.Request().Context()
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to begin transaction"})
	}
	defer tx.Rollback(ctx)

	qtx := h.querier.(*db.Queries).WithTx(tx)

	// Step 1: Update the base role details
	role, err := qtx.UpdateRole(ctx, db.UpdateRoleParams{
		ID:             roleID,
		OrganizationID: orgID,
		Name:           req.Name,
		Description:    req.Description,
	})
	if err != nil {
		h.logger.Error("failed to update role", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to update role"})
	}

	// Step 2: Wipe all existing permission mappings for this Role ID
	if err := qtx.DeleteRolePermissions(ctx, roleID); err != nil {
		h.logger.Error("failed to wipe old role permissions", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to wipe old role permissions"})
	}

	// Step 3: Insert the new permission_ids list
	for _, perm := range req.PermissionIDs {
		err := qtx.InsertRolePermission(ctx, db.InsertRolePermissionParams{
			RoleID:         roleID,
			PermissionSlug: perm,
		})
		if err != nil {
			h.logger.Error("failed to attach permission to role", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to attach permission to role"})
		}
	}

	// Step 4: Commit Transaction
	if err := tx.Commit(ctx); err != nil {
		h.logger.Error("failed to commit transaction", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to commit transaction"})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"id":          pgUUIDToString(role.ID),
		"name":        role.Name,
		"description": role.Description,
	})
}
