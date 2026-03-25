package handler

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"

	db "github.com/arc-self/apps/iam-service/internal/repository/db"
)

// UsersHandler serves REST endpoints for user self-service operations.
type UsersHandler struct {
	querier db.Querier
	logger  *zap.Logger
}

// NewUsersHandler creates a handler with the given database querier.
func NewUsersHandler(q db.Querier, logger *zap.Logger) *UsersHandler {
	return &UsersHandler{querier: q, logger: logger}
}

// Register binds user routes to the Echo instance.
func (h *UsersHandler) Register(e *echo.Echo) {
	g := e.Group("/api/iam/users")
	g.GET("/me", h.GetMe)
	g.GET("", h.ListOrganizationUsers)
	g.POST("/invite", h.InviteUser)
	g.POST("/:id/roles", h.AddUserRole)
	g.DELETE("/:id/roles/:role_id", h.RemoveUserRole)
	g.DELETE("/:id", h.RemoveUser)
}

// ── JWT helpers ─────────────────────────────────────────────────────────────

// jwtClaims is the minimal set of claims we extract from the Keycloak JWT.
// We do NOT verify the signature here — APISIX has already validated the token.
type jwtClaims struct {
	Sub              string `json:"sub"`
	Email            string `json:"email"`
	PreferredUsername string `json:"preferred_username"`
	GivenName        string `json:"given_name"`
	FamilyName       string `json:"family_name"`
	Name             string `json:"name"`
}

// parseJWTClaims does an *unverified* decode of the JWT payload.
// Signature validation is the gateway's responsibility.
func parseJWTClaims(tokenString string) (*jwtClaims, error) {
	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "malformed JWT")
	}

	// Standard base64url decoding (no padding)
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "cannot decode JWT payload")
	}

	var claims jwtClaims
	if err := json.Unmarshal(payload, &claims); err != nil {
		return nil, echo.NewHTTPError(http.StatusUnauthorized, "cannot parse JWT claims")
	}
	return &claims, nil
}

// ── Response types ──────────────────────────────────────────────────────────

type meUserResponse struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	IsActive  bool   `json:"is_active"`
}

type meOrgResponse struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type meResponse struct {
	User          meUserResponse  `json:"user"`
	Organizations []meOrgResponse `json:"organizations"`
}

// ── Handler ─────────────────────────────────────────────────────────────────

// GetMe godoc
// @Summary      Get Current User
// @Description  Returns the authenticated user's profile and organization memberships. The user is identified by the `sub` claim in the JWT.
// @ID           get-me
// @Tags         users
// @Produce      json
// @Security     BearerAuth
// @Success      200  {object}  meResponse
// @Failure      401  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Router       /users/me [get]
func (h *UsersHandler) GetMe(c echo.Context) error {
	// 1. Extract Bearer token
	authHeader := c.Request().Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "missing bearer token"})
	}
	token := strings.TrimPrefix(authHeader, "Bearer ")

	// 2. Parse JWT claims (unverified — APISIX already validated)
	claims, err := parseJWTClaims(token)
	if err != nil {
		h.logger.Warn("failed to parse JWT", zap.Error(err))
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "invalid token"})
	}

	// 3. Determine user identity.
	//    Priority: JWT sub claim → APISIX X-Internal-User-Id header → JWT-only fallback
	userIdentity := claims.Sub
	if userIdentity == "" {
		// Keycloak 26 lightweight access tokens may omit sub.
		// The APISIX authz plugin may inject the user ID header.
		userIdentity = c.Request().Header.Get("X-Internal-User-Id")
	}

	if userIdentity == "" {
		// No user ID available at all — return a minimal JWT-based profile
		h.logger.Warn("no sub claim or X-Internal-User-Id, returning JWT-only profile",
			zap.String("email", claims.Email))
		return c.JSON(http.StatusOK, meResponse{
			User: meUserResponse{
				ID:        "",
				Email:     claims.Email,
				FirstName: claims.GivenName,
				LastName:  claims.FamilyName,
				IsActive:  true,
			},
			Organizations: []meOrgResponse{},
		})
	}

	h.logger.Info("GET /users/me", zap.String("userId", userIdentity))

	// 4. Look up user by Keycloak sub (= users.id in our schema)
	var userID pgtype.UUID
	if err := userID.Scan(userIdentity); err != nil {
		h.logger.Error("invalid user UUID", zap.String("userId", userIdentity), zap.Error(err))
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "invalid user id"})
	}

	user, err := h.querier.GetUserByID(c.Request().Context(), userID)
	if err != nil {
		h.logger.Warn("user not found in IAM DB, returning JWT-based profile",
			zap.String("userId", userIdentity), zap.Error(err))
		// User may not be synced yet — return a minimal profile from the JWT
		return c.JSON(http.StatusOK, meResponse{
			User: meUserResponse{
				ID:        userIdentity,
				Email:     claims.Email,
				FirstName: claims.GivenName,
				LastName:  claims.FamilyName,
				IsActive:  true,
			},
			Organizations: []meOrgResponse{},
		})
	}

	// 5. Fetch organization memberships
	orgs, err := h.querier.GetUserOrganizations(c.Request().Context(), userID)
	if err != nil {
		h.logger.Error("failed to fetch user organizations", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "internal error"})
	}

	// 6. Build response
	orgList := make([]meOrgResponse, 0, len(orgs))
	for _, o := range orgs {
		oid := ""
		if o.OrganizationID.Valid {
			oid = pgUUIDToString(o.OrganizationID)
		}
		orgList = append(orgList, meOrgResponse{
			ID:   oid,
			Name: o.OrganizationName,
		})
	}

	// Derive name fields: prefer JWT claims, fall back to email prefix
	firstName := claims.GivenName
	lastName := claims.FamilyName
	if firstName == "" && lastName == "" && claims.Name != "" {
		parts := strings.SplitN(claims.Name, " ", 2)
		firstName = parts[0]
		if len(parts) > 1 {
			lastName = parts[1]
		}
	}
	if firstName == "" {
		firstName = strings.Split(user.Email, "@")[0]
	}

	return c.JSON(http.StatusOK, meResponse{
		User: meUserResponse{
			ID:        pgUUIDToString(user.ID),
			Email:     user.Email,
			FirstName: firstName,
			LastName:  lastName,
			IsActive:  true,
		},
		Organizations: orgList,
	})
}

// pgUUIDToString converts a pgtype.UUID to its standard string representation.
func pgUUIDToString(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	b := u.Bytes
	return strings.Join([]string{
		encodeHex(b[0:4]),
		encodeHex(b[4:6]),
		encodeHex(b[6:8]),
		encodeHex(b[8:10]),
		encodeHex(b[10:16]),
	}, "-")
}

// hex string helper
func encodeHex(b []byte) string {
	const hextable = "0123456789abcdef"
	s := make([]byte, len(b)*2)
	for i, v := range b {
		s[i*2] = hextable[v>>4]
		s[i*2+1] = hextable[v&0x0f]
	}
	return string(s)
}

func getOrgIDFromContext(c echo.Context) (pgtype.UUID, error) {
	orgIDHeader := c.Request().Header.Get("X-Tenant-Id")
	if orgIDHeader == "" {
		orgIDHeader = c.Request().Header.Get("X-Organization-Id")
	}
	var orgID pgtype.UUID
	err := orgID.Scan(orgIDHeader)
	return orgID, err
}

// getCurrentUserID extracts the authenticated user's UUID from the APISIX-injected header.
func getCurrentUserID(c echo.Context) (pgtype.UUID, bool) {
	userStr := c.Request().Header.Get("X-Internal-User-Id")
	var uid pgtype.UUID
	if userStr == "" {
		return uid, false
	}
	if err := uid.Scan(userStr); err != nil {
		return uid, false
	}
	return uid, uid.Valid
}

func (h *UsersHandler) ListOrganizationUsers(c echo.Context) error {
	orgID, err := getOrgIDFromContext(c)
	if err != nil || !orgID.Valid {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "missing or invalid organization ID"})
	}

	users, err := h.querier.ListOrganizationUsers(c.Request().Context(), orgID)
	if err != nil {
		h.logger.Error("failed to list organization users", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to list users"})
	}

	type orgUserResponse struct {
		ID        string `json:"id"`
		Email     string `json:"email"`
		RoleID    string `json:"role_id"`
		RoleName  string `json:"role_name"`
		CreatedAt string `json:"created_at"`
	}

	resp := make([]orgUserResponse, 0, len(users))
	for _, u := range users {
		resp = append(resp, orgUserResponse{
			ID:        pgUUIDToString(u.ID),
			Email:     u.Email,
			RoleID:    pgUUIDToString(u.RoleID),
			RoleName:  u.RoleName,
			CreatedAt: u.CreatedAt.Time.Format("2006-01-02T15:04:05Z"),
		})
	}
	return c.JSON(http.StatusOK, resp)
}

// ── Invite User ─────────────────────────────────────────────────────────────

type InviteUserRequest struct {
	Email  string `json:"email"`
	RoleID string `json:"role_id"`
}

// InviteUser creates a user in the IAM database (if not exists) and assigns
// them to the caller's organization with the specified role.
func (h *UsersHandler) InviteUser(c echo.Context) error {
	orgID, err := getOrgIDFromContext(c)
	if err != nil || !orgID.Valid {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "missing organization ID"})
	}

	var req InviteUserRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	if req.Email == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "email is required"})
	}
	if req.RoleID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "role_id is required"})
	}

	var roleID pgtype.UUID
	if err := roleID.Scan(req.RoleID); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid role_id"})
	}

	ctx := c.Request().Context()

	// 1. Check if user already exists by email.
	existingUser, err := h.querier.GetUserByEmail(ctx, req.Email)
	var userID pgtype.UUID
	if err != nil {
		// User does not exist — create them with a new UUID.
		// When the user later authenticates via Keycloak, the webhook
		// SyncUser upsert will update this row with the real Keycloak sub.
		newUUID := uuid.New()
		if err := userID.Scan(newUUID.String()); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to generate user id"})
		}

		_, err := h.querier.UpsertUser(ctx, db.UpsertUserParams{
			ID:    userID,
			Email: req.Email,
		})
		if err != nil {
			h.logger.Error("failed to create invited user", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to create user"})
		}

		h.logger.Info("created new user via invite",
			zap.String("email", req.Email),
			zap.String("user_id", newUUID.String()),
		)
	} else {
		userID = existingUser.ID
	}

	// 2. Assign the role to the user in this organization (idempotent).
	if err := h.querier.AddUserRole(ctx, db.AddUserRoleParams{
		UserID:         userID,
		OrganizationID: orgID,
		RoleID:         roleID,
	}); err != nil {
		h.logger.Error("failed to assign role to invited user", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to assign role"})
	}

	h.logger.Info("user invited successfully",
		zap.String("email", req.Email),
		zap.String("org_id", pgUUIDToString(orgID)),
		zap.String("role_id", req.RoleID),
	)

	return c.JSON(http.StatusCreated, map[string]string{
		"message": "user invited",
		"user_id": pgUUIDToString(userID),
	})
}

// ── Add / Remove Role (multi-role support) ──────────────────────────────────

type AddUserRoleRequest struct {
	RoleID string `json:"role_id"`
}

func (h *UsersHandler) AddUserRole(c echo.Context) error {
	orgID, err := getOrgIDFromContext(c)
	if err != nil || !orgID.Valid {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "missing organization ID"})
	}

	userIDStr := c.Param("id")
	var userID pgtype.UUID
	if err := userID.Scan(userIDStr); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid user id"})
	}

	var req AddUserRoleRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	var roleID pgtype.UUID
	if err := roleID.Scan(req.RoleID); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid role id"})
	}

	if err := h.querier.AddUserRole(c.Request().Context(), db.AddUserRoleParams{
		UserID:         userID,
		OrganizationID: orgID,
		RoleID:         roleID,
	}); err != nil {
		h.logger.Error("failed to add user role", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to add role"})
	}

	return c.JSON(http.StatusOK, map[string]string{"status": "success"})
}

func (h *UsersHandler) RemoveUserRole(c echo.Context) error {
	orgID, err := getOrgIDFromContext(c)
	if err != nil || !orgID.Valid {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "missing organization ID"})
	}

	userIDStr := c.Param("id")
	var userID pgtype.UUID
	if err := userID.Scan(userIDStr); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid user id"})
	}

	roleIDStr := c.Param("role_id")
	var roleID pgtype.UUID
	if err := roleID.Scan(roleIDStr); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid role id"})
	}

	if err := h.querier.RemoveUserRole(c.Request().Context(), db.RemoveUserRoleParams{
		UserID:         userID,
		OrganizationID: orgID,
		RoleID:         roleID,
	}); err != nil {
		h.logger.Error("failed to remove user role", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to remove role"})
	}

	return c.NoContent(http.StatusNoContent)
}

// ── Remove User (with self-deletion guard) ──────────────────────────────────

func (h *UsersHandler) RemoveUser(c echo.Context) error {
	orgID, err := getOrgIDFromContext(c)
	if err != nil || !orgID.Valid {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "missing organization ID"})
	}

	userIDStr := c.Param("id")
	var userID pgtype.UUID
	if err := userID.Scan(userIDStr); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid user id"})
	}

	// Self-deletion guard: prevent users from removing themselves
	currentUserID, ok := getCurrentUserID(c)
	if ok && currentUserID == userID {
		return c.JSON(http.StatusForbidden, map[string]string{"error": "cannot remove yourself from the organization"})
	}

	params := db.RemoveUserFromOrganizationParams{
		UserID:         userID,
		OrganizationID: orgID,
	}

	if err := h.querier.RemoveUserFromOrganization(c.Request().Context(), params); err != nil {
		h.logger.Error("failed to remove user", zap.Error(err))
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to remove user"})
	}

	return c.NoContent(http.StatusNoContent)
}
