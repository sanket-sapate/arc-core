package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/chromedp/cdproto/network"
	"github.com/chromedp/chromedp"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"

	db "github.com/arc-self/apps/cookie-scanner/internal/repository/db"
)

// ScannerService manages cookie scanning jobs.
type ScannerService struct {
	pool    *pgxpool.Pool
	querier *db.Queries
	logger  *zap.Logger
}

func NewScannerService(pool *pgxpool.Pool, querier *db.Queries, logger *zap.Logger) *ScannerService {
	return &ScannerService{pool: pool, querier: querier, logger: logger}
}

// toPgtypeUUID converts a google/uuid.UUID to pgtype.UUID.
func toPgtypeUUID(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{Bytes: id, Valid: true}
}

// StartScan creates a pending scan record and kicks off the async scan.
func (s *ScannerService) StartScan(ctx context.Context, tenantID uuid.UUID, rawURL string) (*db.CookieScan, error) {
	scan, err := s.querier.CreateScan(ctx, db.CreateScanParams{
		ID:       toPgtypeUUID(uuid.New()),
		TenantID: toPgtypeUUID(tenantID),
		Url:      rawURL,
	})
	if err != nil {
		return nil, fmt.Errorf("create scan record: %w", err)
	}

	go s.runScan(context.Background(), scan)
	return &scan, nil
}

// GetScan returns a scan and its cookies.
func (s *ScannerService) GetScan(ctx context.Context, scanID uuid.UUID) (*db.CookieScan, []db.ScannedCookie, error) {
	pgID := toPgtypeUUID(scanID)
	scan, err := s.querier.GetScan(ctx, pgID)
	if err != nil {
		return nil, nil, fmt.Errorf("get scan: %w", err)
	}
	cookies, err := s.querier.GetCookiesByScan(ctx, pgID)
	if err != nil {
		return nil, nil, fmt.Errorf("get cookies: %w", err)
	}
	return &scan, cookies, nil
}

// ListScans returns scans for a tenant (newest first).
func (s *ScannerService) ListScans(ctx context.Context, tenantID uuid.UUID, limit, offset int32) ([]db.CookieScan, error) {
	return s.querier.ListScans(ctx, db.ListScansParams{
		TenantID: toPgtypeUUID(tenantID),
		Limit:    limit,
		Offset:   offset,
	})
}

// ── Internal scanning logic ───────────────────────────────────────────────────

func (s *ScannerService) runScan(ctx context.Context, scan db.CookieScan) {
	now := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	// Mark as running
	_, _ = s.querier.UpdateScanStatus(ctx, db.UpdateScanStatusParams{
		ID:          scan.ID,
		Status:      "running",
		Error:       pgtype.Text{},
		StartedAt:   now,
		CompletedAt: pgtype.Timestamptz{},
	})

	cookies, scanErr := s.extractCookies(ctx, scan.Url)

	completedAt := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}
	errText := pgtype.Text{}
	status := "completed"
	if scanErr != nil {
		status = "failed"
		errText = pgtype.Text{String: scanErr.Error(), Valid: true}
		s.logger.Error("cookie scan failed", zap.String("url", scan.Url), zap.Error(scanErr))
	}

	_, updateErr := s.querier.UpdateScanStatus(ctx, db.UpdateScanStatusParams{
		ID:          scan.ID,
		Status:      status,
		Error:       errText,
		StartedAt:   now,
		CompletedAt: completedAt,
	})
	if updateErr != nil {
		s.logger.Error("failed to update scan status", zap.Error(updateErr))
	}

	if len(cookies) > 0 && scanErr == nil {
		// Stamp scan_id onto every cookie row
		for i := range cookies {
			cookies[i].ScanID = scan.ID
		}
		if _, insertErr := s.querier.InsertCookies(ctx, cookies); insertErr != nil {
			s.logger.Error("failed to insert cookies", zap.Error(insertErr))
		}
	}

	s.logger.Info("cookie scan done",
		zap.String("url", scan.Url),
		zap.String("status", status),
		zap.Int("cookies", len(cookies)),
	)
}

func (s *ScannerService) extractCookies(ctx context.Context, rawURL string) ([]db.InsertCookiesParams, error) {
	opts := append(
		chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", true),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("disable-blink-features", "AutomationControlled"),
		chromedp.UserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"),
	)

	allocCtx, cancelAlloc := chromedp.NewExecAllocator(ctx, opts...)
	defer cancelAlloc()

	chromeCtx, cancel := chromedp.NewContext(allocCtx)
	defer cancel()
	chromeCtx, cancel = context.WithTimeout(chromeCtx, 90*time.Second)
	defer cancel()

	var rawCookies []*network.Cookie
	err := chromedp.Run(chromeCtx,
		chromedp.Navigate(rawURL),
		// Simulate human interaction to trigger analytics/marketing scripts.
		chromedp.Evaluate(`window.scrollTo(0, document.body.scrollHeight)`, nil),
		chromedp.Sleep(3*time.Second),
		chromedp.Evaluate(`window.scrollTo(0, 0)`, nil),
		chromedp.Sleep(4*time.Second),
		chromedp.ActionFunc(func(c context.Context) error {
			var err error
			rawCookies, err = network.GetCookies().Do(c)
			return err
		}),
	)
	if err != nil {
		return nil, fmt.Errorf("chromedp: %w", err)
	}

	params := make([]db.InsertCookiesParams, 0, len(rawCookies))
	for _, c := range rawCookies {
		exp := pgtype.Timestamptz{}
		if c.Expires > 0 {
			exp = pgtype.Timestamptz{Time: time.Unix(int64(c.Expires), 0).UTC(), Valid: true}
		}
		params = append(params, db.InsertCookiesParams{
			ID:          toPgtypeUUID(uuid.New()),
			// ScanID is stamped by runScan before insertion
			Name:        c.Name,
			Domain:      pgtype.Text{String: c.Domain, Valid: c.Domain != ""},
			Path:        pgtype.Text{String: c.Path, Valid: c.Path != ""},
			Value:       pgtype.Text{String: c.Value, Valid: true},
			Expiration:  exp,
			Secure:      c.Secure,
			HttpOnly:    c.HTTPOnly,
			SameSite:    pgtype.Text{String: string(c.SameSite), Valid: true},
			Source:      "headless_browser",
			Category:    categorizeCookie(c.Name),
			Description: pgtype.Text{String: "Automatically detected cookie", Valid: true},
		})
	}
	return params, nil
}

// categorizeCookie assigns a standard category to a cookie by name heuristic.
func categorizeCookie(name string) string {
	n := strings.ToLower(name)
	switch {
	case containsAny(n, "_ga", "_gid", "_gat", "utma", "utmb", "utmc", "utmz", "_hjid", "_hjsession", "_hjincluded"):
		return "Analytics"
	case containsAny(n, "fbp", "_fbc", "ide", "test_cookie", "muid", "anonchk", "_ttp", "fr_"):
		return "Marketing"
	case containsAny(n, "lang", "locale", "language", "seen_cookie", "cookie_notice", "cookie_consent", "gdpr"):
		return "Functional"
	case containsAny(n, "session", "csrf", "xsrf", "jsessionid", "phpsessid", "asp.net_", "cf_clearance", "__cfduid", "token", "auth"):
		return "Necessary"
	default:
		return "Unknown"
	}
}

func containsAny(s string, subs ...string) bool {
	for _, sub := range subs {
		if strings.Contains(s, sub) {
			return true
		}
	}
	return false
}
