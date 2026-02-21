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

	"github.com/arc-self/apps/discovery-service/internal/client"
	db "github.com/arc-self/apps/discovery-service/internal/repository/db"
	"github.com/arc-self/apps/discovery-service/internal/service"
	coreMw "github.com/arc-self/packages/go-core/middleware"
)

// ── helpers ───────────────────────────────────────────────────────────────

func mustPgUUID(s string) pgtype.UUID {
	var u pgtype.UUID
	u.Scan(s)
	return u
}

func ctxWithOrg(orgID string) context.Context {
	return context.WithValue(context.Background(), coreMw.OrgIDKey, orgID)
}

func newOrgID() string { return uuid.New().String() }

// ── hand-rolled mockQuerier matching db.Querier exactly ──────────────────

type mockQuerier struct {
	createDictFn     func(context.Context, db.CreateDictionaryItemParams) (db.DataDictionaryItem, error)
	getDictFn        func(context.Context, db.GetDictionaryItemParams) (db.DataDictionaryItem, error)
	getDictByNameFn  func(context.Context, db.GetDictionaryItemByNameParams) (db.DataDictionaryItem, error)
	listDictFn       func(context.Context, interface{}) ([]db.DataDictionaryItem, error)
	updateDictFn     func(context.Context, db.UpdateDictionaryItemParams) (db.DataDictionaryItem, error)
	insertOutboxFn   func(context.Context, db.InsertOutboxEventParams) error
	createJobFn      func(context.Context, db.CreateScanJobParams) (db.ScanJob, error)
	getJobFn         func(context.Context, db.GetScanJobParams) (db.ScanJob, error)
	listPendingFn    func(context.Context) ([]db.ScanJob, error)
	updateStatusFn   func(context.Context, db.UpdateScanJobStatusParams) (db.ScanJob, error)
	markSyncedFn     func(context.Context, interface{}) error
}

func (m *mockQuerier) CreateDictionaryItem(ctx context.Context, arg db.CreateDictionaryItemParams) (db.DataDictionaryItem, error) {
	if m.createDictFn != nil {
		return m.createDictFn(ctx, arg)
	}
	return db.DataDictionaryItem{}, nil
}
func (m *mockQuerier) GetDictionaryItem(ctx context.Context, arg db.GetDictionaryItemParams) (db.DataDictionaryItem, error) {
	if m.getDictFn != nil {
		return m.getDictFn(ctx, arg)
	}
	return db.DataDictionaryItem{}, nil
}
func (m *mockQuerier) GetDictionaryItemByName(ctx context.Context, arg db.GetDictionaryItemByNameParams) (db.DataDictionaryItem, error) {
	if m.getDictByNameFn != nil {
		return m.getDictByNameFn(ctx, arg)
	}
	return db.DataDictionaryItem{}, nil
}
func (m *mockQuerier) ListDictionaryItems(ctx context.Context, orgID interface{}) ([]db.DataDictionaryItem, error) {
	if m.listDictFn != nil {
		return m.listDictFn(ctx, orgID)
	}
	return nil, nil
}
func (m *mockQuerier) UpdateDictionaryItem(ctx context.Context, arg db.UpdateDictionaryItemParams) (db.DataDictionaryItem, error) {
	if m.updateDictFn != nil {
		return m.updateDictFn(ctx, arg)
	}
	return db.DataDictionaryItem{}, nil
}
func (m *mockQuerier) InsertOutboxEvent(ctx context.Context, arg db.InsertOutboxEventParams) error {
	if m.insertOutboxFn != nil {
		return m.insertOutboxFn(ctx, arg)
	}
	return nil
}
func (m *mockQuerier) CreateScanJob(ctx context.Context, arg db.CreateScanJobParams) (db.ScanJob, error) {
	if m.createJobFn != nil {
		return m.createJobFn(ctx, arg)
	}
	return db.ScanJob{}, nil
}
func (m *mockQuerier) GetScanJob(ctx context.Context, arg db.GetScanJobParams) (db.ScanJob, error) {
	if m.getJobFn != nil {
		return m.getJobFn(ctx, arg)
	}
	return db.ScanJob{}, nil
}
func (m *mockQuerier) ListPendingScanJobs(ctx context.Context) ([]db.ScanJob, error) {
	if m.listPendingFn != nil {
		return m.listPendingFn(ctx)
	}
	return nil, nil
}
func (m *mockQuerier) UpdateScanJobStatus(ctx context.Context, arg db.UpdateScanJobStatusParams) (db.ScanJob, error) {
	if m.updateStatusFn != nil {
		return m.updateStatusFn(ctx, arg)
	}
	return db.ScanJob{}, nil
}
func (m *mockQuerier) MarkScanJobSynced(ctx context.Context, id interface{}) error {
	if m.markSyncedFn != nil {
		return m.markSyncedFn(ctx, id)
	}
	return nil
}

var _ db.Querier = (*mockQuerier)(nil)

// ── hand-rolled mockScanner matching client.ScannerClient exactly ─────────

type mockScanner struct {
	createRuleFn   func(ctx context.Context, tenantID, name, pattern string) (string, error)
	triggerScanFn  func(ctx context.Context, tenantID, sourceID string) (string, error)
}

func (m *mockScanner) CreateRule(ctx context.Context, tenantID, name, pattern string) (string, error) {
	if m.createRuleFn != nil {
		return m.createRuleFn(ctx, tenantID, name, pattern)
	}
	return "rule-001", nil
}
func (m *mockScanner) CreateProfile(ctx context.Context, tenantID, name string) (string, error) {
	return "profile-001", nil
}
func (m *mockScanner) TriggerScan(ctx context.Context, tenantID, sourceID string) (string, error) {
	if m.triggerScanFn != nil {
		return m.triggerScanFn(ctx, tenantID, sourceID)
	}
	return "job-001", nil
}
func (m *mockScanner) GetJobStatus(ctx context.Context, tenantID, jobID string) (string, error) {
	return "COMPLETED", nil
}
func (m *mockScanner) GetJobFindings(ctx context.Context, tenantID, jobID string, page int) ([]client.Finding, bool, error) {
	return nil, false, nil
}

var _ client.ScannerClient = (*mockScanner)(nil)

// ── DictionaryService.GetDictionaryItem ──────────────────────────────────

func TestGetDictionaryItem_Success(t *testing.T) {
	orgID := newOrgID()
	itemID := newOrgID()

	q := &mockQuerier{getDictFn: func(_ context.Context, arg db.GetDictionaryItemParams) (db.DataDictionaryItem, error) {
		assert.Equal(t, mustPgUUID(itemID), arg.ID)
		assert.Equal(t, mustPgUUID(orgID), arg.OrganizationID)
		return db.DataDictionaryItem{ID: mustPgUUID(itemID), Name: "Email"}, nil
	}}
	svc := service.NewDictionaryService(nil, q, &mockScanner{})
	item, err := svc.GetDictionaryItem(ctxWithOrg(orgID), itemID)

	require.NoError(t, err)
	assert.Equal(t, "Email", item.Name)
}

func TestGetDictionaryItem_NotFound(t *testing.T) {
	q := &mockQuerier{getDictFn: func(_ context.Context, _ db.GetDictionaryItemParams) (db.DataDictionaryItem, error) {
		return db.DataDictionaryItem{}, errors.New("no rows")
	}}
	svc := service.NewDictionaryService(nil, q, &mockScanner{})
	_, err := svc.GetDictionaryItem(ctxWithOrg(newOrgID()), newOrgID())

	require.Error(t, err)
	assert.True(t, errors.Is(err, service.ErrNotFound))
}

func TestGetDictionaryItem_InvalidID(t *testing.T) {
	svc := service.NewDictionaryService(nil, &mockQuerier{}, &mockScanner{})
	_, err := svc.GetDictionaryItem(ctxWithOrg(newOrgID()), "not-a-uuid")

	require.Error(t, err)
	assert.True(t, errors.Is(err, service.ErrInvalidInput))
}

func TestGetDictionaryItem_MissingOrgID(t *testing.T) {
	svc := service.NewDictionaryService(nil, &mockQuerier{}, &mockScanner{})
	_, err := svc.GetDictionaryItem(context.Background(), newOrgID())

	require.Error(t, err)
	assert.True(t, errors.Is(err, service.ErrInvalidInput))
}

// ── DictionaryService.ListDictionaryItems ─────────────────────────────────

func TestListDictionaryItems_Success(t *testing.T) {
	orgID := newOrgID()

	q := &mockQuerier{listDictFn: func(_ context.Context, _ interface{}) ([]db.DataDictionaryItem, error) {
		return []db.DataDictionaryItem{
			{Name: "Email"},
			{Name: "Phone"},
		}, nil
	}}
	svc := service.NewDictionaryService(nil, q, &mockScanner{})
	items, err := svc.ListDictionaryItems(ctxWithOrg(orgID))

	require.NoError(t, err)
	assert.Len(t, items, 2)
}

func TestListDictionaryItems_MissingOrgID(t *testing.T) {
	svc := service.NewDictionaryService(nil, &mockQuerier{}, &mockScanner{})
	_, err := svc.ListDictionaryItems(context.Background())

	require.Error(t, err)
	assert.True(t, errors.Is(err, service.ErrInvalidInput))
}

// ── CreateDictionaryItem (validation + scanner error — no pool required) ──

func TestCreateDictionaryItem_MissingName(t *testing.T) {
	svc := service.NewDictionaryService(nil, &mockQuerier{}, &mockScanner{})
	_, err := svc.CreateDictionaryItem(ctxWithOrg(newOrgID()), service.CreateDictionaryItemInput{Name: ""})

	require.Error(t, err)
	assert.True(t, errors.Is(err, service.ErrInvalidInput))
}

func TestCreateDictionaryItem_MissingOrgID(t *testing.T) {
	svc := service.NewDictionaryService(nil, &mockQuerier{}, &mockScanner{})
	_, err := svc.CreateDictionaryItem(context.Background(), service.CreateDictionaryItemInput{Name: "Email"})

	require.Error(t, err)
	assert.True(t, errors.Is(err, service.ErrInvalidInput))
}

func TestCreateDictionaryItem_ScannerError_Propagated(t *testing.T) {
	scanner := &mockScanner{createRuleFn: func(_ context.Context, _, _, _ string) (string, error) {
		return "", errors.New("scanner API down")
	}}
	svc := service.NewDictionaryService(nil, &mockQuerier{}, scanner)
	_, err := svc.CreateDictionaryItem(ctxWithOrg(newOrgID()), service.CreateDictionaryItemInput{
		Name:    "Email",
		Pattern: ".*@.*",
	})

	require.Error(t, err)
	assert.Contains(t, err.Error(), "scanner.CreateRule")
}

// ── ScanService.GetScanJob ────────────────────────────────────────────────

func TestGetScanJob_Success(t *testing.T) {
	orgID := newOrgID()
	jobID := newOrgID()

	q := &mockQuerier{getJobFn: func(_ context.Context, arg db.GetScanJobParams) (db.ScanJob, error) {
		assert.Equal(t, mustPgUUID(jobID), arg.ID)
		return db.ScanJob{ID: mustPgUUID(jobID), Status: "COMPLETED"}, nil
	}}
	svc := service.NewScanService(nil, q, &mockScanner{})
	job, err := svc.GetScanJob(ctxWithOrg(orgID), jobID)

	require.NoError(t, err)
	assert.Equal(t, "COMPLETED", job.Status)
}

func TestGetScanJob_NotFound(t *testing.T) {
	q := &mockQuerier{getJobFn: func(_ context.Context, _ db.GetScanJobParams) (db.ScanJob, error) {
		return db.ScanJob{}, errors.New("no rows")
	}}
	svc := service.NewScanService(nil, q, &mockScanner{})
	_, err := svc.GetScanJob(ctxWithOrg(newOrgID()), newOrgID())

	require.Error(t, err)
	assert.True(t, errors.Is(err, service.ErrNotFound))
}

func TestGetScanJob_InvalidID(t *testing.T) {
	svc := service.NewScanService(nil, &mockQuerier{}, &mockScanner{})
	_, err := svc.GetScanJob(ctxWithOrg(newOrgID()), "bad-id")

	require.Error(t, err)
	assert.True(t, errors.Is(err, service.ErrInvalidInput))
}

func TestGetScanJob_MissingOrgID(t *testing.T) {
	svc := service.NewScanService(nil, &mockQuerier{}, &mockScanner{})
	_, err := svc.GetScanJob(context.Background(), newOrgID())

	require.Error(t, err)
	assert.True(t, errors.Is(err, service.ErrInvalidInput))
}

// ── ScanService.TriggerScan (validation + scanner error — no pool required) ─

func TestTriggerScan_MissingSourceID(t *testing.T) {
	svc := service.NewScanService(nil, &mockQuerier{}, &mockScanner{})
	_, err := svc.TriggerScan(ctxWithOrg(newOrgID()), service.TriggerScanInput{SourceID: ""})

	require.Error(t, err)
	assert.True(t, errors.Is(err, service.ErrInvalidInput))
}

func TestTriggerScan_MissingOrgID(t *testing.T) {
	svc := service.NewScanService(nil, &mockQuerier{}, &mockScanner{})
	_, err := svc.TriggerScan(context.Background(), service.TriggerScanInput{SourceID: "src-1"})

	require.Error(t, err)
	assert.True(t, errors.Is(err, service.ErrInvalidInput))
}

func TestTriggerScan_ScannerError_Propagated(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	scanner := &mockScanner{triggerScanFn: func(_ context.Context, _, _ string) (string, error) {
		return "", errors.New("scanner unavailable")
	}}
	svc := service.NewScanService(nil, &mockQuerier{}, scanner)
	_, err := svc.TriggerScan(ctxWithOrg(newOrgID()), service.TriggerScanInput{SourceID: "src-1"})

	require.Error(t, err)
	assert.Contains(t, err.Error(), "scanner.TriggerScan")
}

// ── TriggerScan success path (querier called after scanner succeeds) ──────

func TestTriggerScan_Success_StoresJob(t *testing.T) {
	jobStoredCalled := false
	q := &mockQuerier{createJobFn: func(_ context.Context, arg db.CreateScanJobParams) (db.ScanJob, error) {
		jobStoredCalled = true
		assert.Equal(t, "job-001", arg.ThirdPartyJobID)
		assert.Equal(t, "PENDING", arg.Status)
		return db.ScanJob{ThirdPartyJobID: "job-001", Status: "PENDING"}, nil
	}}
	svc := service.NewScanService(nil, q, &mockScanner{})
	job, err := svc.TriggerScan(ctxWithOrg(newOrgID()), service.TriggerScanInput{SourceID: "src-1"})

	require.NoError(t, err)
	assert.True(t, jobStoredCalled)
	assert.Equal(t, "PENDING", job.Status)
}
