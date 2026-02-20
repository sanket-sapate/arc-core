package consumer

import (
	"context"
	"encoding/json"
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"go.uber.org/mock/gomock"
	"go.uber.org/zap/zaptest"

	"github.com/arc-self/apps/audit-service/internal/repository/mock"
)

// buildEventJSON serialises an OutboxEvent into the wire format that the
// CDC worker places on the NATS subject.  Using json.Marshal here exercises
// the same encoding path the CDC worker uses.
func buildEventJSON(t *testing.T, ev OutboxEvent) []byte {
	t.Helper()
	b, err := json.Marshal(ev)
	if err != nil {
		t.Fatalf("buildEventJSON: %v", err)
	}
	return b
}

func TestAuditConsumer_ProcessEvent(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockQuerier := mock.NewMockQuerier(ctrl)
	logger := zaptest.NewLogger(t)
	consumer := NewAuditConsumer(nil, mockQuerier, logger) // NATS client nil — not needed in unit tests

	// Valid event: OutboxEvent now uses plain string UUIDs and json.RawMessage
	// for Payload, matching the NATS wire format published by the CDC worker.
	validEvent := OutboxEvent{
		ID:            "00000000-0000-0000-0000-000000000001",
		AggregateType: "item",
		AggregateID:   "00000000-0000-0000-0000-000000000002",
		ActorID:       "00000000-0000-0000-0000-000000000003",
		Type:          "ItemCreated",
		Payload:       json.RawMessage(`{"status":"success"}`),
	}
	validJSON := buildEventJSON(t, validEvent)

	tests := []struct {
		name          string
		payload       []byte
		mockSetup     func()
		expectedError string
	}{
		{
			name:          "Malformed JSON",
			payload:       []byte(`{invalid-json`),
			mockSetup:     func() {},
			expectedError: "malformed payload",
		},
		{
			name:    "Invalid UUID — poison pill terminated",
			payload: buildEventJSON(t, OutboxEvent{
				ID:            "not-a-uuid",
				AggregateType: "item",
				AggregateID:   "00000000-0000-0000-0000-000000000002",
				ActorID:       "00000000-0000-0000-0000-000000000003",
				Type:          "ItemCreated",
				Payload:       json.RawMessage(`{}`),
			}),
			mockSetup:     func() {}, // DB never called — terminated as poison pill
			expectedError: "malformed payload",
		},
		{
			name:    "Database Insertion Error",
			payload: validJSON,
			mockSetup: func() {
				mockQuerier.EXPECT().
					InsertAuditLog(gomock.Any(), gomock.Any()).
					Return(errors.New("connection timeout"))
			},
			expectedError: "db error: connection timeout",
		},
		{
			name:    "Success",
			payload: validJSON,
			mockSetup: func() {
				mockQuerier.EXPECT().
					InsertAuditLog(gomock.Any(), gomock.Any()).
					Return(nil)
			},
			expectedError: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.mockSetup()
			err := consumer.processEvent(context.Background(), tt.payload)
			if tt.expectedError != "" {
				assert.EqualError(t, err, tt.expectedError)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
