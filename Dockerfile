# Funny Family «Чепуха 37» — self-hosted container image (T-8.1, FM-NFR-3).
# Adapted from docs/source_project (spec §16 step 14) for the npm-workspaces
# layout: shared/client/server package.json live under apps/*, packages/*
# rather than at the repo root. Single-stage node:20-alpine: install, build,
# drop dev tooling, run. The server process serves the built client bundle
# (index.ts CLIENT_DIST) — no nginx sidecar. The Cloudflare Worker is
# deployed separately via wrangler, not dockerised.
FROM node:20-alpine

WORKDIR /app

# Install dependencies first for layer caching. npm ci needs every
# workspace's package.json present before it runs. --include=dev forces the
# build tooling in regardless of any inherited NODE_ENV.
COPY package.json package-lock.json ./
COPY apps/funny-multi-client/package.json ./apps/funny-multi-client/package.json
COPY apps/funny-multi-server/package.json ./apps/funny-multi-server/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY cloudflare/package.json ./cloudflare/package.json
RUN npm ci --include=dev

# Build shared -> client + server (the server build also copies i18n JSON
# into dist), then prune dev-only dependencies to slim the image.
COPY . .
RUN npm run build && npm prune --omit=dev

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start", "-w", "apps/funny-multi-server"]
