package handler

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"go.uber.org/zap"

	"github.com/arc-self/apps/trm-service/internal/service"
)

type createAuditCycleRequest struct {
	Name      string     `json:"name"`
	Status    string     `json:"status"`
	StartDate *time.Time `json:"start_date"`
	EndDate   *time.Time `json:"end_date"`
}

func createAuditCycleHandler(svc service.AuditCycleService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req createAuditCycleRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, errResp("invalid request body"))
		}
		ac, err := svc.CreateAuditCycle(c.Request().Context(), service.CreateAuditCycleInput{
			Name:      req.Name,
			Status:    req.Status,
			StartDate: req.StartDate,
			EndDate:   req.EndDate,
		})
		if err != nil {
			logger.Error("CreateAuditCycle failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.JSON(http.StatusCreated, ac)
	}
}

func listAuditCyclesHandler(svc service.AuditCycleService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		items, err := svc.ListAuditCycles(c.Request().Context())
		if err != nil {
			logger.Error("ListAuditCycles failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, items)
	}
}

func getAuditCycleHandler(svc service.AuditCycleService, _ *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		ac, err := svc.GetAuditCycle(c.Request().Context(), c.Param("id"))
		if err != nil {
			return c.JSON(http.StatusNotFound, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, ac)
	}
}

func updateAuditCycleHandler(svc service.AuditCycleService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req createAuditCycleRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, errResp("invalid request body"))
		}
		ac, err := svc.UpdateAuditCycle(c.Request().Context(), c.Param("id"), service.CreateAuditCycleInput{
			Name:      req.Name,
			Status:    req.Status,
			StartDate: req.StartDate,
			EndDate:   req.EndDate,
		})
		if err != nil {
			logger.Error("UpdateAuditCycle failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, ac)
	}
}

func deleteAuditCycleHandler(svc service.AuditCycleService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		if err := svc.DeleteAuditCycle(c.Request().Context(), c.Param("id")); err != nil {
			logger.Error("DeleteAuditCycle failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.NoContent(http.StatusNoContent)
	}
}
