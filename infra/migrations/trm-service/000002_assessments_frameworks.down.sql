DROP TABLE IF EXISTS assessment_answers;
ALTER TABLE assessments DROP COLUMN IF EXISTS audit_cycle_id;
DROP TABLE IF EXISTS audit_cycles;
DROP TABLE IF EXISTS framework_questions;
ALTER TABLE frameworks DROP COLUMN IF EXISTS description;
ALTER TABLE frameworks DROP COLUMN IF EXISTS updated_at;
