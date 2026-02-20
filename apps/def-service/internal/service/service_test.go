package service_test

import (
	"context"
	"errors"
	"testing"

	db "github.com/arc-self/apps/def-service/internal/repository/db"
	mockdb "github.com/arc-self/apps/def-service/internal/repository/mock"
	"github.com/arc-self/apps/def-service/internal/service"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/mock/gomock"
)

func newTestUUID(val byte) pgtype.UUID {
	var id [16]byte
	id[0] = val
	return pgtype.UUID{Bytes: id, Valid: true}
}

func TestGetTask(t *testing.T) {
	tenantID := newTestUUID(1)
	taskID := newTestUUID(2)

	tests := []struct {
		name     string
		setup    func(q *mockdb.MockQuerier)
		wantErr  bool
		wantName string
	}{
		{
			name: "success",
			setup: func(q *mockdb.MockQuerier) {
				q.EXPECT().GetTask(gomock.Any(), db.GetTaskParams{
					ID:       taskID,
					TenantID: tenantID,
				}).Return(db.Task{
					ID:       taskID,
					TenantID: tenantID,
					Title:    "Test Task",
					Status:   "open",
				}, nil)
			},
			wantErr:  false,
			wantName: "Test Task",
		},
		{
			name: "not found",
			setup: func(q *mockdb.MockQuerier) {
				q.EXPECT().GetTask(gomock.Any(), db.GetTaskParams{
					ID:       taskID,
					TenantID: tenantID,
				}).Return(db.Task{}, errors.New("no rows"))
			},
			wantErr: true,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			mockQuerier := mockdb.NewMockQuerier(ctrl)
			tc.setup(mockQuerier)

			svc := service.NewTaskService(mockQuerier)
			task, err := svc.GetTask(context.Background(), tenantID, taskID)

			if tc.wantErr {
				require.Error(t, err)
				assert.ErrorIs(t, err, service.ErrTaskNotFound)
			} else {
				require.NoError(t, err)
				assert.Equal(t, tc.wantName, task.Title)
			}
		})
	}
}

func TestCreateTask(t *testing.T) {
	tenantID := newTestUUID(1)

	tests := []struct {
		name    string
		input   service.CreateTaskInput
		setup   func(q *mockdb.MockQuerier)
		wantErr bool
		errType error
	}{
		{
			name: "success with explicit values",
			input: service.CreateTaskInput{
				TenantID: tenantID,
				Title:    "New Task",
				Body:     "Description",
				Priority: "high",
				Status:   "in_progress",
			},
			setup: func(q *mockdb.MockQuerier) {
				q.EXPECT().CreateTask(gomock.Any(), db.CreateTaskParams{
					TenantID: tenantID,
					Title:    "New Task",
					Body:     pgtype.Text{String: "Description", Valid: true},
					Priority: "high",
					Status:   "in_progress",
				}).Return(db.Task{
					TenantID: tenantID,
					Title:    "New Task",
					Priority: "high",
					Status:   "in_progress",
				}, nil)
			},
			wantErr: false,
		},
		{
			name: "success with defaults",
			input: service.CreateTaskInput{
				TenantID: tenantID,
				Title:    "Default Task",
			},
			setup: func(q *mockdb.MockQuerier) {
				q.EXPECT().CreateTask(gomock.Any(), db.CreateTaskParams{
					TenantID: tenantID,
					Title:    "Default Task",
					Body:     pgtype.Text{String: "", Valid: false},
					Priority: "medium",
					Status:   "open",
				}).Return(db.Task{
					TenantID: tenantID,
					Title:    "Default Task",
					Priority: "medium",
					Status:   "open",
				}, nil)
			},
			wantErr: false,
		},
		{
			name: "empty title returns validation error",
			input: service.CreateTaskInput{
				TenantID: tenantID,
				Title:    "",
			},
			setup:   func(q *mockdb.MockQuerier) {},
			wantErr: true,
			errType: service.ErrInvalidInput,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			mockQuerier := mockdb.NewMockQuerier(ctrl)
			tc.setup(mockQuerier)

			svc := service.NewTaskService(mockQuerier)
			task, err := svc.CreateTask(context.Background(), tc.input)

			if tc.wantErr {
				require.Error(t, err)
				if tc.errType != nil {
					assert.ErrorIs(t, err, tc.errType)
				}
			} else {
				require.NoError(t, err)
				assert.Equal(t, tc.input.Title, task.Title)
			}
		})
	}
}

func TestListTasks(t *testing.T) {
	tenantID := newTestUUID(1)

	tests := []struct {
		name      string
		limit     int32
		offset    int32
		setup     func(q *mockdb.MockQuerier)
		wantCount int
		wantErr   bool
	}{
		{
			name:  "defaults limit when zero",
			limit: 0,
			setup: func(q *mockdb.MockQuerier) {
				q.EXPECT().ListTasksByTenant(gomock.Any(), db.ListTasksByTenantParams{
					TenantID: tenantID, Limit: 20, Offset: 0,
				}).Return([]db.Task{{Title: "A"}, {Title: "B"}}, nil)
			},
			wantCount: 2,
		},
		{
			name:  "caps limit at 100",
			limit: 999,
			setup: func(q *mockdb.MockQuerier) {
				q.EXPECT().ListTasksByTenant(gomock.Any(), db.ListTasksByTenantParams{
					TenantID: tenantID, Limit: 100, Offset: 0,
				}).Return(nil, nil)
			},
			wantCount: 0,
		},
		{
			name:  "repository error",
			limit: 10,
			setup: func(q *mockdb.MockQuerier) {
				q.EXPECT().ListTasksByTenant(gomock.Any(), gomock.Any()).Return(nil, errors.New("db error"))
			},
			wantErr: true,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			defer ctrl.Finish()

			mockQuerier := mockdb.NewMockQuerier(ctrl)
			tc.setup(mockQuerier)

			svc := service.NewTaskService(mockQuerier)
			tasks, err := svc.ListTasks(context.Background(), tenantID, tc.limit, tc.offset)

			if tc.wantErr {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
				assert.Len(t, tasks, tc.wantCount)
			}
		})
	}
}
