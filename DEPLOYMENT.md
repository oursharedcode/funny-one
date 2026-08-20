# Deployment

This repo has two independently deployed pieces (design §7):

1. **The Cloudflare Worker** (`cloudflare/`) — generates and caches the AI cartoons.
2. **The game server** (`apps/funny-multi-server/`, which also serves the built client) —
   deploy to Render (blueprint included) or self-host with Docker.

Deploy the Worker first: the game server needs its URL and shared secret before it can start.

## 1. Deploy the Cloudflare Worker

Requires a Cloudflare account (Workers AI and R2 are both available on the free plan).

```bash
cd cloudflare
npx wrangler login

# The image cache (design §7.2) — one bucket, your account. Required.
npx wrangler r2 bucket create funny-multi-images

# Shared secret between the Worker and the game server. Generate any random
# string (e.g. `openssl rand -hex 32`) and set it here.
npx wrangler secret put WORKER_SECRET

npx wrangler deploy
```

The deploy prints your Worker's URL (`https://funny-multi-image.<your-subdomain>.workers.dev`).
Keep that and the `WORKER_SECRET` value — the game server needs both.

### Optional: persistent stats counter

Without this, the Worker's "images generated today" counter resets whenever Render's free
tier spins the server down. To make it durable:

```bash
npx wrangler kv namespace create STATS_KV
npx wrangler kv namespace create STATS_KV --preview
```

Uncomment the `[[kv_namespaces]]` block in `cloudflare/wrangler.toml` and paste in the two
ids the commands above print, then `wrangler deploy` again. The Worker runs fine without
this — `worker.js` treats `STATS_KV` as optional.

### Optional: premium phase (Phase 9 only)

`POLAR_ACCESS_TOKEN` and `ENTITLEMENT_SECRET` are only needed once Phase 9 (license
redemption) is in use. Leave them unset until then — an unset `ENTITLEMENT_SECRET` on the
game server means no premium rooms are created.

## 2. Deploy the game server

### Option A — Render (recommended, free plan)

The repo includes `render.yaml`, a Render Blueprint. From the Render dashboard: **New →
Blueprint**, point it at this repo, and Render reads `render.yaml` for the build/start
commands and env var list. It uses Render's native Node runtime — `npm install --include=dev
&& npm run build`, then `npm run start` — not the Dockerfile; there's no reason to pay the
extra build/cold-start cost of a container on the free plan when Render's own Node build does
the same thing.

After the blueprint creates the service, set these in the Render dashboard (marked
`sync: false` in `render.yaml`, so Render won't ask for them until you fill them in):

| Env var                    | Value                                                             |
| -------------------------- | ----------------------------------------------------------------- |
| `CLOUDFLARE_WORKER_URL`    | the Worker URL from step 1                                        |
| `CLOUDFLARE_WORKER_SECRET` | the `WORKER_SECRET` value from step 1                             |
| `DEPLOYER_DONATE_URL`      | optional — shows a "Support this server" button on the end screen |
| `MAX_ROOMS`                | optional — default 500                                            |
| `MAX_IMAGES_PER_DAY`       | optional — default 25; R2 cache hits don't count against this     |

See `.env.example` for the full list, including `TRUSTED_PROXY_HOPS` (below) and
`ROUND_DURATION_MS`/`PORT`, which Render doesn't need to override.

Render's free plan spins the service down after inactivity; the first request after a
spin-down is slow (cold start) but otherwise this is a normal Node web service — no
database, no persistent volume (FM-CORE-2: room state is in-memory only and is meant to be
disposable).

### Option B — self-host with Docker

```bash
cp .env.example .env   # fill in CLOUDFLARE_WORKER_URL / CLOUDFLARE_WORKER_SECRET at minimum
docker compose up
```

`docker-compose.yml` builds `Dockerfile` (single-stage `node:20-alpine`: `npm ci`, `npm run
build`, `npm prune --omit=dev`, then `npm run start`) and reads env vars from `.env` at the
repo root. Put your own TLS-terminating reverse proxy (nginx, Caddy, Cloudflare Tunnel, …) in
front of it — the container itself serves plain HTTP on port 3000, and PWA install +
service-worker registration both require HTTPS.

Unverified: `docker compose up` has not been run against this Dockerfile yet (no Docker
available in the dev sandbox that built it). Run it once before relying on it for a real
deploy, and update this note once confirmed.

## Trusted proxy hops (`TRUSTED_PROXY_HOPS`)

The per-IP rate limiter (FM-CORE-4) buckets by client IP, read from the right-hand
(proxy-appended) end of the `x-forwarded-for` header — not the left-hand end, which a client
can set to any value it likes and use to pick, or rotate, its own rate-limit bucket.

"Right-hand end, N hops in" is only correct if the request actually crosses exactly N
trusted proxies before reaching the server. Render puts one TLS-terminating proxy in front
of every web service, so the default `TRUSTED_PROXY_HOPS=1` is correct for Option A
unchanged. Only raise it if you put something else in front of Render (a CDN, a load
balancer) or in front of your own Docker host — one hop per proxy that appends to
`x-forwarded-for` before the server sees it. Setting it too high re-opens the same
spoofing gap this exists to close (a client's own value shifts into the trusted window).

## After both are deployed

Run the acceptance checklist (T-8.2) against the production URL with real phones, including
disconnect-mid-game → bot, the daily image cap, and a cache-hit replay of the same story.
Then close the Phase-7 device-session items that were parked pending an HTTPS URL: the
DevTools Application → Manifest → Installability panel, a real iPhone + Android PWA install,
and the 60 fps animation-jank check (Gate 7).
