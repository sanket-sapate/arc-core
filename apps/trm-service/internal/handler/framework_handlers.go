package handler

import (
	"encoding/csv"
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/labstack/echo/v4"
	"go.uber.org/zap"

	"github.com/arc-self/apps/trm-service/internal/service"
	coreMw "github.com/arc-self/packages/go-core/middleware"
)

type createFrameworkRequest struct {
	Name        string `json:"name"`
	Version     string `json:"version"`
	Description string `json:"description"`
}

func createFrameworkHandler(svc service.FrameworkService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		if !coreMw.HasPermission(c.Request().Context(), "frameworks.create") {
			return c.JSON(http.StatusForbidden, errResp("missing frameworks.create permission"))
		}
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
		if !coreMw.HasPermission(c.Request().Context(), "frameworks.read") {
			return c.JSON(http.StatusForbidden, errResp("missing frameworks.read permission"))
		}
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
		if !coreMw.HasPermission(c.Request().Context(), "frameworks.read") {
			return c.JSON(http.StatusForbidden, errResp("missing frameworks.read permission"))
		}
		f, err := svc.GetFramework(c.Request().Context(), c.Param("id"))
		if err != nil {
			return c.JSON(http.StatusNotFound, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, f)
	}
}

func updateFrameworkHandler(svc service.FrameworkService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		if !coreMw.HasPermission(c.Request().Context(), "frameworks.update") {
			return c.JSON(http.StatusForbidden, errResp("missing frameworks.update permission"))
		}
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
		if !coreMw.HasPermission(c.Request().Context(), "frameworks.delete") {
			return c.JSON(http.StatusForbidden, errResp("missing frameworks.delete permission"))
		}
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
		if !coreMw.HasPermission(c.Request().Context(), "frameworks.update") {
			return c.JSON(http.StatusForbidden, errResp("missing frameworks.update permission"))
		}
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
		if !coreMw.HasPermission(c.Request().Context(), "frameworks.read") {
			return c.JSON(http.StatusForbidden, errResp("missing frameworks.read permission"))
		}
		items, err := svc.ListQuestions(c.Request().Context(), c.Param("framework_id"))
		if err != nil {
			logger.Error("ListQuestions failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}
		return c.JSON(http.StatusOK, items)
	}
}

func importFrameworkQuestionsHandler(svc service.FrameworkService, logger *zap.Logger) echo.HandlerFunc {
	return func(c echo.Context) error {
		if !coreMw.HasPermission(c.Request().Context(), "frameworks.update") {
			return c.JSON(http.StatusForbidden, errResp("missing frameworks.update permission"))
		}
		frameworkID := c.Param("framework_id")
		if frameworkID == "" {
			return c.JSON(http.StatusBadRequest, errResp("framework_id is required"))
		}

		
		// Parse multipart form explicitly (max 32MB)
		err := c.Request().ParseMultipartForm(32 << 20) // 32MB
		if err != nil {
			logger.Error("Failed to parse multipart form", zap.Error(err))
			return c.JSON(http.StatusBadRequest, errResp("failed to parse multipart form: "+err.Error()))
		}

		// Parse multipart form — explicit check for missing file
		file, err := c.FormFile("file")
		if err != nil {
			logger.Error("Failed to get file from form", zap.Error(err))
			if err == http.ErrMissingFile {
				return c.JSON(http.StatusBadRequest, errResp("no file uploaded: include a CSV file in the 'file' field"))
			}
			return c.JSON(http.StatusBadRequest, errResp("file upload required: "+err.Error()))
		}

		
		// Open the uploaded file
		src, err := file.Open()
		if err != nil {
			return c.JSON(http.StatusInternalServerError, errResp("failed to open file"))
		}
		defer src.Close()

		// Parse CSV
		reader := csv.NewReader(src)
		reader.TrimLeadingSpace = true

		// Read header row
		headers, err := reader.Read()
		if err != nil {
			return c.JSON(http.StatusBadRequest, errResp("failed to read CSV headers"))
		}

		// Map headers to indices
		headerMap := make(map[string]int)
		for i, h := range headers {
			headerMap[strings.ToLower(strings.TrimSpace(h))] = i
		}

		// Validate required headers
		requiredHeaders := []string{"question_text"}
		for _, h := range requiredHeaders {
			if _, ok := headerMap[h]; !ok {
				return c.JSON(http.StatusBadRequest, errResp("missing required header: "+h))
			}
		}

		// Parse rows
		var rows []service.CSVQuestionRow
		rowNum := 1
		for {
			record, err := reader.Read()
			if err == io.EOF {
				break
			}
			if err != nil {
				return c.JSON(http.StatusBadRequest, errResp("CSV parse error at row "+strconv.Itoa(rowNum)))
			}
			rowNum++

			row := service.CSVQuestionRow{
				QuestionText: getCSVField(record, headerMap, "question_text"),
				QuestionType: getCSVField(record, headerMap, "question_type"),
				Options:      getCSVField(record, headerMap, "options"),
			}

			// Parse required field
			requiredStr := getCSVField(record, headerMap, "required")
			row.Required = strings.ToLower(requiredStr) == "true" || requiredStr == "1"

			rows = append(rows, row)
		}

		if len(rows) == 0 {
			return c.JSON(http.StatusBadRequest, errResp("CSV file contains no data rows"))
		}

		
		// Import questions
		count, err := svc.ImportQuestionsFromCSV(c.Request().Context(), frameworkID, rows)
		if err != nil {
			logger.Error("ImportQuestionsFromCSV failed", zap.Error(err))
			return c.JSON(http.StatusInternalServerError, errResp(err.Error()))
		}

		
		return c.JSON(http.StatusOK, map[string]interface{}{
			"imported_count": count,
		})
	}
}

func getCSVField(record []string, headerMap map[string]int, fieldName string) string {
	if idx, ok := headerMap[fieldName]; ok && idx < len(record) {
		return strings.TrimSpace(record[idx])
	}
	return ""
}
