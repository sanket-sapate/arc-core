package handler_test

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	db "github.com/arc-self/apps/abc-service/internal/repository/db"
	"github.com/arc-self/apps/abc-service/internal/handler"
	"github.com/arc-self/apps/abc-service/internal/service"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
	"context"
)

// --- Mock Service ---

type MockItemService struct {
	ctrl     *gomock.Controller
	recorder *MockItemServiceRecorder
}

type MockItemServiceRecorder struct {
	mock *MockItemService
}

func NewMockItemService(ctrl *gomock.Controller) *MockItemService {
	m := &MockItemService{ctrl: ctrl}
	m.recorder = &MockItemServiceRecorder{mock: m}
	return m
}

func (m *MockItemService) EXPECT() *MockItemServiceRecorder {
	return m.recorder
}

func toError(v interface{}) error {
	if v == nil {
		return nil
	}
	return v.(error)
}

// GetItem
func (m *MockItemService) GetItem(ctx context.Context, orgID, itemID pgtype.UUID) (db.Item, error) {
	ret := m.ctrl.Call(m, "GetItem", ctx, orgID, itemID)
	return ret[0].(db.Item), toError(ret[1])
}
func (mr *MockItemServiceRecorder) GetItem(ctx, orgID, itemID any) *gomock.Call {
	return mr.mock.ctrl.RecordCall(mr.mock, "GetItem", ctx, orgID, itemID)
}

// ListItems
func (m *MockItemService) ListItems(ctx context.Context, orgID pgtype.UUID) ([]db.Item, error) {
	ret := m.ctrl.Call(m, "ListItems", ctx, orgID)
	ret0, _ := ret[0].([]db.Item)
	return ret0, toError(ret[1])
}
func (mr *MockItemServiceRecorder) ListItems(ctx, orgID any) *gomock.Call {
	return mr.mock.ctrl.RecordCall(mr.mock, "ListItems", ctx, orgID)
}

// CreateItem
func (m *MockItemService) CreateItem(ctx context.Context, params service.CreateItemInput) (db.Item, error) {
	ret := m.ctrl.Call(m, "CreateItem", ctx, params)
	return ret[0].(db.Item), toError(ret[1])
}
func (mr *MockItemServiceRecorder) CreateItem(ctx, params any) *gomock.Call {
	return mr.mock.ctrl.RecordCall(mr.mock, "CreateItem", ctx, params)
}

// SoftDeleteItem
func (m *MockItemService) SoftDeleteItem(ctx context.Context, orgID, itemID pgtype.UUID) error {
	ret := m.ctrl.Call(m, "SoftDeleteItem", ctx, orgID, itemID)
	return toError(ret[0])
}
func (mr *MockItemServiceRecorder) SoftDeleteItem(ctx, orgID, itemID any) *gomock.Call {
	return mr.mock.ctrl.RecordCall(mr.mock, "SoftDeleteItem", ctx, orgID, itemID)
}

// TransitionItemStatus
func (m *MockItemService) TransitionItemStatus(ctx context.Context, itemID, orgID pgtype.UUID, newStatus string) (db.Item, error) {
	ret := m.ctrl.Call(m, "TransitionItemStatus", ctx, itemID, orgID, newStatus)
	return ret[0].(db.Item), toError(ret[1])
}
func (mr *MockItemServiceRecorder) TransitionItemStatus(ctx, itemID, orgID, newStatus any) *gomock.Call {
	return mr.mock.ctrl.RecordCall(mr.mock, "TransitionItemStatus", ctx, itemID, orgID, newStatus)
}

// CreateCategory
func (m *MockItemService) CreateCategory(ctx context.Context, params service.CreateCategoryInput) (db.Category, error) {
	ret := m.ctrl.Call(m, "CreateCategory", ctx, params)
	return ret[0].(db.Category), toError(ret[1])
}
func (mr *MockItemServiceRecorder) CreateCategory(ctx, params any) *gomock.Call {
	return mr.mock.ctrl.RecordCall(mr.mock, "CreateCategory", ctx, params)
}

// ListCategories
func (m *MockItemService) ListCategories(ctx context.Context, orgID pgtype.UUID) ([]db.Category, error) {
	ret := m.ctrl.Call(m, "ListCategories", ctx, orgID)
	ret0, _ := ret[0].([]db.Category)
	return ret0, toError(ret[1])
}
func (mr *MockItemServiceRecorder) ListCategories(ctx, orgID any) *gomock.Call {
	return mr.mock.ctrl.RecordCall(mr.mock, "ListCategories", ctx, orgID)
}

// --- Helpers ---

func mustUUID() (string, pgtype.UUID) {
	raw := uuid.New()
	var pg pgtype.UUID
	pg.Scan(raw.String())
	return raw.String(), pg
}

// --- Tests ---

func TestGetItem_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockSvc := NewMockItemService(ctrl)
	h := handler.NewItemHandler(mockSvc)

	orgStr, orgPG := mustUUID()
	itemStr, itemPG := mustUUID()

	mockSvc.EXPECT().GetItem(gomock.Any(), orgPG, itemPG).Return(db.Item{
		ID:             itemPG,
		OrganizationID: orgPG,
		Name:           "Found Item",
		Status:         "DRAFT",
	}, nil)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/items/"+itemStr, nil)
	req.Header.Set("X-Internal-Org-Id", orgStr)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/api/v1/items/:id")
	c.SetParamNames("id")
	c.SetParamValues(itemStr)

	err := h.GetItem(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)

	var body map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &body)
	assert.Equal(t, "Found Item", body["Name"])
}

func TestGetItem_NotFound(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockSvc := NewMockItemService(ctrl)
	h := handler.NewItemHandler(mockSvc)

	orgStr, orgPG := mustUUID()
	itemStr, itemPG := mustUUID()

	mockSvc.EXPECT().GetItem(gomock.Any(), orgPG, itemPG).Return(db.Item{}, errors.New("not found"))

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/items/"+itemStr, nil)
	req.Header.Set("X-Internal-Org-Id", orgStr)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/api/v1/items/:id")
	c.SetParamNames("id")
	c.SetParamValues(itemStr)

	err := h.GetItem(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

func TestGetItem_MissingOrgID(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockSvc := NewMockItemService(ctrl)
	h := handler.NewItemHandler(mockSvc)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/items/some-id", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/api/v1/items/:id")
	c.SetParamNames("id")
	c.SetParamValues("some-id")

	err := h.GetItem(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestCreateItem_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockSvc := NewMockItemService(ctrl)
	h := handler.NewItemHandler(mockSvc)

	orgStr, orgPG := mustUUID()

	mockSvc.EXPECT().CreateItem(gomock.Any(), gomock.Any()).Return(db.Item{
		OrganizationID: orgPG,
		Name:           "New Item",
		Status:         "DRAFT",
	}, nil)

	body := `{"name":"New Item","description":"A test"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/items", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	req.Header.Set("X-Internal-Org-Id", orgStr)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := h.CreateItem(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusCreated, rec.Code)

	var resp map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &resp)
	assert.Equal(t, "New Item", resp["Name"])
}

func TestCreateItem_ValidationError(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockSvc := NewMockItemService(ctrl)
	h := handler.NewItemHandler(mockSvc)

	orgStr, _ := mustUUID()

	mockSvc.EXPECT().CreateItem(gomock.Any(), gomock.Any()).Return(db.Item{}, errors.New("invalid input: name is required"))

	body := `{"name":"","description":""}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/items", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	req.Header.Set("X-Internal-Org-Id", orgStr)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := h.CreateItem(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusUnprocessableEntity, rec.Code)
}

func TestSoftDeleteItem_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockSvc := NewMockItemService(ctrl)
	h := handler.NewItemHandler(mockSvc)

	orgStr, orgPG := mustUUID()
	itemStr, itemPG := mustUUID()

	mockSvc.EXPECT().SoftDeleteItem(gomock.Any(), orgPG, itemPG).Return(nil)

	e := echo.New()
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/items/"+itemStr, nil)
	req.Header.Set("X-Internal-Org-Id", orgStr)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/api/v1/items/:id")
	c.SetParamNames("id")
	c.SetParamValues(itemStr)

	err := h.SoftDeleteItem(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusNoContent, rec.Code)
}

func TestTransitionStatus_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockSvc := NewMockItemService(ctrl)
	h := handler.NewItemHandler(mockSvc)

	orgStr, orgPG := mustUUID()
	itemStr, itemPG := mustUUID()

	mockSvc.EXPECT().TransitionItemStatus(gomock.Any(), itemPG, orgPG, "AVAILABLE").Return(db.Item{
		ID:             itemPG,
		OrganizationID: orgPG,
		Status:         "AVAILABLE",
	}, nil)

	body := `{"status":"AVAILABLE"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPatch, "/api/v1/items/"+itemStr+"/status", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	req.Header.Set("X-Internal-Org-Id", orgStr)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/api/v1/items/:id/status")
	c.SetParamNames("id")
	c.SetParamValues(itemStr)

	err := h.TransitionStatus(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)

	var resp map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &resp)
	assert.Equal(t, "AVAILABLE", resp["Status"])
}
