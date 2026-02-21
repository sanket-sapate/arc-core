#!/bin/bash
# init_vault.sh — One-time Vault initialization for production.
#
# Run this ONCE after `make prod-init` starts vault+postgres.
# What it does:
#   1. Waits for Vault API to be available
#   2. Initialises Vault (5 key shares, threshold 3)
#   3. Saves init.json (unseal keys + root token) to /vault/data/ in the volume
#   4. Unseals Vault using the keys from the local temp file
#   5. Writes VAULT_ROOT_TOKEN to .env.prod automatically
#   6. Enables KV v2 and seeds all service secrets
#
# ⚠️  Back up the printed unseal keys and root token to a secure location.

set -euo pipefail

VAULT_CONTAINER="${VAULT_CONTAINER:-prod-vault-1}"
ENV_FILE="${ENV_FILE:-infra/prod/.env.prod}"

if [ ! -f "${ENV_FILE}" ]; then
  echo "ERROR: ${ENV_FILE} not found."
  echo "       Copy infra/prod/.env.example → infra/prod/.env.prod and fill in values."
  exit 1
fi

# Load env values for secret seeding
set -a; source "${ENV_FILE}"; set +a

# ── 1. Wait for Vault API ───────────────────────────────────────────────────
echo "Waiting for Vault API to be reachable..."
for i in $(seq 1 40); do
  if docker exec "${VAULT_CONTAINER}" \
      sh -c "VAULT_ADDR=http://127.0.0.1:8200 vault status 2>/dev/null | grep -q 'Storage Type'"; then
    echo "  Vault API is up."
    break
  fi
  echo "  waiting... ($i/40)"
  sleep 2
done

# ── 2. Check if already initialised ─────────────────────────────────────────
if docker exec "${VAULT_CONTAINER}" \
    sh -c "VAULT_ADDR=http://127.0.0.1:8200 vault status 2>/dev/null | grep -q 'Initialized.*true'"; then
  echo "Vault is already initialised. If sealed, run: make prod-unseal"
  exit 0
fi

# ── 3. Initialise and capture output locally ─────────────────────────────────
echo "Initialising Vault (5 shares, threshold 3)..."

TMPFILE=$(mktemp)
docker exec "${VAULT_CONTAINER}" \
  sh -c "VAULT_ADDR=http://127.0.0.1:8200 vault operator init \
    -key-shares=5 \
    -key-threshold=3 \
    -format=json" | tee "${TMPFILE}"

# ── 4. Extract keys and root token from the LOCAL temp file ──────────────────
# (avoids needing grep -P or python inside the minimal vault container)

# Extract root token
ROOT_TOKEN=$(grep '"root_token"' "${TMPFILE}" | sed 's/.*"root_token": *"\([^"]*\)".*/\1/')

# Extract unseal keys (one per line)
UNSEAL_KEY_1=$(grep -o '"[A-Za-z0-9+/=]\{44,\}"' "${TMPFILE}" | sed -n '1p' | tr -d '"')
UNSEAL_KEY_2=$(grep -o '"[A-Za-z0-9+/=]\{44,\}"' "${TMPFILE}" | sed -n '2p' | tr -d '"')
UNSEAL_KEY_3=$(grep -o '"[A-Za-z0-9+/=]\{44,\}"' "${TMPFILE}" | sed -n '3p' | tr -d '"')

# Persist init.json to the vault volume for future unseals
docker cp "${TMPFILE}" "${VAULT_CONTAINER}:/vault/data/init.json"
rm -f "${TMPFILE}"

echo ""
echo "⚠️  IMPORTANT: The above JSON contains your unseal keys and root token."
echo "   init.json saved to /vault/data/ (inside the vault volume — persistent)."
echo "   Back it up to a SECURE location."
echo ""

if [ -z "${ROOT_TOKEN}" ]; then
  echo "ERROR: Could not parse root_token from init output."
  exit 1
fi

# ── 5. Unseal Vault using keys extracted on the host ────────────────────────
echo "Unsealing Vault..."
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 "${VAULT_CONTAINER}" \
  sh -c "vault operator unseal '${UNSEAL_KEY_1}'" > /dev/null && echo "  ✓ key 1/3"
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 "${VAULT_CONTAINER}" \
  sh -c "vault operator unseal '${UNSEAL_KEY_2}'" > /dev/null && echo "  ✓ key 2/3"
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 "${VAULT_CONTAINER}" \
  sh -c "vault operator unseal '${UNSEAL_KEY_3}'" > /dev/null && echo "  ✓ key 3/3"

# Verify unsealed
if docker exec "${VAULT_CONTAINER}" \
    sh -c "VAULT_ADDR=http://127.0.0.1:8200 vault status 2>/dev/null | grep -q 'Sealed.*false'"; then
  echo "  ✓ Vault is unsealed"
else
  echo "ERROR: Vault is still sealed after applying 3 keys. Check the init output above."
  exit 1
fi

# ── 6. Write root token to .env.prod ────────────────────────────────────────
if grep -q "VAULT_ROOT_TOKEN=REPLACE_AFTER_PROD_INIT" "${ENV_FILE}" 2>/dev/null; then
  sed -i "s|VAULT_ROOT_TOKEN=REPLACE_AFTER_PROD_INIT|VAULT_ROOT_TOKEN=${ROOT_TOKEN}|" "${ENV_FILE}"
  echo "✓ Root token written to ${ENV_FILE}"
elif ! grep -q "VAULT_ROOT_TOKEN=" "${ENV_FILE}" 2>/dev/null; then
  echo "VAULT_ROOT_TOKEN=${ROOT_TOKEN}" >> "${ENV_FILE}"
  echo "✓ Root token appended to ${ENV_FILE}"
else
  # Already set from a previous run — update it
  sed -i "s|VAULT_ROOT_TOKEN=.*|VAULT_ROOT_TOKEN=${ROOT_TOKEN}|" "${ENV_FILE}"
  echo "✓ Root token updated in ${ENV_FILE}"
fi

# ── 7. Seed all service secrets ──────────────────────────────────────────────
echo ""
echo "Seeding Vault secrets..."
docker exec \
  -e VAULT_ADDR=http://127.0.0.1:8200 \
  -e VAULT_TOKEN="${ROOT_TOKEN}" \
  "${VAULT_CONTAINER}" sh -c "
    vault secrets enable -path=secret kv-v2 2>/dev/null || true

    vault kv put secret/arc/iam-service \
      PG_URL='${PG_URL_IAM:-${PG_URL}}' \
      NATS_URL='${NATS_URL}' \
      WEBHOOK_PSK='${WEBHOOK_PSK}' && echo '  ✓ iam-service'

    vault kv put secret/arc/audit-service \
      PG_URL='${PG_URL}' \
      NATS_URL='${NATS_URL}' && echo '  ✓ audit-service'

    vault kv put secret/arc/cdc-worker \
      PG_URL="${PG_URL}" \
      NATS_URL="${NATS_URL}" && echo '  ✓ cdc-worker'

    vault kv put secret/arc/discovery-service \
      PG_URL='${PG_URL}' \
      NATS_URL='${NATS_URL}' \
      SCANNER_BASE_URL='${SCANNER_BASE_URL}' \
      SCANNER_API_KEY='${SCANNER_API_KEY}' && echo '  ✓ discovery-service'

    vault kv put secret/arc/trm-service \
      PG_URL='${PG_URL}' \
      NATS_URL='${NATS_URL}' && echo '  ✓ trm-service'

    vault kv put secret/arc/privacy-service \
      PG_URL='${PG_URL}' \
      NATS_URL='${NATS_URL}' && echo '  ✓ privacy-service'

    vault kv put secret/arc/abc-service \
      PG_URL='${PG_URL}' \
      NATS_URL='${NATS_URL}' && echo '  ✓ abc-service'
  "

echo ""
echo "✓ Vault initialised, unsealed, and all secrets seeded."
echo "  Root token saved in ${ENV_FILE} as VAULT_ROOT_TOKEN."
echo ""
echo "  Next step: make prod-up"
