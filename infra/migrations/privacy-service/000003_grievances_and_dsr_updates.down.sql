-- Down Migration for DSRs and Grievances

DROP INDEX IF EXISTS idx_grievances_org;
DROP TABLE IF EXISTS grievances;

ALTER TABLE privacy_requests
DROP COLUMN IF EXISTS due_date;
