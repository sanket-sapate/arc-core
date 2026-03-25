-- Add import tracking fields to framework_questions
ALTER TABLE framework_questions ADD COLUMN import_batch_id UUID;
ALTER TABLE framework_questions ADD COLUMN import_row_number INTEGER;
ALTER TABLE framework_questions ADD COLUMN import_source VARCHAR(50);

-- Add index for batch queries
CREATE INDEX idx_framework_questions_import_batch ON framework_questions(import_batch_id) WHERE import_batch_id IS NOT NULL;
