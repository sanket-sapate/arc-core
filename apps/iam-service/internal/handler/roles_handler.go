package handler

import (
	"net/http"

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
	g := e.Group("/api/iam/roles")
	g.GET("", h.ListOrganizationRoles)
	g.POST("", h.CreateRole)
	g.PUT("/:id", h.UpdateRole)
	g.PUT("/:id/permissions", h.UpdateRolePermissions)
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
		Description string   `json:"description"`
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
			Description: r.Description,
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

	qtx := db.New(tx)

	role, err := qtx.CreateRole(ctx, db.CreateRoleParams{
		OrganizationID: orgID,
		Name:           req.Name,
		Description:    req.Description,
	})
	if err != nil {
		h.logger.Error("failed to create role", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to create role"})
	}

	// Use role.ID (DB-generated) — NOT a locally-generated UUID.
	for _, perm := range req.PermissionIDs {
		err := qtx.InsertRolePermission(ctx, db.InsertRolePermissionParams{
			RoleID:         role.ID,
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

	// Validate name is not empty (Issue #5)
	if req.Name == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "role name is required"})
	}

	ctx := c.Request().Context()
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to begin transaction"})
	}
	defer tx.Rollback(ctx)

	qtx := db.New(tx)

	// Step 1: Update the base role details.
	// The WHERE clause includes organization_id — this is the tenancy guard.
	// If the role belongs to a different org, UpdateRole returns pgx.ErrNoRows.
	role, err := qtx.UpdateRole(ctx, db.UpdateRoleParams{
		ID:             roleID,
		OrganizationID: orgID,
		Name:           req.Name,
		Description:    req.Description,
	})
	if err != nil {
		h.logger.Error("failed to update role", zap.Error(err))
		return c.JSON(http.StatusNotFound, map[string]string{"error": "role not found in this organization"})
	}

	// Step 2: Replace permission mappings
	if err := qtx.DeleteRolePermissions(ctx, roleID); err != nil {
		h.logger.Error("failed to wipe old role permissions", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to wipe old role permissions"})
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

	return c.JSON(http.StatusOK, map[string]interface{}{
		"id":          pgUUIDToString(role.ID),
		"name":        role.Name,
		"description": role.Description,
	})
}

// ── PUT /roles/:id/permissions ─────────────────────────────────────────────
// Dedicated endpoint that replaces only the permission mapping for a role
// without requiring name/description fields.

type UpdateRolePermissionsRequest struct {
	PermissionIDs []string `json:"permission_ids"`
}

func (h *RolesHandler) UpdateRolePermissions(c echo.Context) error {
	orgID, err := getOrgID(c)
	if err != nil || !orgID.Valid {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "missing or invalid organization ID"})
	}

	roleIDStr := c.Param("id")
	var roleID pgtype.UUID
	if err := roleID.Scan(roleIDStr); err != nil || !roleID.Valid {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid role ID"})
	}

	var req UpdateRolePermissionsRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request format"})
	}

	ctx := c.Request().Context()

	// Issue #6 fix: Tenancy check inside the transaction to prevent TOCTOU race.
	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to begin transaction"})
	}
	defer tx.Rollback(ctx)

	qtx := db.New(tx)

	// Verify role belongs to this org by attempting a no-op update inside the TX.
	// UpdateRole WHERE includes organization_id, so it fails if the role
	// doesn't belong to this org. We use it as a SELECT ... FOR UPDATE equivalent.
	existingRole, err := qtx.UpdateRole(ctx, db.UpdateRoleParams{
		ID:             roleID,
		OrganizationID: orgID,
		Name:           "", // will be overwritten below
		Description:    "", // will be overwritten below
	})
	if err != nil {
		return c.JSON(http.StatusForbidden, map[string]string{"error": "role does not belong to your organization"})
	}
	// Immediately restore the original name/description (don't blank them)
	_, err = qtx.UpdateRole(ctx, db.UpdateRoleParams{
		ID:             roleID,
		OrganizationID: orgID,
		Name:           existingRole.Name,
		Description:    existingRole.Description,
	})
	if err != nil {
		h.logger.Error("failed to restore role details", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "internal error"})
	}

	if err := qtx.DeleteRolePermissions(ctx, roleID); err != nil {
		h.logger.Error("failed to wipe old role permissions", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to wipe old role permissions"})
	}

	for _, perm := range req.PermissionIDs {
		err := qtx.InsertRolePermission(ctx, db.InsertRolePermissionParams{
			RoleID:         roleID,
			PermissionSlug: perm,
		})
		if err != nil {
			h.logger.Error("failed to attach permission to role", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to attach permission"})
		}
	}

	if err := tx.Commit(ctx); err != nil {
		h.logger.Error("failed to commit transaction", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to commit transaction"})
	}

	// Return the updated permissions list
	perms, err := h.querier.GetRolePermissions(ctx, roleID)
	if err != nil {
		perms = []string{}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"role_id":     pgUUIDToString(roleID),
		"permissions": perms,
	})
}
