package handler

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgtype"

	db "github.com/arc-self/apps/iam-service/internal/repository/db"
	pb "github.com/arc-self/packages/go-core/proto/iam/v1"
)

// GRPCAuthzHandler implements the IAMServiceServer gRPC interface.
// It provides a fast authorization evaluation endpoint consumed by
// the APISIX Go Plugin Runner on every inbound API request.
type GRPCAuthzHandler struct {
	pb.UnimplementedIAMServiceServer
	querier db.Querier
}

// NewGRPCAuthzHandler creates a handler with the given database querier.
func NewGRPCAuthzHandler(q db.Querier) *GRPCAuthzHandler {
	return &GRPCAuthzHandler{querier: q}
}

// EvaluateAccess checks whether a user within an organization holds the
// requested permission slug (e.g. "item:read", "iam:manage").
func (h *GRPCAuthzHandler) EvaluateAccess(ctx context.Context, req *pb.EvaluateAccessRequest) (*pb.EvaluateAccessResponse, error) {
	// Fail-closed: reject if identity context is missing
	if req.OrganizationId == "" || req.UserId == "" {
		return &pb.EvaluateAccessResponse{Allowed: false}, nil
	}

	// Parse UUIDs
	userID, err := parseGRPCUUID(req.UserId)
	if err != nil {
		return &pb.EvaluateAccessResponse{Allowed: false}, nil
	}
	orgID, err := parseGRPCUUID(req.OrganizationId)
	if err != nil {
		return &pb.EvaluateAccessResponse{Allowed: false}, nil
	}

	// 1. Check if user holds the specific permission slug in this organization
	allowed, err := h.querier.CheckUserPermission(ctx, db.CheckUserPermissionParams{
		UserID:         userID,
		OrganizationID: orgID,
		PermissionSlug: req.PermissionSlug,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to check permission: %w", err)
	}

	if !allowed {
		return &pb.EvaluateAccessResponse{Allowed: false}, nil
	}

	// 2. Fetch all permission slugs for this user in the organization
	permissions, err := h.querier.GetUserPermissionsInOrg(ctx, db.GetUserPermissionsInOrgParams{
		UserID:         userID,
		OrganizationID: orgID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get permissions: %w", err)
	}

	return &pb.EvaluateAccessResponse{
		Allowed:     true,
		Permissions: permissions,
	}, nil
}

// parseGRPCUUID converts a string UUID from the gRPC request to pgtype.UUID
func parseGRPCUUID(s string) (pgtype.UUID, error) {
	var u pgtype.UUID
	err := u.Scan(s)
	return u, err
}
