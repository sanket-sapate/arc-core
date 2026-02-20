# ─────────────────────────────────────────────────────────
# Arc Monorepo Makefile
# ─────────────────────────────────────────────────────────

PG_URL ?= postgres://postgres:password@localhost:5432/arc_db?sslmode=disable

# ── Migration Paths ──────────────────────────────────────
MIGRATE_ABC  = infra/migrations/abc
MIGRATE_DEF  = infra/migrations/def
MIGRATE_IAM  = apps/iam-service/infra/migrations

# ═══════════════════════════════════════════════════════════
# Migrations
# ═══════════════════════════════════════════════════════════
.PHONY: migrate-abc-up migrate-abc-down \
        migrate-def-up migrate-def-down \
        migrate-iam-up migrate-iam-down \
        migrate-up migrate-down

## Individual service migrations ─────────────────────────

migrate-abc-up:
	migrate -path $(MIGRATE_ABC) -database "$(PG_URL)" up

migrate-abc-down:
	migrate -path $(MIGRATE_ABC) -database "$(PG_URL)" down

migrate-def-up:
	migrate -path $(MIGRATE_DEF) -database "$(PG_URL)" up

migrate-def-down:
	migrate -path $(MIGRATE_DEF) -database "$(PG_URL)" down

migrate-iam-up:
	migrate -path $(MIGRATE_IAM) -database "$(PG_URL)" up

migrate-iam-down:
	migrate -path $(MIGRATE_IAM) -database "$(PG_URL)" down

## All migrations at once ────────────────────────────────

migrate-up: migrate-abc-up migrate-def-up migrate-iam-up
	@echo "✓ All migrations applied"

migrate-down: migrate-iam-down migrate-def-down migrate-abc-down
	@echo "✓ All migrations rolled back"

# ═══════════════════════════════════════════════════════════
# Run Services
# ═══════════════════════════════════════════════════════════
.PHONY: run-abc run-def run-iam run-audit run-cdc

run-abc:
	go run apps/abc-service/cmd/api/main.go

run-def:
	go run apps/def-service/cmd/api/main.go

run-iam:
	go run apps/iam-service/cmd/api/main.go

run-audit:
	go run apps/audit-service/cmd/api/main.go

run-cdc:
	go run apps/cdc-worker/cmd/bg/main.go

# ═══════════════════════════════════════════════════════════
# Tests
# ═══════════════════════════════════════════════════════════
.PHONY: test-abc test-def test-iam test-audit test-cdc \
        test-runner test-core test-all

## Individual service tests ──────────────────────────────

test-abc:
	go test ./apps/abc-service/internal/... -count=1 -v

test-def:
	go test ./apps/def-service/internal/... -count=1 -v

test-iam:
	go test ./apps/iam-service/internal/... -count=1 -v

test-audit:
	go test ./apps/audit-service/internal/... -count=1 -v

test-cdc:
	go test ./apps/cdc-worker/internal/... -count=1 -v

## Package tests ─────────────────────────────────────────

test-runner:
	AUTHZ_SKIP_INIT=true go test ./packages/apisix-go-runner/plugins/... -count=1 -v

test-core:
	GOWORK=off go test ./packages/go-core/... -count=1 -v

## All tests ─────────────────────────────────────────────

test-all: test-abc test-def test-iam test-audit test-cdc test-runner
	@echo "✓ All tests passed"

# ═══════════════════════════════════════════════════════════
# Code Generation
# ═══════════════════════════════════════════════════════════
.PHONY: sqlc-iam sqlc-abc sqlc-def sqlc-all generate-proto

sqlc-iam:
	cd apps/iam-service && sqlc generate

sqlc-abc:
	cd apps/abc-service && sqlc generate

sqlc-def:
	cd apps/def-service && sqlc generate

sqlc-all: sqlc-abc sqlc-def sqlc-iam
	@echo "✓ All sqlc generated"

generate-proto:
	cd packages/go-core && protoc --go_out=. --go_opt=paths=source_relative --go-grpc_out=. --go-grpc_opt=paths=source_relative proto/iam/v1/iam.proto
	@echo "✓ Proto bindings generated"

# ═══════════════════════════════════════════════════════════
# Infrastructure
# ═══════════════════════════════════════════════════════════
.PHONY: infra-up infra-down

infra-up:
	docker compose -f infra/local/docker-compose.yml up -d

infra-down:
	docker compose -f infra/local/docker-compose.yml down
