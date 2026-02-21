-- name: CreateDictionaryItem :one
INSERT INTO data_dictionary (id, organization_id, name, category, sensitivity, third_party_rule_id, active)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetDictionaryItem :one
SELECT * FROM data_dictionary
WHERE id = $1 AND organization_id = $2;

-- name: ListDictionaryItems :many
SELECT * FROM data_dictionary
WHERE organization_id = $1
ORDER BY name ASC;

-- name: GetDictionaryItemByName :one
SELECT * FROM data_dictionary
WHERE organization_id = $1 AND name = $2;

-- name: UpdateDictionaryItem :one
UPDATE data_dictionary
SET name = $3, category = $4, sensitivity = $5, active = $6, updated_at = NOW()
WHERE id = $1 AND organization_id = $2
RETURNING *;
