package service_test

import (
	"context"
	"errors"
	"testing"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
	"go.uber.org/zap"

	db "github.com/arc-self/apps/iam-service/internal/repository/db"
	"github.com/arc-self/apps/iam-service/internal/repository/mock"
	"github.com/arc-self/apps/iam-service/internal/service"
)

func mustPGUUID(s string) pgtype.UUID {
	var u pgtype.UUID
	u.Scan(s)
	return u
}

func TestSyncUser_FullFlow(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockQ := mock.NewMockQuerier(ctrl)
	logger := zap.NewNop()

	svc := service.NewSyncService(mockQ, logger, service.SyncConfig{
		DefaultOrgName: "default",
	})

	keycloakUID := "550e8400-e29b-41d4-a716-446655440000"
	email := "alice@example.com"

	userID := mustPGUUID(keycloakUID)
	orgID := mustPGUUID("660e8400-e29b-41d4-a716-446655440001")
	roleID := mustPGUUID("770e8400-e29b-41d4-a716-446655440002")

	// 1. Upsert user
	mockQ.EXPECT().UpsertUser(gomock.Any(), db.UpsertUserParams{
		ID:    userID,
		Email: email,
	}).Return(db.User{ID: userID, Email: email}, nil)

	// 2. Lookup org
	mockQ.EXPECT().GetOrganizationByName(gomock.Any(), "default").Return(
		db.Organization{ID: orgID, Name: "default"}, nil,
	)

	// 3. Get default role
	mockQ.EXPECT().GetDefaultRole(gomock.Any(), orgID).Return(
		db.Role{ID: roleID, Name: "member"}, nil,
	)

	// 4. Assign role
	mockQ.EXPECT().AssignUserRole(gomock.Any(), db.AssignUserRoleParams{
		UserID:         userID,
		OrganizationID: orgID,
		RoleID:         roleID,
	}).Return(nil)

	err := svc.SyncUser(context.Background(), keycloakUID, email)
	require.NoError(t, err)
}

func TestSyncUser_DomainMapping(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockQ := mock.NewMockQuerier(ctrl)
	logger := zap.NewNop()

	svc := service.NewSyncService(mockQ, logger, service.SyncConfig{
		DefaultOrgName:    "default",
		EmailDomainOrgMap: map[string]string{"acme.com": "Acme Corp"},
	})

	keycloakUID := "550e8400-e29b-41d4-a716-446655440000"
	email := "bob@acme.com"

	userID := mustPGUUID(keycloakUID)
	orgID := mustPGUUID("660e8400-e29b-41d4-a716-446655440001")
	roleID := mustPGUUID("770e8400-e29b-41d4-a716-446655440002")

	mockQ.EXPECT().UpsertUser(gomock.Any(), gomock.Any()).Return(db.User{ID: userID, Email: email}, nil)
	mockQ.EXPECT().GetOrganizationByName(gomock.Any(), "Acme Corp").Return(
		db.Organization{ID: orgID, Name: "Acme Corp"}, nil,
	)
	mockQ.EXPECT().GetDefaultRole(gomock.Any(), orgID).Return(
		db.Role{ID: roleID, Name: "member"}, nil,
	)
	mockQ.EXPECT().AssignUserRole(gomock.Any(), gomock.Any()).Return(nil)

	err := svc.SyncUser(context.Background(), keycloakUID, email)
	require.NoError(t, err)
}

func TestSyncUser_OrgNotFound_GracefulDegradation(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockQ := mock.NewMockQuerier(ctrl)
	logger := zap.NewNop()

	svc := service.NewSyncService(mockQ, logger, service.SyncConfig{
		DefaultOrgName: "default",
	})

	keycloakUID := "550e8400-e29b-41d4-a716-446655440000"
	email := "charlie@unknown.com"
	userID := mustPGUUID(keycloakUID)

	mockQ.EXPECT().UpsertUser(gomock.Any(), gomock.Any()).Return(db.User{ID: userID, Email: email}, nil)
	mockQ.EXPECT().GetOrganizationByName(gomock.Any(), "default").Return(
		db.Organization{}, errors.New("no rows"),
	)
	// Should NOT call GetDefaultRole or AssignUserRole

	err := svc.SyncUser(context.Background(), keycloakUID, email)
	assert.NoError(t, err) // degrades gracefully
}

func TestSyncUser_InvalidKeycloakID(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockQ := mock.NewMockQuerier(ctrl)
	logger := zap.NewNop()

	svc := service.NewSyncService(mockQ, logger, service.SyncConfig{})

	err := svc.SyncUser(context.Background(), "not-a-uuid", "test@example.com")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid keycloak user ID")
}
