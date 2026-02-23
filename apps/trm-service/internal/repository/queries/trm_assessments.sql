-- ── Enhanced Frameworks ───────────────────────────────────────────────────

-- name: UpdateFramework :one
UPDATE frameworks
SET name = $3, version = $4, description = $5, updated_at = NOW()
WHERE id = $1 AND organization_id = $2
RETURNING *;

-- name: DeleteFramework :exec
DELETE FROM frameworks
WHERE id = $1 AND organization_id = $2;

-- ── Framework Questions ───────────────────────────────────────────────────

-- name: CreateFrameworkQuestion :one
INSERT INTO framework_questions (id, framework_id, question_text, question_type, options)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListFrameworkQuestions :many
SELECT * FROM framework_questions
WHERE framework_id = $1
ORDER BY created_at ASC;

-- ── Audit Cycles ──────────────────────────────────────────────────────────

-- name: CreateAuditCycle :one
INSERT INTO audit_cycles (id, organization_id, name, status, start_date, end_date)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetAuditCycle :one
SELECT * FROM audit_cycles
WHERE id = $1 AND organization_id = $2;

-- name: ListAuditCycles :many
SELECT * FROM audit_cycles
WHERE organization_id = $1
ORDER BY created_at DESC;

-- name: UpdateAuditCycle :one
UPDATE audit_cycles
SET name = $3, status = $4, start_date = $5, end_date = $6, updated_at = NOW()
WHERE id = $1 AND organization_id = $2
RETURNING *;

-- name: DeleteAuditCycle :exec
DELETE FROM audit_cycles
WHERE id = $1 AND organization_id = $2;

-- ── Enhanced Assessments ──────────────────────────────────────────────────

-- name: UpdateAssessmentCycle :one
UPDATE assessments
SET audit_cycle_id = $3, updated_at = NOW()
WHERE id = $1 AND organization_id = $2
RETURNING *;

-- ── Assessment Answers ────────────────────────────────────────────────────

-- name: UpsertAssessmentAnswer :one
INSERT INTO assessment_answers (id, assessment_id, question_id, answer_text, answer_options)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (assessment_id, question_id) DO UPDATE
SET answer_text = EXCLUDED.answer_text,
    answer_options = EXCLUDED.answer_options,
    updated_at = NOW()
RETURNING *;

-- name: ListAssessmentAnswers :many
SELECT * FROM assessment_answers
WHERE assessment_id = $1;
