// Package service implements the domain logic for the trm-service.
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

	db "github.com/arc-self/apps/trm-service/internal/repository/db"
	coreMw "github.com/arc-self/packages/go-core/middleware"
)

var (
	ErrNotFound     = errors.New("not found")
	ErrInvalidInput = errors.New("invalid input")
)

// ── shared helpers ────────────────────────────────────────────────────────

func newUUID() pgtype.UUID {
	id, _ := uuid.NewV7()
	var u pgtype.UUID
	u.Scan(id.String())
	return u
}

func parseUUID(s string) (pgtype.UUID, error) {
	parsed, err := uuid.Parse(s)
	if err != nil {
		return pgtype.UUID{}, err
	}
	var u pgtype.UUID
	u.Scan(parsed.String())
	return u, nil
}

func mustGetOrgID(ctx context.Context) (pgtype.UUID, error) {
	orgIDStr, ok := coreMw.GetOrgID(ctx)
	if !ok || orgIDStr == "" {
		return pgtype.UUID{}, fmt.Errorf("%w: missing organization_id in context", ErrInvalidInput)
	}
	return parseUUID(orgIDStr)
}

func injectTraceContext(ctx context.Context, payload map[string]interface{}) {
	sc := trace.SpanContextFromContext(ctx)
	if sc.IsValid() {
		payload["trace_id"] = sc.TraceID().String()
		payload["span_id"] = sc.SpanID().String()
	}
}

// ── VendorService ─────────────────────────────────────────────────────────

type VendorService interface {
	CreateVendor(ctx context.Context, p CreateVendorInput) (db.Vendor, error)
	GetVendor(ctx context.Context, id string) (db.Vendor, error)
	ListVendors(ctx context.Context) ([]db.Vendor, error)
	UpdateVendor(ctx context.Context, id string, p UpdateVendorInput) (db.Vendor, error)
	DeleteVendor(ctx context.Context, id string) error
}

type CreateVendorInput struct {
	Name             string
	ContactEmail     string
	ComplianceStatus string
	RiskLevel        string
}

type UpdateVendorInput = CreateVendorInput

type vendorService struct {
	pool    *pgxpool.Pool
	querier db.Querier
}

func NewVendorService(pool *pgxpool.Pool, q db.Querier) VendorService {
	return &vendorService{pool: pool, querier: q}
}

func (s *vendorService) CreateVendor(ctx context.Context, p CreateVendorInput) (db.Vendor, error) {
	if p.Name == "" {
		return db.Vendor{}, fmt.Errorf("%w: name is required", ErrInvalidInput)
	}
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.Vendor{}, err
	}
	cs := p.ComplianceStatus
	if cs == "" {
		cs = "pending"
	}
	rl := p.RiskLevel
	if rl == "" {
		rl = "low"
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return db.Vendor{}, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)
	qtx := db.New(tx)

	vendor, err := qtx.CreateVendor(ctx, db.CreateVendorParams{
		ID:               newUUID(),
		OrganizationID:   orgID,
		Name:             p.Name,
		ContactEmail:     pgtype.Text{String: p.ContactEmail, Valid: p.ContactEmail != ""},
		ComplianceStatus: pgtype.Text{String: cs, Valid: true},
		RiskLevel:        pgtype.Text{String: rl, Valid: true},
	})
	if err != nil {
		return db.Vendor{}, fmt.Errorf("create vendor: %w", err)
	}

	payloadMap := map[string]interface{}{
		"name":              p.Name,
		"compliance_status": cs,
		"risk_level":        rl,
	}
	injectTraceContext(ctx, payloadMap)
	payload, _ := json.Marshal(payloadMap)

	if err := qtx.InsertOutboxEvent(ctx, db.InsertOutboxEventParams{
		ID:             newUUID(),
		OrganizationID: orgID,
		AggregateType:  "vendor",
		AggregateID:    vendor.ID.String(),
		EventType:      "VendorCreated",
		Payload:        payload,
	}); err != nil {
		return db.Vendor{}, fmt.Errorf("outbox insert: %w", err)
	}

	return vendor, tx.Commit(ctx)
}

func (s *vendorService) GetVendor(ctx context.Context, id string) (db.Vendor, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.Vendor{}, err
	}
	vendorID, err := parseUUID(id)
	if err != nil {
		return db.Vendor{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	v, err := s.querier.GetVendor(ctx, db.GetVendorParams{ID: vendorID, OrganizationID: orgID})
	if err != nil {
		return db.Vendor{}, fmt.Errorf("%w: vendor", ErrNotFound)
	}
	return v, nil
}

func (s *vendorService) ListVendors(ctx context.Context) ([]db.Vendor, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return nil, err
	}
	return s.querier.ListVendors(ctx, orgID)
}

func (s *vendorService) UpdateVendor(ctx context.Context, id string, p UpdateVendorInput) (db.Vendor, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.Vendor{}, err
	}
	vendorID, err := parseUUID(id)
	if err != nil {
		return db.Vendor{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	return s.querier.UpdateVendor(ctx, db.UpdateVendorParams{
		ID:               vendorID,
		OrganizationID:   orgID,
		Name:             p.Name,
		ContactEmail:     pgtype.Text{String: p.ContactEmail, Valid: p.ContactEmail != ""},
		ComplianceStatus: pgtype.Text{String: p.ComplianceStatus, Valid: p.ComplianceStatus != ""},
		RiskLevel:        pgtype.Text{String: p.RiskLevel, Valid: p.RiskLevel != ""},
	})
}

func (s *vendorService) DeleteVendor(ctx context.Context, id string) error {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return err
	}
	vendorID, err := parseUUID(id)
	if err != nil {
		return fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	return s.querier.DeleteVendor(ctx, db.DeleteVendorParams{ID: vendorID, OrganizationID: orgID})
}

// ── DPAService ────────────────────────────────────────────────────────────

type DPAService interface {
	CreateDPA(ctx context.Context, p CreateDPAInput) (db.Dpa, error)
	GetDPA(ctx context.Context, id string) (db.Dpa, error)
	ListDPAsByVendor(ctx context.Context, vendorID string) ([]db.Dpa, error)
	SignDPA(ctx context.Context, id string) (db.Dpa, error)
	AddDataScope(ctx context.Context, dpaID, dictID, justification string) error
	ListDataScope(ctx context.Context, dpaID string) ([]db.ListDPADataScopeRow, error)
}

type CreateDPAInput struct {
	VendorID string
}

type dpaService struct {
	pool    *pgxpool.Pool
	querier db.Querier
}

func NewDPAService(pool *pgxpool.Pool, q db.Querier) DPAService {
	return &dpaService{pool: pool, querier: q}
}

func (s *dpaService) CreateDPA(ctx context.Context, p CreateDPAInput) (db.Dpa, error) {
	if p.VendorID == "" {
		return db.Dpa{}, fmt.Errorf("%w: vendor_id is required", ErrInvalidInput)
	}
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.Dpa{}, err
	}
	vendorID, err := parseUUID(p.VendorID)
	if err != nil {
		return db.Dpa{}, fmt.Errorf("%w: invalid vendor_id", ErrInvalidInput)
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return db.Dpa{}, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)
	qtx := db.New(tx)

	dpa, err := qtx.CreateDPA(ctx, db.CreateDPAParams{
		ID:             newUUID(),
		OrganizationID: orgID,
		VendorID:       vendorID,
		Status:         "draft",
	})
	if err != nil {
		return db.Dpa{}, fmt.Errorf("create dpa: %w", err)
	}

	payloadMap := map[string]interface{}{"vendor_id": p.VendorID, "status": "draft"}
	injectTraceContext(ctx, payloadMap)
	payload, _ := json.Marshal(payloadMap)

	if err := qtx.InsertOutboxEvent(ctx, db.InsertOutboxEventParams{
		ID:             newUUID(),
		OrganizationID: orgID,
		AggregateType:  "dpa",
		AggregateID:    dpa.ID.String(),
		EventType:      "DPACreated",
		Payload:        payload,
	}); err != nil {
		return db.Dpa{}, fmt.Errorf("outbox insert: %w", err)
	}

	return dpa, tx.Commit(ctx)
}

func (s *dpaService) GetDPA(ctx context.Context, id string) (db.Dpa, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.Dpa{}, err
	}
	dpaID, err := parseUUID(id)
	if err != nil {
		return db.Dpa{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	dpa, err := s.querier.GetDPA(ctx, db.GetDPAParams{ID: dpaID, OrganizationID: orgID})
	if err != nil {
		return db.Dpa{}, fmt.Errorf("%w: dpa", ErrNotFound)
	}
	return dpa, nil
}

func (s *dpaService) ListDPAsByVendor(ctx context.Context, vendorID string) ([]db.Dpa, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return nil, err
	}
	vid, err := parseUUID(vendorID)
	if err != nil {
		return nil, fmt.Errorf("%w: invalid vendor_id", ErrInvalidInput)
	}
	return s.querier.ListDPAsByVendor(ctx, db.ListDPAsByVendorParams{VendorID: vid, OrganizationID: orgID})
}

func (s *dpaService) SignDPA(ctx context.Context, id string) (db.Dpa, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.Dpa{}, err
	}
	dpaID, err := parseUUID(id)
	if err != nil {
		return db.Dpa{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}

	now := pgtype.Timestamptz{}
	now.Scan("now")

	return s.querier.UpdateDPAStatus(ctx, db.UpdateDPAStatusParams{
		ID:             dpaID,
		OrganizationID: orgID,
		Status:         "signed",
		SignedAt:       now,
	})
}

func (s *dpaService) AddDataScope(ctx context.Context, dpaID, dictID, justification string) error {
	dID, err := parseUUID(dpaID)
	if err != nil {
		return fmt.Errorf("%w: invalid dpa_id", ErrInvalidInput)
	}
	dicID, err := parseUUID(dictID)
	if err != nil {
		return fmt.Errorf("%w: invalid dictionary_id", ErrInvalidInput)
	}
	return s.querier.AddDPADataScope(ctx, db.AddDPADataScopeParams{
		DpaID:         dID,
		DictionaryID:  dicID,
		Justification: pgtype.Text{String: justification, Valid: justification != ""},
	})
}

func (s *dpaService) ListDataScope(ctx context.Context, dpaID string) ([]db.ListDPADataScopeRow, error) {
	dID, err := parseUUID(dpaID)
	if err != nil {
		return nil, fmt.Errorf("%w: invalid dpa_id", ErrInvalidInput)
	}
	return s.querier.ListDPADataScope(ctx, dID)
}

// ── AssessmentService ─────────────────────────────────────────────────────

type AssessmentService interface {
	CreateAssessment(ctx context.Context, p CreateAssessmentInput) (db.Assessment, error)
	GetAssessment(ctx context.Context, id string) (db.Assessment, error)
	ListAssessmentsByVendor(ctx context.Context, vendorID string) ([]db.Assessment, error)
	ListAssessments(ctx context.Context) ([]db.Assessment, error)
	UpdateStatus(ctx context.Context, id string, status string, score *int32) (db.Assessment, error)
	UpdateAssessmentCycle(ctx context.Context, id string, auditCycleID string) (db.Assessment, error)
	UpsertAnswer(ctx context.Context, p UpsertAnswerInput) (db.AssessmentAnswer, error)
	ListAnswers(ctx context.Context, assessmentID string) ([]db.AssessmentAnswer, error)
}

type UpsertAnswerInput struct {
	AssessmentID  string
	QuestionID    string
	AnswerText    string
	AnswerOptions []byte
}

type CreateAssessmentInput struct {
	VendorID    string
	FrameworkID string
	Status      string
}

type assessmentService struct {
	pool    *pgxpool.Pool
	querier db.Querier
}

func NewAssessmentService(pool *pgxpool.Pool, q db.Querier) AssessmentService {
	return &assessmentService{pool: pool, querier: q}
}

func (s *assessmentService) CreateAssessment(ctx context.Context, p CreateAssessmentInput) (db.Assessment, error) {
	if p.VendorID == "" || p.FrameworkID == "" {
		return db.Assessment{}, fmt.Errorf("%w: vendor_id and framework_id are required", ErrInvalidInput)
	}
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.Assessment{}, err
	}
	vendorID, err := parseUUID(p.VendorID)
	if err != nil {
		return db.Assessment{}, fmt.Errorf("%w: invalid vendor_id", ErrInvalidInput)
	}
	frameworkID, err := parseUUID(p.FrameworkID)
	if err != nil {
		return db.Assessment{}, fmt.Errorf("%w: invalid framework_id", ErrInvalidInput)
	}
	status := p.Status
	if status == "" {
		status = "draft"
	}
	return s.querier.CreateAssessment(ctx, db.CreateAssessmentParams{
		ID:             newUUID(),
		OrganizationID: orgID,
		VendorID:       vendorID,
		FrameworkID:    frameworkID,
		Status:         pgtype.Text{String: status, Valid: true},
		Score:          pgtype.Int4{},
	})
}

func (s *assessmentService) GetAssessment(ctx context.Context, id string) (db.Assessment, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.Assessment{}, err
	}
	aID, err := parseUUID(id)
	if err != nil {
		return db.Assessment{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	a, err := s.querier.GetAssessment(ctx, db.GetAssessmentParams{ID: aID, OrganizationID: orgID})
	if err != nil {
		return db.Assessment{}, fmt.Errorf("%w: assessment", ErrNotFound)
	}
	return a, nil
}

func (s *assessmentService) ListAssessmentsByVendor(ctx context.Context, vendorID string) ([]db.Assessment, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return nil, err
	}
	vid, err := parseUUID(vendorID)
	if err != nil {
		return nil, fmt.Errorf("%w: invalid vendor_id", ErrInvalidInput)
	}
	return s.querier.ListAssessmentsByVendor(ctx, db.ListAssessmentsByVendorParams{
		VendorID:       vid,
		OrganizationID: orgID,
	})
}

func (s *assessmentService) ListAssessments(ctx context.Context) ([]db.Assessment, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return nil, err
	}
	return s.querier.ListAssessments(ctx, orgID)
}

func (s *assessmentService) UpdateStatus(ctx context.Context, id string, status string, score *int32) (db.Assessment, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.Assessment{}, err
	}
	aID, err := parseUUID(id)
	if err != nil {
		return db.Assessment{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	var scoreVal pgtype.Int4
	if score != nil {
		scoreVal = pgtype.Int4{Int32: *score, Valid: true}
	}
	return s.querier.UpdateAssessmentStatus(ctx, db.UpdateAssessmentStatusParams{
		ID:             aID,
		OrganizationID: orgID,
		Status:         pgtype.Text{String: status, Valid: true},
		Score:          scoreVal,
	})
}

func (s *assessmentService) UpdateAssessmentCycle(ctx context.Context, id string, auditCycleID string) (db.Assessment, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.Assessment{}, err
	}
	aID, err := parseUUID(id)
	if err != nil {
		return db.Assessment{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	var acID pgtype.UUID
	if auditCycleID != "" {
		acID, err = parseUUID(auditCycleID)
		if err != nil {
			return db.Assessment{}, fmt.Errorf("%w: invalid audit_cycle_id", ErrInvalidInput)
		}
	}
	return s.querier.UpdateAssessmentCycle(ctx, db.UpdateAssessmentCycleParams{
		ID:             aID,
		OrganizationID: orgID,
		AuditCycleID:   acID,
	})
}

func (s *assessmentService) UpsertAnswer(ctx context.Context, p UpsertAnswerInput) (db.AssessmentAnswer, error) {
	aID, err := parseUUID(p.AssessmentID)
	if err != nil {
		return db.AssessmentAnswer{}, fmt.Errorf("%w: invalid assessment_id", ErrInvalidInput)
	}
	qID, err := parseUUID(p.QuestionID)
	if err != nil {
		return db.AssessmentAnswer{}, fmt.Errorf("%w: invalid question_id", ErrInvalidInput)
	}
	return s.querier.UpsertAssessmentAnswer(ctx, db.UpsertAssessmentAnswerParams{
		ID:            newUUID(),
		AssessmentID:  aID,
		QuestionID:    qID,
		AnswerText:    pgtype.Text{String: p.AnswerText, Valid: p.AnswerText != ""},
		AnswerOptions: p.AnswerOptions,
	})
}

func (s *assessmentService) ListAnswers(ctx context.Context, assessmentID string) ([]db.AssessmentAnswer, error) {
	aID, err := parseUUID(assessmentID)
	if err != nil {
		return nil, fmt.Errorf("%w: invalid assessment_id", ErrInvalidInput)
	}
	return s.querier.ListAssessmentAnswers(ctx, aID)
}
