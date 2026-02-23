ALTER TABLE purposes
ADD COLUMN data_objects uuid[] NOT NULL DEFAULT '{}';
