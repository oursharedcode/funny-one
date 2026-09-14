# Deployment

This repo has two independently deployed pieces (design §7):

1. **The Cloudflare Worker** (`cloudflare/`) — generates and caches the AI cartoons.
2. **The game server** (`apps/funny-multi-server/`, which also serves the built client) —
   self-host with Docker behind Caddy (what production runs), or one-click to Render.

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

Without this, the Worker's "images generated today" counter resets whenever the Worker's
isolate is recycled (and, on Render's free tier, whenever the server spins down). To make it
durable:

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

Two options. **A** is what `https://www.staging-oursharedcode.com/funny37-game` runs on; **B**
is the fastest way to get a copy up, at the price of Render's free-plan hibernation.

### Option A — self-host with Docker + Caddy (what production runs)

Any Linux host with Docker will do; production is an Oracle Cloud _Always Free_ VM (1 GB,
Sydney) provisioned by the two scripts in `deploy/oci/` (`network.py`, then `vm.py` — each
file's header says what it creates; both need `pip install oci` and an API key in
`~/.oci/config`). Whatever the host, it needs ports 80 and 443 reachable and DNS `A` records
for your site name (and its bare domain) pointing at it before the first start, because Caddy
fetches its certificates on boot.

Two files make it production rather than "a container on :3000":

- `docker-compose.yml`'s **`caddy` profile** adds Caddy on 80/443 with automatic HTTPS
  (`deploy/caddy/Caddyfile`): it redirects the bare domain to `SITE_HOST`, forwards
  `BASE_PATH/*` to the game container untouched, forwards WebSockets without any extra
  configuration, and 404s everything else on the host — a second game on the same name gets
  its own `handle` block. Certificates live in the `caddy_data` volume.
- **`BASE_PATH`** (`.env`), the URL sub-path the game is served under — `/funny37-game` in
  production, so a sibling game can share the domain (design §1). It must reach two places:
  the image build (the client bakes it into Vite's `base`, the PWA scope and the Socket.IO
  path) and the running server (static prefix, `/health`, Socket.IO path). Compose feeds one
  value to both; the server and client accept any spelling, the Caddyfile pastes it verbatim,
  so write it **without** a trailing slash. Unset means `/`.

On the host, once, as the user that will run it:

```bash
mkdir -p ~/funny && cd ~/funny
# .env — see .env.example. Production's, minus the secret:
#   CLOUDFLARE_WORKER_URL=https://funny-multi-image.<subdomain>.workers.dev
#   CLOUDFLARE_WORKER_SECRET=<the WORKER_SECRET from step 1>
#   BASE_PATH=/funny37-game
#   SITE_HOST=www.example.com
#   SITE_APEX=example.com
#   TRUSTED_PROXY_HOPS=1        # Caddy is the one proxy (see below)
chmod 600 .env
```

Then, from a checkout on any machine with Docker (a 1 GB host is too small to build on, so
the image is built here and streamed across; no registry involved):

```bash
deploy/ship.sh ubuntu@<host-ip>          # remote dir defaults to ~/funny
```

`ship.sh` reads `BASE_PATH` from the host's `.env`, builds the image with it (tagged with the
git commit), `docker save | gzip | ssh … docker load`s it (~80 MB), copies `docker-compose.yml`
and the Caddyfile next to `.env`, runs `docker compose --profile caddy up -d`, and waits for
`https://SITE_HOST/BASE_PATH/health` to answer through Caddy. Re-run it to deploy a new
commit; Caddy keeps its certificates across restarts.

Without the profile — `docker compose up -d` — you get the game alone on plain HTTP `:3000`,
for a TLS proxy of your own (nginx, Cloudflare Tunnel, …); PWA install and service-worker
registration both require HTTPS, so something must terminate TLS.

Verified 2026-09-15 on the production VM: `docker compose up` builds from this Dockerfile
(two-stage `node:20-alpine`, 251 MB), the container idles at ~50 MB with Caddy at ~20 MB,
Let's Encrypt certificates for both names on first boot, HTTP→HTTPS and apex→`www`
redirects, and a scripted 3-player room over TLS WebSockets through Caddy in under a
second.

### Option B — Render (one click, free plan; hibernates)

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

**Free-plan hibernation, measured 2026-08-20.** Expect more than slow cold starts: against a
service that had just served traffic, roughly 30% of requests came back as Render's own 404
with an `x-render-routing: no-server` header, and the pod hostname carried a `-hibernate-`
segment. The application is not involved — its logs show every request that reaches it
returning 200 from a single, never-restarted pid. For a game built on long-lived Socket.IO
connections this matters: an idle room can lose its socket to the routing layer rather than
to any bug in the server. Use a paid instance for anything you expect real players on; the
free plan is fine for a smoke test or a family deploy that tolerates a reconnect. This is why
production moved to Option A (steering decision D-5, 2026-09-14) — a $0 VM that never sleeps.

## Trusted proxy hops (`TRUSTED_PROXY_HOPS`)

The per-IP rate limiter (FM-CORE-4) buckets by client IP, read from the right-hand
(proxy-appended) end of the `x-forwarded-for` header — not the left-hand end, which a client
can set to any value it likes and use to pick, or rotate, its own rate-limit bucket.

"Right-hand end, N hops in" is only correct if the request actually crosses exactly N
trusted proxies before reaching the server. Caddy (Option A) appends the client address to
`x-forwarded-for` and is the only proxy in front of the container, and Render (Option B)
puts exactly one TLS-terminating proxy in front of every web service — so the default
`TRUSTED_PROXY_HOPS=1` is right for both. Only raise it if you add something in front (a
CDN, a load balancer, Cloudflare's proxy switched on for the DNS record) — one hop per proxy
that appends to `x-forwarded-for` before the server sees it. Setting it too high re-opens
the same spoofing gap this exists to close (a client's own value shifts into the trusted
window).

## After both are deployed

Run the acceptance checklist (T-8.2) against the production URL
(`https://www.staging-oursharedcode.com/funny37-game/`) with real phones, including
disconnect-mid-game → bot, the daily image cap, and a cache-hit replay of the same story.
Then close the Phase-7 device-session items that were parked pending an HTTPS URL: the
DevTools Application → Manifest → Installability panel, a real iPhone + Android PWA install,
and the 60 fps animation-jank check (Gate 7).
