package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	db "github.com/arc-self/apps/trm-service/internal/repository/db"
)

type FrameworkService interface {
	CreateFramework(ctx context.Context, p CreateFrameworkInput) (db.Framework, error)
	GetFramework(ctx context.Context, id string) (db.Framework, error)
	ListFrameworks(ctx context.Context) ([]db.Framework, error)
	UpdateFramework(ctx context.Context, id string, p UpdateFrameworkInput) (db.Framework, error)
	DeleteFramework(ctx context.Context, id string) error
	CreateQuestion(ctx context.Context, p CreateQuestionInput) (db.FrameworkQuestion, error)
	ListQuestions(ctx context.Context, frameworkID string) ([]db.FrameworkQuestion, error)
	ImportQuestionsFromCSV(ctx context.Context, frameworkID string, rows []CSVQuestionRow) (int, error)
}

type CreateFrameworkInput struct {
	Name        string
	Version     string
	Description string
}

type UpdateFrameworkInput = CreateFrameworkInput

type CreateQuestionInput struct {
	FrameworkID  string
	QuestionText string
	QuestionType string
	Options      []byte
}

type CSVQuestionRow struct {
	QuestionText string
	QuestionType string
	Options      string
	Required     bool
}

type frameworkService struct {
	pool    *pgxpool.Pool
	querier db.Querier
}

func NewFrameworkService(pool *pgxpool.Pool, q db.Querier) FrameworkService {
	return &frameworkService{pool: pool, querier: q}
}

func (s *frameworkService) CreateFramework(ctx context.Context, p CreateFrameworkInput) (db.Framework, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.Framework{}, err
	}
	if p.Name == "" || p.Version == "" {
		return db.Framework{}, fmt.Errorf("%w: name and version required", ErrInvalidInput)
	}
	return s.querier.CreateFramework(ctx, db.CreateFrameworkParams{
		ID:             newUUID(),
		OrganizationID: orgID,
		Name:           p.Name,
		Version:        p.Version,
	})
}

func (s *frameworkService) GetFramework(ctx context.Context, id string) (db.Framework, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.Framework{}, err
	}
	fID, err := parseUUID(id)
	if err != nil {
		return db.Framework{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	return s.querier.GetFramework(ctx, db.GetFrameworkParams{ID: fID, OrganizationID: orgID})
}

func (s *frameworkService) ListFrameworks(ctx context.Context) ([]db.Framework, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return nil, err
	}
	return s.querier.ListFrameworks(ctx, orgID)
}

func (s *frameworkService) UpdateFramework(ctx context.Context, id string, p UpdateFrameworkInput) (db.Framework, error) {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return db.Framework{}, err
	}
	fID, err := parseUUID(id)
	if err != nil {
		return db.Framework{}, fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	return s.querier.UpdateFramework(ctx, db.UpdateFrameworkParams{
		ID:             fID,
		OrganizationID: orgID,
		Name:           p.Name,
		Version:        p.Version,
		Description:    pgtype.Text{String: p.Description, Valid: p.Description != ""},
	})
}

func (s *frameworkService) DeleteFramework(ctx context.Context, id string) error {
	orgID, err := mustGetOrgID(ctx)
	if err != nil {
		return err
	}
	fID, err := parseUUID(id)
	if err != nil {
		return fmt.Errorf("%w: invalid id", ErrInvalidInput)
	}
	return s.querier.DeleteFramework(ctx, db.DeleteFrameworkParams{ID: fID, OrganizationID: orgID})
}

func (s *frameworkService) CreateQuestion(ctx context.Context, p CreateQuestionInput) (db.FrameworkQuestion, error) {
	fID, err := parseUUID(p.FrameworkID)
	if err != nil {
		return db.FrameworkQuestion{}, fmt.Errorf("%w: invalid framework_id", ErrInvalidInput)
	}
	qt := p.QuestionType
	if qt == "" {
		qt = "text"
	}
	return s.querier.CreateFrameworkQuestion(ctx, db.CreateFrameworkQuestionParams{
		ID:              newUUID(),
		FrameworkID:     fID,
		QuestionText:    p.QuestionText,
		QuestionType:    pgtype.Text{String: qt, Valid: true},
		Options:         p.Options,
		ImportBatchID:   pgtype.UUID{Valid: false},
		ImportRowNumber: pgtype.Int4{Valid: false},
		ImportSource:    pgtype.Text{Valid: false},
	})
}

func (s *frameworkService) ListQuestions(ctx context.Context, frameworkID string) ([]db.FrameworkQuestion, error) {
	fID, err := parseUUID(frameworkID)
	if err != nil {
		return nil, fmt.Errorf("%w: invalid framework_id", ErrInvalidInput)
	}
	return s.querier.ListFrameworkQuestions(ctx, fID)
}

func (s *frameworkService) ImportQuestionsFromCSV(ctx context.Context, frameworkID string, rows []CSVQuestionRow) (int, error) {
	fID, err := parseUUID(frameworkID)
	if err != nil {
		return 0, fmt.Errorf("%w: invalid framework_id", ErrInvalidInput)
	}

	// Generate a single batch ID for this import
	batchID := newUUID()

	// Begin transaction
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return 0, fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := db.New(tx)
	importedCount := 0

	for i, row := range rows {
		// Validate required fields
		if row.QuestionText == "" {
			return 0, fmt.Errorf("%w: row %d missing question_text", ErrInvalidInput, i+1)
		}

		// Default question type
		qt := row.QuestionType
		if qt == "" {
			qt = "text"
		}

		// Validate question type
		if qt != "text" && qt != "boolean" && qt != "multiple_choice" {
			return 0, fmt.Errorf("%w: row %d invalid question_type '%s' (must be text, boolean, or multiple_choice)", ErrInvalidInput, i+1, qt)
		}

		// Parse options (pipe-separated values like "Yes|No|N/A")
		var optionsJSON []byte
		if row.Options != "" {
			// Split by pipe and create JSON array
			parts := strings.Split(row.Options, "|")
			optionsJSON, err = json.Marshal(parts)
			if err != nil {
				return 0, fmt.Errorf("row %d: failed to encode options: %w", i+1, err)
			}
		}

		// Insert question
		_, err = qtx.CreateFrameworkQuestion(ctx, db.CreateFrameworkQuestionParams{
			ID:              newUUID(),
			FrameworkID:     fID,
			QuestionText:    row.QuestionText,
			QuestionType:    pgtype.Text{String: qt, Valid: true},
			Options:         optionsJSON,
			ImportBatchID:   pgtype.UUID{Bytes: batchID.Bytes, Valid: true},
			ImportRowNumber: pgtype.Int4{Int32: int32(i + 1), Valid: true},
			ImportSource:    pgtype.Text{String: "csv", Valid: true},
		})
		if err != nil {
			return 0, fmt.Errorf("row %d: insert failed: %w", i+1, err)
		}
		importedCount++
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		return 0, fmt.Errorf("commit transaction: %w", err)
	}

	return importedCount, nil
}
