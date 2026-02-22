// Package service contains the CookieScanner, which crawls client websites
// to automatically discover and categorise cookies for use in cookie banners.
//
// The Cookie Scanner is deliberately placed in the discovery-service alongside
// the database scanner because both involve heavy I/O (headless browsers /
// HTTP scrapers) that must be isolated from the privacy-service admin stack.
//
// TODO: implement headless / HTTP crawler to discover cookies per domain.
// Candidate libraries: chromedp (headless Chrome), rod (Chrome DevTools), colly (HTTP).
// Expected flow:
//   1. Receive a ScanRequest{OrganizationID, Domain} from NATS or a cron.
//   2. Crawl the domain, intercept Set-Cookie headers + document.cookie writes.
//   3. Classify each cookie by category (necessary / analytics / marketing).
//   4. Publish a CookieScanCompleted event so the privacy-service can update
//      the cookie banner configuration.
package service

import (
	"net/http"

	"go.uber.org/zap"
)

// CookieScanner scans a web domain for cookies and categorises them.
type CookieScanner struct {
	httpClient *http.Client
	logger     *zap.Logger
}

// NewCookieScanner constructs a CookieScanner.
func NewCookieScanner(logger *zap.Logger) *CookieScanner {
	return &CookieScanner{
		httpClient: &http.Client{},
		logger:     logger,
	}
}
