-- iam migration 000002: align physical schema with RBAC sqlc models
-- Fixes: FLAW-4.1 (schema/model divergence) and FLAW-4.2 (UpsertUser NOT NULL violation)

-- Step 1: Drop stale columns from the v1 flat-user schema that do not
-- exist in the generated sqlc models and that violate NOT NULL on upsert.
ALTER TABLE users DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE users DROP COLUMN IF EXISTS external_id;
ALTER TABLE users DROP COLUMN IF EXISTS display_name;
ALTER TABLE users DROP COLUMN IF EXISTS role;
ALTER TABLE users DROP COLUMN IF EXISTS active;
ALTER TABLE users DROP COLUMN IF EXISTS updated_at;

-- Step 2: Create the organizations table (anchor for all tenant scoping).
CREATE TABLE organizations (
    id         UUID PRIMARY KEY,
    name       VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 3: Create the roles table, scoped per organization.
-- The UNIQUE constraint on (organization_id, name) prevents duplicate role names
-- within the same org and matches the GetDefaultRole query assumption.
CREATE TABLE roles (
    id              UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            VARCHAR(50) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, name)
);

-- Step 4: Create the role_permissions join table.
-- permission_slug carries values like "item:read", "item:write", "iam:manage".
CREATE TABLE role_permissions (
    role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_slug VARCHAR(255) NOT NULL,
    PRIMARY KEY (role_id, permission_slug)
);

-- Step 5: Create the user_organization_roles junction table.
-- Idempotent on re-assignment via the ON CONFLICT DO NOTHING in AssignUserRole.
CREATE TABLE user_organization_roles (
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, organization_id, role_id)
);

-- Step 6: Supporting indexes for the hot RBAC evaluation path (CheckUserPermission).
CREATE INDEX idx_uor_user_org ON user_organization_roles(user_id, organization_id);
