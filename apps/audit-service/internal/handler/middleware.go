package handler

import (
	"context"

	coreMw "github.com/arc-self/packages/go-core/middleware"
	"github.com/labstack/echo/v4"
)

// InternalContextMiddleware extracts X-Internal-* headers set by the APISIX
// Go Runner after JWT validation and stores them in the request context using
// go-core typed keys, so that mustGetOrgID resolves correctly.
//
// This middleware MUST be applied to every route — the audit-service must
// never serve cross-tenant data.
func InternalContextMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			ctx := c.Request().Context()
			if userID := c.Request().Header.Get("X-Internal-User-Id"); userID != "" {
				ctx = context.WithValue(ctx, coreMw.UserIDKey, userID)
			}
			if orgID := c.Request().Header.Get("X-Internal-Org-Id"); orgID != "" {
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
