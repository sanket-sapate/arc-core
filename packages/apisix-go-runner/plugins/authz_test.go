package plugins_test

import (
	"context"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"testing"

	pkgHTTP "github.com/apache/apisix-go-plugin-runner/pkg/http"
	"github.com/arc-self/packages/apisix-go-runner/plugins"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestMain sets up the test environment to skip real Redis/gRPC/JWKS initialization.
func TestMain(m *testing.M) {
	os.Setenv("AUTHZ_SKIP_INIT", "true")
	os.Exit(m.Run())
}

// --- Mock pkgHTTP.Header ---
// Implements github.com/apache/apisix-go-plugin-runner/pkg/http.Header

type mockHeader struct {
	data http.Header
}

func newMockHeader() *mockHeader {
	return &mockHeader{data: http.Header{}}
}

func (h *mockHeader) Set(key, value string) { h.data.Set(key, value) }
func (h *mockHeader) Del(key string)        { h.data.Del(key) }
func (h *mockHeader) Get(key string) string { return h.data.Get(key) }
func (h *mockHeader) View() http.Header     { return h.data }

// Compile-time check
var _ pkgHTTP.Header = (*mockHeader)(nil)

// --- Mock pkgHTTP.Request ---
// Implements github.com/apache/apisix-go-plugin-runner/pkg/http.Request

type mockRequest struct {
	id      uint32
	method  string
	path    []byte
	header  *mockHeader
	args    url.Values
	body    []byte
	ctx     context.Context
	respHdr http.Header
}

func newMockRequest() *mockRequest {
	return &mockRequest{
		id:      1,
		method:  "GET",
		path:    []byte("/api/abc/items"),
		header:  newMockHeader(),
		args:    url.Values{},
		body:    nil,
		ctx:     context.Background(),
		respHdr: http.Header{},
	}
}

func (r *mockRequest) ID() uint32                      { return r.id }
func (r *mockRequest) SrcIP() net.IP                   { return net.IPv4(127, 0, 0, 1) }
func (r *mockRequest) Method() string                  { return r.method }
func (r *mockRequest) Path() []byte                    { return r.path }
func (r *mockRequest) SetPath(p []byte)                { r.path = p }
func (r *mockRequest) Header() pkgHTTP.Header          { return r.header }
func (r *mockRequest) Args() url.Values                { return r.args }
func (r *mockRequest) Var(name string) ([]byte, error) { return nil, nil }
func (r *mockRequest) Body() ([]byte, error)           { return r.body, nil }
func (r *mockRequest) SetBody(b []byte)                { r.body = b }
func (r *mockRequest) Context() context.Context        { return r.ctx }
func (r *mockRequest) RespHeader() http.Header         { return r.respHdr }

// Compile-time check
var _ pkgHTTP.Request = (*mockRequest)(nil)

// --- Tests ---

func TestAuthz_Name(t *testing.T) {
	p := &plugins.Authz{}
	assert.Equal(t, "authz", p.Name())
}

func TestAuthz_ParseConf(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		wantErr  bool
		wantSlug string
	}{
		{
			name:     "empty object",
			input:    `{}`,
			wantErr:  false,
			wantSlug: "",
		},
		{
			name:     "valid slug",
			input:    `{"permission_slug": "item:read"}`,
			wantErr:  false,
			wantSlug: "item:read",
		},
		{
			name:     "iam manage slug",
			input:    `{"permission_slug": "iam:manage"}`,
			wantErr:  false,
			wantSlug: "iam:manage",
		},
		{
			name:    "malformed JSON",
			input:   `{invalid`,
			wantErr: true,
		},
		{
			name:     "extra fields ignored",
			input:    `{"permission_slug": "task:read", "unknown_field": 123}`,
			wantErr:  false,
			wantSlug: "task:read",
		},
	}

	p := &plugins.Authz{}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			conf, err := p.ParseConf([]byte(tc.input))
			if tc.wantErr {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
				authzConf, ok := conf.(plugins.AuthzConf)
				require.True(t, ok, "expected AuthzConf type")
				assert.Equal(t, tc.wantSlug, authzConf.PermissionSlug)
			}
		})
	}
}

func TestAuthz_RequestFilter_MissingAuthHeader(t *testing.T) {
	plugins.ResetClients()
	p := &plugins.Authz{}
	conf, _ := p.ParseConf([]byte(`{"permission_slug": "item:read"}`))

	// No Authorization header at all
	req := newMockRequest()
	rec := httptest.NewRecorder()
	p.RequestFilter(conf, rec, req)

	assert.Equal(t, http.StatusUnauthorized, rec.Code)
	assert.Contains(t, rec.Body.String(), "missing or malformed authorization header")
}

func TestAuthz_RequestFilter_MalformedAuthHeader(t *testing.T) {
	plugins.ResetClients()
	p := &plugins.Authz{}
	conf, _ := p.ParseConf([]byte(`{"permission_slug": "item:read"}`))

	// Authorization header without "Bearer " prefix
	req := newMockRequest()
	req.header.Set("Authorization", "Basic abc123")
	rec := httptest.NewRecorder()
	p.RequestFilter(conf, rec, req)

	assert.Equal(t, http.StatusUnauthorized, rec.Code)
	assert.Contains(t, rec.Body.String(), "missing or malformed authorization header")
}

func TestAuthz_RequestFilter_FallbackMissingUserID(t *testing.T) {
	// In test mode (JWKS=nil), falls back to X-User-Id header.
	// If neither JWT nor fallback header is present → 401.
	plugins.ResetClients()
	p := &plugins.Authz{}
	conf, _ := p.ParseConf([]byte(`{"permission_slug": "item:read"}`))

	req := newMockRequest()
	req.header.Set("Authorization", "Bearer fake-token-for-test")
	// No X-User-Id header in fallback mode
	rec := httptest.NewRecorder()
	p.RequestFilter(conf, rec, req)

	assert.Equal(t, http.StatusUnauthorized, rec.Code)
	assert.Contains(t, rec.Body.String(), "authentication unavailable")
}

func TestAuthz_RequestFilter_MissingOrgContext(t *testing.T) {
	plugins.ResetClients()
	p := &plugins.Authz{}
	conf, _ := p.ParseConf([]byte(`{"permission_slug": "item:read"}`))

	req := newMockRequest()
	req.header.Set("Authorization", "Bearer fake-token-for-test")
	req.header.Set("X-User-Id", "user-456") // Fallback identity
	// No X-Organization-Id
	rec := httptest.NewRecorder()
	p.RequestFilter(conf, rec, req)

	assert.Equal(t, http.StatusForbidden, rec.Code)
	assert.Contains(t, rec.Body.String(), "missing organization context")
}

func TestAuthz_RequestFilter_Success(t *testing.T) {
	plugins.ResetClients()
	p := &plugins.Authz{}
	conf, _ := p.ParseConf([]byte(`{"permission_slug": "item:read"}`))

	req := newMockRequest()
	req.header.Set("Authorization", "Bearer fake-token-for-test")
	req.header.Set("X-User-Id", "user-789")
	req.header.Set("X-Organization-Id", "org-456")

	rec := httptest.NewRecorder()
	p.RequestFilter(conf, rec, req)

	// Should NOT set an error status (default 200 from recorder = no WriteHeader called)
	assert.Equal(t, http.StatusOK, rec.Code)

	// Verify internal headers were injected into the request
	assert.Equal(t, "user-789", req.header.Get("X-Internal-User-Id"))
	assert.Equal(t, "org-456", req.header.Get("X-Internal-Org-Id"))
	assert.NotEmpty(t, req.header.Get("X-Internal-Permissions"))
}

func TestAuthz_RequestFilter_PermissionsInjected(t *testing.T) {
	plugins.ResetClients()
	p := &plugins.Authz{}
	conf, _ := p.ParseConf([]byte(`{"permission_slug": "iam:manage"}`))

	req := newMockRequest()
	req.header.Set("Authorization", "Bearer fake-token-for-test")
	req.header.Set("X-User-Id", "uid-abc")
	req.header.Set("X-Organization-Id", "oid-def")

	rec := httptest.NewRecorder()
	p.RequestFilter(conf, rec, req)

	// Verify exact user/org IDs are forwarded as-is
	assert.Equal(t, "uid-abc", req.header.Get("X-Internal-User-Id"))
	assert.Equal(t, "oid-def", req.header.Get("X-Internal-Org-Id"))
	// In fallback mode (no gRPC), permissions = the slug itself
	assert.Equal(t, "iam:manage", req.header.Get("X-Internal-Permissions"))
}
