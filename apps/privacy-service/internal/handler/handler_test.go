package handler_test

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"

	db "github.com/arc-self/apps/privacy-service/internal/repository/db"
	"github.com/arc-self/apps/privacy-service/internal/handler"
	"github.com/arc-self/apps/privacy-service/internal/service"
)

// ── Helpers ───────────────────────────────────────────────────────────────────

func mustUUID() string { return uuid.New().String() }

func mustPgUUID(s string) pgtype.UUID {
	var u pgtype.UUID
	u.Scan(s)
	return u
}

func toError(v interface{}) error {
	if v == nil {
		return nil
	}
	return v.(error)
}

// ── Mock: CookieBannerService ─────────────────────────────────────────────────

type MockCookieBannerService struct {
	ctrl *gomock.Controller
	rec  *MockCookieBannerServiceRecorder
}
type MockCookieBannerServiceRecorder struct{ m *MockCookieBannerService }

func NewMockCookieBannerService(ctrl *gomock.Controller) *MockCookieBannerService {
	m := &MockCookieBannerService{ctrl: ctrl}
	m.rec = &MockCookieBannerServiceRecorder{m}
	return m
}
func (m *MockCookieBannerService) EXPECT() *MockCookieBannerServiceRecorder { return m.rec }

func (m *MockCookieBannerService) Create(ctx context.Context, p service.CreateCookieBannerInput) (db.CookieBanner, error) {
	ret := m.ctrl.Call(m, "Create", ctx, p)
	return ret[0].(db.CookieBanner), toError(ret[1])
}
func (r *MockCookieBannerServiceRecorder) Create(ctx, p any) *gomock.Call {
	return r.m.ctrl.RecordCall(r.m, "Create", ctx, p)
}

func (m *MockCookieBannerService) Get(ctx context.Context, id string) (db.CookieBanner, error) {
	ret := m.ctrl.Call(m, "Get", ctx, id)
	return ret[0].(db.CookieBanner), toError(ret[1])
}
func (r *MockCookieBannerServiceRecorder) Get(ctx, id any) *gomock.Call {
	return r.m.ctrl.RecordCall(r.m, "Get", ctx, id)
}

func (m *MockCookieBannerService) List(ctx context.Context) ([]db.CookieBanner, error) {
	ret := m.ctrl.Call(m, "List", ctx)
	v, _ := ret[0].([]db.CookieBanner)
	return v, toError(ret[1])
}
func (r *MockCookieBannerServiceRecorder) List(ctx any) *gomock.Call {
	return r.m.ctrl.RecordCall(r.m, "List", ctx)
}

func (m *MockCookieBannerService) Update(ctx context.Context, id string, p service.UpdateCookieBannerInput) (db.CookieBanner, error) {
	ret := m.ctrl.Call(m, "Update", ctx, id, p)
	return ret[0].(db.CookieBanner), toError(ret[1])
}
func (r *MockCookieBannerServiceRecorder) Update(ctx, id, p any) *gomock.Call {
	return r.m.ctrl.RecordCall(r.m, "Update", ctx, id, p)
}

func (m *MockCookieBannerService) Delete(ctx context.Context, id string) error {
	ret := m.ctrl.Call(m, "Delete", ctx, id)
	return toError(ret[0])
}
func (r *MockCookieBannerServiceRecorder) Delete(ctx, id any) *gomock.Call {
	return r.m.ctrl.RecordCall(r.m, "Delete", ctx, id)
}

// ── Mock: PrivacyRequestService ───────────────────────────────────────────────

type MockPrivacyRequestService struct {
	ctrl *gomock.Controller
	rec  *MockPrivacyRequestServiceRecorder
}
type MockPrivacyRequestServiceRecorder struct{ m *MockPrivacyRequestService }

func NewMockPrivacyRequestService(ctrl *gomock.Controller) *MockPrivacyRequestService {
	m := &MockPrivacyRequestService{ctrl: ctrl}
	m.rec = &MockPrivacyRequestServiceRecorder{m}
	return m
}
func (m *MockPrivacyRequestService) EXPECT() *MockPrivacyRequestServiceRecorder { return m.rec }

func (m *MockPrivacyRequestService) Create(ctx context.Context, p service.CreatePrivacyRequestInput) (db.PrivacyRequest, error) {
	ret := m.ctrl.Call(m, "Create", ctx, p)
	return ret[0].(db.PrivacyRequest), toError(ret[1])
}
func (r *MockPrivacyRequestServiceRecorder) Create(ctx, p any) *gomock.Call {
	return r.m.ctrl.RecordCall(r.m, "Create", ctx, p)
}

func (m *MockPrivacyRequestService) Get(ctx context.Context, id string) (db.PrivacyRequest, error) {
	ret := m.ctrl.Call(m, "Get", ctx, id)
	return ret[0].(db.PrivacyRequest), toError(ret[1])
}
func (r *MockPrivacyRequestServiceRecorder) Get(ctx, id any) *gomock.Call {
	return r.m.ctrl.RecordCall(r.m, "Get", ctx, id)
}

func (m *MockPrivacyRequestService) List(ctx context.Context) ([]db.PrivacyRequest, error) {
	ret := m.ctrl.Call(m, "List", ctx)
	v, _ := ret[0].([]db.PrivacyRequest)
	return v, toError(ret[1])
}
func (r *MockPrivacyRequestServiceRecorder) List(ctx any) *gomock.Call {
	return r.m.ctrl.RecordCall(r.m, "List", ctx)
}

func (m *MockPrivacyRequestService) Resolve(ctx context.Context, id, resolution string) (db.PrivacyRequest, error) {
	ret := m.ctrl.Call(m, "Resolve", ctx, id, resolution)
	return ret[0].(db.PrivacyRequest), toError(ret[1])
}
func (r *MockPrivacyRequestServiceRecorder) Resolve(ctx, id, resolution any) *gomock.Call {
	return r.m.ctrl.RecordCall(r.m, "Resolve", ctx, id, resolution)
}

// ══════════════════════════════════════════════════════════════════════════════
// CookieBannerHandler tests
// ══════════════════════════════════════════════════════════════════════════════

func TestCookieBannerHandler_Get_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	bannerID := mustUUID()
	mockSvc := NewMockCookieBannerService(ctrl)
	mockSvc.EXPECT().Get(gomock.Any(), bannerID).Return(db.CookieBanner{
		Domain: "example.com",
		Active: pgtype.Bool{Bool: true, Valid: true},
	}, nil)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/cookie-banners/"+bannerID, nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/api/v1/cookie-banners/:id")
	c.SetParamNames("id")
	c.SetParamValues(bannerID)

	h := handler.NewCookieBannerHandler(mockSvc)
	err := h.Get(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)

	var body map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &body)
	assert.Equal(t, "example.com", body["Domain"])
}

func TestCookieBannerHandler_Get_NotFound(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	bannerID := mustUUID()
	mockSvc := NewMockCookieBannerService(ctrl)
	mockSvc.EXPECT().Get(gomock.Any(), bannerID).Return(db.CookieBanner{}, service.ErrNotFound)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/cookie-banners/"+bannerID, nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/api/v1/cookie-banners/:id")
	c.SetParamNames("id")
	c.SetParamValues(bannerID)

	h := handler.NewCookieBannerHandler(mockSvc)
	err := h.Get(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

func TestCookieBannerHandler_List_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockSvc := NewMockCookieBannerService(ctrl)
	mockSvc.EXPECT().List(gomock.Any()).Return([]db.CookieBanner{
		{Domain: "a.com"},
		{Domain: "b.com"},
	}, nil)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/cookie-banners", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := handler.NewCookieBannerHandler(mockSvc)
	err := h.List(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)

	var body []map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &body)
	assert.Len(t, body, 2)
	assert.Equal(t, "a.com", body[0]["Domain"])
}

func TestCookieBannerHandler_Create_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockSvc := NewMockCookieBannerService(ctrl)
	mockSvc.EXPECT().Create(gomock.Any(), gomock.Any()).Return(db.CookieBanner{
		Domain: "new.com",
		Active: pgtype.Bool{Bool: true, Valid: true},
	}, nil)

	body := `{"Domain":"new.com","Active":true}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/cookie-banners", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := handler.NewCookieBannerHandler(mockSvc)
	err := h.Create(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusCreated, rec.Code)

	var resp map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &resp)
	assert.Equal(t, "new.com", resp["Domain"])
}

func TestCookieBannerHandler_Create_InvalidInput(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockSvc := NewMockCookieBannerService(ctrl)
	mockSvc.EXPECT().Create(gomock.Any(), gomock.Any()).Return(
		db.CookieBanner{},
		errors.New("invalid input: domain is required"),
	)

	body := `{"Domain":""}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/cookie-banners", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := handler.NewCookieBannerHandler(mockSvc)
	err := h.Create(c)
	require.NoError(t, err)
	// service.ErrInvalidInput → 422; plain errors fall through to 500
	assert.Equal(t, http.StatusInternalServerError, rec.Code)
}

func TestCookieBannerHandler_Delete_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	bannerID := mustUUID()
	mockSvc := NewMockCookieBannerService(ctrl)
	mockSvc.EXPECT().Delete(gomock.Any(), bannerID).Return(nil)

	e := echo.New()
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/cookie-banners/"+bannerID, nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/api/v1/cookie-banners/:id")
	c.SetParamNames("id")
	c.SetParamValues(bannerID)

	h := handler.NewCookieBannerHandler(mockSvc)
	err := h.Delete(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusNoContent, rec.Code)
}

func TestCookieBannerHandler_Delete_NotFound(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	bannerID := mustUUID()
	mockSvc := NewMockCookieBannerService(ctrl)
	mockSvc.EXPECT().Delete(gomock.Any(), bannerID).Return(service.ErrNotFound)

	e := echo.New()
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/cookie-banners/"+bannerID, nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/api/v1/cookie-banners/:id")
	c.SetParamNames("id")
	c.SetParamValues(bannerID)

	h := handler.NewCookieBannerHandler(mockSvc)
	err := h.Delete(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

// ══════════════════════════════════════════════════════════════════════════════
// PrivacyRequestHandler tests
// ══════════════════════════════════════════════════════════════════════════════

func TestPrivacyRequestHandler_Create_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockSvc := NewMockPrivacyRequestService(ctrl)
	mockSvc.EXPECT().Create(gomock.Any(), gomock.Any()).Return(db.PrivacyRequest{
		Type:   "erasure",
		Status: pgtype.Text{String: "pending", Valid: true},
	}, nil)

	body := `{"Type":"erasure","RequesterEmail":"user@example.com"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/privacy-requests", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := handler.NewPrivacyRequestHandler(mockSvc)
	err := h.Create(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusCreated, rec.Code)

	var resp map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &resp)
	assert.Equal(t, "erasure", resp["Type"])
}

func TestPrivacyRequestHandler_Create_ValidationError(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockSvc := NewMockPrivacyRequestService(ctrl)
	mockSvc.EXPECT().Create(gomock.Any(), gomock.Any()).Return(
		db.PrivacyRequest{},
		service.ErrInvalidInput,
	)

	body := `{"Type":""}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/privacy-requests", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := handler.NewPrivacyRequestHandler(mockSvc)
	err := h.Create(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusUnprocessableEntity, rec.Code)
}

func TestPrivacyRequestHandler_Get_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	reqID := mustUUID()
	mockSvc := NewMockPrivacyRequestService(ctrl)
	mockSvc.EXPECT().Get(gomock.Any(), reqID).Return(db.PrivacyRequest{
		Type:   "access",
		Status: pgtype.Text{String: "pending", Valid: true},
	}, nil)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/privacy-requests/"+reqID, nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/api/v1/privacy-requests/:id")
	c.SetParamNames("id")
	c.SetParamValues(reqID)

	h := handler.NewPrivacyRequestHandler(mockSvc)
	err := h.Get(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
}

func TestPrivacyRequestHandler_Get_NotFound(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	reqID := mustUUID()
	mockSvc := NewMockPrivacyRequestService(ctrl)
	mockSvc.EXPECT().Get(gomock.Any(), reqID).Return(db.PrivacyRequest{}, service.ErrNotFound)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/privacy-requests/"+reqID, nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/api/v1/privacy-requests/:id")
	c.SetParamNames("id")
	c.SetParamValues(reqID)

	h := handler.NewPrivacyRequestHandler(mockSvc)
	err := h.Get(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

func TestPrivacyRequestHandler_Resolve_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	reqID := mustUUID()
	mockSvc := NewMockPrivacyRequestService(ctrl)
	mockSvc.EXPECT().Resolve(gomock.Any(), reqID, "data deleted").Return(db.PrivacyRequest{
		Status:     pgtype.Text{String: "resolved", Valid: true},
		Resolution: pgtype.Text{String: "data deleted", Valid: true},
	}, nil)

	body := `{"resolution":"data deleted"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/privacy-requests/"+reqID+"/resolve", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/api/v1/privacy-requests/:id/resolve")
	c.SetParamNames("id")
	c.SetParamValues(reqID)

	h := handler.NewPrivacyRequestHandler(mockSvc)
	err := h.Resolve(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &resp)
	assert.Equal(t, "resolved", resp["Status"].(string))
}

func TestPrivacyRequestHandler_List_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockSvc := NewMockPrivacyRequestService(ctrl)
	mockSvc.EXPECT().List(gomock.Any()).Return([]db.PrivacyRequest{
		{Type: "erasure"},
		{Type: "access"},
		{Type: "portability"},
	}, nil)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/privacy-requests", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	h := handler.NewPrivacyRequestHandler(mockSvc)
	err := h.List(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)

	var body []map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &body)
	assert.Len(t, body, 3)
}
