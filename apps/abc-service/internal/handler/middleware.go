package handler

import (
	"context"

	coreMw "github.com/arc-self/packages/go-core/middleware"
	"github.com/labstack/echo/v4"
)

// InternalContextMiddleware extracts the X-Internal-* headers injected by
// the APISIX Go Runner (authz plugin) after JWT verification and propagates
// them into the Go request context using the go-core middleware key types.
//
// This must be registered AFTER the OTel tracing middleware (so the span
// context is already present) and BEFORE any domain handler that calls
// coreMw.GetUserID or coreMw.GetOrgID.
//
// Fixes: FLAW-3.2 — coreMw context keys were never populated, causing
// CreateItem and TransitionItemStatus to always return 422.
func InternalContextMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			ctx := c.Request().Context()

			if userID := c.Request().Header.Get("X-Internal-User-Id"); userID != "" {
				ctx = context.WithValue(ctx, coreMw.UserIDKey, userID)
			}
			if orgID := c.Request().Header.Get("X-Internal-Org-Id"); orgID != "" {
				ctx = context.WithValue(ctx, coreMw.OrgIDKey, orgID)
			} else if orgID := c.Request().Header.Get("X-Organization-Id"); orgID != "" {
				ctx = context.WithValue(ctx, coreMw.OrgIDKey, orgID)
			}
			if perms := c.Request().Header.Get("X-Internal-Permissions"); perms != "" {
				ctx = context.WithValue(ctx, coreMw.PermissionsKey, perms)
			}

			c.SetRequest(c.Request().WithContext(ctx))
			return next(c)
		}
	}
}
