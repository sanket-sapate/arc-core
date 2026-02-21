package handler

import (
	"context"

	coreMw "github.com/arc-self/packages/go-core/middleware"
	"github.com/labstack/echo/v4"
)

// InternalContextMiddleware extracts X-Internal-* headers injected by the
// APISIX Go Runner after JWT verification and propagates them into the Go
// request context using go-core typed keys.
//
// Must be registered AFTER the OTel tracing middleware and BEFORE domain
// handlers that call coreMw.GetUserID / coreMw.GetOrgID.
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
