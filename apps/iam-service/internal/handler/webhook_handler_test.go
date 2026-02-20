package handler_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
	"go.uber.org/zap"

	db "github.com/arc-self/apps/iam-service/internal/repository/db"
	"github.com/arc-self/apps/iam-service/internal/repository/mock"
	"github.com/arc-self/apps/iam-service/internal/handler"
	"github.com/arc-self/apps/iam-service/internal/service"
)

const testPSK = "test-secret-key"

func setupWebhookHandler(t *testing.T) (*handler.WebhookHandler, *mock.MockQuerier, *gomock.Controller) {
	ctrl := gomock.NewController(t)
	mockQ := mock.NewMockQuerier(ctrl)
	logger := zap.NewNop()

	syncSvc := service.NewSyncService(mockQ, logger, service.SyncConfig{
		DefaultOrgName: "default",
	})

	wh := handler.NewWebhookHandler(syncSvc, logger, testPSK)
	return wh, mockQ, ctrl
}

func TestWebhook_InvalidPSK(t *testing.T) {
	wh, _, ctrl := setupWebhookHandler(t)
	defer ctrl.Finish()

	body := `{"type":"REGISTER","userId":"550e8400-e29b-41d4-a716-446655440000","details":{"email":"a@b.com"}}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/webhooks/keycloak", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	req.Header.Set("X-Webhook-Secret", "wrong-key")
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := wh.HandleKeycloakEvent(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestWebhook_MissingPSK(t *testing.T) {
	wh, _, ctrl := setupWebhookHandler(t)
	defer ctrl.Finish()

	body := `{"type":"REGISTER","userId":"550e8400-e29b-41d4-a716-446655440000","details":{"email":"a@b.com"}}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/webhooks/keycloak", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	// No X-Webhook-Secret header
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := wh.HandleKeycloakEvent(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusUnauthorized, rec.Code)
}

func TestWebhook_RegisterEvent_Success(t *testing.T) {
	wh, mockQ, ctrl := setupWebhookHandler(t)
	defer ctrl.Finish()

	uid := "550e8400-e29b-41d4-a716-446655440000"
	email := "alice@example.com"

	var userID, orgID, roleID pgtype.UUID
	userID.Scan(uid)
	orgID.Scan("660e8400-e29b-41d4-a716-446655440001")
	roleID.Scan("770e8400-e29b-41d4-a716-446655440002")

	mockQ.EXPECT().UpsertUser(gomock.Any(), gomock.Any()).Return(db.User{ID: userID, Email: email}, nil)
	mockQ.EXPECT().GetOrganizationByName(gomock.Any(), "default").Return(db.Organization{ID: orgID}, nil)
	mockQ.EXPECT().GetDefaultRole(gomock.Any(), orgID).Return(db.Role{ID: roleID, Name: "member"}, nil)
	mockQ.EXPECT().AssignUserRole(gomock.Any(), gomock.Any()).Return(nil)

	body := `{"type":"REGISTER","userId":"` + uid + `","details":{"email":"` + email + `"}}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/webhooks/keycloak", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	req.Header.Set("X-Webhook-Secret", testPSK)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := wh.HandleKeycloakEvent(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "synced")
}

func TestWebhook_UnhandledEvent_Acknowledged(t *testing.T) {
	wh, _, ctrl := setupWebhookHandler(t)
	defer ctrl.Finish()

	body := `{"type":"LOGIN","userId":"550e8400-e29b-41d4-a716-446655440000"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/webhooks/keycloak", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	req.Header.Set("X-Webhook-Secret", testPSK)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := wh.HandleKeycloakEvent(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "ignored")
}

func TestWebhook_RegisterEvent_MissingEmail(t *testing.T) {
	wh, _, ctrl := setupWebhookHandler(t)
	defer ctrl.Finish()

	body := `{"type":"REGISTER","userId":"","details":{"email":""}}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/webhooks/keycloak", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	req.Header.Set("X-Webhook-Secret", testPSK)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := wh.HandleKeycloakEvent(c)
	require.NoError(t, err)
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}
