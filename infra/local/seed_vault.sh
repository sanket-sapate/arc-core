#!/bin/bash
# Seed Vault KV v2 secrets for local development.
# Run after `docker compose up -d vault`.
#
# Usage: ./seed_vault.sh

set -euo pipefail

export VAULT_ADDR="${VAULT_ADDR:-http://localhost:8200}"
export VAULT_TOKEN="${VAULT_TOKEN:-root}"

echo "Seeding Vault at ${VAULT_ADDR}..."

vault kv put secret/arc/iam-service \
  PG_URL="postgres://postgres:password@postgres:5432/arc_db?sslmode=disable" \
  NATS_URL="nats://nats:4222" \
  WEBHOOK_PSK="dev-psk-change-me"

vault kv put secret/arc/abc-service \
  PG_URL="postgres://postgres:password@postgres:5432/arc_db?sslmode=disable" \
  NATS_URL="nats://nats:4222"

vault kv put secret/arc/audit-service \
  PG_URL="postgres://postgres:password@postgres:5432/arc_db?sslmode=disable" \
  NATS_URL="nats://nats:4222"

vault kv put secret/arc/cdc-worker \
  PG_URL="postgres://postgres:password@postgres:5432/arc_db?replication=database&sslmode=disable" \
  NATS_URL="nats://nats:4222"

echo "✓ All secrets seeded."
