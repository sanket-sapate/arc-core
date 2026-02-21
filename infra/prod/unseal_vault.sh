#!/bin/bash
# unseal_vault.sh — Re-unseal Vault after a container restart.
#
# Vault uses Shamir key shares — it is sealed every time the vault container
# restarts. This script reads init.json from the vault volume, copies it
# to the host temporarily, extracts the first 3 unseal keys, and applies them.
#
# Usage: bash infra/prod/unseal_vault.sh
#        make prod-unseal

set -euo pipefail

VAULT_CONTAINER="${VAULT_CONTAINER:-prod-vault-1}"

echo "Re-unsealing Vault..."

# Check Vault is reachable
if ! docker exec "${VAULT_CONTAINER}" \
    sh -c "VAULT_ADDR=http://127.0.0.1:8200 vault status 2>/dev/null | grep -q 'Storage Type'"; then
  echo "ERROR: Vault container '${VAULT_CONTAINER}' is not responding."
  echo "       Ensure the container is running: docker ps | grep vault"
  exit 1
fi

# Check if already unsealed
if docker exec "${VAULT_CONTAINER}" \
    sh -c "VAULT_ADDR=http://127.0.0.1:8200 vault status 2>/dev/null | grep -q 'Sealed.*false'"; then
  echo "Vault is already unsealed."
  exit 0
fi

# Copy init.json from the vault volume to a local temp file
TMPFILE=$(mktemp)
if ! docker cp "${VAULT_CONTAINER}:/vault/data/init.json" "${TMPFILE}" 2>/dev/null; then
  echo "ERROR: /vault/data/init.json not found in the vault volume."
  echo "       The volume may have been deleted. Re-run: make prod-init"
  rm -f "${TMPFILE}"
  exit 1
fi

# Extract the first 3 unseal keys on the host (no perl regex needed)
UNSEAL_KEY_1=$(grep -o '"[A-Za-z0-9+/=]\{44,\}"' "${TMPFILE}" | sed -n '1p' | tr -d '"')
UNSEAL_KEY_2=$(grep -o '"[A-Za-z0-9+/=]\{44,\}"' "${TMPFILE}" | sed -n '2p' | tr -d '"')
UNSEAL_KEY_3=$(grep -o '"[A-Za-z0-9+/=]\{44,\}"' "${TMPFILE}" | sed -n '3p' | tr -d '"')
rm -f "${TMPFILE}"

if [ -z "${UNSEAL_KEY_1}" ] || [ -z "${UNSEAL_KEY_2}" ] || [ -z "${UNSEAL_KEY_3}" ]; then
  echo "ERROR: Could not parse unseal keys from init.json."
  exit 1
fi

# Apply keys
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 "${VAULT_CONTAINER}" \
  sh -c "vault operator unseal '${UNSEAL_KEY_1}'" > /dev/null && echo "  ✓ key 1/3"
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 "${VAULT_CONTAINER}" \
  sh -c "vault operator unseal '${UNSEAL_KEY_2}'" > /dev/null && echo "  ✓ key 2/3"
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 "${VAULT_CONTAINER}" \
  sh -c "vault operator unseal '${UNSEAL_KEY_3}'" > /dev/null && echo "  ✓ key 3/3"

# Confirm
if docker exec "${VAULT_CONTAINER}" \
    sh -c "VAULT_ADDR=http://127.0.0.1:8200 vault status 2>/dev/null | grep -q 'Sealed.*false'"; then
  echo "✓ Vault is unsealed and ready"
else
  echo "ERROR: Vault is still sealed after applying 3 keys."
  echo "       Check: docker exec ${VAULT_CONTAINER} sh -c 'VAULT_ADDR=http://127.0.0.1:8200 vault status'"
  exit 1
fi
