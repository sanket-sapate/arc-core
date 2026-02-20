package handler_test

import (
	"context"
	"fmt"
	"testing"

	db "github.com/arc-self/apps/iam-service/internal/repository/db"
	"github.com/arc-self/apps/iam-service/internal/repository/mock"
	pb "github.com/arc-self/packages/go-core/proto/iam/v1"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	gomock "go.uber.org/mock/gomock"

	"github.com/arc-self/apps/iam-service/internal/handler"
)

// helper to create a valid pgtype.UUID from a string
func mustParseUUID(s string) pgtype.UUID {
	var u pgtype.UUID
	if err := u.Scan(s); err != nil {
		panic(fmt.Sprintf("invalid UUID %q: %v", s, err))
	}
	return u
}

const (
	testUserID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
	testOrgID  = "11111111-2222-3333-4444-555555555555"
)

func TestEvaluateAccess_MissingIdentity(t *testing.T) {
	ctrl := gomock.NewController(t)
	q := mock.NewMockQuerier(ctrl)
	h := handler.NewGRPCAuthzHandler(q)

	tests := []struct {
		name   string
		userID string
		orgID  string
	}{
		{"both missing", "", ""},
		{"user missing", "", testOrgID},
		{"org missing", testUserID, ""},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			resp, err := h.EvaluateAccess(context.Background(), &pb.EvaluateAccessRequest{
				UserId:         tc.userID,
				OrganizationId: tc.orgID,
				PermissionSlug: "item:read",
			})
			require.NoError(t, err)
			assert.False(t, resp.Allowed)
		})
	}
}

func TestEvaluateAccess_InvalidUUID(t *testing.T) {
	ctrl := gomock.NewController(t)
	q := mock.NewMockQuerier(ctrl)
	h := handler.NewGRPCAuthzHandler(q)

	resp, err := h.EvaluateAccess(context.Background(), &pb.EvaluateAccessRequest{
		UserId:         "not-a-uuid",
		OrganizationId: testOrgID,
		PermissionSlug: "item:read",
	})
	require.NoError(t, err)
	assert.False(t, resp.Allowed)
}

func TestEvaluateAccess_PermissionDenied(t *testing.T) {
	ctrl := gomock.NewController(t)
	q := mock.NewMockQuerier(ctrl)
	h := handler.NewGRPCAuthzHandler(q)

	q.EXPECT().CheckUserPermission(gomock.Any(), db.CheckUserPermissionParams{
		UserID:         mustParseUUID(testUserID),
		OrganizationID: mustParseUUID(testOrgID),
		PermissionSlug: "item:delete",
	}).Return(false, nil)

	resp, err := h.EvaluateAccess(context.Background(), &pb.EvaluateAccessRequest{
		UserId:         testUserID,
		OrganizationId: testOrgID,
		PermissionSlug: "item:delete",
	})
	require.NoError(t, err)
	assert.False(t, resp.Allowed)
	assert.Empty(t, resp.Permissions)
}

func TestEvaluateAccess_PermissionGranted(t *testing.T) {
	ctrl := gomock.NewController(t)
	q := mock.NewMockQuerier(ctrl)
	h := handler.NewGRPCAuthzHandler(q)

	q.EXPECT().CheckUserPermission(gomock.Any(), db.CheckUserPermissionParams{
		UserID:         mustParseUUID(testUserID),
		OrganizationID: mustParseUUID(testOrgID),
		PermissionSlug: "item:read",
	}).Return(true, nil)

	q.EXPECT().GetUserPermissionsInOrg(gomock.Any(), db.GetUserPermissionsInOrgParams{
		UserID:         mustParseUUID(testUserID),
		OrganizationID: mustParseUUID(testOrgID),
	}).Return([]string{"item:read", "item:create"}, nil)

	resp, err := h.EvaluateAccess(context.Background(), &pb.EvaluateAccessRequest{
		UserId:         testUserID,
		OrganizationId: testOrgID,
		PermissionSlug: "item:read",
	})
	require.NoError(t, err)
	assert.True(t, resp.Allowed)
	assert.ElementsMatch(t, []string{"item:read", "item:create"}, resp.Permissions)
}

func TestEvaluateAccess_DBError(t *testing.T) {
	ctrl := gomock.NewController(t)
	q := mock.NewMockQuerier(ctrl)
	h := handler.NewGRPCAuthzHandler(q)

	q.EXPECT().CheckUserPermission(gomock.Any(), gomock.Any()).
		Return(false, fmt.Errorf("connection refused"))

	resp, err := h.EvaluateAccess(context.Background(), &pb.EvaluateAccessRequest{
		UserId:         testUserID,
		OrganizationId: testOrgID,
		PermissionSlug: "item:read",
	})
	require.Error(t, err)
	assert.Nil(t, resp)
	assert.Contains(t, err.Error(), "failed to check permission")
}
