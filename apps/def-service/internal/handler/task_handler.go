package handler

import (
	"net/http"

	"github.com/arc-self/apps/def-service/internal/service"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
)

type TaskHandler struct {
	svc service.TaskService
}

func NewTaskHandler(svc service.TaskService) *TaskHandler {
	return &TaskHandler{svc: svc}
}

func (h *TaskHandler) Register(e *echo.Echo) {
	g := e.Group("/api/v1/tasks")
	g.GET("/:id", h.GetTask)
	g.GET("", h.ListTasks)
	g.POST("", h.CreateTask)
	g.PUT("/:id", h.UpdateTask)
	g.DELETE("/:id", h.DeleteTask)
}

type createTaskRequest struct {
	Title    string `json:"title" validate:"required"`
	Body     string `json:"body"`
	Priority string `json:"priority"`
	Status   string `json:"status"`
}

type listTasksRequest struct {
	Limit  int32 `query:"limit"`
	Offset int32 `query:"offset"`
}

func (h *TaskHandler) GetTask(c echo.Context) error {
	tenantID, err := extractTenantID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid tenant_id"})
	}
	taskID, err := parseUUID(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid task id"})
	}
	task, err := h.svc.GetTask(c.Request().Context(), tenantID, taskID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "task not found"})
	}
	return c.JSON(http.StatusOK, task)
}

func (h *TaskHandler) ListTasks(c echo.Context) error {
	tenantID, err := extractTenantID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid tenant_id"})
	}
	var req listTasksRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid query parameters"})
	}
	tasks, err := h.svc.ListTasks(c.Request().Context(), tenantID, req.Limit, req.Offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to list tasks"})
	}
	return c.JSON(http.StatusOK, tasks)
}

func (h *TaskHandler) CreateTask(c echo.Context) error {
	tenantID, err := extractTenantID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid tenant_id"})
	}
	var req createTaskRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}
	task, err := h.svc.CreateTask(c.Request().Context(), service.CreateTaskInput{
		TenantID: tenantID,
		Title:    req.Title,
		Body:     req.Body,
		Priority: req.Priority,
		Status:   req.Status,
	})
	if err != nil {
		return c.JSON(http.StatusUnprocessableEntity, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusCreated, task)
}

func (h *TaskHandler) UpdateTask(c echo.Context) error {
	tenantID, err := extractTenantID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid tenant_id"})
	}
	taskID, err := parseUUID(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid task id"})
	}
	var req createTaskRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}
	task, err := h.svc.UpdateTask(c.Request().Context(), service.UpdateTaskInput{
		ID:       taskID,
		TenantID: tenantID,
		Title:    req.Title,
		Body:     req.Body,
		Priority: req.Priority,
		Status:   req.Status,
	})
	if err != nil {
		return c.JSON(http.StatusUnprocessableEntity, map[string]string{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, task)
}

func (h *TaskHandler) DeleteTask(c echo.Context) error {
	tenantID, err := extractTenantID(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid tenant_id"})
	}
	taskID, err := parseUUID(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid task id"})
	}
	if err := h.svc.DeleteTask(c.Request().Context(), tenantID, taskID); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to delete task"})
	}
	return c.NoContent(http.StatusNoContent)
}

func extractTenantID(c echo.Context) (pgtype.UUID, error) {
	return parseUUID(c.Request().Header.Get("X-Tenant-ID"))
}

func parseUUID(s string) (pgtype.UUID, error) {
	var u pgtype.UUID
	err := u.Scan(s)
	return u, err
}
