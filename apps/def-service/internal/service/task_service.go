package service

import (
	"context"
	"errors"
	"fmt"

	db "github.com/arc-self/apps/def-service/internal/repository/db"
	"github.com/jackc/pgx/v5/pgtype"
)

var (
	ErrTaskNotFound = errors.New("task not found")
	ErrInvalidInput = errors.New("invalid input")
)

type TaskService interface {
	GetTask(ctx context.Context, tenantID, taskID pgtype.UUID) (db.Task, error)
	ListTasks(ctx context.Context, tenantID pgtype.UUID, limit, offset int32) ([]db.Task, error)
	CreateTask(ctx context.Context, params CreateTaskInput) (db.Task, error)
	UpdateTask(ctx context.Context, params UpdateTaskInput) (db.Task, error)
	DeleteTask(ctx context.Context, tenantID, taskID pgtype.UUID) error
}

type CreateTaskInput struct {
	TenantID pgtype.UUID
	Title    string
	Body     string
	Priority string
	Status   string
}

type UpdateTaskInput struct {
	ID       pgtype.UUID
	TenantID pgtype.UUID
	Title    string
	Body     string
	Priority string
	Status   string
}

type taskService struct {
	querier db.Querier
}

func NewTaskService(q db.Querier) TaskService {
	return &taskService{querier: q}
}

func (s *taskService) GetTask(ctx context.Context, tenantID, taskID pgtype.UUID) (db.Task, error) {
	task, err := s.querier.GetTask(ctx, db.GetTaskParams{
		ID:       taskID,
		TenantID: tenantID,
	})
	if err != nil {
		return db.Task{}, fmt.Errorf("%w: %v", ErrTaskNotFound, err)
	}
	return task, nil
}

func (s *taskService) ListTasks(ctx context.Context, tenantID pgtype.UUID, limit, offset int32) ([]db.Task, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	return s.querier.ListTasksByTenant(ctx, db.ListTasksByTenantParams{
		TenantID: tenantID,
		Limit:    limit,
		Offset:   offset,
	})
}

func (s *taskService) CreateTask(ctx context.Context, params CreateTaskInput) (db.Task, error) {
	if params.Title == "" {
		return db.Task{}, fmt.Errorf("%w: title is required", ErrInvalidInput)
	}
	if params.Priority == "" {
		params.Priority = "medium"
	}
	if params.Status == "" {
		params.Status = "open"
	}

	return s.querier.CreateTask(ctx, db.CreateTaskParams{
		TenantID: params.TenantID,
		Title:    params.Title,
		Body:     pgtype.Text{String: params.Body, Valid: params.Body != ""},
		Priority: params.Priority,
		Status:   params.Status,
	})
}

func (s *taskService) UpdateTask(ctx context.Context, params UpdateTaskInput) (db.Task, error) {
	if params.Title == "" {
		return db.Task{}, fmt.Errorf("%w: title is required", ErrInvalidInput)
	}

	task, err := s.querier.UpdateTask(ctx, db.UpdateTaskParams{
		ID:       params.ID,
		TenantID: params.TenantID,
		Title:    params.Title,
		Body:     pgtype.Text{String: params.Body, Valid: params.Body != ""},
		Priority: params.Priority,
		Status:   params.Status,
	})
	if err != nil {
		return db.Task{}, fmt.Errorf("%w: %v", ErrTaskNotFound, err)
	}
	return task, nil
}

func (s *taskService) DeleteTask(ctx context.Context, tenantID, taskID pgtype.UUID) error {
	return s.querier.DeleteTask(ctx, db.DeleteTaskParams{
		ID:       taskID,
		TenantID: tenantID,
	})
}
