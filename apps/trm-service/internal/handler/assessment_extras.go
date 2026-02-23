package handler

import (
	"encoding/json"
	"net/http"

	"github.com/labstack/echo/v4"
	"go.uber.org/zap"

	"github.com/arc-self/apps/trm-service/internal/service"
)

type updateAssessmentCycleRequest struct {
	AuditCycleID string `json:"audit_cycle_id"`
}

func updateAssessmentCycleHandler(svc service.AssessmentService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req updateAssessmentCycleRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, errResp("invalid request body"))
		}
		a, err := svc.UpdateAssessmentCycle(c.Request().Context(), c.Param("id"), req.AuditCycleID)
		if err != nil {
			logger.Error("UpdateAssessmentCycle failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, a)
	}
}

type upsertAnswerRequest struct {
	QuestionID    string          `json:"question_id"`
	AnswerText    string          `json:"answer_text"`
	AnswerOptions json.RawMessage `json:"answer_options"`
}

func upsertAssessmentAnswerHandler(svc service.AssessmentService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req upsertAnswerRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, errResp("invalid request body"))
		}
		ans, err := svc.UpsertAnswer(c.Request().Context(), service.UpsertAnswerInput{
			AssessmentID:  c.Param("id"),
			QuestionID:    req.QuestionID,
			AnswerText:    req.AnswerText,
			AnswerOptions: req.AnswerOptions,
		})
		if err != nil {
			logger.Error("UpsertAnswer failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, ans)
	}
}

func listAssessmentAnswersHandler(svc service.AssessmentService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		items, err := svc.ListAnswers(c.Request().Context(), c.Param("id"))
		if err != nil {
			logger.Error("ListAnswers failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, items)
	}
}
