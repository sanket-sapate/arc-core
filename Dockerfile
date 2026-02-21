# ─────────────────────────────────────────────────────────────────────────────
# Multi-stage build for all Go services in the monorepo.
#
# Usage:
#   docker build --build-arg SERVICE=audit-service -t arc/audit-service:latest .
#   docker build --build-arg SERVICE=cdc-worker --build-arg CMD=worker -t arc/cdc-worker:latest .
#
# Build args:
#   SERVICE    - service name, used in image tag (required)
#   CMD        - cmd subdir, default: api
#   BUILD_PATH - override full import path, default: ./apps/${SERVICE}/cmd/${CMD}
#                Use this for packages: --build-arg BUILD_PATH=./packages/apisix-go-runner/cmd/go-runner
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM golang:1.26-alpine AS builder

ARG SERVICE
ARG CMD=api
ARG BUILD_PATH=""

RUN test -n "${SERVICE}" || (echo "ERROR: --build-arg SERVICE=<name> is required" && exit 1)

# Install git (needed by some go modules)
RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /workspace

# Copy the entire monorepo — go.work references every module, so all
# apps/*/go.mod files must be present for `go build` to succeed.
# .dockerignore keeps the context lean (excludes .git, frontend, infra).
COPY . .

# Download dependencies with the full workspace active
RUN go work sync && go mod download 2>/dev/null || true

# Resolve build path: use explicit BUILD_PATH if provided, else default to apps/
RUN if [ -n "${BUILD_PATH}" ]; then \
      RESOLVED="${BUILD_PATH}"; \
    else \
      RESOLVED="./apps/${SERVICE}/cmd/${CMD}"; \
    fi && \
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build \
      -ldflags="-w -s -extldflags='-static'" \
      -trimpath \
      -o /bin/service \
      "${RESOLVED}"

# ── Stage 2: minimal runtime image ───────────────────────────────────────────
FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=builder /bin/service /service
# Copy timezone data so time.LoadLocation works
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
# Copy CA certs for outbound TLS (Vault, scanner API, Keycloak)
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

EXPOSE 8080

ENTRYPOINT ["/service"]
