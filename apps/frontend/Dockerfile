# ─────────────────────────────────────────────────────────────────────────────
# Multi-stage Dockerfile for the ARC Frontend
#
# Build stage:  Node 20 + Vite build (SPA mode)
# Serve stage:  nginx:alpine serving static assets
#
# Environment variables (VITE_*) are baked in at build time.
# Pass them via --build-arg or use the appropriate .env file.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Build the application ──────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Copy dependencies from the previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args for environment injection at build time
# These override values from .env files when passed via docker-compose or CLI
ARG VITE_API_URL
ARG VITE_KEYCLOAK_URL
ARG VITE_CALLBACK_URL
ARG VITE_KEYCLOAK_CLIENT_ID
ARG VITE_ARC_ORG_ID
ARG VITE_PUBLIC_API_URL

# Set as env vars so Vite picks them up during build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_KEYCLOAK_URL=${VITE_KEYCLOAK_URL}
ENV VITE_CALLBACK_URL=${VITE_CALLBACK_URL}
ENV VITE_KEYCLOAK_CLIENT_ID=${VITE_KEYCLOAK_CLIENT_ID}
ENV VITE_ARC_ORG_ID=${VITE_ARC_ORG_ID}
ENV VITE_PUBLIC_API_URL=${VITE_PUBLIC_API_URL}

# Build in SPA mode (no SSR) for static Nginx serving
RUN sed -i 's/ssr: true/ssr: false/' react-router.config.ts && \
    npm run build

# ── Stage 3: Serve with Nginx ───────────────────────────────────────────────
FROM nginx:alpine AS production

# Remove default Nginx config and static files
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy our Nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built static assets from the build stage
# React Router SPA build outputs to build/client/
COPY --from=build /app/build/client /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]