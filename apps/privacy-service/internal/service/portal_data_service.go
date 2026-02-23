package service

import (
	"context"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	db "github.com/arc-self/apps/privacy-service/internal/repository/db"
)

type PortalDataService interface {
	GetUserConsents(ctx context.Context, email string) ([]db.ConsentReceipt, error)
	GetUserPrivacyRequests(ctx context.Context, email string) ([]db.PrivacyRequest, error)
	GetUserGrievances(ctx context.Context, email string) ([]db.Grievance, error)
	GetUserNominees(ctx context.Context, email string) ([]db.Nominee, error)
	CreateUserNominee(ctx context.Context, userEmail, nomineeName, nomineeEmail, relation string) (db.Nominee, error)
}

type portalDataService struct {
	pool    *pgxpool.Pool
	querier db.Querier
}

func NewPortalDataService(pool *pgxpool.Pool, q db.Querier) PortalDataService {
	return &portalDataService{pool: pool, querier: q}
}

func (s *portalDataService) GetUserConsents(ctx context.Context, email string) ([]db.ConsentReceipt, error) {
	// For MVP, return empty list or mock list as the true mapping is complex
	return []db.ConsentReceipt{}, nil
}

func (s *portalDataService) GetUserPrivacyRequests(ctx context.Context, email string) ([]db.PrivacyRequest, error) {
	if email == "" {
		return nil, ErrInvalidInput
	}
	return s.querier.ListUserPrivacyRequests(ctx, pgtype.Text{String: email, Valid: email != ""})
}

func (s *portalDataService) GetUserGrievances(ctx context.Context, email string) ([]db.Grievance, error) {
	if email == "" {
		return nil, ErrInvalidInput
	}
	return s.querier.ListUserGrievances(ctx, pgtype.Text{String: email, Valid: email != ""})
}

func (s *portalDataService) GetUserNominees(ctx context.Context, email string) ([]db.Nominee, error) {
	if email == "" {
		return nil, ErrInvalidInput
	}
	return s.querier.GetUserNominees(ctx, email)
}

func (s *portalDataService) CreateUserNominee(ctx context.Context, userEmail, nomineeName, nomineeEmail, relation string) (db.Nominee, error) {
	if userEmail == "" || nomineeName == "" || nomineeEmail == "" || relation == "" {
		return db.Nominee{}, ErrInvalidInput
	}
	return s.querier.CreateNominee(ctx, db.CreateNomineeParams{
		ID:              newUUID(),
		UserEmail:       userEmail,
		NomineeName:     nomineeName,
		NomineeEmail:    nomineeEmail,
		NomineeRelation: relation,
		Status:          pgtype.Text{String: "pending", Valid: true},
	})
}
