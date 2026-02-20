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
