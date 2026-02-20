package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgtype"
	"go.uber.org/zap"

	db "github.com/arc-self/apps/iam-service/internal/repository/db"
)

// SyncService handles identity synchronization from Keycloak events.
type SyncService struct {
	querier            db.Querier
	logger             *zap.Logger
	defaultOrgName     string // fallback org for unmatched email domains
	emailDomainOrgMap  map[string]string // domain → org name mapping
}

// SyncConfig holds configuration for domain-to-organization mapping.
type SyncConfig struct {
	DefaultOrgName    string            // e.g., "default"
	EmailDomainOrgMap map[string]string // e.g., {"acme.com": "Acme Corp"}
}

// NewSyncService creates a SyncService with the provided configuration.
func NewSyncService(q db.Querier, logger *zap.Logger, cfg SyncConfig) *SyncService {
	if cfg.DefaultOrgName == "" {
		cfg.DefaultOrgName = "default"
	}
	if cfg.EmailDomainOrgMap == nil {
		cfg.EmailDomainOrgMap = make(map[string]string)
	}
	return &SyncService{
		querier:           q,
		logger:            logger,
		defaultOrgName:    cfg.DefaultOrgName,
		emailDomainOrgMap: cfg.EmailDomainOrgMap,
	}
}

// SyncUser handles a Keycloak USER_REGISTER event:
//  1. Upsert the user (idempotent via ON CONFLICT DO NOTHING)
//  2. Resolve the target organization from the email domain
//  3. Assign the default "member" role in that organization
func (s *SyncService) SyncUser(ctx context.Context, keycloakUserID string, email string) error {
	// --- 1. Upsert User ---
	var userID pgtype.UUID
	if err := userID.Scan(keycloakUserID); err != nil {
		return fmt.Errorf("invalid keycloak user ID %q: %w", keycloakUserID, err)
	}

	_, err := s.querier.UpsertUser(ctx, db.UpsertUserParams{
		ID:    userID,
		Email: email,
	})
	if err != nil {
		return fmt.Errorf("failed to upsert user: %w", err)
	}

	s.logger.Info("user synced",
		zap.String("user_id", keycloakUserID),
		zap.String("email", email),
	)

	// --- 2. Resolve Organization ---
	orgName := s.resolveOrg(email)
	org, err := s.querier.GetOrganizationByName(ctx, orgName)
	if err != nil {
		s.logger.Warn("organization not found for email domain, skipping role assignment",
			zap.String("email", email),
			zap.String("org_name", orgName),
			zap.Error(err),
		)
		// User is created but no role assigned — admin can assign manually
		return nil
	}

	// --- 3. Get Default Role ---
	role, err := s.querier.GetDefaultRole(ctx, org.ID)
	if err != nil {
		s.logger.Warn("default 'member' role not found for organization, skipping assignment",
			zap.String("org_name", orgName),
			zap.Error(err),
		)
		return nil
	}

	// --- 4. Assign Role (idempotent) ---
	if err := s.querier.AssignUserRole(ctx, db.AssignUserRoleParams{
		UserID:         userID,
		OrganizationID: org.ID,
		RoleID:         role.ID,
	}); err != nil {
		return fmt.Errorf("failed to assign default role: %w", err)
	}

	s.logger.Info("default role assigned",
		zap.String("user_id", keycloakUserID),
		zap.String("org", orgName),
		zap.String("role", role.Name),
	)

	return nil
}

// resolveOrg determines the organization name from the email domain.
// Falls back to defaultOrgName if no mapping is configured.
func (s *SyncService) resolveOrg(email string) string {
	parts := strings.SplitN(email, "@", 2)
	if len(parts) != 2 {
		return s.defaultOrgName
	}
	domain := strings.ToLower(parts[1])

	if orgName, ok := s.emailDomainOrgMap[domain]; ok {
		return orgName
	}
	return s.defaultOrgName
}
