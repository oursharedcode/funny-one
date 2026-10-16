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
- A **domain name** you control, with DNS `A` records for the game's host (e.g.
  `www.funny37.example.com`), its bare name (`funny37.example.com`), the same pair for Funny
  One (`www.funny1.example.com`, `funny1.example.com`) and for the landing page
  (`www.funny-family.example.com`, `funny-family.example.com`), and the older shared host and
  its bare name (`www.example.com`, `example.com` — see `SITE_HOST` below), all pointing at the
  host. Caddy fetches its certificates on first boot, so the records must resolve before the
  first start.
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

# Switch generation on: uncomment the two-line `[ai]` block in wrangler.toml.
# The repository ships it off (see "The generation switch" below), and a fresh
# deployment has no pictures to serve until something generates them.

npx wrangler deploy
```

The deploy prints your Worker's URL (`https://funny-multi-image.<your-subdomain>.workers.dev`).
Keep that and the `WORKER_SECRET` value — the game server needs both. A quick check:

```bash
curl -H "X-Secret: <your WORKER_SECRET>" https://funny-multi-image.<your-subdomain>.workers.dev/stats
# → {"date":"2026-09-16","count":0,"generation":true}   (a 403 means the secret doesn't match)
```

### The generation switch

The `[ai]` block in `cloudflare/wrangler.toml` is the only thing that lets the Worker call the
image model. Commented out, the Worker still serves every picture already in R2 and answers a
request for a new one with `503` — nothing can spend Neurons, not even a caller holding
`WORKER_SECRET`. `/stats` reports the state as `generation`.

That matters on the paid Workers plan, which has no spending cap (a budget alert under Manage
Account → Billing → Billable Usage only emails you): the shared secret is otherwise all that
stands between a leak and the bill. So keep the block on while the library is filling, and
comment it out and `wrangler deploy` again once it is complete. Production has run with it off
since 2026-10-03.

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

### Optional: pre-generate the whole picture library (Phase 9, D-7)

The game only ever asks for one of 10,000 possible pictures. Generating them all once
(`node cloudflare/pregenerate.mjs`, resumable) costs about $21 on the paid Workers AI plan and
about 7 GB of R2 (inside R2's free 10 GB), after which every request is a cache hit, the daily
cap never fires and R2 egress is free. Without it the cache fills organically and
`MAX_IMAGES_PER_DAY` applies. The project's own run used the paid plan, then went back to free
on 2026-10-03 — on free, the 10k neurons/day make a full re-run a several-day job instead of
one.

The batch needs the generation switch on. When `--dry-run` reports nothing missing, switch it
off (above); switch it back on for the re-run after any pool edit.

## 2. Deploy the game server

Production (`https://www.funny37.oursharedcode.com/`) is an Oracle Cloud _Always
Free_ VM (1 GB, Sydney) provisioned by the two scripts in `deploy/oci/` (`network.py`, then
`vm.py` — each file's header says what it creates; both need `pip install oci` and an API key
in `~/.oci/config`). Those scripts are optional: any host from the list above will do.

Two files make it production rather than "a container on :3000":

- `docker-compose.yml`'s **`caddy` profile** adds Caddy on 80/443 with automatic HTTPS
  (`deploy/caddy/Caddyfile`). Four hosts: **`FM_HOST`** is the game's own — Caddy forwards
  everything on it to the game container untouched, WebSockets included, except two files it
  serves itself from `deploy/origin-root/funny37` (B-1b): the privacy policy at `/privacy`
  and `/.well-known/assetlinks.json` for the Android app. It redirects `FM_APEX` (the bare
  name) to `FM_HOST`. **`FO_HOST`** is Funny One's own (2c): static files, served by Caddy
  itself, with `FO_APEX` redirected to it. **`SITE_HOST`** is the older shared host, where
  both games used to live: it forwards their former addresses `/funny37-game` and
  `/funny1-game` to `FM_HOST` and `FO_HOST`, redirects `SITE_APEX` to itself and 404s
  everything else. **`HUB_HOST`** is the landing page's (2d): static files again, with
  `HUB_APEX` redirected to it. A game has its own host because an Android app wrapping it (a
  Trusted Web Activity) bakes the origin in. Certificates live in the `caddy_data` volume.
  Caddy refuses a Caddyfile with an empty site name, so all eight names must be set even when
  you self-host only Funny Multi: point the other six at any names you control, or skip Caddy
  (see the variant below).
- **`BASE_PATH`** (`.env`), the URL sub-path the game is served under — `/` (the default, or
  unset) behind this Caddyfile, since the game owns its host. It must reach two places: the
  image build (the client bakes it into Vite's `base`, the PWA scope and the Socket.IO path)
  and the running server (static prefix, `/health`, Socket.IO path). Compose feeds one value to
  both; `ship.sh` refuses anything but `/`. A sub-path (any spelling is accepted) is for the
  variant below, where your own proxy does the routing.

### 2a. Once, on the host: the `.env` file

Nothing from this repo needs to be on the host in advance — `ship.sh` copies what it needs.
The one thing you create by hand is the environment file, as the user that will run Docker:

```bash
ssh ubuntu@<host-ip>
mkdir -p ~/funny && cd ~/funny
cat > .env <<'ENV'
CLOUDFLARE_WORKER_URL=https://funny-multi-image.<your-subdomain>.workers.dev
CLOUDFLARE_WORKER_SECRET=<the WORKER_SECRET from step 1>
FM_HOST=www.funny37.example.com
FM_APEX=funny37.example.com
FO_HOST=www.funny1.example.com
FO_APEX=funny1.example.com
SITE_HOST=www.example.com
SITE_APEX=example.com
HUB_HOST=www.funny-family.example.com
HUB_APEX=funny-family.example.com
TRUSTED_PROXY_HOPS=1
ENV
chmod 600 .env
exit
```

`.env.example` in the repo documents every variable, including the optional ones
(the `DEPLOYER_*` support rails — PayID + registered name, GitHub Sponsors URL, Lightning
address, Ko-fi and Buy Me a Coffee pages, legacy donate URL — for the Support screen,
`MAX_ROOMS`, `MAX_IMAGES_PER_DAY`,
`ROUND_DURATION_MS`, `PORT`). The defaults are right for a family-sized deployment.

#### Optional: the Support screen

The in-game **Support** screen (♥ on Home, _Support this server_ on the end screen) lists
gift addresses — yours, on your deployment; none are in the code. Add any of these lines to
the same `.env`; the screen shows only the rails you set, and with none set there is no ♥:

```bash
DEPLOYER_PAYID=you@example.com
DEPLOYER_PAYID_NAME="YOUR REGISTERED NAME"
DEPLOYER_SPONSORS_URL=https://github.com/sponsors/<you>
DEPLOYER_LIGHTNING_ADDRESS=you@your-wallet.com
DEPLOYER_KOFI_URL=https://ko-fi.com/<you>
DEPLOYER_BMC_URL=https://buymeacoffee.com/<you>
DEPLOYER_DONATE_URL=https://example.com/donate
```

- `DEPLOYER_PAYID` is the email, phone number or ABN you registered as a PayID (Osko, so
  Australian banks only). `DEPLOYER_PAYID_NAME` must match the registered account name to the
  letter: the payer's bank shows that name before they confirm, and a mismatch makes people
  abort. Check it with a $1 transfer from another account.
- `DEPLOYER_SPONSORS_URL`: GitHub Sponsors defaults to monthly, so create _one-time_ tiers
  and a gift stays a one-off (the screen tells players to choose one).
- `DEPLOYER_LIGHTNING_ADDRESS` is a Lightning address (`user@wallet`), shown as a
  `lightning:` link and a QR code. Pay it once from a second wallet before you publish it.
- `DEPLOYER_KOFI_URL` and `DEPLOYER_BMC_URL` are your Ko-fi and Buy Me a Coffee pages, shown
  as two buttons in those brands' colours under Lightning. Both take card payments, so a
  disputed gift can cost you a dispute fee; leave them unset to offer only the three rails
  above (README → _Why the card rails are optional_).
- `DEPLOYER_DONATE_URL` is any other single link, listed last.

The server reads these once at boot, so restart it after editing:
`cd ~/funny && docker compose --profile caddy up -d` (without `--profile caddy` if you run
your own proxy), or just re-run `ship.sh`. Then `curl https://<FM_HOST>/config` shows what the
screen will list, with `null` for each rail left unset.

### 2b. From your PC: ship it

From your clone, on any machine with Docker (a 1 GB host is too small to build on, so the
image is built here and streamed across; no registry involved):

```bash
deploy/ship.sh ubuntu@<host-ip>          # remote dir defaults to ~/funny
```

`ship.sh` reads `BASE_PATH` and the eight hosts from the host's `.env` (and stops if one is
missing), builds the image with `BASE_PATH` (tagged with the git commit),
`docker save | gzip | ssh … docker load`s it (~80 MB), copies `docker-compose.yml` and the
Caddyfile next to `.env`, streams `deploy/origin-root/funny37` into `static/funny37-root`
(swapped in whole), runs `docker compose --profile caddy up -d`, reloads Caddy, waits for
`https://FM_HOST/health` to answer through Caddy, checks that `/privacy` and
`/.well-known/assetlinks.json` on `FM_HOST` come from Caddy (not the game's `index.html`) and
that `https://SITE_HOST/funny37-game/` forwards to `FM_HOST`. The first run takes a minute longer
while Caddy obtains its certificates. Re-run it to deploy a new commit; Caddy keeps its
certificates across restarts.

**Moving a deployment from a sub-path to its own host** (production did this in B-1a): create
the two new DNS records first; on the host edit `.env` — add `FM_HOST` and `FM_APEX`, set
`BASE_PATH=/` — then run `ship.sh`. The old `/funny37-game` address then forwards, join links
included. One container serves one mount point, so the old address cannot keep serving too
(two containers would split the in-memory rooms), and an installed PWA cannot follow the
forward — a service worker's script may not sit behind a redirect — so it is reinstalled from
the new host.

Verified 2026-09-15 on the production VM: the two-stage `node:20-alpine` image (251 MB), the
container idles at ~50 MB with Caddy at ~20 MB, Let's Encrypt certificates for both names on
first boot, HTTP→HTTPS and apex→`www` redirects, and a scripted 3-player room over TLS
WebSockets through Caddy in under a second.

### 2c. Funny One on its own host (optional)

Funny One («Одна Чепуха: по кругу», `apps/funny-one-client`) has no server — it is a static
PWA that plays fully offline, so it needs no container, image or secret: the same Caddy serves
its files at the root of `FO_HOST` (production: `https://www.funny1.oursharedcode.com/`). It
needs the host set up by 2a–2b first, with `FO_HOST` and `FO_APEX` in its `.env`.

```bash
deploy/ship-funny-one.sh ubuntu@<host-ip>   # remote dir defaults to ~/funny
```

The script builds the client at the root (`BASE_PATH` unset), streams `dist/` into
`~/funny/static/funny-one` (swapped in whole, never half-copied), streams
`deploy/origin-root/funny1` (the privacy policy at `/privacy` and
`/.well-known/assetlinks.json` for an Android app) into `static/funny1-root` and
`deploy/origin-root/funny1-retired` into `static/funny1-retired`, copies the compose file and
Caddyfile, reloads Caddy, and checks the game, `sw.js`, the manifest, the two origin-root
files, the bare-name redirect, the former address (below) and that Funny Multi's `/health`
still answers. Compose mounts `./static` (the parent directory, so the swap is visible
without restarting Caddy); a run that changes the Caddy service's configuration recreates its
container, which drops Funny Multi's open sockets for a moment — clients reconnect on their
own. Caddy sends `no-cache` for the entry files and the service worker, so an installed copy
picks up a new deploy on its next launch, and a year-long `immutable` for the content-hashed
`assets/`.

**Pictures from the Internet (D-10).** The start screen offers a choice between the built-in
pictures (the default; nothing is downloaded) and the cartoons of Funny Multi's pre-generated
library (step 1, "pre-generate the whole picture library"). The choice appears only in a
build that knows where the library is: the script reads `CLOUDFLARE_WORKER_URL` from the
host's `.env` and bakes it in as `VITE_PICTURES_URL`. That address is public either way —
Funny Multi's players already load their pictures from it; the secret is never read. Set
`VITE_PICTURES_URL` yourself to name another library, or set it empty
(`VITE_PICTURES_URL= deploy/ship-funny-one.sh …`) to build without the option. The game
only ever issues `GET <library>/i/<hash>.png`, and draws the built-in picture whenever that
fails.

**The former address** (production moved in Step 60). Until then Funny One lived at
`https://SITE_HOST/funny1-game/`. Every path under it now answers `301` to `FO_HOST` —
except `/funny1-game/sw.js`. Funny One precaches itself completely, so a browser that has
been there answers the old address from its own cache and never asks the server for the page;
the one thing it does ask for is its service worker's script, and a redirect there is ignored.
That path therefore answers with a small retiring worker
(`deploy/origin-root/funny1-retired/sw.js`): it deletes the caches, unregisters itself and
reloads the open pages, which then meet the forward. A copy installed to a home screen from
the old address still has to be reinstalled from the new one — its start address is fixed at
install time.

When a deployment gains Funny One's host, do it in this order: the two DNS records, then
`FO_HOST`/`FO_APEX` in the host's `.env`, then `ship-funny-one.sh`, and only then
`ship.sh` — all three scripts (these two and 2d's) copy the same Caddyfile, and they stop
before copying it if a name is missing, because an empty one would keep Caddy from starting
for both games.

### 2d. The Funny Family landing page (optional)

The landing page «Семейная Чепуха» (`apps/funny-family-site`; production:
`https://www.funny-family.oursharedcode.com/`) introduces both games, links to them and to
this repository, and shows a short trailer, in the games' 15 languages. Like Funny One it is
static files: the same Caddy serves them at the root of `HUB_HOST`, with `HUB_APEX` redirected
to it — no container, image or secret.

```bash
deploy/ship-funny-family.sh ubuntu@<host-ip>   # remote dir defaults to ~/funny
```

The script builds one page per language (English at `/`, the others at `/<code>/`, e.g.
`/ru/`), `/stats/`, a `404.html` and `sitemap.xml`; streams them into
`~/funny/static/funny-family` (swapped in whole); copies the compose file and Caddyfile,
reloads Caddy, and checks the English and Russian pages, `/stats/`, a missing path, the
trailer, the counts (below), the bare-name redirect and that Funny Multi's `/health` still
answers. Pages are sent with `no-cache`, the content-hashed `assets/` with a year-long
`immutable`, the video, flags and fonts with a day.

**Two designs.** Each new tab gets design A (the trailer as a card that plays with sound) or
design B (a silent loop of it behind the top of the page), half and half at random; `?v=a` or
`?v=b` in the address forces one.

**Visit counts** (design DD-15). The page counts its visits and clicks, and Funny Multi counts
the visits that arrive from it and how many of them go on to open the Support screen and pick
a way to give. Each count is a daily total per a few fixed labels — the design, the language,
where the visit came from, a phone or not — with no IP address, cookie or identifier stored,
and nothing is counted when the browser sends Do Not Track or Global Privacy Control, or inside
the Android app. Funny Multi's server keeps the counts: Caddy forwards the page's two count
addresses on `HUB_HOST` (`/api/stats` and `/api/stats/summary`) to it, and compose keeps the
file in the `stats_data` volume, 400 days of it. `https://<HUB_HOST>/stats/` shows them, with
a test of whether one design sends more of its visitors on to Funny Multi than the other; it
is public and kept out of search engines.

Because of the counts the page needs a game server from Step 72 or later, so a deployment
that gains the landing page goes in this order: the two DNS records, then `HUB_HOST`/`HUB_APEX`
in the host's `.env`, then `ship.sh`, and only then `ship-funny-family.sh`.

### Variant: your own TLS proxy instead of Caddy

`ship.sh` always uses the Caddy profile. If you already terminate TLS elsewhere (nginx,
Cloudflare Tunnel, …), clone the repo on a host big enough to build (2 GB is plenty), put the
same `.env` at the repo root (the eight hosts not needed) and run
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

1. `https://<FM_HOST>/health` answers `{"ok":true}` (this is what `ship.sh` waits for).
2. Open `https://<FM_HOST>/` on a phone: Chrome offers "Install app" (Android) or
   Safari's Share → Add to Home Screen (iPhone). No offer means the origin is not HTTPS or the
   service worker failed — check `BASE_PATH` matches what the client was built with.
3. Create a room, join from two more devices (or browser tabs) via the QR code, play a round.
   The reveal should show a cartoon within ~10 s. "Generation failed" on every reveal means
   `CLOUDFLARE_WORKER_URL`/`CLOUDFLARE_WORKER_SECRET` don't match the Worker — compare with
   `wrangler secret list` in `cloudflare/` — or that the generation switch is off on a library
   that is not complete (`"generation":false` in the `curl` from step 1).
4. Play the same story again: the second reveal is instant (R2 cache hit), and the Worker's
   `/stats` count (the `curl` from step 1) did not move.
5. If you set any `DEPLOYER_*` rail: the Home screen has a ♥ in its corner that opens the
   Support screen with exactly those rails. No ♥: `curl` the `/config` route — all `null`
   means the server has not restarted since the `.env` edit, or a variable name is misspelt.
6. With the landing page (2d): open `https://<HUB_HOST>/` in a browser that sends neither Do
   Not Track nor Global Privacy Control, then `https://<HUB_HOST>/stats/` — today's visits
   include yours.
7. Logs, when something is off: `ssh ubuntu@<host-ip> 'cd ~/funny && docker compose logs --tail 50'`.
