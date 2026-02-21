-- name: CreateScanJob :one
INSERT INTO scan_jobs (id, organization_id, third_party_job_id, source_name, status, findings_synced)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetScanJob :one
SELECT * FROM scan_jobs
WHERE id = $1 AND organization_id = $2;

-- name: ListPendingScanJobs :many
SELECT * FROM scan_jobs
WHERE status IN ('PENDING', 'RUNNING')
ORDER BY created_at ASC;

-- name: UpdateScanJobStatus :one
UPDATE scan_jobs
SET status = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: MarkScanJobSynced :exec
UPDATE scan_jobs
SET findings_synced = true, status = 'COMPLETED', updated_at = NOW()
WHERE id = $1;
