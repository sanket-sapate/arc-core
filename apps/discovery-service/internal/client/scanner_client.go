// Package client provides an HTTP client facade for the third-party scanning API.
// All requests inject the tenant's ID via the X-Tenant-ID header so that a single
// instance of the discovery-service can serve multiple tenants while keeping
// data fully isolated on the scanner side.
package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

// ScannerClient is the interface that abstracts the third-party scanning API.
// Using an interface allows callers (service layer, tests) to swap in a mock.
type ScannerClient interface {
	// CreateRule registers a new detection rule on the scanning platform.
	// Returns the opaque rule ID assigned by the third party.
	CreateRule(ctx context.Context, tenantID, name, pattern string) (string, error)

	// CreateProfile creates a named scanning profile that groups related rules.
	// Returns the opaque profile ID assigned by the third party.
	CreateProfile(ctx context.Context, tenantID, name string) (string, error)

	// TriggerScan starts an asynchronous scan of the given data source.
	// Returns the opaque job ID assigned by the third party.
	TriggerScan(ctx context.Context, tenantID, sourceID string) (string, error)

	// GetJobStatus returns the current status string of a scan job
	// (e.g. "PENDING", "RUNNING", "COMPLETED", "FAILED").
	GetJobStatus(ctx context.Context, tenantID, jobID string) (string, error)

	// GetJobFindings fetches a paginated list of PII findings for a completed job.
	// page is 1-based; returns the findings and whether there are more pages.
	GetJobFindings(ctx context.Context, tenantID, jobID string, page int) ([]Finding, bool, error)

	// NetworkScan triggers a network discovery scan.
	NetworkScan(ctx context.Context, tenantID, targetRange string, ports []int) error

	// ProxyRequest allows sending raw requests to the scanner with the proper tenant and auth headers.
	ProxyRequest(ctx context.Context, tenantID, method, path string, body interface{}) ([]byte, error)
}

// Finding represents a single PII detection result returned by the third-party API.
type Finding struct {
	// InfoType is the third-party's label for the detected data type (e.g. "EMAIL_ADDRESS").
	InfoType string `json:"info_type"`
	// Location describes where the PII was discovered (table, column, file path, etc.).
	Location string `json:"location"`
	// Confidence is a [0,1] score indicating how confident the scanner is.
	Confidence float64 `json:"confidence"`
	// SampleValue is an optional (possibly masked) sample of the detected value.
	SampleValue string `json:"sample_value,omitempty"`
}

// httpScannerClient is the production implementation backed by real HTTP calls.
type httpScannerClient struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
}

// NewScannerClient constructs a ready-to-use ScannerClient.
//
//   - baseURL is the root URL of the third-party scanning API (no trailing slash).
//   - apiKey is an optional bearer token / API key sent as Authorization header.
func NewScannerClient(baseURL, apiKey string) ScannerClient {
	return &httpScannerClient{
		baseURL: baseURL,
		apiKey:  apiKey,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// ── internal helpers ──────────────────────────────────────────────────────

// newRequest builds an *http.Request, injects common headers, and serialises
// the optional body as JSON.
func (c *httpScannerClient) newRequest(
	ctx context.Context,
	method, path, tenantID string,
	body interface{},
) (*http.Request, error) {
	var buf io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("scanner client: marshal request body: %w", err)
		}
		buf = bytes.NewReader(b)
	}

	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, buf)
	if err != nil {
		return nil, fmt.Errorf("scanner client: build request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("X-Tenant-ID", tenantID)
	if c.apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+c.apiKey)
	}

	return req, nil
}

// doJSON executes req and decodes a successful (2xx) response body into dest.
// Non-2xx status codes are treated as errors.
func (c *httpScannerClient) doJSON(req *http.Request, dest interface{}) error {
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("scanner client: http do: %w", err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("scanner client: read body: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("scanner client: unexpected status %d: %s", resp.StatusCode, string(raw))
	}

	if dest != nil {
		if err := json.Unmarshal(raw, dest); err != nil {
			return fmt.Errorf("scanner client: unmarshal response: %w", err)
		}
	}
	return nil
}

// ── CreateRule ────────────────────────────────────────────────────────────

type createRuleRequest struct {
	Name     string `json:"name"`
	Pattern  string `json:"pattern"`
	Severity string `json:"severity"`
}

type createRuleResponse struct {
	RuleID string `json:"rule_id"`
}

// CreateRule registers a detection rule and returns the third-party rule_id.
func (c *httpScannerClient) CreateRule(ctx context.Context, tenantID, name, pattern string) (string, error) {
	baseURL := strings.TrimRight(c.baseURL, "/")
	// If the baseURL already ends with /api/v1, don't append it again
	if strings.HasSuffix(baseURL, "/api/v1") {
		baseURL = strings.TrimSuffix(baseURL, "/api/v1")
	}
	targetURL := fmt.Sprintf("%s/api/v1/admin/rules", baseURL)

	// Default dummy pattern if none provided to avoid scanner 400
	p := pattern
	if p == "" {
		p = "(?i).*"
	}

	body := createRuleRequest{
		Name:     name,
		Pattern:  p,
		Severity: "HIGH",
	}

	b, err := json.Marshal(body)
	if err != nil {
		return "", fmt.Errorf("scanner client: marshal request body: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, targetURL, bytes.NewReader(b))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("X-Tenant-ID", tenantID)
	if c.apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+c.apiKey)
	}

	log.Printf("Scanner Client - Sending CreateRule to: %s", targetURL)

	var resp createRuleResponse
	if err := c.doJSON(req, &resp); err != nil {
		return "", fmt.Errorf("CreateRule: %w", err)
	}
	return resp.RuleID, nil
}

// ── CreateProfile ─────────────────────────────────────────────────────────

type createProfileRequest struct {
	Name string `json:"name"`
}

type createProfileResponse struct {
	ProfileID string `json:"profile_id"`
}

// CreateProfile creates a scanning profile and returns the third-party profile_id.
func (c *httpScannerClient) CreateProfile(ctx context.Context, tenantID, name string) (string, error) {
	req, err := c.newRequest(ctx, http.MethodPost, "/profiles", tenantID, createProfileRequest{Name: name})
	if err != nil {
		return "", err
	}

	var resp createProfileResponse
	if err := c.doJSON(req, &resp); err != nil {
		return "", fmt.Errorf("CreateProfile: %w", err)
	}
	return resp.ProfileID, nil
}

// ── TriggerScan ───────────────────────────────────────────────────────────

type triggerScanRequest struct {
	SourceID string `json:"source_id"`
}

type triggerScanResponse struct {
	JobID string `json:"job_id"`
}

// TriggerScan initiates an asynchronous scan and returns the third-party job_id.
func (c *httpScannerClient) TriggerScan(ctx context.Context, tenantID, sourceID string) (string, error) {
	req, err := c.newRequest(ctx, http.MethodPost, "/scans", tenantID, triggerScanRequest{SourceID: sourceID})
	if err != nil {
		return "", err
	}

	var resp triggerScanResponse
	if err := c.doJSON(req, &resp); err != nil {
		return "", fmt.Errorf("TriggerScan: %w", err)
	}
	return resp.JobID, nil
}

// ── GetJobStatus ──────────────────────────────────────────────────────────

type jobStatusResponse struct {
	Status string `json:"status"`
}

// GetJobStatus polls a scan job and returns its current status string.
func (c *httpScannerClient) GetJobStatus(ctx context.Context, tenantID, jobID string) (string, error) {
	req, err := c.newRequest(ctx, http.MethodGet, "/scans/"+jobID+"/status", tenantID, nil)
	if err != nil {
		return "", err
	}

	var resp jobStatusResponse
	if err := c.doJSON(req, &resp); err != nil {
		return "", fmt.Errorf("GetJobStatus: %w", err)
	}
	return resp.Status, nil
}

// ── GetJobFindings ────────────────────────────────────────────────────────

type jobFindingsResponse struct {
	Findings []Finding `json:"findings"`
	HasMore  bool      `json:"has_more"`
}

// GetJobFindings retrieves a page of PII findings for a completed scan job.
// page is 1-based. Returns findings, whether more pages exist, and any error.
func (c *httpScannerClient) GetJobFindings(ctx context.Context, tenantID, jobID string, page int) ([]Finding, bool, error) {
	path := fmt.Sprintf("/scans/%s/findings?page=%d", jobID, page)
	req, err := c.newRequest(ctx, http.MethodGet, path, tenantID, nil)
	if err != nil {
		return nil, false, err
	}

	var resp jobFindingsResponse
	if err := c.doJSON(req, &resp); err != nil {
		return nil, false, fmt.Errorf("GetJobFindings: %w", err)
	}
	return resp.Findings, resp.HasMore, nil
}

// ── NetworkScan ───────────────────────────────────────────────────────────

type networkScanRequest struct {
	TargetRange string `json:"target_range"`
	Ports       []int  `json:"ports"`
}

// NetworkScan triggers an immediate network sweep on the third-party scanner.
func (c *httpScannerClient) NetworkScan(ctx context.Context, tenantID, targetRange string, ports []int) error {
	req, err := c.newRequest(ctx, http.MethodPost, "/admin/discovery/scan", tenantID, networkScanRequest{
		TargetRange: targetRange,
		Ports:       ports,
	})
	if err != nil {
		return err
	}

	// This endpoint returns 200/202 with no relevant JSON payload that we need,
	// so we just execute it and disregard the JSON body decoding.
	if err := c.doJSON(req, nil); err != nil {
		return fmt.Errorf("NetworkScan: %w", err)
	}
	return nil
}

// ── ProxyRequest ──────────────────────────────────────────────────────────

// ProxyRequest executes a raw HTTP request against the scanner API and returns the raw JSON response body.
func (c *httpScannerClient) ProxyRequest(ctx context.Context, tenantID, method, path string, body interface{}) ([]byte, error) {
	req, err := c.newRequest(ctx, method, path, tenantID, body)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("ProxyRequest: http do: %w", err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("ProxyRequest: read body: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("ProxyRequest: unexpected status %d: %s", resp.StatusCode, string(raw))
	}
	return raw, nil
}
