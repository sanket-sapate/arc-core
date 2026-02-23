package middleware

import (
	"bytes"
	"net/http"

	"github.com/labstack/echo/v4"
)

// NullToEmptyArray is an Echo middleware that rewrites JSON `null` response
// bodies to `[]`. This prevents Go's default JSON marshaling of nil slices
// from reaching the frontend, which expects empty arrays, not null.
//
// Only applies to successful (2xx) JSON responses with a body of exactly `null`.
func NullToEmptyArray() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Wrap the response writer to capture the body
			rec := &bodyInterceptor{
				ResponseWriter: c.Response().Writer,
				buf:            &bytes.Buffer{},
			}
			c.Response().Writer = rec

			if err := next(c); err != nil {
				return err
			}

			body := rec.buf.Bytes()

			// Only fix JSON responses with a body of exactly "null"
			ct := c.Response().Header().Get(echo.HeaderContentType)
			isJSON := len(ct) >= 16 && ct[:16] == "application/json"
			statusOK := c.Response().Status >= 200 && c.Response().Status < 300

			if isJSON && statusOK && bytes.Equal(bytes.TrimSpace(body), []byte("null")) {
				body = []byte("[]")
				c.Response().Header().Set("Content-Length", "2")
			}

			// Write the (possibly modified) body to the original writer
			rec.ResponseWriter.WriteHeader(c.Response().Status)
			_, writeErr := rec.ResponseWriter.Write(body)
			return writeErr
		}
	}
}

// bodyInterceptor captures the response body without writing to the client.
type bodyInterceptor struct {
	http.ResponseWriter
	buf         *bytes.Buffer
	wroteHeader bool
}

func (b *bodyInterceptor) Write(data []byte) (int, error) {
	return b.buf.Write(data)
}

func (b *bodyInterceptor) WriteHeader(_ int) {
	// Suppress — we write the header ourselves after inspection.
}
