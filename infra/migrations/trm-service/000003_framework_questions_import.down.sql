-- Remove import tracking fields from framework_questions
DROP INDEX IF EXISTS idx_framework_questions_import_batch;
ALTER TABLE framework_questions DROP COLUMN IF EXISTS import_source;
ALTER TABLE framework_questions DROP COLUMN IF EXISTS import_row_number;
ALTER TABLE framework_questions DROP COLUMN IF EXISTS import_batch_id;
