// Package worker provides background goroutines that run alongside the HTTP
// server for the discovery-service.
//
// ScanPoller periodically queries Postgres for unfinished scan jobs, polls the
// third-party scanning API for their status, and – when a job completes –
// fetches all findings, maps each finding's info_type to the internal
// data_dictionary, and emits PiiFound outbox events for downstream consumption.
package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"

	"github.com/arc-self/apps/discovery-service/internal/client"
	db "github.com/arc-self/apps/discovery-service/internal/repository/db"
)

// ScanPoller polls the third-party scanning API for pending/running jobs and
// processes findings when a job completes.
type ScanPoller struct {
	pool     *pgxpool.Pool
	querier  db.Querier
	scanner  client.ScannerClient
	interval time.Duration
	logger   *zap.Logger
}

// NewScanPoller constructs a ScanPoller.
//
//   - pool / querier – database access (pool is needed for transactions).
//   - scanner        – third-party API client.
//   - interval       – how often to poll; defaults to 60 s if zero.
//   - logger         – structured logger.
func NewScanPoller(
	pool *pgxpool.Pool,
	querier db.Querier,
	scanner client.ScannerClient,
	interval time.Duration,
	logger *zap.Logger,
) *ScanPoller {
	if interval <= 0 {
		interval = 60 * time.Second
	}
	return &ScanPoller{
		pool:     pool,
		querier:  querier,
		scanner:  scanner,
		interval: interval,
		logger:   logger,
	}
}

// Run starts the polling loop. It blocks until ctx is cancelled, making it
// suitable for running inside a goroutine alongside the HTTP server.
//
//	go poller.Run(ctx)
func (p *ScanPoller) Run(ctx context.Context) {
	ticker := time.NewTicker(p.interval)
	defer ticker.Stop()

	p.logger.Info("scan poller started", zap.Duration("interval", p.interval))

	for {
		select {
		case <-ctx.Done():
			p.logger.Info("scan poller stopping")
			return
		case <-ticker.C:
			p.poll(ctx)
		}
	}
}

// poll is the core tick handler. It loads all pending/running jobs from Postgres
// and processes each one independently so that a single failure does not block
// the others.
func (p *ScanPoller) poll(ctx context.Context) {
	jobs, err := p.querier.ListPendingScanJobs(ctx)
	if err != nil {
		p.logger.Error("error listing pending scan jobs", zap.Error(err))
		return
	}

	p.logger.Debug("polling scan jobs", zap.Int("count", len(jobs)))

	for _, job := range jobs {
		if err := p.processJob(ctx, job); err != nil {
			p.logger.Error("error processing scan job",
				zap.String("job_id", job.ID.String()),
				zap.String("third_party_job_id", job.ThirdPartyJobID),
				zap.Error(err),
			)
		}
	}
}

// processJob handles a single scan job: it checks the remote status, transitions
// the local status if it has changed, and – when the job is now COMPLETED and
// findings have not yet been synced – fetches and processes all findings.
func (p *ScanPoller) processJob(ctx context.Context, job db.ScanJob) error {
	// The tenant ID is stored as the string representation of organization_id.
	tenantID := job.OrganizationID.String()

	// ── 1. Poll remote status ─────────────────────────────────────────────
	remoteStatus, err := p.scanner.GetJobStatus(ctx, tenantID, job.ThirdPartyJobID)
	if err != nil {
		return fmt.Errorf("GetJobStatus(%s): %w", job.ThirdPartyJobID, err)
	}

	p.logger.Debug("scan job status",
		zap.String("job_id", job.ID.String()),
		zap.String("local_status", job.Status),
		zap.String("remote_status", remoteStatus),
	)

	// ── 2. Update local status if changed ────────────────────────────────
	if remoteStatus != job.Status {
		updated, err := p.querier.UpdateScanJobStatus(ctx, db.UpdateScanJobStatusParams{
			ID:     job.ID,
			Status: remoteStatus,
		})
		if err != nil {
			return fmt.Errorf("UpdateScanJobStatus: %w", err)
		}
		job = updated // keep working with the fresh record
	}

	// ── 3. Process findings for newly completed jobs ───────────────────────
	if remoteStatus != "COMPLETED" {
		return nil // job not done yet
	}
	if job.FindingsSynced.Bool {
		return nil // already processed
	}

	if err := p.syncFindings(ctx, job); err != nil {
		return fmt.Errorf("syncFindings: %w", err)
	}

	return nil
}

// syncFindings fetches all pages of findings from the third-party API,
// maps each finding to the internal data_dictionary (by matching info_type to
// item name), inserts PiiFound outbox events, and marks the job as synced —
// all within a single database transaction.
func (p *ScanPoller) syncFindings(ctx context.Context, job db.ScanJob) error {
	tenantID := job.OrganizationID.String()

	p.logger.Info("syncing findings for completed scan job",
		zap.String("job_id", job.ID.String()),
		zap.String("third_party_job_id", job.ThirdPartyJobID),
	)

	// ── Collect all finding pages ─────────────────────────────────────────
	var allFindings []client.Finding
	page := 1
	for {
		findings, hasMore, err := p.scanner.GetJobFindings(ctx, tenantID, job.ThirdPartyJobID, page)
		if err != nil {
			return fmt.Errorf("GetJobFindings page %d: %w", page, err)
		}
		allFindings = append(allFindings, findings...)
		if !hasMore {
			break
		}
		page++
	}

	p.logger.Info("fetched findings",
		zap.String("job_id", job.ID.String()),
		zap.Int("total_findings", len(allFindings)),
	)

	// ── Build a lookup of known dictionary items for this org ─────────────
	// We do this once per job, outside the transaction, to keep the hot path
	// simple and avoid holding locks on the dictionary table.
	dictItems, err := p.querier.ListDictionaryItems(ctx, job.OrganizationID)
	if err != nil {
		return fmt.Errorf("ListDictionaryItems: %w", err)
	}

	// Index by name (lowercased) for fuzzy matching with the third-party info_type.
	dictByName := make(map[string]db.DataDictionaryItem, len(dictItems))
	for _, item := range dictItems {
		dictByName[toLower(item.Name)] = item
	}

	// ── Atomic write: outbox events + mark synced ─────────────────────────
	tx, err := p.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := db.New(tx)

	for _, finding := range allFindings {
		// Map the third-party info_type to an internal dictionary item.
		// We match by normalised name (e.g. "email_address" → "email_address").
		dictItem, ok := dictByName[toLower(finding.InfoType)]

		payloadMap := map[string]interface{}{
			"scan_job_id":       job.ID.String(),
			"third_party_job_id": job.ThirdPartyJobID,
			"info_type":         finding.InfoType,
			"location":          finding.Location,
			"confidence":        finding.Confidence,
			"sample_value":      finding.SampleValue,
		}

		aggregateID := job.ID.String() // fallback aggregate: the scan job itself
		if ok {
			payloadMap["dictionary_item_id"] = dictItem.ID.String()
			payloadMap["dictionary_item_name"] = dictItem.Name
			aggregateID = dictItem.ID.String()
		}

		payload, _ := json.Marshal(payloadMap)

		if err := qtx.InsertOutboxEvent(ctx, db.InsertOutboxEventParams{
			ID:             newUUID(),
			OrganizationID: job.OrganizationID,
			AggregateType:  "scan_finding",
			AggregateID:    aggregateID,
			EventType:      "PiiFound",
			Payload:        payload,
		}); err != nil {
			return fmt.Errorf("InsertOutboxEvent for finding %s: %w", finding.InfoType, err)
		}
	}

	// Mark the job as fully synced inside the same transaction.
	if err := qtx.MarkScanJobSynced(ctx, job.ID); err != nil {
		return fmt.Errorf("MarkScanJobSynced: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit tx: %w", err)
	}

	p.logger.Info("findings synced",
		zap.String("job_id", job.ID.String()),
		zap.Int("events_emitted", len(allFindings)),
	)

	return nil
}

// ── Helpers ───────────────────────────────────────────────────────────────

// newUUID generates a UUIDv7 and returns it as a pgtype.UUID.
// (duplicated from service package to keep worker self-contained)
func newUUID() pgtype.UUID {
	// We import the uuid package transitively via the db package's pgtype dependency.
	// To avoid a circular import we simply call uuid directly.
	id, _ := uuidNewV7()
	var u pgtype.UUID
	u.Scan(id)
	return u
}

// toLower normalises a string for fuzzy matching between third-party labels and
// internal dictionary names. Spaces and underscores are treated equally.
func toLower(s string) string {
	out := make([]byte, len(s))
	for i := 0; i < len(s); i++ {
		c := s[i]
		if c >= 'A' && c <= 'Z' {
			out[i] = c + 32
		} else if c == ' ' {
			out[i] = '_'
		} else {
			out[i] = c
		}
	}
	return string(out)
}

// uuidNewV7 is a thin shim that calls google/uuid so the worker package does not
// need to import the service package (which would risk a cycle).
func uuidNewV7() (string, error) {
	// We use the uuid package directly; it is already in the module dependency graph.
	return uuidV7String()
}
