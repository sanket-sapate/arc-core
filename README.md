# ARC Monorepo

This repository contains:
- Multiple Go services in `apps/`
- Shared packages in `packages/`
- Infrastructure definitions in `infra/`
- Frontend application in `apps/frontend/`

---

## Local Development — Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) running
- [GNU Make](https://www.gnu.org/software/make/) (comes with Git Bash on Windows)
- No other local tools required (Go, Vault CLI, psql, etc. all run inside containers)

### Start the full stack

```bash
# 1. Clone
git clone <repo-url> arc-self && cd arc-self

# 2. Start everything
make dev-up
```

`make dev-up` does all of this automatically:
1. Starts all infrastructure (Postgres, NATS JetStream, Vault, Keycloak, APISIX, Jaeger, Grafana, Prometheus, Loki, Redis)
2. Seeds Vault with local dev secrets — no `vault` CLI required
3. Applies all database migrations via psql inside the Postgres container
4. Restarts Go services so they pick up fresh secrets and the new schema

**First run takes 3–5 minutes** while Docker pulls images and Go compiles the services.
Subsequent runs are near-instant (images and Go build cache are reused).

### Stop and reset

```bash
make dev-down   # stops all containers and removes volumes (full reset)
make infra-down # stops containers but keeps volumes (faster next start)
```

### After a code change

```bash
make dev-restart-services   # restarts only the Go service containers
```

## Production Deployment

The production setup uses pre-built Docker images, a persistent Vault backend, and secure automated secrets management.

### Initial Setup (Fresh Server)

```bash
# 1. Provide environment variables
cp infra/prod/.env.example infra/prod/.env.prod
# (Fill in configuration like SCANNER_API_KEY if needed; Vault token is auto-filled later)

# 2. Build all Docker images
make prod-build

# 3. Initialize Vault, apply database migrations, and seed secrets
make prod-init

# 4. Start the entire application stack
make prod-up
```

*Note: `make prod-init` will automatically initialize Vault (saving the unseal keys to the persistent volume), unseal it, extract and save the `VAULT_ROOT_TOKEN` to your `.env.prod` file, and seed all microservice secrets.*

### Managing Production

```bash
# If the Vault container restarts, it is sealed by default. Re-unseal it:
make prod-unseal

# Stop the stack (preserves persistent volumes and data)
make prod-down
```

---

## Endpoints

| Service | Internal address | Notes |
|---|---|---|
| APISIX gateway | `http://localhost:9080` | All client traffic goes here |
| Keycloak | `http://localhost:8080` | `admin` / `admin` |
| Vault UI | `http://localhost:8200` | token: `root` |
| Jaeger | `http://localhost:16686` | Distributed traces |
| Grafana | `http://localhost:3001` | `admin` / `admin` |
| Prometheus | `http://localhost:9090` | Metrics |

Go services are **not** exposed to the host — they are only reachable via the APISIX gateway or by service name inside the Docker network.

---

## Useful Make targets

```bash
make test-all       # run all unit tests (no infra required)
make test-audit     # run audit-service tests only
make test-trm       # run trm-service tests only
make test-discovery # run discovery-service tests only
make sqlc-all       # regenerate all sqlc DB layer files
make migrate-up     # apply migrations using golang-migrate (advanced)
```

---

## Services

| Service | Port (internal) | Purpose |
|---|---|---|
| `iam-service` | `:8080` | Auth, users, RBAC, Keycloak webhook |
| `audit-service` | `:8080` | Immutable audit log of all domain events |
| `discovery-service` | `:8080` | Data dictionary + PII scan jobs |
| `trm-service` | `:8080` | Third-party risk management |
| `privacy-service` | `:8080` | Privacy requests, DPAs, DPIAs |
| `cdc-worker` | — | CDC outbox → NATS publisher |

## Architecture Notes

- **NATS JetStream** stream `DOMAIN_EVENTS` captures both `outbox.>` (legacy) and `DOMAIN_EVENTS.>` (service-routed) subjects
- **Vault** (dev mode, in-memory) — secrets must be re-seeded after every `docker restart` of the vault container; `make dev-up` handles this automatically
- **Transactional Outbox pattern** — every mutating operation writes an `outbox_events` row in the same DB transaction; the CDC worker publishes it to NATS
