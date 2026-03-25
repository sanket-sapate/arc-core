package middleware

import "context"

// Context keys for internal headers injected by the APISIX Go runner.
type contextKey string

const (
	// UserIDKey is the context key for the authenticated user's UUID.
	UserIDKey contextKey = "user_id"
	// OrgIDKey is the context key for the tenant/organization UUID.
	OrgIDKey contextKey = "org_id"
	// PermissionsKey is the context key for the comma-separated permission slugs.
	PermissionsKey contextKey = "permissions"
)

// WithUserID returns a new context with the user ID set.
func WithUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, UserIDKey, userID)
}

// WithOrgID returns a new context with the organization ID set.
func WithOrgID(ctx context.Context, orgID string) context.Context {
	return context.WithValue(ctx, OrgIDKey, orgID)
}

// GetUserID extracts the user ID from the context.
func GetUserID(ctx context.Context) (string, bool) {
	v, ok := ctx.Value(UserIDKey).(string)
	return v, ok
}

// GetOrgID extracts the organization ID from the context.
func GetOrgID(ctx context.Context) (string, bool) {
	v, ok := ctx.Value(OrgIDKey).(string)
	return v, ok
}

// GetPermissions extracts the comma-separated permission slugs from the context.
func GetPermissions(ctx context.Context) (string, bool) {
	v, ok := ctx.Value(PermissionsKey).(string)
	return v, ok
}

// HasPermission checks if the user has a specific permission slug.
// Permissions are stored as a comma-separated string in the context.
func HasPermission(ctx context.Context, requiredPermission string) bool {
	perms, ok := GetPermissions(ctx)
	if !ok || perms == "" {
		return false
	}
	
	// Simple string search - permissions are comma-separated
	// e.g., "vendors.read,vendors.create,assessments.read"
	for i := 0; i < len(perms); {
		// Find the next comma or end of string
		end := i
		for end < len(perms) && perms[end] != ',' {
			end++
		}
		
		// Extract permission slug
		perm := perms[i:end]
		if perm == requiredPermission {
			return true
		}
		
		// Move to next permission (skip comma)
		i = end + 1
	}
	
	return false
}
