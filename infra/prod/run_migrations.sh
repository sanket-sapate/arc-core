#!/bin/bash
set -euo pipefail

echo "Waiting for Postgres to be ready..."
until pg_isready -h "${PGHOST}" -U "${PGUSER}" -d "${PGDATABASE}"; do
  sleep 1
done

echo "Applying migrations to ${PGHOST}/${PGDATABASE}..."

# Enable uuid-ossp extension (idempotent)
psql -v ON_ERROR_STOP=0 -q \
  -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>&1 \
  | grep -v "already exists" | grep -v "^$" | grep -v "^NOTICE" || true

# Shared outbox_events table (referenced by all services, created once)
psql -v ON_ERROR_STOP=0 -q -c "
CREATE TABLE IF NOT EXISTS outbox_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  aggregate_type  TEXT NOT NULL,
  aggregate_id    TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}',
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);" 2>&1 | grep -v "already exists" | grep -v "^$" | grep -v "^NOTICE" || true

# Apply each service's up-migrations in dependency order
for svc in abc iam audit-service privacy-service discovery-service trm-service cookie-scanner; do
  dir="/migrations/${svc}"
  if [ ! -d "${dir}" ]; then
    echo "  ! skipping ${svc} (no migrations directory)"
    continue
  fi

  echo ""
  echo "── ${svc} ──────────────────────────────────────────"
  for f in $(find "${dir}" -name "*.up.sql" | sort); do
    echo "  ↳ $(basename "${f}")"
    psql -v ON_ERROR_STOP=0 -q -f "${f}" 2>&1 \
      | grep -v "^$" \
      | grep -v "already exists" \
      | grep -v "^NOTICE" \
      || true
  done
done

echo ""
echo "✓ All migrations applied"
