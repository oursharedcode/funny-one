# Funny Family «Чепуха 37» — self-hosted container image (T-8.1, FM-NFR-3).
# Adapted from docs/source_project (spec §16 step 14) for the npm-workspaces
# layout: shared/client/server package.json live under apps/*, packages/*
# rather than at the repo root. The server process serves the built client
# bundle (index.ts CLIENT_DIST) — no nginx sidecar. The Cloudflare Worker is
# deployed separately via wrangler, not dockerised.
#
# Two stages. The first single-stage version pruned dev dependencies after
# building, which cannot shrink an image: the `npm ci --include=dev` layer
# (451 MB) was already written, so the result was 785 MB. Now the build tooling
# never reaches the runtime stage, which installs only the server workspace's
# production dependencies and copies the three dist/ trees across.
#
# BASE_PATH (requirements D-5): the URL sub-path the app is served under —
# unset/`/` on Render, `/funny37-game` behind the owner's Caddy. It must reach
# BOTH stages: the client bakes it in at build time (Vite `base`, PWA scope,
# Socket.IO path) and the server reads it at runtime (static prefix, /health,
# Socket.IO path). docker-compose.yml passes one value to both places.
#
#   docker build --build-arg BASE_PATH=/funny37-game -t funny-multi .

# ---- build stage -----------------------------------------------------------
FROM node:20-alpine AS build

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
# into dist). BASE_PATH is read by apps/funny-multi-client/vite.config.ts.
COPY . .
ARG BASE_PATH=/
ENV BASE_PATH=$BASE_PATH
RUN npm run build

# ---- runtime stage ---------------------------------------------------------
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Production dependencies of the server workspace only. The other workspace
# manifests are still copied so npm can reconcile the lockfile, but nothing of
# theirs is installed: the client is a static bundle by now, and @funny/shared
# arrives as its built dist/ below (the workspace symlink npm creates for it
# points there).
COPY package.json package-lock.json ./
COPY apps/funny-multi-client/package.json ./apps/funny-multi-client/package.json
COPY apps/funny-multi-server/package.json ./apps/funny-multi-server/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY cloudflare/package.json ./cloudflare/package.json
RUN npm ci --omit=dev --workspace apps/funny-multi-server

COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/funny-multi-server/dist ./apps/funny-multi-server/dist
COPY --from=build /app/apps/funny-multi-client/dist ./apps/funny-multi-client/dist

ARG BASE_PATH=/
ENV BASE_PATH=$BASE_PATH
EXPOSE 3000
CMD ["npm", "run", "start", "-w", "apps/funny-multi-server"]
