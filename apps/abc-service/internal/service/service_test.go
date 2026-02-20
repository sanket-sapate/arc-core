package service_test

import (
	"testing"

	"github.com/arc-self/apps/abc-service/internal/service"
	"github.com/stretchr/testify/assert"
)

func TestIsValidTransition(t *testing.T) {
	tests := []struct {
		name    string
		current string
		target  string
		valid   bool
	}{
		// DRAFT transitions
		{"DRAFT → AVAILABLE", "DRAFT", "AVAILABLE", true},
		{"DRAFT → RETIRED", "DRAFT", "RETIRED", true},
		{"DRAFT → ALLOCATED (blocked)", "DRAFT", "ALLOCATED", false},
		{"DRAFT → MAINTENANCE (blocked)", "DRAFT", "MAINTENANCE", false},

		// AVAILABLE transitions
		{"AVAILABLE → ALLOCATED", "AVAILABLE", "ALLOCATED", true},
		{"AVAILABLE → MAINTENANCE", "AVAILABLE", "MAINTENANCE", true},
		{"AVAILABLE → RETIRED", "AVAILABLE", "RETIRED", true},
		{"AVAILABLE → DRAFT (blocked)", "AVAILABLE", "DRAFT", false},

		// ALLOCATED transitions
		{"ALLOCATED → AVAILABLE", "ALLOCATED", "AVAILABLE", true},
		{"ALLOCATED → RETIRED", "ALLOCATED", "RETIRED", true},
		{"ALLOCATED → MAINTENANCE (blocked)", "ALLOCATED", "MAINTENANCE", false},

		// MAINTENANCE transitions
		{"MAINTENANCE → AVAILABLE", "MAINTENANCE", "AVAILABLE", true},
		{"MAINTENANCE → RETIRED", "MAINTENANCE", "RETIRED", true},
		{"MAINTENANCE → ALLOCATED (blocked)", "MAINTENANCE", "ALLOCATED", false},

		// RETIRED is terminal
		{"RETIRED → AVAILABLE (blocked)", "RETIRED", "AVAILABLE", false},
		{"RETIRED → DRAFT (blocked)", "RETIRED", "DRAFT", false},

		// Unknown states
		{"unknown current state", "BANANA", "AVAILABLE", false},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			result := service.IsValidTransition(tc.current, tc.target)
			assert.Equal(t, tc.valid, result)
		})
	}
}

func TestGetItem_NotFound(t *testing.T) {
	// Non-transactional service methods are tested via handler tests
	// which mock the full ItemService interface.
	// Transactional methods (CreateItem, TransitionItemStatus) require
	// integration tests with a real pgxpool.Pool.
}
