package service_test

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"

	db "github.com/arc-self/apps/privacy-service/internal/repository/db"
	"github.com/arc-self/apps/privacy-service/internal/repository/mock"
	"github.com/arc-self/apps/privacy-service/internal/service"
	coreMw "github.com/arc-self/packages/go-core/middleware"
)

// ── Helpers ──────────────────────────────────────────────────────────────────

// ctxWithOrg returns a context populated with the given org ID string,
// mirroring what InternalContextMiddleware does at the handler layer.
func ctxWithOrg(orgID string) context.Context {
	return context.WithValue(context.Background(), coreMw.OrgIDKey, orgID)
}

func mustPgUUID(s string) pgtype.UUID {
	var u pgtype.UUID
	u.Scan(s)
	return u
}

func newOrgID() (string, pgtype.UUID) {
	s := uuid.New().String()
	return s, mustPgUUID(s)
}

// ══════════════════════════════════════════════════════════════════════════════
// CookieBannerService
// ══════════════════════════════════════════════════════════════════════════════

// NOTE: CookieBannerService.Create and CookieBannerService.Delete require a
// real pgxpool.Pool for transaction management (same constraint as abc-service's
// transactional methods). Those operations are covered by integration tests.
// The non-transactional reads (Get, List) delegate directly to the Querier and
// are fully testable via the mock.

func TestCookieBannerService_Get_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	orgStr, orgPG := newOrgID()
	bannerIDStr, bannerIDPG := newOrgID()

	q := mock.NewMockQuerier(ctrl)
	q.EXPECT().
		GetCookieBanner(gomock.Any(), db.GetCookieBannerParams{
			ID:             bannerIDPG,
			OrganizationID: orgPG,
		}).
		Return(db.CookieBanner{
			ID:             bannerIDPG,
			OrganizationID: orgPG,
			Domain:         "example.com",
			Active:         pgtype.Bool{Bool: true, Valid: true},
		}, nil)

	svc := service.NewCookieBannerService(nil, q)
	banner, err := svc.Get(ctxWithOrg(orgStr), bannerIDStr)

	require.NoError(t, err)
	assert.Equal(t, "example.com", banner.Domain)
}

func TestCookieBannerService_Get_NotFound(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	orgStr, orgPG := newOrgID()
	bannerIDStr, bannerIDPG := newOrgID()

	q := mock.NewMockQuerier(ctrl)
	q.EXPECT().
		GetCookieBanner(gomock.Any(), db.GetCookieBannerParams{
			ID:             bannerIDPG,
			OrganizationID: orgPG,
		}).
		Return(db.CookieBanner{}, errors.New("no rows"))

	svc := service.NewCookieBannerService(nil, q)
	_, err := svc.Get(ctxWithOrg(orgStr), bannerIDStr)

	require.Error(t, err)
	assert.True(t, errors.Is(err, service.ErrNotFound))
}

func TestCookieBannerService_Get_InvalidID(t *testing.T) {
	svc := service.NewCookieBannerService(nil, nil)
	_, err := svc.Get(ctxWithOrg(uuid.New().String()), "not-a-uuid")

	require.Error(t, err)
	assert.True(t, errors.Is(err, service.ErrInvalidInput))
}

func TestCookieBannerService_Get_MissingOrgID(t *testing.T) {
	svc := service.NewCookieBannerService(nil, nil)
	_, err := svc.Get(context.Background(), uuid.New().String())

	require.Error(t, err)
	assert.True(t, errors.Is(err, service.ErrInvalidInput))
}

func TestCookieBannerService_List_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	orgStr, orgPG := newOrgID()

	q := mock.NewMockQuerier(ctrl)
	q.EXPECT().
		ListCookieBanners(gomock.Any(), orgPG).
		Return([]db.CookieBanner{
			{Domain: "a.com"},
			{Domain: "b.com"},
		}, nil)

	svc := service.NewCookieBannerService(nil, q)
	banners, err := svc.List(ctxWithOrg(orgStr))

	require.NoError(t, err)
	assert.Len(t, banners, 2)
	assert.Equal(t, "a.com", banners[0].Domain)
}

func TestCookieBannerService_List_MissingOrgID(t *testing.T) {
	svc := service.NewCookieBannerService(nil, nil)
	_, err := svc.List(context.Background())

	require.Error(t, err)
	assert.True(t, errors.Is(err, service.ErrInvalidInput))
}

// ══════════════════════════════════════════════════════════════════════════════
// PurposeService — fully non-transactional, all paths testable via mock
// ══════════════════════════════════════════════════════════════════════════════

func TestPurposeService_Create_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	orgStr, orgPG := newOrgID()

	q := mock.NewMockQuerier(ctrl)
	q.EXPECT().
		CreatePurpose(gomock.Any(), gomock.Any()).
		DoAndReturn(func(_ context.Context, arg db.CreatePurposeParams) (db.Purpose, error) {
			assert.Equal(t, orgPG, arg.OrganizationID)
			assert.Equal(t, "Marketing", arg.Name)
			assert.Equal(t, "Consent", arg.LegalBasis.String)
			return db.Purpose{
				ID:             arg.ID,
				OrganizationID: orgPG,
				Name:           arg.Name,
				LegalBasis:     arg.LegalBasis,
				Active:         pgtype.Bool{Bool: true, Valid: true},
			}, nil
		})

	svc := service.NewPurposeService(nil, q)
	p, err := svc.Create(ctxWithOrg(orgStr), service.CreatePurposeInput{
		Name:       "Marketing",
		LegalBasis: "Consent",
		Active:     true,
	})

	require.NoError(t, err)
	assert.Equal(t, "Marketing", p.Name)
	assert.Equal(t, "Consent", p.LegalBasis.String)
}

func TestPurposeService_Create_MissingName(t *testing.T) {
	svc := service.NewPurposeService(nil, nil)
	_, err := svc.Create(ctxWithOrg(uuid.New().String()), service.CreatePurposeInput{Name: ""})

	require.Error(t, err)
	assert.True(t, errors.Is(err, service.ErrInvalidInput))
}

func TestPurposeService_Create_MissingOrgID(t *testing.T) {
	svc := service.NewPurposeService(nil, nil)
	_, err := svc.Create(context.Background(), service.CreatePurposeInput{Name: "X"})

	require.Error(t, err)
	assert.True(t, errors.Is(err, service.ErrInvalidInput))
}

func TestPurposeService_Get_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	orgStr, orgPG := newOrgID()
	purposeIDStr, purposeIDPG := newOrgID()

	q := mock.NewMockQuerier(ctrl)
	q.EXPECT().
		GetPurpose(gomock.Any(), db.GetPurposeParams{ID: purposeIDPG, OrganizationID: orgPG}).
		Return(db.Purpose{ID: purposeIDPG, OrganizationID: orgPG, Name: "Analytics"}, nil)

	svc := service.NewPurposeService(nil, q)
	p, err := svc.Get(ctxWithOrg(orgStr), purposeIDStr)

	require.NoError(t, err)
	assert.Equal(t, "Analytics", p.Name)
}

func TestPurposeService_Update_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	orgStr, orgPG := newOrgID()
	purposeIDStr, purposeIDPG := newOrgID()

	q := mock.NewMockQuerier(ctrl)
	q.EXPECT().
		UpdatePurpose(gomock.Any(), gomock.Any()).
		DoAndReturn(func(_ context.Context, arg db.UpdatePurposeParams) (db.Purpose, error) {
			assert.Equal(t, orgPG, arg.OrganizationID)
			assert.Equal(t, purposeIDPG, arg.ID)
			assert.Equal(t, "Updated Name", arg.Name)
			return db.Purpose{ID: purposeIDPG, Name: arg.Name}, nil
		})

	svc := service.NewPurposeService(nil, q)
	_, err := svc.Update(ctxWithOrg(orgStr), purposeIDStr, service.UpdatePurposeInput{Name: "Updated Name"})
	require.NoError(t, err)
}

// ══════════════════════════════════════════════════════════════════════════════
// PrivacyRequestService — non-transactional reads
// ══════════════════════════════════════════════════════════════════════════════

func TestPrivacyRequestService_Get_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	orgStr, orgPG := newOrgID()
	reqIDStr, reqIDPG := newOrgID()

	q := mock.NewMockQuerier(ctrl)
	q.EXPECT().
		GetPrivacyRequest(gomock.Any(), db.GetPrivacyRequestParams{ID: reqIDPG, OrganizationID: orgPG}).
		Return(db.PrivacyRequest{
			ID:             reqIDPG,
			OrganizationID: orgPG,
			Type:           "erasure",
			Status:         pgtype.Text{String: "pending", Valid: true},
		}, nil)

	svc := service.NewPrivacyRequestService(nil, q)
	req, err := svc.Get(ctxWithOrg(orgStr), reqIDStr)

	require.NoError(t, err)
	assert.Equal(t, "erasure", req.Type)
	assert.Equal(t, "pending", req.Status.String)
}

func TestPrivacyRequestService_Get_NotFound(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	orgStr, orgPG := newOrgID()
	reqIDStr, reqIDPG := newOrgID()

	q := mock.NewMockQuerier(ctrl)
	q.EXPECT().
		GetPrivacyRequest(gomock.Any(), db.GetPrivacyRequestParams{ID: reqIDPG, OrganizationID: orgPG}).
		Return(db.PrivacyRequest{}, errors.New("not found"))

	svc := service.NewPrivacyRequestService(nil, q)
	_, err := svc.Get(ctxWithOrg(orgStr), reqIDStr)

	require.Error(t, err)
	assert.True(t, errors.Is(err, service.ErrNotFound))
}

func TestPrivacyRequestService_Resolve_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	orgStr, orgPG := newOrgID()
	reqIDStr, reqIDPG := newOrgID()

	q := mock.NewMockQuerier(ctrl)
	q.EXPECT().
		UpdatePrivacyRequest(gomock.Any(), gomock.Any()).
		DoAndReturn(func(_ context.Context, arg db.UpdatePrivacyRequestParams) (db.PrivacyRequest, error) {
			assert.Equal(t, reqIDPG, arg.ID)
			assert.Equal(t, orgPG, arg.OrganizationID)
			assert.Equal(t, "resolved", arg.Status.String)
			assert.Equal(t, "data deleted", arg.Resolution.String)
			return db.PrivacyRequest{
				ID:         reqIDPG,
				Status:     pgtype.Text{String: "resolved", Valid: true},
				Resolution: pgtype.Text{String: "data deleted", Valid: true},
			}, nil
		})

	svc := service.NewPrivacyRequestService(nil, q)
	req, err := svc.Resolve(ctxWithOrg(orgStr), reqIDStr, "data deleted")

	require.NoError(t, err)
	assert.Equal(t, "resolved", req.Status.String)
	assert.Equal(t, "data deleted", req.Resolution.String)
}

func TestPrivacyRequestService_Resolve_InvalidID(t *testing.T) {
	svc := service.NewPrivacyRequestService(nil, nil)
	_, err := svc.Resolve(ctxWithOrg(uuid.New().String()), "bad-id", "resolution")

	require.Error(t, err)
	assert.True(t, errors.Is(err, service.ErrInvalidInput))
}

func TestPrivacyRequestService_List_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	orgStr, orgPG := newOrgID()

	q := mock.NewMockQuerier(ctrl)
	q.EXPECT().
		ListPrivacyRequests(gomock.Any(), orgPG).
		Return([]db.PrivacyRequest{
			{Type: "erasure"},
			{Type: "access"},
		}, nil)

	svc := service.NewPrivacyRequestService(nil, q)
	reqs, err := svc.List(ctxWithOrg(orgStr))

	require.NoError(t, err)
	assert.Len(t, reqs, 2)
}

// ══════════════════════════════════════════════════════════════════════════════
// DPIAService — non-transactional reads
// ══════════════════════════════════════════════════════════════════════════════

func TestDPIAService_Get_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	orgStr, orgPG := newOrgID()
	dpiaIDStr, dpiaIDPG := newOrgID()

	q := mock.NewMockQuerier(ctrl)
	q.EXPECT().
		GetDPIA(gomock.Any(), db.GetDPIAParams{ID: dpiaIDPG, OrganizationID: orgPG}).
		Return(db.Dpia{
			ID:             dpiaIDPG,
			OrganizationID: orgPG,
			Name:           "Vendor Assessment",
			Status:         pgtype.Text{String: "draft", Valid: true},
			RiskLevel:      pgtype.Text{String: "high", Valid: true},
		}, nil)

	svc := service.NewDPIAService(nil, q)
	dpia, err := svc.Get(ctxWithOrg(orgStr), dpiaIDStr)

	require.NoError(t, err)
	assert.Equal(t, "Vendor Assessment", dpia.Name)
	assert.Equal(t, "high", dpia.RiskLevel.String)
}

func TestDPIAService_Get_NotFound(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	orgStr, orgPG := newOrgID()
	dpiaIDStr, dpiaIDPG := newOrgID()

	q := mock.NewMockQuerier(ctrl)
	q.EXPECT().
		GetDPIA(gomock.Any(), db.GetDPIAParams{ID: dpiaIDPG, OrganizationID: orgPG}).
		Return(db.Dpia{}, errors.New("not found"))

	svc := service.NewDPIAService(nil, q)
	_, err := svc.Get(ctxWithOrg(orgStr), dpiaIDStr)

	require.Error(t, err)
	assert.True(t, errors.Is(err, service.ErrNotFound))
}

// ══════════════════════════════════════════════════════════════════════════════
// ROPAService
// ══════════════════════════════════════════════════════════════════════════════

func TestROPAService_Create_Success(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	orgStr, orgPG := newOrgID()

	q := mock.NewMockQuerier(ctrl)
	q.EXPECT().
		CreateROPA(gomock.Any(), gomock.Any()).
		DoAndReturn(func(_ context.Context, arg db.CreateROPAParams) (db.Ropa, error) {
			assert.Equal(t, orgPG, arg.OrganizationID)
			assert.Equal(t, "HR Processing", arg.Name)
			assert.Equal(t, []string{"personal", "health"}, arg.DataCategories)
			assert.Equal(t, "active", arg.Status.String)
			return db.Ropa{ID: arg.ID, OrganizationID: orgPG, Name: arg.Name}, nil
		})

	svc := service.NewROPAService(nil, q)
	r, err := svc.Create(ctxWithOrg(orgStr), service.CreateROPAInput{
		Name:           "HR Processing",
		DataCategories: []string{"personal", "health"},
	})

	require.NoError(t, err)
	assert.Equal(t, "HR Processing", r.Name)
}

func TestROPAService_Create_MissingName(t *testing.T) {
	svc := service.NewROPAService(nil, nil)
	_, err := svc.Create(ctxWithOrg(uuid.New().String()), service.CreateROPAInput{Name: ""})

	require.Error(t, err)
	assert.True(t, errors.Is(err, service.ErrInvalidInput))
}
