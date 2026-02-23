package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"go.opentelemetry.io/otel/trace"

	db "github.com/arc-self/apps/privacy-service/internal/repository/db"
	coreMw "github.com/arc-self/packages/go-core/middleware"
)

var (
	ErrNotFound     = errors.New("not found")
	ErrInvalidInput = errors.New("invalid input")
)

// injectTraceContext adds the current span's IDs into a payload map so that
// downstream consumers (audit-service) can reconstruct the distributed trace.
func injectTraceContext(ctx context.Context, payload map[string]interface{}) {
	sc := trace.SpanContextFromContext(ctx)
	if sc.IsValid() {
		payload["trace_id"] = sc.TraceID().String()
		payload["span_id"] = sc.SpanID().String()
	}
}

// newUUID generates a UUIDv7 and returns it as a pgtype.UUID.
func newUUID() pgtype.UUID {
	id, _ := uuid.NewV7()
	var u pgtype.UUID
	u.Scan(id.String())
	return u
}

// parseUUID parses a string into pgtype.UUID.
func parseUUID(s string) (pgtype.UUID, error) {
	parsed, err := uuid.Parse(s)
	if err != nil {
		return pgtype.UUID{}, err
	}
	var u pgtype.UUID
	u.Scan(parsed.String())
	return u, nil
}

// mustGetOrgID reads org ID from context and converts it, or returns an error.
func mustGetOrgID(ctx context.Context) (pgtype.UUID, error) {
	orgIDStr, ok := coreMw.GetOrgID(ctx)
	if !ok || orgIDStr == "" {
		return pgtype.UUID{}, fmt.Errorf("%w: missing organization_id in context", ErrInvalidInput)
	}
	return parseUUID(orgIDStr)
}

// ── CookieBanner Service ──────────────────────────────────────────────────

type CookieBannerService interface {
	Create(ctx context.Context, p CreateCookieBannerInput) (db.CookieBanner, error)
	Get(ctx context.Context, id string) (db.CookieBanner, error)
	List(ctx context.Context) ([]db.CookieBanner, error)
	Update(ctx context.Context, id string, p UpdateCookieBannerInput) (db.CookieBanner, error)
	Delete(ctx context.Context, id string) error
}

type CreateCookieBannerInput struct {
	Domain             string          `json:"domain"`
	Name               string          `json:"name"`
	Title              string          `json:"title"`
	Message            string          `json:"message"`
	AcceptButtonText   string          `json:"accept_button_text"`
	RejectButtonText   string          `json:"reject_button_text"`
	SettingsButtonText string          `json:"settings_button_text"`
	Theme              string          `json:"theme"`
	Position           string          `json:"position"`
	Active             bool            `json:"active"`
	Config             json.RawMessage `json:"config"`
}

type UpdateCookieBannerInput = CreateCookieBannerInput

type cookieBannerService struct {
	pool    *pgxpool.Pool
	rdb     *redis.Client
	querier db.Querier
}

func NewCookieBannerService(pool *pgxpool.Pool, rdb *redis.Client, q db.Querier) CookieBannerService {
	return &cookieBannerService{pool: pool, rdb: rdb, querier: q}
}

func (s *cookieBannerService) Create(ctx context.Context, p CreateCookieBannerInput) (db.CookieBanner, error) {
	if p.Domain == "" {
		return db.CookieBanner{}, fmt.Errorf("%w: domain is required", ErrInvalidInput)
	}
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.CookieBanner{}, err
	}
	cfg := p.Config
	if cfg == nil {
		cfg = json.RawMessage("{}")
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return db.CookieBanner{}, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)
	qtx := db.New(tx)

	banner, err := qtx.CreateCookieBanner(ctx, db.CreateCookieBannerParams{
		ID: newUUID(), OrganizationID: orgID, Domain: p.Domain,
		Name: pgtype.Text{String: p.Name, Valid: p.Name != ""},
		Title: pgtype.Text{String: p.Title, Valid: p.Title != ""},
		Message: pgtype.Text{String: p.Message, Valid: p.Message != ""},
		AcceptButtonText: pgtype.Text{String: p.AcceptButtonText, Valid: p.AcceptButtonText != ""},
		RejectButtonText: pgtype.Text{String: p.RejectButtonText, Valid: p.RejectButtonText != ""},
		SettingsButtonText: pgtype.Text{String: p.SettingsButtonText, Valid: p.SettingsButtonText != ""},
		Theme: pgtype.Text{String: p.Theme, Valid: p.Theme != ""},
		Position: pgtype.Text{String: p.Position, Valid: p.Position != ""},
		Active: pgtype.Bool{Bool: p.Active, Valid: true},
		Config: cfg,
	})
	if err != nil {
		return db.CookieBanner{}, fmt.Errorf("create cookie banner: %w", err)
	}

	payload, _ := json.Marshal(map[string]interface{}{"domain": p.Domain, "name": p.Name})
	injectTraceContext(ctx, map[string]interface{}{})
	if err := qtx.InsertOutboxEvent(ctx, db.InsertOutboxEventParams{
		ID: newUUID(), OrganizationID: orgID,
		AggregateType: "cookie_banner", AggregateID: banner.ID.String(),
		EventType: "CookieBannerCreated", Payload: payload,
	}); err != nil {
		return db.CookieBanner{}, fmt.Errorf("outbox insert: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return banner, err
	}

	// Push to Redis (Write-Through Cache)
	key := fmt.Sprintf("widget:banner:%s:%s", orgID.String(), p.Domain)
	bannerJSON, _ := json.Marshal(banner)
	if err := s.rdb.Set(ctx, key, bannerJSON, 0).Err(); err != nil {
		// Log error but don't fail the request since source of truth succeeded
		fmt.Printf("failed to push banner config to Redis: %v\n", err)
	}

	return banner, nil
}

func (s *cookieBannerService) Get(ctx context.Context, id string) (db.CookieBanner, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.CookieBanner{}, err
	}
	bannerID, err := parseUUID(id)
	if err != nil {
		return db.CookieBanner{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	b, err := s.querier.GetCookieBanner(ctx, db.GetCookieBannerParams{ID: bannerID, OrganizationID: orgID})
	if err != nil {
		return db.CookieBanner{}, fmt.Errorf("%w: cookie banner", ErrNotFound)
	}
	return b, nil
}

func (s *cookieBannerService) List(ctx context.Context) ([]db.CookieBanner, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return nil, err
	}
	return s.querier.ListCookieBanners(ctx, orgID)
}

func (s *cookieBannerService) Update(ctx context.Context, id string, p UpdateCookieBannerInput) (db.CookieBanner, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.CookieBanner{}, err
	}
	bannerID, err := parseUUID(id)
	if err != nil {
		return db.CookieBanner{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	cfg := p.Config
	if cfg == nil {
		cfg = json.RawMessage("{}")
	}
	banner, err := s.querier.UpdateCookieBanner(ctx, db.UpdateCookieBannerParams{
		ID: bannerID, OrganizationID: orgID,
		Name: pgtype.Text{String: p.Name, Valid: p.Name != ""},
		Title: pgtype.Text{String: p.Title, Valid: p.Title != ""},
		Message: pgtype.Text{String: p.Message, Valid: p.Message != ""},
		AcceptButtonText: pgtype.Text{String: p.AcceptButtonText, Valid: p.AcceptButtonText != ""},
		RejectButtonText: pgtype.Text{String: p.RejectButtonText, Valid: p.RejectButtonText != ""},
		SettingsButtonText: pgtype.Text{String: p.SettingsButtonText, Valid: p.SettingsButtonText != ""},
		Theme: pgtype.Text{String: p.Theme, Valid: p.Theme != ""},
		Position: pgtype.Text{String: p.Position, Valid: p.Position != ""},
		Active: pgtype.Bool{Bool: p.Active, Valid: true},
		Config: cfg,
	})
	if err == nil && p.Domain != "" {
		// Update Redis cache if successful
		key := fmt.Sprintf("widget:banner:%s:%s", orgID.String(), p.Domain)
		bannerJSON, _ := json.Marshal(banner)
		if rdbErr := s.rdb.Set(ctx, key, bannerJSON, 0).Err(); rdbErr != nil {
			fmt.Printf("failed to update banner config in Redis: %v\n", rdbErr)
		}
	}
	return banner, err
}

func (s *cookieBannerService) Delete(ctx context.Context, id string) error {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return err
	}
	bannerID, err := parseUUID(id)
	if err != nil {
		return fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	return s.querier.DeleteCookieBanner(ctx, db.DeleteCookieBannerParams{ID: bannerID, OrganizationID: orgID})
}

// ── Privacy Request Service ───────────────────────────────────────────────

type PrivacyRequestService interface {
	Create(ctx context.Context, p CreatePrivacyRequestInput) (db.PrivacyRequest, error)
	Get(ctx context.Context, id string) (db.PrivacyRequest, error)
	List(ctx context.Context) ([]db.PrivacyRequest, error)
	Update(ctx context.Context, id string, p UpdatePrivacyRequestInput) (db.PrivacyRequest, error)
}

type CreatePrivacyRequestInput struct {
	Type           string `json:"type"`
	RequesterEmail string `json:"requester_email"`
	RequesterName  string `json:"requester_name"`
	Description    string `json:"description"`
}

type UpdatePrivacyRequestInput struct {
	Status     string     `json:"status"`
	Resolution string     `json:"resolution"`
	DueDate    *time.Time `json:"due_date"`
}

type privacyRequestService struct {
	pool    *pgxpool.Pool
	querier db.Querier
}

func NewPrivacyRequestService(pool *pgxpool.Pool, q db.Querier) PrivacyRequestService {
	return &privacyRequestService{pool: pool, querier: q}
}

func (s *privacyRequestService) Create(ctx context.Context, p CreatePrivacyRequestInput) (db.PrivacyRequest, error) {
	if p.Type == "" {
		return db.PrivacyRequest{}, fmt.Errorf("%w: type is required", ErrInvalidInput)
	}
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.PrivacyRequest{}, err
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return db.PrivacyRequest{}, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)
	qtx := db.New(tx)

	dueDate := pgtype.Timestamptz{Time: time.Now().AddDate(0, 0, 7), Valid: true}

	req, err := qtx.CreatePrivacyRequest(ctx, db.CreatePrivacyRequestParams{
		ID: newUUID(), OrganizationID: orgID, Type: p.Type,
		Status:         pgtype.Text{String: "acknowledged", Valid: true},
		RequesterEmail: pgtype.Text{String: p.RequesterEmail, Valid: p.RequesterEmail != ""},
		RequesterName:  pgtype.Text{String: p.RequesterName, Valid: p.RequesterName != ""},
		Description:    pgtype.Text{String: p.Description, Valid: p.Description != ""},
		DueDate:        dueDate,
	})
	if err != nil {
		return db.PrivacyRequest{}, fmt.Errorf("create privacy request: %w", err)
	}

	payloadMap := map[string]interface{}{"type": p.Type, "requester_email": p.RequesterEmail}
	injectTraceContext(ctx, payloadMap)
	payload, _ := json.Marshal(payloadMap)
	if err := qtx.InsertOutboxEvent(ctx, db.InsertOutboxEventParams{
		ID: newUUID(), OrganizationID: orgID,
		AggregateType: "privacy_request", AggregateID: req.ID.String(),
		EventType: "PrivacyRequestCreated", Payload: payload,
	}); err != nil {
		return db.PrivacyRequest{}, fmt.Errorf("outbox insert: %w", err)
	}
	return req, tx.Commit(ctx)
}

func (s *privacyRequestService) Get(ctx context.Context, id string) (db.PrivacyRequest, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.PrivacyRequest{}, err
	}
	reqID, err := parseUUID(id)
	if err != nil {
		return db.PrivacyRequest{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	r, err := s.querier.GetPrivacyRequest(ctx, db.GetPrivacyRequestParams{ID: reqID, OrganizationID: orgID})
	if err != nil {
		return db.PrivacyRequest{}, fmt.Errorf("%w: privacy request", ErrNotFound)
	}
	return r, nil
}

func (s *privacyRequestService) List(ctx context.Context) ([]db.PrivacyRequest, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return nil, err
	}
	return s.querier.ListPrivacyRequests(ctx, orgID)
}

func (s *privacyRequestService) Update(ctx context.Context, id string, p UpdatePrivacyRequestInput) (db.PrivacyRequest, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.PrivacyRequest{}, err
	}
	reqID, err := parseUUID(id)
	if err != nil {
		return db.PrivacyRequest{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	dueDate := pgtype.Timestamptz{}
	if p.DueDate != nil {
		dueDate = pgtype.Timestamptz{Time: *p.DueDate, Valid: true}
	} else {
		// Retain existing due_date if not specified
		// Let's fetch the existing request to retain due_date
		existing, err := s.querier.GetPrivacyRequest(ctx, db.GetPrivacyRequestParams{ID: reqID, OrganizationID: orgID})
		if err == nil {
			dueDate = existing.DueDate
		}
	}

	return s.querier.UpdatePrivacyRequest(ctx, db.UpdatePrivacyRequestParams{
		ID:             reqID,
		OrganizationID: orgID,
		Status:         pgtype.Text{String: p.Status, Valid: p.Status != ""},
		Resolution:     pgtype.Text{String: p.Resolution, Valid: p.Resolution != ""},
		DueDate:        dueDate,
	})
}

// ── DPIA Service ──────────────────────────────────────────────────────────

type DPIAService interface {
	Create(ctx context.Context, p CreateDPIAInput) (db.Dpia, error)
	Get(ctx context.Context, id string) (db.Dpia, error)
	List(ctx context.Context) ([]db.Dpia, error)
	Update(ctx context.Context, id string, p UpdateDPIAInput) (db.Dpia, error)
}

type CreateDPIAInput struct {
	Name      string          `json:"name"`
	VendorID  string          `json:"vendor_id"`
	Status    string          `json:"status"`
	RiskLevel string          `json:"risk_level"`
	FormData  json.RawMessage `json:"form_data"`
}

type UpdateDPIAInput = CreateDPIAInput

type dpiaService struct {
	pool    *pgxpool.Pool
	querier db.Querier
}

func NewDPIAService(pool *pgxpool.Pool, q db.Querier) DPIAService {
	return &dpiaService{pool: pool, querier: q}
}

func (s *dpiaService) Create(ctx context.Context, p CreateDPIAInput) (db.Dpia, error) {
	if p.Name == "" {
		return db.Dpia{}, fmt.Errorf("%w: name is required", ErrInvalidInput)
	}
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.Dpia{}, err
	}
	vendorID := pgtype.UUID{}
	if p.VendorID != "" {
		vendorID, err = parseUUID(p.VendorID)
		if err != nil {
			return db.Dpia{}, fmt.Errorf("%w: invalid vendor_id", ErrInvalidInput)
		}
	}
	status := p.Status
	if status == "" {
		status = "draft"
	}
	riskLevel := p.RiskLevel
	if riskLevel == "" {
		riskLevel = "medium"
	}
	formData := p.FormData
	if formData == nil {
		formData = json.RawMessage("{}")
	}
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return db.Dpia{}, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)
	qtx := db.New(tx)

	dpia, err := qtx.CreateDPIA(ctx, db.CreateDPIAParams{
		ID: newUUID(), OrganizationID: orgID, Name: p.Name,
		VendorID:  vendorID,
		Status:    pgtype.Text{String: status, Valid: true},
		RiskLevel: pgtype.Text{String: riskLevel, Valid: true},
		FormData:  formData,
	})
	if err != nil {
		return db.Dpia{}, fmt.Errorf("create dpia: %w", err)
	}

	payloadMap := map[string]interface{}{"name": p.Name, "status": status, "risk_level": riskLevel}
	injectTraceContext(ctx, payloadMap)
	payload, _ := json.Marshal(payloadMap)
	if err := qtx.InsertOutboxEvent(ctx, db.InsertOutboxEventParams{
		ID: newUUID(), OrganizationID: orgID,
		AggregateType: "dpia", AggregateID: dpia.ID.String(),
		EventType: "DPIACreated", Payload: payload,
	}); err != nil {
		return db.Dpia{}, fmt.Errorf("outbox insert: %w", err)
	}
	return dpia, tx.Commit(ctx)
}

func (s *dpiaService) Get(ctx context.Context, id string) (db.Dpia, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.Dpia{}, err
	}
	dpiaID, err := parseUUID(id)
	if err != nil {
		return db.Dpia{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	d, err := s.querier.GetDPIA(ctx, db.GetDPIAParams{ID: dpiaID, OrganizationID: orgID})
	if err != nil {
		return db.Dpia{}, fmt.Errorf("%w: dpia", ErrNotFound)
	}
	return d, nil
}

func (s *dpiaService) List(ctx context.Context) ([]db.Dpia, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return nil, err
	}
	return s.querier.ListDPIAs(ctx, orgID)
}

func (s *dpiaService) Update(ctx context.Context, id string, p UpdateDPIAInput) (db.Dpia, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.Dpia{}, err
	}
	dpiaID, err := parseUUID(id)
	if err != nil {
		return db.Dpia{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	vendorID := pgtype.UUID{}
	if p.VendorID != "" {
		vendorID, err = parseUUID(p.VendorID)
		if err != nil {
			return db.Dpia{}, fmt.Errorf("%w: invalid vendor_id", ErrInvalidInput)
		}
	}
	formData := p.FormData
	if formData == nil {
		formData = json.RawMessage("{}")
	}
	return s.querier.UpdateDPIA(ctx, db.UpdateDPIAParams{
		ID: dpiaID, OrganizationID: orgID, Name: p.Name,
		VendorID:  vendorID,
		Status:    pgtype.Text{String: p.Status, Valid: p.Status != ""},
		RiskLevel: pgtype.Text{String: p.RiskLevel, Valid: p.RiskLevel != ""},
		FormData:  formData,
	})
}

// ── ROPA Service ──────────────────────────────────────────────────────────

type ROPAService interface {
	Create(ctx context.Context, p CreateROPAInput) (db.Ropa, error)
	Get(ctx context.Context, id string) (db.Ropa, error)
	List(ctx context.Context) ([]db.Ropa, error)
	Update(ctx context.Context, id string, p UpdateROPAInput) (db.Ropa, error)
}

type CreateROPAInput struct {
	Name               string   `json:"name"`
	ProcessingActivity string   `json:"processing_activity"`
	LegalBasis         string   `json:"legal_basis"`
	DataCategories     []string `json:"data_categories"`
	Status             string   `json:"status"`
}

type UpdateROPAInput = CreateROPAInput

type ropaService struct {
	pool    *pgxpool.Pool
	querier db.Querier
}

func NewROPAService(pool *pgxpool.Pool, q db.Querier) ROPAService {
	return &ropaService{pool: pool, querier: q}
}

func (s *ropaService) Create(ctx context.Context, p CreateROPAInput) (db.Ropa, error) {
	if p.Name == "" {
		return db.Ropa{}, fmt.Errorf("%w: name is required", ErrInvalidInput)
	}
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.Ropa{}, err
	}
	status := p.Status
	if status == "" {
		status = "active"
	}
	r, err := s.querier.CreateROPA(ctx, db.CreateROPAParams{
		ID: newUUID(), OrganizationID: orgID, Name: p.Name,
		ProcessingActivity: pgtype.Text{String: p.ProcessingActivity, Valid: p.ProcessingActivity != ""},
		LegalBasis:         pgtype.Text{String: p.LegalBasis, Valid: p.LegalBasis != ""},
		DataCategories:     p.DataCategories,
		Status:             pgtype.Text{String: status, Valid: true},
	})
	if err != nil {
		return db.Ropa{}, fmt.Errorf("create ropa: %w", err)
	}
	return r, nil
}

func (s *ropaService) Get(ctx context.Context, id string) (db.Ropa, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.Ropa{}, err
	}
	ropaID, err := parseUUID(id)
	if err != nil {
		return db.Ropa{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	r, err := s.querier.GetROPA(ctx, db.GetROPAParams{ID: ropaID, OrganizationID: orgID})
	if err != nil {
		return db.Ropa{}, fmt.Errorf("%w: ropa", ErrNotFound)
	}
	return r, nil
}

func (s *ropaService) List(ctx context.Context) ([]db.Ropa, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return nil, err
	}
	return s.querier.ListROPAs(ctx, orgID)
}

func (s *ropaService) Update(ctx context.Context, id string, p UpdateROPAInput) (db.Ropa, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.Ropa{}, err
	}
	ropaID, err := parseUUID(id)
	if err != nil {
		return db.Ropa{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	return s.querier.UpdateROPA(ctx, db.UpdateROPAParams{
		ID: ropaID, OrganizationID: orgID, Name: p.Name,
		ProcessingActivity: pgtype.Text{String: p.ProcessingActivity, Valid: p.ProcessingActivity != ""},
		LegalBasis:         pgtype.Text{String: p.LegalBasis, Valid: p.LegalBasis != ""},
		DataCategories:     p.DataCategories,
		Status:             pgtype.Text{String: p.Status, Valid: p.Status != ""},
	})
}

// ── Purpose Service ───────────────────────────────────────────────────────

type PurposeService interface {
	Create(ctx context.Context, p CreatePurposeInput) (db.CreatePurposeRow, error)
	Get(ctx context.Context, id string) (db.GetPurposeRow, error)
	List(ctx context.Context) ([]db.ListPurposesRow, error)
	Update(ctx context.Context, id string, p UpdatePurposeInput) (db.UpdatePurposeRow, error)
}

type CreatePurposeInput struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	LegalBasis  string   `json:"legal_basis"`
	Active      bool     `json:"active"`
	DataObjects []string `json:"data_objects"` // UUIDs as strings
}

type UpdatePurposeInput = CreatePurposeInput

type purposeService struct {
	pool    *pgxpool.Pool
	querier db.Querier
}

func NewPurposeService(pool *pgxpool.Pool, q db.Querier) PurposeService {
	return &purposeService{pool: pool, querier: q}
}

func (s *purposeService) Create(ctx context.Context, p CreatePurposeInput) (db.CreatePurposeRow, error) {
	if p.Name == "" {
		return db.CreatePurposeRow{}, fmt.Errorf("%w: name is required", ErrInvalidInput)
	}
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.CreatePurposeRow{}, err
	}
	dataObjectUUIDs, err := parseStringUUIDs(p.DataObjects)
	if err != nil {
		return db.CreatePurposeRow{}, err
	}
	return s.querier.CreatePurpose(ctx, db.CreatePurposeParams{
		ID: newUUID(), OrganizationID: orgID, Name: p.Name,
		Description: pgtype.Text{String: p.Description, Valid: p.Description != ""},
		LegalBasis:  pgtype.Text{String: p.LegalBasis, Valid: p.LegalBasis != ""},
		Active:      pgtype.Bool{Bool: p.Active, Valid: true},
		DataObjects: dataObjectUUIDs,
	})
}

func (s *purposeService) Get(ctx context.Context, id string) (db.GetPurposeRow, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.GetPurposeRow{}, err
	}
	purposeID, err := parseUUID(id)
	if err != nil {
		return db.GetPurposeRow{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	p, err := s.querier.GetPurpose(ctx, db.GetPurposeParams{ID: purposeID, OrganizationID: orgID})
	if err != nil {
		return db.GetPurposeRow{}, fmt.Errorf("%w: purpose", ErrNotFound)
	}
	return p, nil
}

func (s *purposeService) List(ctx context.Context) ([]db.ListPurposesRow, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return nil, err
	}
	return s.querier.ListPurposes(ctx, orgID)
}

func (s *purposeService) Update(ctx context.Context, id string, p UpdatePurposeInput) (db.UpdatePurposeRow, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.UpdatePurposeRow{}, err
	}
	purposeID, err := parseUUID(id)
	if err != nil {
		return db.UpdatePurposeRow{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	dataObjectUUIDs, err := parseStringUUIDs(p.DataObjects)
	if err != nil {
		return db.UpdatePurposeRow{}, err
	}
	return s.querier.UpdatePurpose(ctx, db.UpdatePurposeParams{
		ID: purposeID, OrganizationID: orgID, Name: p.Name,
		Description: pgtype.Text{String: p.Description, Valid: p.Description != ""},
		LegalBasis:  pgtype.Text{String: p.LegalBasis, Valid: p.LegalBasis != ""},
		Active:      pgtype.Bool{Bool: p.Active, Valid: true},
		DataObjects: dataObjectUUIDs,
	})
}

// ── ConsentForm Service ───────────────────────────────────────────────────

type ConsentFormService interface {
	Create(ctx context.Context, p CreateConsentFormInput) (db.ConsentForm, error)
	Get(ctx context.Context, id string) (db.ConsentForm, error)
	List(ctx context.Context) ([]db.ConsentForm, error)
	Update(ctx context.Context, id string, p UpdateConsentFormInput) (db.ConsentForm, error)
}

type CreateConsentFormInput struct {
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Active      bool            `json:"active"`
	FormConfig  json.RawMessage `json:"form_config"`
	Purposes    []string        `json:"purposes"` // UUIDs as strings
}

type UpdateConsentFormInput = CreateConsentFormInput

type consentFormService struct {
	pool    *pgxpool.Pool
	querier db.Querier
}

func NewConsentFormService(pool *pgxpool.Pool, q db.Querier) ConsentFormService {
	return &consentFormService{pool: pool, querier: q}
}

func (s *consentFormService) Create(ctx context.Context, p CreateConsentFormInput) (db.ConsentForm, error) {
	if p.Name == "" {
		return db.ConsentForm{}, fmt.Errorf("%w: name is required", ErrInvalidInput)
	}
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.ConsentForm{}, err
	}
	cfg := p.FormConfig
	if cfg == nil {
		cfg = json.RawMessage("{}")
	}
	purposeUUIDs, err := parsePurposeIDs(p.Purposes)
	if err != nil {
		return db.ConsentForm{}, err
	}
	return s.querier.CreateConsentForm(ctx, db.CreateConsentFormParams{
		ID: newUUID(), OrganizationID: orgID, Name: p.Name,
		Description: pgtype.Text{String: p.Description, Valid: p.Description != ""},
		Active:      pgtype.Bool{Bool: p.Active, Valid: true},
		FormConfig:  cfg,
		Purposes:    purposeUUIDs,
	})
}

func (s *consentFormService) Get(ctx context.Context, id string) (db.ConsentForm, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.ConsentForm{}, err
	}
	formID, err := parseUUID(id)
	if err != nil {
		return db.ConsentForm{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	f, err := s.querier.GetConsentForm(ctx, db.GetConsentFormParams{ID: formID, OrganizationID: orgID})
	if err != nil {
		return db.ConsentForm{}, fmt.Errorf("%w: consent form", ErrNotFound)
	}
	return f, nil
}

func (s *consentFormService) List(ctx context.Context) ([]db.ConsentForm, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return nil, err
	}
	return s.querier.ListConsentForms(ctx, orgID)
}

func (s *consentFormService) Update(ctx context.Context, id string, p UpdateConsentFormInput) (db.ConsentForm, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.ConsentForm{}, err
	}
	formID, err := parseUUID(id)
	if err != nil {
		return db.ConsentForm{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	cfg := p.FormConfig
	if cfg == nil {
		cfg = json.RawMessage("{}")
	}
	purposeUUIDs, err := parsePurposeIDs(p.Purposes)
	if err != nil {
		return db.ConsentForm{}, err
	}
	return s.querier.UpdateConsentForm(ctx, db.UpdateConsentFormParams{
		ID: formID, OrganizationID: orgID, Name: p.Name,
		Description: pgtype.Text{String: p.Description, Valid: p.Description != ""},
		Active:      pgtype.Bool{Bool: p.Active, Valid: true},
		FormConfig:  cfg,
		Purposes:    purposeUUIDs,
	})
}

func parsePurposeIDs(ids []string) ([]pgtype.UUID, error) {
	out := make([]pgtype.UUID, 0, len(ids))
	for _, s := range ids {
		u, err := parseUUID(s)
		if err != nil {
			return nil, fmt.Errorf("%w: invalid purpose id %q", ErrInvalidInput, s)
		}
		out = append(out, u)
	}
	return out, nil
}

func parseStringUUIDs(ids []string) ([]pgtype.UUID, error) {
	out := make([]pgtype.UUID, 0, len(ids))
	for _, s := range ids {
		u, err := parseUUID(s)
		if err != nil {
			return nil, fmt.Errorf("%w: invalid id %q", ErrInvalidInput, s)
		}
		out = append(out, u)
	}
	return out, nil
}

// ── Grievance Service ─────────────────────────────────────────────────────

type GrievanceService interface {
	Create(ctx context.Context, p CreateGrievanceInput) (db.Grievance, error)
	Get(ctx context.Context, id string) (db.Grievance, error)
	List(ctx context.Context) ([]db.Grievance, error)
	Update(ctx context.Context, id string, p UpdateGrievanceInput) (db.Grievance, error)
}

type CreateGrievanceInput struct {
	ReporterEmail string `json:"reporter_email"`
	IssueType     string `json:"issue_type"`
	Description   string `json:"description"`
	Priority      string `json:"priority"`
}

type UpdateGrievanceInput struct {
	Status     string `json:"status"`
	Resolution string `json:"resolution"`
	Priority   string `json:"priority"`
}

type grievanceService struct {
	pool    *pgxpool.Pool
	querier db.Querier
}

func NewGrievanceService(pool *pgxpool.Pool, q db.Querier) GrievanceService {
	return &grievanceService{pool: pool, querier: q}
}

func (s *grievanceService) Create(ctx context.Context, p CreateGrievanceInput) (db.Grievance, error) {
	if p.IssueType == "" {
		return db.Grievance{}, fmt.Errorf("%w: issue_type is required", ErrInvalidInput)
	}
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.Grievance{}, err
	}
	priority := p.Priority
	if priority == "" {
		priority = "medium"
	}

	dueDate := pgtype.Timestamptz{Time: time.Now().AddDate(0, 0, 30), Valid: true}

	return s.querier.CreateGrievance(ctx, db.CreateGrievanceParams{
		ID:             newUUID(),
		OrganizationID: orgID,
		ReporterEmail:  pgtype.Text{String: p.ReporterEmail, Valid: p.ReporterEmail != ""},
		IssueType:      p.IssueType,
		Description:    pgtype.Text{String: p.Description, Valid: p.Description != ""},
		Status:         pgtype.Text{String: "acknowledged", Valid: true},
		Priority:       pgtype.Text{String: priority, Valid: true},
		DueDate:        dueDate,
	})
}

func (s *grievanceService) Get(ctx context.Context, id string) (db.Grievance, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.Grievance{}, err
	}
	gID, err := parseUUID(id)
	if err != nil {
		return db.Grievance{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	g, err := s.querier.GetGrievance(ctx, db.GetGrievanceParams{ID: gID, OrganizationID: orgID})
	if err != nil {
		return db.Grievance{}, fmt.Errorf("%w: grievance", ErrNotFound)
	}
	return g, nil
}

func (s *grievanceService) List(ctx context.Context) ([]db.Grievance, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return nil, err
	}
	return s.querier.ListGrievances(ctx, orgID)
}

func (s *grievanceService) Update(ctx context.Context, id string, p UpdateGrievanceInput) (db.Grievance, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.Grievance{}, err
	}
	gID, err := parseUUID(id)
	if err != nil {
		return db.Grievance{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	return s.querier.UpdateGrievance(ctx, db.UpdateGrievanceParams{
		ID:             gID,
		OrganizationID: orgID,
		Status:         pgtype.Text{String: p.Status, Valid: p.Status != ""},
		Resolution:     pgtype.Text{String: p.Resolution, Valid: p.Resolution != ""},
		Priority:       pgtype.Text{String: p.Priority, Valid: p.Priority != ""},
	})
}

