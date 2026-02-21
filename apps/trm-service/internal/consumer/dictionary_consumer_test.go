package consumer

import (
	"context"
	"encoding/json"
	"errors"
	"testing"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
	"go.uber.org/zap/zaptest"

	db "github.com/arc-self/apps/trm-service/internal/repository/db"
)

// ── minimal mock Querier for the consumer package ─────────────────────────
// We hand-roll a lightweight mock to avoid a circular import with the mock
// package (which lives in repository/mock, a separate package).

type mockQuerier struct {
	upsertFn func(context.Context, db.UpsertReplicatedDictionaryParams) error
	deleteFn func(context.Context, pgtype.UUID) error
}

func (m *mockQuerier) UpsertReplicatedDictionary(ctx context.Context, arg db.UpsertReplicatedDictionaryParams) error {
	if m.upsertFn != nil {
		return m.upsertFn(ctx, arg)
	}
	return nil
}
func (m *mockQuerier) DeleteReplicatedDictionary(ctx context.Context, id pgtype.UUID) error {
	if m.deleteFn != nil {
		return m.deleteFn(ctx, id)
	}
	return nil
}

// Implement the rest of db.Querier with no-ops so the interface is satisfied.
func (m *mockQuerier) CreateVendor(ctx context.Context, arg db.CreateVendorParams) (db.Vendor, error) {
	return db.Vendor{}, nil
}
func (m *mockQuerier) GetVendor(ctx context.Context, arg db.GetVendorParams) (db.Vendor, error) {
	return db.Vendor{}, nil
}
func (m *mockQuerier) ListVendors(ctx context.Context, organizationID pgtype.UUID) ([]db.Vendor, error) {
	return nil, nil
}
func (m *mockQuerier) UpdateVendor(ctx context.Context, arg db.UpdateVendorParams) (db.Vendor, error) {
	return db.Vendor{}, nil
}
func (m *mockQuerier) DeleteVendor(ctx context.Context, arg db.DeleteVendorParams) error { return nil }
func (m *mockQuerier) CreateFramework(ctx context.Context, arg db.CreateFrameworkParams) (db.Framework, error) {
	return db.Framework{}, nil
}
func (m *mockQuerier) GetFramework(ctx context.Context, arg db.GetFrameworkParams) (db.Framework, error) {
	return db.Framework{}, nil
}
func (m *mockQuerier) ListFrameworks(ctx context.Context, organizationID pgtype.UUID) ([]db.Framework, error) {
	return nil, nil
}
func (m *mockQuerier) CreateAssessment(ctx context.Context, arg db.CreateAssessmentParams) (db.Assessment, error) {
	return db.Assessment{}, nil
}
func (m *mockQuerier) GetAssessment(ctx context.Context, arg db.GetAssessmentParams) (db.Assessment, error) {
	return db.Assessment{}, nil
}
func (m *mockQuerier) ListAssessmentsByVendor(ctx context.Context, arg db.ListAssessmentsByVendorParams) ([]db.Assessment, error) {
	return nil, nil
}
func (m *mockQuerier) UpdateAssessmentStatus(ctx context.Context, arg db.UpdateAssessmentStatusParams) (db.Assessment, error) {
	return db.Assessment{}, nil
}
func (m *mockQuerier) CreateDPA(ctx context.Context, arg db.CreateDPAParams) (db.Dpa, error) {
	return db.Dpa{}, nil
}
func (m *mockQuerier) GetDPA(ctx context.Context, arg db.GetDPAParams) (db.Dpa, error) {
	return db.Dpa{}, nil
}
func (m *mockQuerier) ListDPAsByVendor(ctx context.Context, arg db.ListDPAsByVendorParams) ([]db.Dpa, error) {
	return nil, nil
}
func (m *mockQuerier) UpdateDPAStatus(ctx context.Context, arg db.UpdateDPAStatusParams) (db.Dpa, error) {
	return db.Dpa{}, nil
}
func (m *mockQuerier) AddDPADataScope(ctx context.Context, arg db.AddDPADataScopeParams) error {
	return nil
}
func (m *mockQuerier) ListDPADataScope(ctx context.Context, dpaID pgtype.UUID) ([]db.DpaDataScopeRow, error) {
	return nil, nil
}
func (m *mockQuerier) GetReplicatedDictionaryItem(ctx context.Context, id pgtype.UUID) (db.ReplicatedDataDictionary, error) {
	return db.ReplicatedDataDictionary{}, nil
}
func (m *mockQuerier) ListReplicatedDictionary(ctx context.Context, organizationID pgtype.UUID) ([]db.ReplicatedDataDictionary, error) {
	return nil, nil
}
func (m *mockQuerier) InsertOutboxEvent(ctx context.Context, arg db.InsertOutboxEventParams) error {
	return nil
}

var _ db.Querier = (*mockQuerier)(nil)

// ── helpers ───────────────────────────────────────────────────────────────

const (
	validDictID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
	validOrgID  = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
)

func buildEvent(t *testing.T, orgID, eventType, aggregateID string, payload interface{}) []byte {
	t.Helper()
	payloadBytes, err := json.Marshal(payload)
	require.NoError(t, err)
	env := dictionaryOutboxEvent{
		ID:             "cccccccc-cccc-cccc-cccc-cccccccccccc",
		OrganizationID: orgID,
		AggregateType:  "data_dictionary",
		AggregateID:    aggregateID,
		EventType:      eventType,
		Payload:        json.RawMessage(payloadBytes),
	}
	b, err := json.Marshal(env)
	require.NoError(t, err)
	return b
}

func validPayload() map[string]interface{} {
	return map[string]interface{}{
		"name":        "Email Address",
		"sensitivity": "high",
		"active":      true,
	}
}

// ── DictionaryConsumer.processEvent ──────────────────────────────────────

func TestDictionaryConsumer_Created_Upserts(t *testing.T) {
	upsertCalled := false
	q := &mockQuerier{
		upsertFn: func(_ context.Context, arg db.UpsertReplicatedDictionaryParams) error {
			upsertCalled = true
			assert.Equal(t, "Email Address", arg.Name)
			assert.Equal(t, "high", arg.Sensitivity)
			assert.True(t, arg.Active)
			return nil
		},
	}
	c := NewDictionaryConsumer(nil, q, zaptest.NewLogger(t))
	data := buildEvent(t, validOrgID, "DataDictionaryItemCreated", validDictID, validPayload())
	err := c.processEvent(context.Background(), data)
	require.NoError(t, err)
	assert.True(t, upsertCalled)
}

func TestDictionaryConsumer_Updated_Upserts(t *testing.T) {
	upsertCalled := false
	q := &mockQuerier{upsertFn: func(_ context.Context, _ db.UpsertReplicatedDictionaryParams) error {
		upsertCalled = true
		return nil
	}}
	c := NewDictionaryConsumer(nil, q, zaptest.NewLogger(t))
	data := buildEvent(t, validOrgID, "DataDictionaryItemUpdated", validDictID, validPayload())
	err := c.processEvent(context.Background(), data)
	require.NoError(t, err)
	assert.True(t, upsertCalled)
}

func TestDictionaryConsumer_Deleted_Deletes(t *testing.T) {
	deleteCalled := false
	q := &mockQuerier{deleteFn: func(_ context.Context, _ pgtype.UUID) error {
		deleteCalled = true
		return nil
	}}
	c := NewDictionaryConsumer(nil, q, zaptest.NewLogger(t))
	data := buildEvent(t, validOrgID, "DataDictionaryItemDeleted", validDictID, map[string]interface{}{})
	err := c.processEvent(context.Background(), data)
	require.NoError(t, err)
	assert.True(t, deleteCalled)
}

func TestDictionaryConsumer_UnknownEvent_Skipped(t *testing.T) {
	// An unrelated event should be silently skipped (no DB calls).
	q := &mockQuerier{
		upsertFn: func(_ context.Context, _ db.UpsertReplicatedDictionaryParams) error {
			t.Fatal("upsert should not be called for unknown event types")
			return nil
		},
		deleteFn: func(_ context.Context, _ pgtype.UUID) error {
			t.Fatal("delete should not be called for unknown event types")
			return nil
		},
	}
	c := NewDictionaryConsumer(nil, q, zaptest.NewLogger(t))
	data := buildEvent(t, validOrgID, "SomeOtherEvent", validDictID, validPayload())
	err := c.processEvent(context.Background(), data)
	require.NoError(t, err) // Unknown events ack silently
}

func TestDictionaryConsumer_MalformedJSON_PoisonPill(t *testing.T) {
	c := NewDictionaryConsumer(nil, &mockQuerier{}, zaptest.NewLogger(t))
	err := c.processEvent(context.Background(), []byte(`{invalid`))
	require.Error(t, err)
	var ppe *poisonPillError
	assert.True(t, errors.As(err, &ppe))
}

func TestDictionaryConsumer_InvalidAggregateID_PoisonPill(t *testing.T) {
	c := NewDictionaryConsumer(nil, &mockQuerier{}, zaptest.NewLogger(t))
	data := buildEvent(t, validOrgID, "DataDictionaryItemCreated", "not-a-uuid", validPayload())
	err := c.processEvent(context.Background(), data)
	require.Error(t, err)
	var ppe *poisonPillError
	assert.True(t, errors.As(err, &ppe))
}

func TestDictionaryConsumer_InvalidOrgID_PoisonPill(t *testing.T) {
	c := NewDictionaryConsumer(nil, &mockQuerier{}, zaptest.NewLogger(t))
	data := buildEvent(t, "not-a-uuid", "DataDictionaryItemCreated", validDictID, validPayload())
	err := c.processEvent(context.Background(), data)
	require.Error(t, err)
	var ppe *poisonPillError
	assert.True(t, errors.As(err, &ppe))
}

func TestDictionaryConsumer_EmptyPayloadName_PoisonPill(t *testing.T) {
	payload := map[string]interface{}{"name": "", "sensitivity": "low"}
	c := NewDictionaryConsumer(nil, &mockQuerier{}, zaptest.NewLogger(t))
	data := buildEvent(t, validOrgID, "DataDictionaryItemCreated", validDictID, payload)
	err := c.processEvent(context.Background(), data)
	require.Error(t, err)
	var ppe *poisonPillError
	assert.True(t, errors.As(err, &ppe))
}

func TestDictionaryConsumer_DBError_IsTransient(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	q := &mockQuerier{upsertFn: func(_ context.Context, _ db.UpsertReplicatedDictionaryParams) error {
		return errors.New("connection refused")
	}}
	c := NewDictionaryConsumer(nil, q, zaptest.NewLogger(t))
	data := buildEvent(t, validOrgID, "DataDictionaryItemCreated", validDictID, validPayload())
	err := c.processEvent(context.Background(), data)
	require.Error(t, err)
	// Must NOT be a poison pill — should NAK for retry
	var ppe *poisonPillError
	assert.False(t, errors.As(err, &ppe))
}

func TestDictionaryConsumer_DefaultSensitivity(t *testing.T) {
	payload := map[string]interface{}{"name": "Phone Number"} // no sensitivity
	q := &mockQuerier{upsertFn: func(_ context.Context, arg db.UpsertReplicatedDictionaryParams) error {
		assert.Equal(t, "medium", arg.Sensitivity, "should default to 'medium'")
		return nil
	}}
	c := NewDictionaryConsumer(nil, q, zaptest.NewLogger(t))
	data := buildEvent(t, validOrgID, "DataDictionaryItemCreated", validDictID, payload)
	err := c.processEvent(context.Background(), data)
	require.NoError(t, err)
}
