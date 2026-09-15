# Deployment

This repo has two independently deployed pieces (design §7):

1. **The Cloudflare Worker** (`cloudflare/`) — generates and caches the AI cartoons.
2. **The game server** (`apps/funny-multi-server/`, which also serves the built client) —
   a Docker image, run behind Caddy for automatic HTTPS (what production runs) or behind a TLS
   proxy of your own.

Deploy the Worker first: the game server needs its URL and shared secret before it can start.

## What you need

- A **Cloudflare account**. Workers, Workers AI and R2 all have free tiers that cover this
  game's usage; note that Cloudflare asks for a payment method on file before it lets you
  enable R2, even though the free tier itself costs nothing.
- A **Linux host with Docker** (Compose v2 included) that can be reached on ports 80 and 443,
  and SSH access to it. Production is an Oracle Cloud _Always Free_ VM — any VPS works.
- A **domain name** you control, with DNS `A` records for the site name (e.g. `www.example.com`)
  and its bare domain (`example.com`) pointing at the host. Caddy fetches its certificates on
  first boot, so the records must resolve before the first start.
- On the machine you deploy _from_ (your PC is fine): Node 20, git, Docker, `ssh`/`scp` and
  `curl`. On Windows use Git Bash — `deploy/ship.sh` is a bash script and already handles
  Git Bash's path rewriting.

## 1. Deploy the Cloudflare Worker

```bash
git clone https://github.com/oursharedcode/funny-one.git
cd funny-one/cloudflare
npx wrangler login              # npx fetches wrangler on first use — answer "y"

# The image cache (design §7.2) — one bucket, your account. Required.
npx wrangler r2 bucket create funny-multi-images

# Shared secret between the Worker and the game server. Generate any random
# string (e.g. `openssl rand -hex 32`) and paste it when prompted.
npx wrangler secret put WORKER_SECRET

npx wrangler deploy
```

The deploy prints your Worker's URL (`https://funny-multi-image.<your-subdomain>.workers.dev`).
Keep that and the `WORKER_SECRET` value — the game server needs both. A quick check:

```bash
curl -H "X-Secret: <your WORKER_SECRET>" https://funny-multi-image.<your-subdomain>.workers.dev/stats
# → {"date":"2026-09-16","count":0}   (a 403 means the secret doesn't match)
```

### Optional: persistent stats counter

Without this, the Worker's "images generated today" counter resets whenever the Worker's
isolate is recycled. To make it durable:

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

Production (`https://www.staging-oursharedcode.com/funny37-game`) is an Oracle Cloud _Always
Free_ VM (1 GB, Sydney) provisioned by the two scripts in `deploy/oci/` (`network.py`, then
`vm.py` — each file's header says what it creates; both need `pip install oci` and an API key
in `~/.oci/config`). Those scripts are optional: any host from the list above will do.

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
  so write it **without** a trailing slash. Unset means `/` — the game at the root of the
  site name.

### 2a. Once, on the host: the `.env` file

Nothing from this repo needs to be on the host in advance — `ship.sh` copies what it needs.
The one thing you create by hand is the environment file, as the user that will run Docker:

```bash
ssh ubuntu@<host-ip>
mkdir -p ~/funny && cd ~/funny
cat > .env <<'ENV'
CLOUDFLARE_WORKER_URL=https://funny-multi-image.<your-subdomain>.workers.dev
CLOUDFLARE_WORKER_SECRET=<the WORKER_SECRET from step 1>
BASE_PATH=/funny37-game
SITE_HOST=www.example.com
SITE_APEX=example.com
TRUSTED_PROXY_HOPS=1
ENV
chmod 600 .env
exit
```

`.env.example` in the repo documents every variable, including the optional ones
(`DEPLOYER_DONATE_URL` for a "Support this server" button, `MAX_ROOMS`, `MAX_IMAGES_PER_DAY`,
`ROUND_DURATION_MS`, `PORT`). The defaults are right for a family-sized deployment.

### 2b. From your PC: ship it

From your clone, on any machine with Docker (a 1 GB host is too small to build on, so the
image is built here and streamed across; no registry involved):

```bash
deploy/ship.sh ubuntu@<host-ip>          # remote dir defaults to ~/funny
```

`ship.sh` reads `BASE_PATH` and `SITE_HOST` from the host's `.env`, builds the image with it
(tagged with the git commit), `docker save | gzip | ssh … docker load`s it (~80 MB), copies
`docker-compose.yml` and the Caddyfile next to `.env`, runs
`docker compose --profile caddy up -d`, and waits for `https://SITE_HOST/BASE_PATH/health`
to answer through Caddy. The first run takes a minute longer while Caddy obtains its
certificates. Re-run it to deploy a new commit; Caddy keeps its certificates across restarts.

Verified 2026-09-15 on the production VM: the two-stage `node:20-alpine` image (251 MB), the
container idles at ~50 MB with Caddy at ~20 MB, Let's Encrypt certificates for both names on
first boot, HTTP→HTTPS and apex→`www` redirects, and a scripted 3-player room over TLS
WebSockets through Caddy in under a second.

### Variant: your own TLS proxy instead of Caddy

`ship.sh` always uses the Caddy profile. If you already terminate TLS elsewhere (nginx,
Cloudflare Tunnel, …), clone the repo on a host big enough to build (2 GB is plenty), put the
same `.env` at the repo root (`SITE_HOST`/`SITE_APEX` not needed) and run
`docker compose up -d`: you get the game alone on plain HTTP `:3000`, mounted under
`BASE_PATH`, for your proxy to forward to. PWA install and service-worker registration both
require HTTPS, so something must terminate TLS. See the next section before choosing
`TRUSTED_PROXY_HOPS`.

## Trusted proxy hops (`TRUSTED_PROXY_HOPS`)

The per-IP rate limiter (FM-CORE-4) buckets by client IP, read from the right-hand
(proxy-appended) end of the `x-forwarded-for` header — not the left-hand end, which a client
can set to any value it likes and use to pick, or rotate, its own rate-limit bucket.

"Right-hand end, N hops in" is only correct if the request actually crosses exactly N
trusted proxies before reaching the server. Caddy appends the client address to
`x-forwarded-for` and is the only proxy in front of the container, so the default
`TRUSTED_PROXY_HOPS=1` is right for the setup above. Only raise it if you add something in
front (a CDN, a load balancer, Cloudflare's proxy switched on for the DNS record) — one hop
per proxy that appends to `x-forwarded-for` before the server sees it. Setting it too high
re-opens the same spoofing gap this exists to close (a client's own value shifts into the
trusted window).

## After both are deployed — a five-minute check

1. `https://<SITE_HOST><BASE_PATH>/health` answers `{"ok":true}` (this is what `ship.sh`
   waits for).
2. Open `https://<SITE_HOST><BASE_PATH>/` on a phone: Chrome offers "Install app" (Android) or
   Safari's Share → Add to Home Screen (iPhone). No offer means the origin is not HTTPS or the
   service worker failed — check `BASE_PATH` matches what the client was built with.
3. Create a room, join from two more devices (or browser tabs) via the QR code, play a round.
   The reveal should show a cartoon within ~10 s. "Generation failed" on every reveal means
   `CLOUDFLARE_WORKER_URL`/`CLOUDFLARE_WORKER_SECRET` don't match the Worker — compare with
   `wrangler secret list` in `cloudflare/`.
4. Play the same story again: the second reveal is instant (R2 cache hit), and the Worker's
   `/stats` count (the `curl` from step 1) did not move.
5. Logs, when something is off: `ssh ubuntu@<host-ip> 'cd ~/funny && docker compose logs --tail 50'`.
