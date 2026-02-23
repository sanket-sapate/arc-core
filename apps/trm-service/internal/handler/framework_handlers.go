package handler

import (
	"encoding/json"
	"net/http"

	"github.com/labstack/echo/v4"
	"go.uber.org/zap"

	"github.com/arc-self/apps/trm-service/internal/service"
)

type createFrameworkRequest struct {
	Name        string `json:"name"`
	Version     string `json:"version"`
	Description string `json:"description"`
}

func createFrameworkHandler(svc service.FrameworkService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req createFrameworkRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, errResp("invalid request body"))
		}
		f, err := svc.CreateFramework(c.Request().Context(), service.CreateFrameworkInput{
			Name:        req.Name,
			Version:     req.Version,
			Description: req.Description,
		})
		if err != nil {
			logger.Error("CreateFramework failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.JSON(http.StatusCreated, f)
	}
}

func listFrameworksHandler(svc service.FrameworkService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		items, err := svc.ListFrameworks(c.Request().Context())
		if err != nil {
			logger.Error("ListFrameworks failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, items)
	}
}

func getFrameworkHandler(svc service.FrameworkService, _ *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		f, err := svc.GetFramework(c.Request().Context(), c.Param("id"))
		if err != nil {
			return c.JSON(http.StatusNotFound, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, f)
	}
}

func updateFrameworkHandler(svc service.FrameworkService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req createFrameworkRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, errResp("invalid request body"))
		}
		f, err := svc.UpdateFramework(c.Request().Context(), c.Param("id"), service.UpdateFrameworkInput{
			Name:        req.Name,
			Version:     req.Version,
			Description: req.Description,
		})
		if err != nil {
			logger.Error("UpdateFramework failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, f)
	}
}

func deleteFrameworkHandler(svc service.FrameworkService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		if err := svc.DeleteFramework(c.Request().Context(), c.Param("id")); err != nil {
			logger.Error("DeleteFramework failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.NoContent(http.StatusNoContent)
	}
}

type createQuestionRequest struct {
	QuestionText string          `json:"question_text"`
	QuestionType string          `json:"question_type"`
	Options      json.RawMessage `json:"options"`
}



func createFrameworkQuestionHandler(svc service.FrameworkService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req createQuestionRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, errResp("invalid request body"))
		}
		q, err := svc.CreateQuestion(c.Request().Context(), service.CreateQuestionInput{
			FrameworkID:  c.Param("framework_id"),
			QuestionText: req.QuestionText,
			QuestionType: req.QuestionType,
			Options:      req.Options,
		})
		if err != nil {
			logger.Error("CreateQuestion failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.JSON(http.StatusCreated, q)
	}
}

func listFrameworkQuestionsHandler(svc service.FrameworkService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		items, err := svc.ListQuestions(c.Request().Context(), c.Param("framework_id"))
		if err != nil {
			logger.Error("ListQuestions failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, items)
	}
}
