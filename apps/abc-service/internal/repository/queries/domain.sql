-- name: CreateCategory :one
INSERT INTO categories (id, organization_id, name)
VALUES ($1, $2, $3)
RETURNING *;

-- name: ListCategories :many
SELECT * FROM categories
WHERE organization_id = $1
ORDER BY name ASC;

-- name: CreateItem :one
INSERT INTO items (id, organization_id, category_id, name, description, status)
VALUES ($1, $2, $3, $4, $5, 'DRAFT')
RETURNING *;

-- name: GetItem :one
SELECT * FROM items
WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL;

-- name: ListItems :many
SELECT * FROM items
WHERE organization_id = $1 AND deleted_at IS NULL
ORDER BY created_at DESC;

-- name: UpdateItemStatus :one
UPDATE items
SET status = $2, updated_at = NOW()
WHERE id = $1 AND organization_id = $3 AND deleted_at IS NULL
RETURNING *;

-- name: SoftDeleteItem :exec
UPDATE items
SET deleted_at = NOW(), updated_at = NOW()
WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL;
