package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.opentelemetry.io/otel/trace"

	db "github.com/arc-self/apps/abc-service/internal/repository/db"
	coreMw "github.com/arc-self/packages/go-core/middleware"
)

var (
	ErrItemNotFound      = errors.New("item not found")
	ErrInvalidInput      = errors.New("invalid input")
	ErrInvalidTransition = errors.New("invalid status transition")
)

// --- Status State Machine ---

var validTransitions = map[string][]string{
	"DRAFT":       {"AVAILABLE", "RETIRED"},
	"AVAILABLE":   {"ALLOCATED", "MAINTENANCE", "RETIRED"},
	"ALLOCATED":   {"AVAILABLE", "RETIRED"},
	"MAINTENANCE": {"AVAILABLE", "RETIRED"},
	"RETIRED":     {},
}

func IsValidTransition(current, target string) bool {
	allowed, exists := validTransitions[current]
	if !exists {
		return false
	}
	for _, a := range allowed {
		if a == target {
			return true
		}
	}
	return false
}

// --- Service Interface ---

type ItemService interface {
	GetItem(ctx context.Context, orgID, itemID pgtype.UUID) (db.Item, error)
	ListItems(ctx context.Context, orgID pgtype.UUID) ([]db.Item, error)
	CreateItem(ctx context.Context, params CreateItemInput) (db.Item, error)
	SoftDeleteItem(ctx context.Context, orgID, itemID pgtype.UUID) error
	TransitionItemStatus(ctx context.Context, itemID, orgID pgtype.UUID, newStatus string) (db.Item, error)
	CreateCategory(ctx context.Context, params CreateCategoryInput) (db.Category, error)
	ListCategories(ctx context.Context, orgID pgtype.UUID) ([]db.Category, error)
}

type CreateItemInput struct {
	OrganizationID pgtype.UUID
	CategoryID     pgtype.UUID
	Name           string
	Description    string
}

type CreateCategoryInput struct {
	OrganizationID pgtype.UUID
	Name           string
}

// --- Service Implementation ---

type itemService struct {
	pool    *pgxpool.Pool
	querier db.Querier
}

func NewItemService(pool *pgxpool.Pool, q db.Querier) ItemService {
	return &itemService{pool: pool, querier: q}
}

// --- Category Operations ---

func (s *itemService) CreateCategory(ctx context.Context, params CreateCategoryInput) (db.Category, error) {
	if params.Name == "" {
		return db.Category{}, fmt.Errorf("%w: category name is required", ErrInvalidInput)
	}

	catID, _ := uuid.NewV7()
	var catUUID pgtype.UUID
	catUUID.Scan(catID.String())

	return s.querier.CreateCategory(ctx, db.CreateCategoryParams{
		ID:             catUUID,
		OrganizationID: params.OrganizationID,
		Name:           params.Name,
	})
}

func (s *itemService) ListCategories(ctx context.Context, orgID pgtype.UUID) ([]db.Category, error) {
	return s.querier.ListCategories(ctx, orgID)
}

// --- Item Operations ---

func (s *itemService) GetItem(ctx context.Context, orgID, itemID pgtype.UUID) (db.Item, error) {
	item, err := s.querier.GetItem(ctx, db.GetItemParams{
		ID:             itemID,
		OrganizationID: orgID,
	})
	if err != nil {
		return db.Item{}, fmt.Errorf("%w: %v", ErrItemNotFound, err)
	}
	return item, nil
}

func (s *itemService) ListItems(ctx context.Context, orgID pgtype.UUID) ([]db.Item, error) {
	return s.querier.ListItems(ctx, orgID)
}

func (s *itemService) CreateItem(ctx context.Context, params CreateItemInput) (db.Item, error) {
	if params.Name == "" {
		return db.Item{}, fmt.Errorf("%w: name is required", ErrInvalidInput)
	}

	// Extract actor identity from context
	userIDStr, ok := coreMw.GetUserID(ctx)
	if !ok || userIDStr == "" {
		return db.Item{}, fmt.Errorf("%w: missing user identity in context", ErrInvalidInput)
	}
	actorUUID, err := uuid.Parse(userIDStr)
	if err != nil {
		return db.Item{}, fmt.Errorf("%w: invalid user_id: %v", ErrInvalidInput, err)
	}
	var actorID pgtype.UUID
	actorID.Scan(actorUUID.String())

	// Generate item ID up-front for the outbox event
	itemID, _ := uuid.NewV7()
	var itemUUID pgtype.UUID
	itemUUID.Scan(itemID.String())

	// Begin transaction
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return db.Item{}, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := db.New(tx)

	// Create the item (always starts in DRAFT)
	item, err := qtx.CreateItem(ctx, db.CreateItemParams{
		ID:             itemUUID,
		OrganizationID: params.OrganizationID,
		CategoryID:     params.CategoryID,
		Name:           params.Name,
		Description:    pgtype.Text{String: params.Description, Valid: params.Description != ""},
	})
	if err != nil {
		return db.Item{}, fmt.Errorf("failed to create item: %w", err)
	}

	// Emit outbox event with actor identity and trace context
	payloadMap := map[string]interface{}{
		"name":        params.Name,
		"description": params.Description,
		"category_id": params.CategoryID,
	}
	injectTraceContext(ctx, payloadMap)
	payload, _ := json.Marshal(payloadMap)

	eventID, _ := uuid.NewV7()
	var eventUUID pgtype.UUID
	eventUUID.Scan(eventID.String())

	if err := qtx.InsertOutboxEvent(ctx, db.InsertOutboxEventParams{
		ID:            eventUUID,
		AggregateType: "item",
		AggregateID:   item.ID,
		ActorID:       actorID,
		Type:          "ItemCreated",
		Payload:       payload,
	}); err != nil {
		return db.Item{}, fmt.Errorf("failed to insert outbox event: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return db.Item{}, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return item, nil
}

func (s *itemService) SoftDeleteItem(ctx context.Context, orgID, itemID pgtype.UUID) error {
	return s.querier.SoftDeleteItem(ctx, db.SoftDeleteItemParams{
		ID:             itemID,
		OrganizationID: orgID,
	})
}

// TransitionItemStatus enforces the state machine and emits an outbox event,
// all within a single database transaction.
func (s *itemService) TransitionItemStatus(ctx context.Context, itemID, orgID pgtype.UUID, newStatus string) (db.Item, error) {
	// Extract actor identity from context
	userIDStr, ok := coreMw.GetUserID(ctx)
	if !ok || userIDStr == "" {
		return db.Item{}, fmt.Errorf("%w: missing user identity in context", ErrInvalidInput)
	}
	actorUUID, err := uuid.Parse(userIDStr)
	if err != nil {
		return db.Item{}, fmt.Errorf("%w: invalid user_id: %v", ErrInvalidInput, err)
	}
	var actorID pgtype.UUID
	actorID.Scan(actorUUID.String())

	// 1. Begin transaction
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return db.Item{}, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := db.New(tx)

	// 2. Fetch current state (within transaction for consistency)
	item, err := qtx.GetItem(ctx, db.GetItemParams{
		ID:             itemID,
		OrganizationID: orgID,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return db.Item{}, fmt.Errorf("%w", ErrItemNotFound)
		}
		return db.Item{}, fmt.Errorf("failed to fetch item: %w", err)
	}

	// 3. Evaluate transition via state machine
	if !IsValidTransition(item.Status, newStatus) {
		return db.Item{}, fmt.Errorf("%w: %s → %s", ErrInvalidTransition, item.Status, newStatus)
	}

	// 4. Execute update
	updatedItem, err := qtx.UpdateItemStatus(ctx, db.UpdateItemStatusParams{
		ID:             itemID,
		Status:         newStatus,
		OrganizationID: orgID,
	})
	if err != nil {
		return db.Item{}, fmt.Errorf("failed to update item status: %w", err)
	}

	// 5. Construct outbox event with trace context
	payloadMap := map[string]interface{}{
		"old_status": item.Status,
		"new_status": newStatus,
	}
	injectTraceContext(ctx, payloadMap)
	payload, _ := json.Marshal(payloadMap)

	eventID, _ := uuid.NewV7()
	var eventUUID pgtype.UUID
	eventUUID.Scan(eventID.String())

	if err := qtx.InsertOutboxEvent(ctx, db.InsertOutboxEventParams{
		ID:            eventUUID,
		AggregateType: "item",
		AggregateID:   itemID,
		ActorID:       actorID,
		Type:          "ItemStatusTransitioned",
		Payload:       payload,
	}); err != nil {
		return db.Item{}, fmt.Errorf("failed to insert outbox event: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return db.Item{}, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return updatedItem, nil
}

// injectTraceContext extracts the current span's trace and span IDs from
// the context and adds them to the payload map. This enables downstream
// consumers (audit-service) to reconstruct the span context and link
// the distributed trace across the async NATS boundary.
func injectTraceContext(ctx context.Context, payload map[string]interface{}) {
	spanCtx := trace.SpanContextFromContext(ctx)
	if spanCtx.IsValid() {
		payload["trace_id"] = spanCtx.TraceID().String()
		payload["span_id"] = spanCtx.SpanID().String()
	}
}
