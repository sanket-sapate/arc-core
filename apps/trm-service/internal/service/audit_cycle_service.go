package service

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	db "github.com/arc-self/apps/trm-service/internal/repository/db"
)

type AuditCycleService interface {
	CreateAuditCycle(ctx context.Context, p CreateAuditCycleInput) (db.AuditCycle, error)
	GetAuditCycle(ctx context.Context, id string) (db.AuditCycle, error)
	ListAuditCycles(ctx context.Context) ([]db.AuditCycle, error)
	UpdateAuditCycle(ctx context.Context, id string, p UpdateAuditCycleInput) (db.AuditCycle, error)
	DeleteAuditCycle(ctx context.Context, id string) error
}

type CreateAuditCycleInput struct {
	Name      string
	Status    string
	StartDate *time.Time
	EndDate   *time.Time
}

type UpdateAuditCycleInput = CreateAuditCycleInput

type auditCycleService struct {
	pool    *pgxpool.Pool
	querier db.Querier
}

func NewAuditCycleService(pool *pgxpool.Pool, q db.Querier) AuditCycleService {
	return &auditCycleService{pool: pool, querier: q}
}

func (s *auditCycleService) CreateAuditCycle(ctx context.Context, p CreateAuditCycleInput) (db.AuditCycle, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.AuditCycle{}, err
	}
	if p.Name == "" {
		return db.AuditCycle{}, fmt.Errorf("%w: name is required", ErrInvalidInput)
	}
	status := p.Status
	if status == "" {
		status = "planned"
	}
	var sDate, eDate pgtype.Timestamptz
	if p.StartDate != nil {
		sDate = pgtype.Timestamptz{Time: *p.StartDate, Valid: true}
	}
	if p.EndDate != nil {
		eDate = pgtype.Timestamptz{Time: *p.EndDate, Valid: true}
	}
	return s.querier.CreateAuditCycle(ctx, db.CreateAuditCycleParams{
		ID:             newUUID(),
		OrganizationID: orgID,
		Name:           p.Name,
		Status:         pgtype.Text{String: status, Valid: true},
		StartDate:      sDate,
		EndDate:        eDate,
	})
}

func (s *auditCycleService) GetAuditCycle(ctx context.Context, id string) (db.AuditCycle, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.AuditCycle{}, err
	}
	aID, err := parseUUID(id)
	if err != nil {
		return db.AuditCycle{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	return s.querier.GetAuditCycle(ctx, db.GetAuditCycleParams{ID: aID, OrganizationID: orgID})
}

func (s *auditCycleService) ListAuditCycles(ctx context.Context) ([]db.AuditCycle, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return nil, err
	}
	return s.querier.ListAuditCycles(ctx, orgID)
}

func (s *auditCycleService) UpdateAuditCycle(ctx context.Context, id string, p UpdateAuditCycleInput) (db.AuditCycle, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.AuditCycle{}, err
	}
	aID, err := parseUUID(id)
	if err != nil {
		return db.AuditCycle{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	var sDate, eDate pgtype.Timestamptz
	if p.StartDate != nil {
		sDate = pgtype.Timestamptz{Time: *p.StartDate, Valid: true}
	}
	if p.EndDate != nil {
		eDate = pgtype.Timestamptz{Time: *p.EndDate, Valid: true}
	}
	return s.querier.UpdateAuditCycle(ctx, db.UpdateAuditCycleParams{
		ID:             aID,
		OrganizationID: orgID,
		Name:           p.Name,
		Status:         pgtype.Text{String: p.Status, Valid: p.Status != ""},
		StartDate:      sDate,
		EndDate:        eDate,
	})
}

func (s *auditCycleService) DeleteAuditCycle(ctx context.Context, id string) error {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return err
	}
	aID, err := parseUUID(id)
	if err != nil {
		return fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	return s.querier.DeleteAuditCycle(ctx, db.DeleteAuditCycleParams{ID: aID, OrganizationID: orgID})
}
