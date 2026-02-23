-- name: CreateScriptRule :one
INSERT INTO script_rules (
    id, tenant_id, purpose_id, name, script_domain, rule_type, active, created_at, updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
)
RETURNING *;

-- name: GetScriptRule :one
SELECT * FROM script_rules 
WHERE id = $1 AND tenant_id = $2;

-- name: ListScriptRules :many
SELECT * FROM script_rules 
WHERE tenant_id = $1
ORDER BY created_at DESC;

-- name: UpdateScriptRule :one
UPDATE script_rules
SET 
    purpose_id = COALESCE(NULLIF(@purpose_id::uuid, '00000000-0000-0000-0000-000000000000'::uuid), purpose_id),
    name = COALESCE(NULLIF(@name::text, ''), name),
    script_domain = COALESCE(NULLIF(@script_domain::text, ''), script_domain),
    rule_type = COALESCE(NULLIF(@rule_type::text, ''), rule_type),
    active = COALESCE(NULLIF(@active::boolean, active), @active::boolean),
    updated_at = NOW()
WHERE id = @id AND tenant_id = @tenant_id
RETURNING *;

-- name: DeleteScriptRule :exec
DELETE FROM script_rules 
WHERE id = $1 AND tenant_id = $2;
