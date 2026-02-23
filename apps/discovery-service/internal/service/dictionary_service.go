// Package service implements the domain logic for the discovery-service.
// It acts as the orchestrator between the third-party scanning API (via
// client.ScannerClient) and the local Postgres data store (via db.Querier).
//
// Every mutating operation that must be replicated downstream writes a record
// to the outbox_events table inside the same database transaction, achieving
// the Transactional Outbox pattern without a distributed two-phase commit.
package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.opentelemetry.io/otel/trace"

	"github.com/arc-self/apps/discovery-service/internal/client"
	db "github.com/arc-self/apps/discovery-service/internal/repository/db"
	coreMw "github.com/arc-self/packages/go-core/middleware"
)

var (
	ErrNotFound     = errors.New("not found")
	ErrInvalidInput = errors.New("invalid input")
)

// ── Shared helpers ────────────────────────────────────────────────────────

// newUUID generates a UUIDv7 and returns it as a pgtype.UUID.
func newUUID() pgtype.UUID {
	id, _ := uuid.NewV7()
	var u pgtype.UUID
	u.Scan(id.String())
	return u
}

// parseUUID parses a string UUID into pgtype.UUID.
func parseUUID(s string) (pgtype.UUID, error) {
	parsed, err := uuid.Parse(s)
	if err != nil {
		return pgtype.UUID{}, err
	}
	var u pgtype.UUID
	u.Scan(parsed.String())
	return u, nil
}

// mustGetOrgID extracts the organisation ID from context or returns an error.
func mustGetOrgID(ctx context.Context) (pgtype.UUID, error) {
	orgIDStr, ok := coreMw.GetOrgID(ctx)
	if !ok || orgIDStr == "" {
		return pgtype.UUID{}, fmt.Errorf("%w: missing organization_id in context", ErrInvalidInput)
	}
	return parseUUID(orgIDStr)
}

// injectTraceContext enriches a payload map with the active span's IDs so that
// the audit-service and other consumers can reconstruct the distributed trace.
func injectTraceContext(ctx context.Context, payload map[string]interface{}) {
	sc := trace.SpanContextFromContext(ctx)
	if sc.IsValid() {
		payload["trace_id"] = sc.TraceID().String()
		payload["span_id"] = sc.SpanID().String()
	}
}

// ── DictionaryService ─────────────────────────────────────────────────────

// DictionaryService manages the Master Data Dictionary.
type DictionaryService interface {
	// CreateDictionaryItem first creates the corresponding rule in the third-party
	// scanning API, then persists the item locally and emits an outbox event so
	// downstream services (privacy-service, trm-service) can replicate it.
	CreateDictionaryItem(ctx context.Context, params CreateDictionaryItemInput) (db.DataDictionary, error)

	// GetDictionaryItem retrieves a single dictionary item by ID.
	GetDictionaryItem(ctx context.Context, id string) (db.DataDictionary, error)

	// ListDictionaryItems returns all items for the caller's organisation.
	ListDictionaryItems(ctx context.Context) ([]db.DataDictionary, error)
}

// CreateDictionaryItemInput carries the caller-supplied fields for a new item.
type CreateDictionaryItemInput struct {
	Name        string
	Category    string
	Sensitivity string // "low" | "medium" | "high"
	// Pattern is the regex or detection rule pattern forwarded to the scanner API.
	Pattern string
}

// dictionaryService is the concrete implementation.
type dictionaryService struct {
	pool    *pgxpool.Pool
	querier db.Querier
	scanner client.ScannerClient
}

// NewDictionaryService wires together dependencies and returns a DictionaryService.
func NewDictionaryService(pool *pgxpool.Pool, q db.Querier, scanner client.ScannerClient) DictionaryService {
	return &dictionaryService{pool: pool, querier: q, scanner: scanner}
}

// CreateDictionaryItem implements DictionaryService.
//
// Sequence:
//  1. Call scanner.CreateRule to register the detection rule on the third-party API.
//  2. Begin a DB transaction.
//  3. Insert the data_dictionary row (including the returned third_party_rule_id).
//  4. Insert an outbox_events row (DataDictionaryItemCreated) for NATS fan-out.
//  5. Commit – both inserts succeed atomically or both roll back.
func (s *dictionaryService) CreateDictionaryItem(ctx context.Context, params CreateDictionaryItemInput) (db.DataDictionary, error) {
	if params.Name == "" {
		return db.DataDictionary{}, fmt.Errorf("%w: name is required", ErrInvalidInput)
	}

	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.DataDictionary{}, err
	}

	// Resolve tenant ID from context (re-use the org ID string as the tenant hint).
	tenantIDStr, _, _ := func() (string, bool, error) {
		tid, ok := coreMw.GetOrgID(ctx)
		return tid, ok, nil
	}()

	sensitivity := params.Sensitivity
	if sensitivity == "" {
		sensitivity = "medium"
	}

	// ── Step 1: register the rule on the third-party API ──────────────────
	ruleID, err := s.scanner.CreateRule(ctx, tenantIDStr, params.Name, params.Pattern)
	if err != nil {
		return db.DataDictionary{}, fmt.Errorf("scanner.CreateRule: %w", err)
	}

	// ── Step 2–5: atomic DB write ─────────────────────────────────────────
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return db.DataDictionary{}, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := db.New(tx)

	item, err := qtx.CreateDictionaryItem(ctx, db.CreateDictionaryItemParams{
		ID:               newUUID(),
		OrganizationID:   orgID,
		Name:             params.Name,
		Category:         pgtype.Text{String: params.Category, Valid: params.Category != ""},
		Sensitivity:      pgtype.Text{String: sensitivity, Valid: true},
		ThirdPartyRuleID: pgtype.Text{String: ruleID, Valid: ruleID != ""},
		Active:           pgtype.Bool{Bool: true, Valid: true},
	})
	if err != nil {
		return db.DataDictionary{}, fmt.Errorf("insert data_dictionary: %w", err)
	}

	payloadMap := map[string]interface{}{
		"name":               params.Name,
		"category":           params.Category,
		"sensitivity":        sensitivity,
		"third_party_rule_id": ruleID,
	}
	injectTraceContext(ctx, payloadMap)
	payload, _ := json.Marshal(payloadMap)

	if err := qtx.InsertOutboxEvent(ctx, db.InsertOutboxEventParams{
		ID:             newUUID(),
		OrganizationID: orgID,
		AggregateType:  "data_dictionary",
		AggregateID:    item.ID.String(),
		EventType:      "DataDictionaryItemCreated",
		Payload:        payload,
	}); err != nil {
		return db.DataDictionary{}, fmt.Errorf("outbox insert: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return db.DataDictionary{}, fmt.Errorf("commit tx: %w", err)
	}

	return item, nil
}

// GetDictionaryItem retrieves a single item scoped to the caller's organisation.
func (s *dictionaryService) GetDictionaryItem(ctx context.Context, id string) (db.DataDictionary, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.DataDictionary{}, err
	}
	itemID, err := parseUUID(id)
	if err != nil {
		return db.DataDictionary{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	item, err := s.querier.GetDictionaryItem(ctx, db.GetDictionaryItemParams{
		ID:             itemID,
		OrganizationID: orgID,
	})
	if err != nil {
		return db.DataDictionary{}, fmt.Errorf("%w: data_dictionary item", ErrNotFound)
	}
	return item, nil
}

// ListDictionaryItems returns all active and inactive items for the organisation.
func (s *dictionaryService) ListDictionaryItems(ctx context.Context) ([]db.DataDictionary, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return nil, err
	}
	return s.querier.ListDictionaryItems(ctx, orgID)
}

// ── ScanService ───────────────────────────────────────────────────────────

// ScanService manages scan job lifecycle.
type ScanService interface {
	// TriggerScan initiates a scan via the third-party API and persists the job
	// record locally so the background poller can track it.
	TriggerScan(ctx context.Context, params TriggerScanInput) (db.ScanJob, error)

	// GetScanJob returns the current state of a scan job.
	GetScanJob(ctx context.Context, id string) (db.ScanJob, error)

	// NetworkScan triggers an immediate network sweep.
	NetworkScan(ctx context.Context, params NetworkScanInput) error
}

// TriggerScanInput carries the caller-supplied fields for a new scan job.
type TriggerScanInput struct {
	SourceID   string // ID of the data source to scan (passed to scanner API)
	SourceName string // Human-readable label stored locally
}

// NetworkScanInput carries the input for a network IP/port scan.
type NetworkScanInput struct {
	TargetRange string
	Ports       []int
}

type scanService struct {
	pool    *pgxpool.Pool
	querier db.Querier
	scanner client.ScannerClient
}

// NewScanService wires together dependencies and returns a ScanService.
func NewScanService(pool *pgxpool.Pool, q db.Querier, scanner client.ScannerClient) ScanService {
	return &scanService{pool: pool, querier: q, scanner: scanner}
}

// TriggerScan fires a scan on the third-party platform and records the job locally.
func (s *scanService) TriggerScan(ctx context.Context, params TriggerScanInput) (db.ScanJob, error) {
	if params.SourceID == "" {
		return db.ScanJob{}, fmt.Errorf("%w: source_id is required", ErrInvalidInput)
	}

	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.ScanJob{}, err
	}

	tenantIDStr, _, _ := func() (string, bool, error) {
		tid, ok := coreMw.GetOrgID(ctx)
		return tid, ok, nil
	}()

	// Call the external API first – if it fails nothing is persisted locally.
	jobID, err := s.scanner.TriggerScan(ctx, tenantIDStr, params.SourceID)
	if err != nil {
		return db.ScanJob{}, fmt.Errorf("scanner.TriggerScan: %w", err)
	}

	job, err := s.querier.CreateScanJob(ctx, db.CreateScanJobParams{
		ID:              newUUID(),
		OrganizationID:  orgID,
		ThirdPartyJobID: jobID,
		SourceName:      params.SourceName,
		Status:          pgtype.Text{String: "PENDING", Valid: true},
		FindingsSynced:  pgtype.Bool{Bool: false, Valid: true},
	})
	if err != nil {
		return db.ScanJob{}, fmt.Errorf("insert scan_job: %w", err)
	}

	return job, nil
}

// GetScanJob returns a scan job scoped to the caller's organisation.
func (s *scanService) GetScanJob(ctx context.Context, id string) (db.ScanJob, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.ScanJob{}, err
	}
	jobID, err := parseUUID(id)
	if err != nil {
		return db.ScanJob{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	job, err := s.querier.GetScanJob(ctx, db.GetScanJobParams{ID: jobID, OrganizationID: orgID})
	if err != nil {
		return db.ScanJob{}, fmt.Errorf("%w: scan job", ErrNotFound)
	}
	return job, nil
}

// NetworkScan passes the network scan parameters to the third-party scanner client.
func (s *scanService) NetworkScan(ctx context.Context, params NetworkScanInput) error {
	if params.TargetRange == "" {
		return fmt.Errorf("%w: target_range is required", ErrInvalidInput)
	}

	tenantIDStr, _, _ := func() (string, bool, error) {
		tid, ok := coreMw.GetOrgID(ctx)
		return tid, ok, nil
	}()

	err := s.scanner.NetworkScan(ctx, tenantIDStr, params.TargetRange, params.Ports)
	if err != nil {
		return fmt.Errorf("scanner.NetworkScan: %w", err)
	}

	return nil
}
