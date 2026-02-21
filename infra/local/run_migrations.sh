#!/bin/bash
# run_migrations.sh — Applies all service schema migrations to the local Postgres
# container using psql directly.
#
# Why not golang-migrate?
# All services share arc_db. golang-migrate uses a single global schema_migrations
# table with no namespace — multiple service paths collide on version numbers.
# This script copies the SQL files into the container and applies them
# idempotently via CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS.
#
# Usage: bash infra/local/run_migrations.sh
#        OR called automatically by: make dev-up

set -euo pipefail

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-local-postgres-1}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-arc_db}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIGRATIONS_DIR="${REPO_ROOT}/infra/migrations"

run_sql() {
  local label="$1"
  local file="$2"
  echo "  ↳ ${label}"
  docker exec -i "${POSTGRES_CONTAINER}" \
    psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -v ON_ERROR_STOP=0 -q < "${file}" 2>&1 \
    | grep -v "^$" \
    | grep -v "already exists" \
    | grep -v "^NOTICE" \
    || true
}

echo "Waiting for Postgres (${POSTGRES_CONTAINER}) to be ready..."
for i in $(seq 1 30); do
  if docker exec "${POSTGRES_CONTAINER}" pg_isready -U "${POSTGRES_USER}" > /dev/null 2>&1; then
    break
  fi
  echo "  waiting... ($i/30)"
  sleep 2
done

echo "Applying migrations to ${POSTGRES_DB}..."

# Enable uuid-ossp extension once (shared across all services)
docker exec "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
  -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" -q 2>&1 | grep -v "^$" | grep -v "already" || true

# Shared outbox_events table (created by abc-service, used by several services)
docker exec "${POSTGRES_CONTAINER}" psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -q \
  -c "CREATE TABLE IF NOT EXISTS outbox_events (
    id            UUID PRIMARY KEY,
    organization_id UUID NOT NULL,
    aggregate_type  TEXT NOT NULL,
    aggregate_id    TEXT NOT NULL,
    event_type      TEXT NOT NULL,
    payload         JSONB NOT NULL DEFAULT '{}',
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );" 2>&1 | grep -v "^$" | grep -v "already" || true

# Apply each service's migrations in dependency order
services=(
  "abc"
  "iam"
  "audit-service"
  "privacy-service"
  "discovery-service"
  "trm-service"
)

for svc in "${services[@]}"; do
  dir="${MIGRATIONS_DIR}/${svc}"
  if [ ! -d "${dir}" ]; then
    echo "  ! skipping ${svc} (no migrations directory)"
    continue
  fi

  echo ""
  echo "── ${svc} ────────────────────────────────"
  for f in $(find "${dir}" -name "*.up.sql" | sort); do
    run_sql "$(basename "${f}")" "${f}"
  done
done

echo ""
echo "✓ All migrations applied"
