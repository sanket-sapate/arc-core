#!/bin/bash
# seed_vault.sh — Seeds Vault KV v2 secrets for local development.
#
# Works WITHOUT a local vault CLI installation — seeds via the running
# vault Docker container. Run `make infra-up` first.
#
# Usage: bash infra/local/seed_vault.sh
#        OR called automatically by: make dev-up

set -euo pipefail

VAULT_CONTAINER="${VAULT_CONTAINER:-local-vault-1}"

echo "Waiting for Vault container (${VAULT_CONTAINER}) to be ready..."
for i in $(seq 1 30); do
  if docker exec -e VAULT_ADDR=http://127.0.0.1:8200 -e VAULT_TOKEN=root \
      "${VAULT_CONTAINER}" vault status > /dev/null 2>&1; then
    break
  fi
  echo "  waiting... ($i/30)"
  sleep 2
done

echo "Seeding Vault secrets..."

docker exec \
  -e VAULT_ADDR=http://127.0.0.1:8200 \
  -e VAULT_TOKEN=root \
  "${VAULT_CONTAINER}" sh -c "
    vault kv put secret/arc/iam-service \
      PG_URL='postgres://postgres:password@postgres:5432/arc_db?sslmode=disable' \
      NATS_URL='nats://nats:4222' \
      WEBHOOK_PSK='dev-psk-change-me'

    vault kv put secret/arc/abc-service \
      PG_URL='postgres://postgres:password@postgres:5432/arc_db?sslmode=disable' \
      NATS_URL='nats://nats:4222'

    vault kv put secret/arc/audit-service \
      PG_URL='postgres://postgres:password@postgres:5432/arc_db?sslmode=disable' \
      NATS_URL='nats://nats:4222'

    vault kv put secret/arc/cdc-worker \
      PG_URL='postgres://postgres:password@postgres:5432/arc_db?replication=database&sslmode=disable' \
      NATS_URL='nats://nats:4222'

    vault kv put secret/arc/discovery-service \
      PG_URL='postgres://postgres:password@postgres:5432/arc_db?sslmode=disable' \
      NATS_URL='nats://nats:4222' \
      SCANNER_BASE_URL='http://localhost:9999' \
      SCANNER_API_KEY=''

    vault kv put secret/arc/trm-service \
      PG_URL='postgres://postgres:password@postgres:5432/arc_db?sslmode=disable' \
      NATS_URL='nats://nats:4222'

    vault kv put secret/arc/privacy-service \
      PG_URL='postgres://postgres:password@postgres:5432/arc_db?sslmode=disable' \
      NATS_URL='nats://nats:4222'

    vault kv put secret/arc/public-api-service \
      REDIS_URL='redis://redis:6379/0' \
      NATS_URL='nats://nats:4222'

    vault kv put secret/arc/notification-service \
      PG_URL='postgres://postgres:password@postgres:5432/arc_db?sslmode=disable' \
      NATS_URL='nats://nats:4222'

    echo '✓ All secrets seeded'
  "
