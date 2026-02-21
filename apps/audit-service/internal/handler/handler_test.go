package handler_test

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
	"go.uber.org/zap/zaptest"

	db "github.com/arc-self/apps/audit-service/internal/repository/db"
	"github.com/arc-self/apps/audit-service/internal/handler"
	"github.com/arc-self/apps/audit-service/internal/repository/mock"
	coreMw "github.com/arc-self/packages/go-core/middleware"
)

// ── helpers ───────────────────────────────────────────────────────────────

func mustUUID() string { return uuid.New().String() }

func mustPgUUID(s string) pgtype.UUID {
	var u pgtype.UUID
	u.Scan(s)
	return u
}

// ctxWithOrg injects an org ID into a context the same way InternalContextMiddleware does.
func ctxWithOrg(orgID string) context.Context {
	return context.WithValue(context.Background(), coreMw.OrgIDKey, orgID)
}

// newEchoWithOrg creates an Echo context whose underlying request carries
// the X-Internal-Org-Id header AND has the org ID pre-injected into ctx,
// simulating what the InternalContextMiddleware does at runtime.
func newEchoWithOrg(t *testing.T, method, path, orgID string) (echo.Context, *httptest.ResponseRecorder) {
	t.Helper()
	req := httptest.NewRequest(method, path, nil)
	req.Header.Set("X-Internal-Org-Id", orgID)
	req = req.WithContext(ctxWithOrg(orgID))
	rec := httptest.NewRecorder()
	e := echo.New()
	return e.NewContext(req, rec), rec
}

// ── GET /v1/audit-logs ────────────────────────────────────────────────────

func TestListAuditLogs_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	orgID := mustUUID()

	q := mock.NewMockQuerier(ctrl)
	q.EXPECT().
		ListAuditLogs(gomock.Any(), gomock.Any()).
		DoAndReturn(func(_ context.Context, arg db.ListAuditLogsParams) ([]db.AuditLog, error) {
			assert.Equal(t, mustPgUUID(orgID), arg.OrganizationID)
			assert.Equal(t, int32(50), arg.Limit)
			assert.Equal(t, int32(0), arg.Offset)
			return []db.AuditLog{
				{EventType: "VendorCreated", SourceService: "trm"},
				{EventType: "DPACreated", SourceService: "trm"},
			}, nil
		})

	c, rec := newEchoWithOrg(t, http.MethodGet, "/v1/audit-logs", orgID)
	logger := zaptest.NewLogger(t)

	e := echo.New()
	handler.RegisterRoutes(e, q, logger)

	// Call handler directly via the context
	err := e.Router().Find(http.MethodGet, "/v1/audit-logs", c)
	_ = err
	// Use httptest server round-trip for a cleaner test
	server := httptest.NewServer(e)
	defer server.Close()

	reqHTTP, _ := http.NewRequest(http.MethodGet, server.URL+"/v1/audit-logs", nil)
	reqHTTP.Header.Set("X-Internal-Org-Id", orgID)
	// We re-mount RegisterRoutes on a fresh echo for the httptest server above,
	// so we verify the recorder from the direct Echo context approach below.
	_ = rec
	_ = c

	// Direct approach: exercise the registered handler via the echo context.
	// Reset and use the recorder from newEchoWithOrg.
	req2 := httptest.NewRequest(http.MethodGet, "/v1/audit-logs?limit=50&offset=0", nil)
	req2 = req2.WithContext(ctxWithOrg(orgID))
	rec2 := httptest.NewRecorder()
	e2 := echo.New()
	c2 := e2.NewContext(req2, rec2)

	q2 := mock.NewMockQuerier(ctrl)
	q2.EXPECT().
		ListAuditLogs(gomock.Any(), gomock.Any()).
		Return([]db.AuditLog{
			{EventType: "VendorCreated"},
		}, nil)

	handler.RegisterRoutes(e2, q2, logger)

	// Walk router and invoke the GET /v1/audit-logs handler
	e2.ServeHTTP(rec2, req2)
	assert.Equal(t, http.StatusOK, rec2.Code)

	var body map[string]interface{}
	require.NoError(t, json.Unmarshal(rec2.Body.Bytes(), &body))
	assert.Equal(t, float64(1), body["count"])
}

func TestListAuditLogs_MissingOrgID_Returns401(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	// No org ID in context
	req := httptest.NewRequest(http.MethodGet, "/v1/audit-logs", nil)
	rec := httptest.NewRecorder()
	e := echo.New()
	q := mock.NewMockQuerier(ctrl) // no expectations — handler should reject before DB call
	handler.RegisterRoutes(e, q, zaptest.NewLogger(t))
	e.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestListAuditLogs_DBError_Returns500(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	orgID := mustUUID()
	q := mock.NewMockQuerier(ctrl)
	q.EXPECT().ListAuditLogs(gomock.Any(), gomock.Any()).Return(nil, errors.New("db down"))

	req := httptest.NewRequest(http.MethodGet, "/v1/audit-logs", nil)
	req = req.WithContext(ctxWithOrg(orgID))
	rec := httptest.NewRecorder()
	e := echo.New()
	handler.RegisterRoutes(e, q, zaptest.NewLogger(t))
	e.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusInternalServerError, rec.Code)
}

// ── GET /v1/audit-logs/:aggregate_type/:aggregate_id ──────────────────────

func TestListAuditLogsByAggregate_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	orgID := mustUUID()
	vendorID := mustUUID()

	q := mock.NewMockQuerier(ctrl)
	q.EXPECT().
		ListAuditLogsByAggregate(gomock.Any(), gomock.Any()).
		DoAndReturn(func(_ context.Context, arg db.ListAuditLogsByAggregateParams) ([]db.AuditLog, error) {
			assert.Equal(t, "vendor", arg.AggregateType)
			assert.Equal(t, vendorID, arg.AggregateID)
			return []db.AuditLog{
				{EventType: "VendorCreated", AggregateType: "vendor", AggregateID: vendorID},
			}, nil
		})

	req := httptest.NewRequest(http.MethodGet, "/v1/audit-logs/vendor/"+vendorID, nil)
	req = req.WithContext(ctxWithOrg(orgID))
	rec := httptest.NewRecorder()
	e := echo.New()
	handler.RegisterRoutes(e, q, zaptest.NewLogger(t))
	e.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	var body map[string]interface{}
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &body))
	assert.Equal(t, "vendor", body["aggregate_type"])
	assert.Equal(t, float64(1), body["count"])
}

func TestListAuditLogsByAggregate_MissingOrgID_Returns401(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	req := httptest.NewRequest(http.MethodGet, "/v1/audit-logs/vendor/some-id", nil)
	rec := httptest.NewRecorder()
	e := echo.New()
	handler.RegisterRoutes(e, mock.NewMockQuerier(ctrl), zaptest.NewLogger(t))
	e.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestListAuditLogsByAggregate_DBError_Returns500(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	orgID := mustUUID()
	q := mock.NewMockQuerier(ctrl)
	q.EXPECT().ListAuditLogsByAggregate(gomock.Any(), gomock.Any()).Return(nil, errors.New("timeout"))

	req := httptest.NewRequest(http.MethodGet, "/v1/audit-logs/vendor/abc", nil)
	req = req.WithContext(ctxWithOrg(orgID))
	rec := httptest.NewRecorder()
	e := echo.New()
	handler.RegisterRoutes(e, q, zaptest.NewLogger(t))
	e.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusInternalServerError, rec.Code)
}

// ── Pagination ─────────────────────────────────────────────────────────────

func TestListAuditLogs_CustomPagination(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	orgID := mustUUID()
	q := mock.NewMockQuerier(ctrl)
	q.EXPECT().
		ListAuditLogs(gomock.Any(), gomock.Any()).
		DoAndReturn(func(_ context.Context, arg db.ListAuditLogsParams) ([]db.AuditLog, error) {
			assert.Equal(t, int32(10), arg.Limit)
			assert.Equal(t, int32(20), arg.Offset)
			return nil, nil
		})

	req := httptest.NewRequest(http.MethodGet, "/v1/audit-logs?limit=10&offset=20", nil)
	req = req.WithContext(ctxWithOrg(orgID))
	rec := httptest.NewRecorder()
	e := echo.New()
	handler.RegisterRoutes(e, q, zaptest.NewLogger(t))
	e.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
}

func TestListAuditLogs_LimitCappedAt500(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	orgID := mustUUID()
	q := mock.NewMockQuerier(ctrl)
	q.EXPECT().
		ListAuditLogs(gomock.Any(), gomock.Any()).
		DoAndReturn(func(_ context.Context, arg db.ListAuditLogsParams) ([]db.AuditLog, error) {
			assert.Equal(t, int32(500), arg.Limit, "limit should be capped at 500")
			return nil, nil
		})

	req := httptest.NewRequest(http.MethodGet, "/v1/audit-logs?limit=99999", nil)
	req = req.WithContext(ctxWithOrg(orgID))
	rec := httptest.NewRecorder()
	e := echo.New()
	handler.RegisterRoutes(e, q, zaptest.NewLogger(t))
	e.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
}

// ── Healthz ────────────────────────────────────────────────────────────────

func TestHealthz(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()
	e := echo.New()
	handler.RegisterRoutes(e, mock.NewMockQuerier(ctrl), zaptest.NewLogger(t))
	e.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)
	var body map[string]string
	require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &body))
	assert.Equal(t, "ok", body["status"])
}
