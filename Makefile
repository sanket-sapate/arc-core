# ─────────────────────────────────────────────────────────
# Arc Monorepo Makefile
# ─────────────────────────────────────────────────────────

PG_URL ?= postgres://postgres:password@localhost:5432/arc_db?sslmode=disable

# ── Migration Paths ──────────────────────────────────────
MIGRATE_ABC       = infra/migrations/abc
MIGRATE_IAM       = infra/migrations/iam
MIGRATE_AUDIT     = infra/migrations/audit-service
MIGRATE_PRIVACY   = infra/migrations/privacy-service
MIGRATE_DISCOVERY = infra/migrations/discovery-service
MIGRATE_TRM       = infra/migrations/trm-service

# ═══════════════════════════════════════════════════════════
# Migrations
# ═══════════════════════════════════════════════════════════
.PHONY: migrate-abc-up migrate-abc-down \
        migrate-iam-up migrate-iam-down \
        migrate-audit-up migrate-audit-down \
        migrate-privacy-up migrate-privacy-down \
        migrate-discovery-up migrate-discovery-down \
        migrate-trm-up migrate-trm-down \
        migrate-up migrate-down

## Individual service migrations ─────────────────────────

migrate-abc-up:
	migrate -path $(MIGRATE_ABC) -database "$(PG_URL)" up

migrate-abc-down:
	migrate -path $(MIGRATE_ABC) -database "$(PG_URL)" down

migrate-iam-up:
	migrate -path $(MIGRATE_IAM) -database "$(PG_URL)" up

migrate-iam-down:
	migrate -path $(MIGRATE_IAM) -database "$(PG_URL)" down

migrate-audit-up:
	migrate -path $(MIGRATE_AUDIT) -database "$(PG_URL)" up

migrate-audit-down:
	migrate -path $(MIGRATE_AUDIT) -database "$(PG_URL)" down

migrate-privacy-up:
	migrate -path $(MIGRATE_PRIVACY) -database "$(PG_URL)" up

migrate-privacy-down:
	migrate -path $(MIGRATE_PRIVACY) -database "$(PG_URL)" down

migrate-discovery-up:
	migrate -path $(MIGRATE_DISCOVERY) -database "$(PG_URL)" up

migrate-discovery-down:
	migrate -path $(MIGRATE_DISCOVERY) -database "$(PG_URL)" down

migrate-trm-up:
	migrate -path $(MIGRATE_TRM) -database "$(PG_URL)" up

migrate-trm-down:
	migrate -path $(MIGRATE_TRM) -database "$(PG_URL)" down

## All migrations at once ────────────────────────────────

migrate-up: migrate-abc-up migrate-iam-up migrate-audit-up migrate-privacy-up migrate-discovery-up migrate-trm-up
	@echo "✓ All migrations applied"

migrate-down: migrate-trm-down migrate-discovery-down migrate-audit-down migrate-privacy-down migrate-iam-down migrate-abc-down
	@echo "✓ All migrations rolled back"

# ═══════════════════════════════════════════════════════════
# Run Services
# ═══════════════════════════════════════════════════════════
.PHONY: run-abc run-def run-iam run-audit run-cdc run-privacy run-discovery run-trm

run-abc:
	go run apps/abc-service/cmd/api/main.go

run-def:
	go run apps/def-service/cmd/api/main.go

run-iam:
	go run apps/iam-service/cmd/api/main.go

run-audit:
	go run apps/audit-service/cmd/api/main.go

run-cdc:
	go run apps/cdc-worker/cmd/worker/main.go

run-privacy:
	go run apps/privacy-service/cmd/api/main.go

run-discovery:
	go run apps/discovery-service/cmd/api/main.go

run-trm:
	go run apps/trm-service/cmd/api/main.go

# ═══════════════════════════════════════════════════════════
# Tests
# ═══════════════════════════════════════════════════════════
.PHONY: test-abc test-def test-iam test-audit test-cdc \
        test-runner test-core test-privacy test-discovery test-trm test-all

## Individual service tests ──────────────────────────────

test-abc:
	cd apps/abc-service && go test ./internal/... -count=1 -v

test-def:
	cd apps/def-service && go test ./internal/... -count=1 -v

test-iam:
	cd apps/iam-service && go test ./internal/... -count=1 -v

test-audit:
	cd apps/audit-service && go test ./internal/... -count=1 -v

test-cdc:
	cd apps/cdc-worker && go test ./internal/... -count=1 -v

test-privacy:
	cd apps/privacy-service && go test ./internal/... -count=1 -v

test-discovery:
	cd apps/discovery-service && go test ./internal/... -count=1 -v

test-trm:
	cd apps/trm-service && go test ./internal/... -count=1 -v

## Package tests ─────────────────────────────────────────

test-runner:
	AUTHZ_SKIP_INIT=true go test ./packages/apisix-go-runner/plugins/... -count=1 -v

# go-core packages are resolved through the go.work workspace.
# GOWORK=off would break dependency resolution since there is no standalone go.sum.
test-core:
	go test ./packages/go-core/... -count=1 -v

## All tests ─────────────────────────────────────────────

test-all: test-abc test-def test-iam test-audit test-cdc test-runner test-core test-privacy test-discovery test-trm
	@echo "✓ All tests passed"

# ═══════════════════════════════════════════════════════════
# Code Generation
# ═══════════════════════════════════════════════════════════
.PHONY: sqlc-iam sqlc-abc sqlc-def sqlc-audit sqlc-privacy sqlc-discovery sqlc-trm sqlc-all generate-proto

sqlc-abc:
	cd apps/abc-service && sqlc generate

sqlc-def:
	cd apps/def-service && sqlc generate

sqlc-iam:
	cd apps/iam-service && sqlc generate

sqlc-audit:
	cd apps/audit-service && sqlc generate

sqlc-privacy:
	cd apps/privacy-service && sqlc generate

sqlc-discovery:
	cd apps/discovery-service && sqlc generate

sqlc-trm:
	cd apps/trm-service && sqlc generate

sqlc-all: sqlc-abc sqlc-def sqlc-iam sqlc-audit sqlc-privacy sqlc-discovery sqlc-trm
	@echo "✓ All sqlc generated"

# protoc must be run from the go-core package root so that
# --go_opt=paths=source_relative places output directly into
# proto/iam/v1/ instead of creating a github.com/... directory tree.
generate-proto:
	cd packages/go-core && protoc \
		--go_out=. --go_opt=paths=source_relative \
		--go-grpc_out=. --go-grpc_opt=paths=source_relative \
		proto/iam/v1/iam.proto
	@echo "✓ Proto bindings generated"

# ═══════════════════════════════════════════════════════════
# Infrastructure
# ═══════════════════════════════════════════════════════════
.PHONY: infra-up infra-down

infra-up:
	docker compose -f infra/local/docker-compose.yml up -d

infra-down:
	docker compose -f infra/local/docker-compose.yml down

# ═══════════════════════════════════════════════════════════
# Developer Convenience: full local stack in one command
# ═══════════════════════════════════════════════════════════
.PHONY: dev-up dev-down dev-restart-services

## dev-up: full local stack — infra + Vault seed + migrations + service restart
## This is the ONLY command a new developer needs to run on a fresh checkout.
##
##   Prerequisites:
##     - Docker Desktop running
##     - git clone completed
##
##   What it does:
##     1. Starts all infrastructure containers (Postgres, NATS, Vault, Keycloak, APISIX …)
##     2. Seeds Vault with local dev secrets (no vault CLI required)
##     3. Applies all DB migrations via psql in the Postgres container
##     4. Restarts Go services so they pick up fresh secrets + schema
dev-up: infra-up
	@echo ""
	@echo "── Step 1/4: infrastructure containers started ✓"
	@echo ""
	@echo "── Step 2/4: seeding Vault secrets..."
	@bash infra/local/seed_vault.sh
	@echo ""
	@echo "── Step 3/4: applying database migrations..."
	@bash infra/local/run_migrations.sh
	@echo ""
	@echo "── Step 4/4: restarting Go services to pick up fresh config..."
	@docker restart local-audit-service-1 local-trm-service-1 \
		local-discovery-service-1 local-iam-service-1 local-cdc-worker-1 2>/dev/null || true
	@echo ""
	@echo "═══════════════════════════════════════════════════"
	@echo "  ✓  Arc local stack is up!"
	@echo ""
	@echo "  Observability:"
	@echo "    Jaeger:     http://localhost:16686"
	@echo "    Grafana:    http://localhost:3001  (admin/admin)"
	@echo "    Prometheus: http://localhost:9090"
	@echo "    Vault UI:   http://localhost:8200  (token: root)"
	@echo "    Keycloak:   http://localhost:8080  (admin/admin)"
	@echo ""
	@echo "  Gateway:      http://localhost:9080"
	@echo "═══════════════════════════════════════════════════"

## dev-down: stop and remove all containers and volumes (full reset)
dev-down:
	docker compose -f infra/local/docker-compose.yml down -v
	@echo "✓ Stack stopped and all volumes removed"

## dev-restart-services: restart only Go services (after a code change)
dev-restart-services:
	docker restart local-audit-service-1 local-trm-service-1 \
		local-discovery-service-1 local-iam-service-1 local-cdc-worker-1
	@echo "✓ Go services restarted"

# ═══════════════════════════════════════════════════════════
# Production (Docker-based, no k8s)
# ═══════════════════════════════════════════════════════════
PROD_COMPOSE = infra/prod/docker-compose.yml
IMAGE_TAG   ?= latest

.PHONY: prod-build prod-init prod-up prod-down prod-unseal

## prod-build: build all Docker images (run before prod-up or prod-init)
prod-build:
	@echo "Building images (tag: $(IMAGE_TAG))..."
	docker build --build-arg SERVICE=iam-service       --build-arg CMD=api    -t arc/iam-service:$(IMAGE_TAG)       .
	docker build --build-arg SERVICE=audit-service     --build-arg CMD=api    -t arc/audit-service:$(IMAGE_TAG)     .
	docker build --build-arg SERVICE=discovery-service --build-arg CMD=api    -t arc/discovery-service:$(IMAGE_TAG) .
	docker build --build-arg SERVICE=trm-service       --build-arg CMD=api    -t arc/trm-service:$(IMAGE_TAG)       .
	docker build --build-arg SERVICE=privacy-service   --build-arg CMD=api    -t arc/privacy-service:$(IMAGE_TAG)   .
	docker build --build-arg SERVICE=cdc-worker        --build-arg CMD=worker -t arc/cdc-worker:$(IMAGE_TAG)        .
	docker build --build-arg SERVICE=apisix-go-runner  \
	             --build-arg BUILD_PATH=./packages/apisix-go-runner/cmd/go-runner \
	             -t arc/apisix-go-runner:$(IMAGE_TAG)  .
	docker build -f infra/local/keycloak/Dockerfile    -t arc/keycloak:$(IMAGE_TAG)  infra/local/keycloak
	docker build -f Dockerfile.migrator                -t arc/migrator:$(IMAGE_TAG)  .
	@echo "✓ All images built"

## prod-init: first-time setup — starts vault+postgres, runs migrations, inits Vault secrets
## Run this ONCE on a fresh server. Requires infra/prod/.env.prod to exist.
prod-init:
	@test -f infra/prod/.env.prod || (echo "ERROR: copy infra/prod/.env.example to infra/prod/.env.prod and fill in values" && exit 1)
	docker compose -f $(PROD_COMPOSE) --env-file infra/prod/.env.prod up -d postgres vault nats
	@echo "Waiting for Vault and Postgres to start..."
	@sleep 10
	bash infra/prod/init_vault.sh
	@echo "✓ Vault initialised and secrets seeded"
	@echo ""
	@echo "Now run: make prod-up"

## prod-up: start the full production stack (auto-unseals Vault if needed)
prod-up:
	@test -f infra/prod/.env.prod || (echo "ERROR: copy infra/prod/.env.example to infra/prod/.env.prod and fill in values" && exit 1)
	@echo "Starting infrastructure..."
	docker compose -f $(PROD_COMPOSE) --env-file infra/prod/.env.prod up -d postgres vault nats redis jaeger
	@echo "Ensuring Vault is unsealed..."
	@sleep 5
	@bash infra/prod/unseal_vault.sh
	@echo "Starting application services..."
	docker compose -f $(PROD_COMPOSE) --env-file infra/prod/.env.prod up -d
	@echo ""
	@echo "═══════════════════════════════════════════════════"
	@echo "  ✓  Arc production stack is up!"
	@echo "  Gateway: http://<your-server-ip>:9080"
	@echo "  Keycloak: http://<your-server-ip>:8090"
	@echo "═══════════════════════════════════════════════════"


## prod-down: stop the production stack (volumes are preserved)
prod-down:
	docker compose -f $(PROD_COMPOSE) --env-file infra/prod/.env.prod down
	@echo "✓ Production stack stopped (volumes preserved)"

## prod-unseal: re-unseal Vault after a vault container restart
prod-unseal:
	bash infra/prod/unseal_vault.sh

