package handler

import (
	"net/http"

	"github.com/arc-self/apps/abc-service/internal/service"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
)

type ItemHandler struct {
	svc service.ItemService
}

func NewItemHandler(svc service.ItemService) *ItemHandler {
	return &ItemHandler{svc: svc}
}

func (h *ItemHandler) Register(e *echo.Echo) {
	items := e.Group("/api/v1/items")
	items.GET("/:id", h.GetItem)
	items.GET("", h.ListItems)
	items.POST("", h.CreateItem)
	items.PATCH("/:id/status", h.TransitionStatus)
	items.DELETE("/:id", h.SoftDeleteItem)

	categories := e.Group("/api/v1/categories")
	categories.POST("", h.CreateCategory)
	categories.GET("", h.ListCategories)
}

// --- Request DTOs ---

type createItemRequest struct {
	CategoryID  string `json:"category_id"`
	Name        string `json:"name" validate:"required"`
	Description string `json:"description"`
}

type transitionStatusRequest struct {
	Status string `json:"status" validate:"required"`
}

type createCategoryRequest struct {
	Name string `json:"name" validate:"required"`
}

// --- Item Handlers ---

// GetItem godoc
// @Summary      Retrieve an item
// @Description  Fetches a specific item by UUID, isolated by organization boundary.
// @ID           get-item
// @Tags         items
// @Produce      json
// @Param        X-Internal-Org-Id  header  string  true  "Organization UUID"
// @Param        id                 path    string  true  "Item UUID"
// @Success      200  {object}  object
// @Failure      400  {object}  map[string]string  "Validation Error"
// @Failure      404  {object}  map[string]string  "Not Found"
// @Router       /api/v1/items/{id} [get]
func (h *ItemHandler) GetItem(c echo.Context) error {
	orgID, err := extractOrgID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid organization_id"})
	}

	itemID, err := parseUUID(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid item id"})
	}

	item, err := h.svc.GetItem(c.Request().Context(), orgID, itemID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "item not found"})
	}

	return c.JSON(http.StatusOK, item)
}

// ListItems godoc
// @Summary      List all items for an organization
// @Description  Returns all non-deleted items scoped to the caller's organization.
// @ID           list-items
// @Tags         items
// @Produce      json
// @Param        X-Internal-Org-Id  header  string  true  "Organization UUID"
// @Success      200  {array}   object
// @Failure      400  {object}  map[string]string  "Validation Error"
// @Failure      500  {object}  map[string]string  "Internal Error"
// @Router       /api/v1/items [get]
func (h *ItemHandler) ListItems(c echo.Context) error {
	orgID, err := extractOrgID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid organization_id"})
	}

	items, err := h.svc.ListItems(c.Request().Context(), orgID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to list items"})
	}

	return c.JSON(http.StatusOK, items)
}

// CreateItem godoc
// @Summary      Create a new item
// @Description  Instantiates a new item within the tenant organization in DRAFT status.
// @ID           create-item
// @Tags         items
// @Accept       json
// @Produce      json
// @Param        X-Internal-Org-Id  header  string             true  "Organization UUID"
// @Param        request            body    createItemRequest  true  "Item Payload"
// @Success      201  {object}  object
// @Failure      400  {object}  map[string]string  "Validation Error"
// @Failure      422  {object}  map[string]string  "Business Rule Violation"
// @Failure      500  {object}  map[string]string  "Internal Error"
// @Router       /api/v1/items [post]
func (h *ItemHandler) CreateItem(c echo.Context) error {
	orgID, err := extractOrgID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid organization_id"})
	}

	var req createItemRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	var categoryID pgtype.UUID
	if req.CategoryID != "" {
		categoryID, err = parseUUID(req.CategoryID)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid category_id"})
		}
	}

	item, err := h.svc.CreateItem(c.Request().Context(), service.CreateItemInput{
		OrganizationID: orgID,
		CategoryID:     categoryID,
		Name:           req.Name,
		Description:    req.Description,
	})
	if err != nil {
		return c.JSON(http.StatusUnprocessableEntity, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusCreated, item)
}

// TransitionStatus godoc
// @Summary      Transition item status
// @Description  Advances the item through the lifecycle state machine (DRAFT → AVAILABLE → ALLOCATED → MAINTENANCE → RETIRED). Invalid transitions are rejected.
// @ID           transition-item-status
// @Tags         items
// @Accept       json
// @Produce      json
// @Param        X-Internal-Org-Id  header  string                    true  "Organization UUID"
// @Param        id                 path    string                    true  "Item UUID"
// @Param        request            body    transitionStatusRequest   true  "Target Status"
// @Success      200  {object}  object
// @Failure      400  {object}  map[string]string  "Validation Error"
// @Failure      422  {object}  map[string]string  "Invalid State Transition"
// @Router       /api/v1/items/{id}/status [patch]
func (h *ItemHandler) TransitionStatus(c echo.Context) error {
	orgID, err := extractOrgID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid organization_id"})
	}

	itemID, err := parseUUID(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid item id"})
	}

	var req transitionStatusRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	item, err := h.svc.TransitionItemStatus(c.Request().Context(), itemID, orgID, req.Status)
	if err != nil {
		return c.JSON(http.StatusUnprocessableEntity, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, item)
}

// SoftDeleteItem godoc
// @Summary      Soft-delete an item
// @Description  Marks an item as deleted without physical removal from storage. The item will no longer appear in list queries.
// @ID           soft-delete-item
// @Tags         items
// @Produce      json
// @Param        X-Internal-Org-Id  header  string  true  "Organization UUID"
// @Param        id                 path    string  true  "Item UUID"
// @Success      204  "No Content"
// @Failure      400  {object}  map[string]string  "Validation Error"
// @Failure      500  {object}  map[string]string  "Internal Error"
// @Router       /api/v1/items/{id} [delete]
func (h *ItemHandler) SoftDeleteItem(c echo.Context) error {
	orgID, err := extractOrgID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid organization_id"})
	}

	itemID, err := parseUUID(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid item id"})
	}

	if err := h.svc.SoftDeleteItem(c.Request().Context(), orgID, itemID); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to delete item"})
	}

	return c.NoContent(http.StatusNoContent)
}

// --- Category Handlers ---

// CreateCategory godoc
// @Summary      Create a new category
// @Description  Creates a named category within the organization for item classification.
// @ID           create-category
// @Tags         categories
// @Accept       json
// @Produce      json
// @Param        X-Internal-Org-Id  header  string                  true  "Organization UUID"
// @Param        request            body    createCategoryRequest   true  "Category Payload"
// @Success      201  {object}  object
// @Failure      400  {object}  map[string]string  "Validation Error"
// @Failure      422  {object}  map[string]string  "Business Rule Violation"
// @Router       /api/v1/categories [post]
func (h *ItemHandler) CreateCategory(c echo.Context) error {
	orgID, err := extractOrgID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid organization_id"})
	}

	var req createCategoryRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	cat, err := h.svc.CreateCategory(c.Request().Context(), service.CreateCategoryInput{
		OrganizationID: orgID,
		Name:           req.Name,
	})
	if err != nil {
		return c.JSON(http.StatusUnprocessableEntity, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusCreated, cat)
}

// ListCategories godoc
// @Summary      List all categories for an organization
// @Description  Returns all categories scoped to the caller's organization.
// @ID           list-categories
// @Tags         categories
// @Produce      json
// @Param        X-Internal-Org-Id  header  string  true  "Organization UUID"
// @Success      200  {array}   object
// @Failure      400  {object}  map[string]string  "Validation Error"
// @Failure      500  {object}  map[string]string  "Internal Error"
// @Router       /api/v1/categories [get]
func (h *ItemHandler) ListCategories(c echo.Context) error {
	orgID, err := extractOrgID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid organization_id"})
	}

	categories, err := h.svc.ListCategories(c.Request().Context(), orgID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to list categories"})
	}

	return c.JSON(http.StatusOK, categories)
}

// --- Helpers ---

// extractOrgID pulls the organization UUID from the X-Internal-Org-Id header
// (injected by the APISIX Go runner after JWT validation).
func extractOrgID(c echo.Context) (pgtype.UUID, error) {
	return parseUUID(c.Request().Header.Get("X-Internal-Org-Id"))
}

// parseUUID converts a string to pgtype.UUID.
func parseUUID(s string) (pgtype.UUID, error) {
	var u pgtype.UUID
	err := u.Scan(s)
	return u, err
}
