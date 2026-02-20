package handler_test

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	db "github.com/arc-self/apps/def-service/internal/repository/db"
	"github.com/arc-self/apps/def-service/internal/handler"
	"github.com/arc-self/apps/def-service/internal/service"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
)

type MockTaskService struct {
	ctrl     *gomock.Controller
	recorder *MockTaskServiceRecorder
}
type MockTaskServiceRecorder struct {
	mock *MockTaskService
}

func NewMockTaskService(ctrl *gomock.Controller) *MockTaskService {
	m := &MockTaskService{ctrl: ctrl}
	m.recorder = &MockTaskServiceRecorder{mock: m}
	return m
}
func (m *MockTaskService) EXPECT() *MockTaskServiceRecorder { return m.recorder }

func toError(v interface{}) error {
	if v == nil {
		return nil
	}
	return v.(error)
}

func (m *MockTaskService) GetTask(ctx context.Context, tenantID, taskID pgtype.UUID) (db.Task, error) {
	ret := m.ctrl.Call(m, "GetTask", ctx, tenantID, taskID)
	return ret[0].(db.Task), toError(ret[1])
}
func (mr *MockTaskServiceRecorder) GetTask(ctx, tenantID, taskID any) *gomock.Call {
	return mr.mock.ctrl.RecordCall(mr.mock, "GetTask", ctx, tenantID, taskID)
}

func (m *MockTaskService) ListTasks(ctx context.Context, tenantID pgtype.UUID, limit, offset int32) ([]db.Task, error) {
	ret := m.ctrl.Call(m, "ListTasks", ctx, tenantID, limit, offset)
	ret0, _ := ret[0].([]db.Task)
	return ret0, toError(ret[1])
}
func (mr *MockTaskServiceRecorder) ListTasks(ctx, tenantID, limit, offset any) *gomock.Call {
	return mr.mock.ctrl.RecordCall(mr.mock, "ListTasks", ctx, tenantID, limit, offset)
}

func (m *MockTaskService) CreateTask(ctx context.Context, params service.CreateTaskInput) (db.Task, error) {
	ret := m.ctrl.Call(m, "CreateTask", ctx, params)
	return ret[0].(db.Task), toError(ret[1])
}
func (mr *MockTaskServiceRecorder) CreateTask(ctx, params any) *gomock.Call {
	return mr.mock.ctrl.RecordCall(mr.mock, "CreateTask", ctx, params)
}

func (m *MockTaskService) UpdateTask(ctx context.Context, params service.UpdateTaskInput) (db.Task, error) {
	ret := m.ctrl.Call(m, "UpdateTask", ctx, params)
	return ret[0].(db.Task), toError(ret[1])
}
func (mr *MockTaskServiceRecorder) UpdateTask(ctx, params any) *gomock.Call {
	return mr.mock.ctrl.RecordCall(mr.mock, "UpdateTask", ctx, params)
}

func (m *MockTaskService) DeleteTask(ctx context.Context, tenantID, taskID pgtype.UUID) error {
	ret := m.ctrl.Call(m, "DeleteTask", ctx, tenantID, taskID)
	return toError(ret[0])
}
func (mr *MockTaskServiceRecorder) DeleteTask(ctx, tenantID, taskID any) *gomock.Call {
	return mr.mock.ctrl.RecordCall(mr.mock, "DeleteTask", ctx, tenantID, taskID)
}

func mustUUID() (string, pgtype.UUID) {
	raw := uuid.New()
	var pg pgtype.UUID
	pg.Scan(raw.String())
	return raw.String(), pg
}

func TestGetTask_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	mockSvc := NewMockTaskService(ctrl)
	h := handler.NewTaskHandler(mockSvc)
	tenantStr, tenantPG := mustUUID()
	taskStr, taskPG := mustUUID()

	mockSvc.EXPECT().GetTask(gomock.Any(), tenantPG, taskPG).Return(db.Task{
		ID: taskPG, TenantID: tenantPG, Title: "Found Task", Status: "open",
	}, nil)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/tasks/"+taskStr, nil)
	req.Header.Set("X-Tenant-ID", tenantStr)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/api/v1/tasks/:id")
	c.SetParamNames("id")
	c.SetParamValues(taskStr)

	err := h.GetTask(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
	var body map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &body)
	assert.Equal(t, "Found Task", body["Title"])
}

func TestGetTask_NotFound(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	mockSvc := NewMockTaskService(ctrl)
	h := handler.NewTaskHandler(mockSvc)
	tenantStr, tenantPG := mustUUID()
	taskStr, taskPG := mustUUID()

	mockSvc.EXPECT().GetTask(gomock.Any(), tenantPG, taskPG).Return(db.Task{}, errors.New("not found"))

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/tasks/"+taskStr, nil)
	req.Header.Set("X-Tenant-ID", tenantStr)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/api/v1/tasks/:id")
	c.SetParamNames("id")
	c.SetParamValues(taskStr)

	err := h.GetTask(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusNotFound, rec.Code)
}

func TestGetTask_MissingTenantID(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	mockSvc := NewMockTaskService(ctrl)
	h := handler.NewTaskHandler(mockSvc)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/v1/tasks/some-id", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/api/v1/tasks/:id")
	c.SetParamNames("id")
	c.SetParamValues("some-id")

	err := h.GetTask(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestCreateTask_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	mockSvc := NewMockTaskService(ctrl)
	h := handler.NewTaskHandler(mockSvc)
	tenantStr, tenantPG := mustUUID()

	mockSvc.EXPECT().CreateTask(gomock.Any(), gomock.Any()).Return(db.Task{
		TenantID: tenantPG, Title: "New Task", Priority: "high", Status: "open",
	}, nil)

	body := `{"title":"New Task","body":"Details","priority":"high","status":"open"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/tasks", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	req.Header.Set("X-Tenant-ID", tenantStr)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := h.CreateTask(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusCreated, rec.Code)
	var resp map[string]interface{}
	json.Unmarshal(rec.Body.Bytes(), &resp)
	assert.Equal(t, "New Task", resp["Title"])
}

func TestDeleteTask_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	mockSvc := NewMockTaskService(ctrl)
	h := handler.NewTaskHandler(mockSvc)
	tenantStr, tenantPG := mustUUID()
	taskStr, taskPG := mustUUID()

	mockSvc.EXPECT().DeleteTask(gomock.Any(), tenantPG, taskPG).Return(nil)

	e := echo.New()
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/tasks/"+taskStr, nil)
	req.Header.Set("X-Tenant-ID", tenantStr)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetPath("/api/v1/tasks/:id")
	c.SetParamNames("id")
	c.SetParamValues(taskStr)

	err := h.DeleteTask(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusNoContent, rec.Code)
}
