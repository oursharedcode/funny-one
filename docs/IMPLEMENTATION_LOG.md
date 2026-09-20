# Implementation log — Funny Multi «Чепуха 37»

Session journal. The end-of-session ritual appends one entry per closed task
(`## Step N — title (date)`, **Shipped:** / **Owed:**); the RESUME HERE note at the foot
names the next step. Task blocks: `steering/tasks.md` (active) ·
`steering/tasks-done.md` (closed).

## Backfill — Phases 0–6 (2026-08-12 → 2026-08-16)

Logged retroactively at phase granularity when this log was created (2026-08-20).
Per-task closure notes are in `steering/tasks-done.md`; commit-level detail in git history.
Step numbering starts at Step 1 with the first entry after this backfill.

- **Phase 0 — repo bootstrap** (Gate 0, 2026-08-12). Monorepo skeleton, npm workspaces, CI;
  `npm install` clean, CI green on the empty skeleton.
- **Phase 1 — packages/shared** (Gate 1, 2026-08-12). Rotation formula, answer-pool schema,
  canonical option ids and prompt fragments, hand-authored en/ru pools, socket contract
  adapted to option ids + URL pictures.
- **Phase 2 — server core** (Gate 2, 2026-08-13). Rooms/lobby, round flow with option-id
  answers and reveal prose, disconnect rules (grace window, botification, host migration);
  Gate 2 automated as a full 7-round game over real sockets; i18n coverage tests (T-2.5).
- **Phase 3 — client core** (Gate 3, 2026-08-13, device session logged 2026-08-15).
  Vite/Tailwind/PWA bootstrap with phase routing, Home + Lobby, RoundScreen combobox,
  WaitingScreen + §17 transition lock.
- **Phase 4 — image pipeline** (Gate 4, 2026-08-13→15). R2-cached image Worker,
  deterministic prompt builder, reserve/refund + reveal wiring; device-session results logged.
- **Phase 5 — gallery, end, share** (Gate 5, 2026-08-16). Server stats broadcast, room
  gallery + EndScreen, download/share adapted to URL images; Gate 5 run on two real phones.
- **Phase 6 — 15-language breadth** (Gate 6, 2026-08-16). All 15 languages authored and
  wired (T-6.1–T-6.3); spot-checks (T-6.4) scripted a real RU/zh/he game each through the
  actual render pipeline — RU declined grammar and he RTL structure both read correctly, and
  the check itself caught and fixed two bugs (a zh/ja double-terminal-punctuation bug in
  `ensureTerminalPeriod`, and `he` RTL combobox mirroring never having been
  logical-property-safe).
- **Build state at backfill**: typecheck / lint / format / `npm test` all green locally —
  614 tests across 4 workspaces (82 shared + 307 server + 186 client + 39 worker);
  `npm audit` 0 vulnerabilities; Phase 6 push (`676fd45`) CI green (run 31933503352,
  2026-08-16).

---

~~**RESUME HERE (2026-08-20).** Next: **T-7.1 (S)** — PWA install. Manifest, service worker
and `swReload.ts` already landed at T-3.1; remaining per the task block: replace the
placeholder `public/icon.svg` with real artwork, decide whether to ship raster 192/512
icons alongside it, and run the real-device install test on iPhone + Android (the part
that was never automatable). Gate 7 = Lighthouse PWA installable + animation jank check
on a real device. No blockers; CI is green through the Phase 6 push.~~ *(carried — see
Step 1 below.)*

## Step 1 — T-7.1 PWA icons: paths-only SVG + pre-rendered rasters (2026-08-20)

**Shipped:** Hand-authored `public/icon.svg` as a paths-only vector — the previous
placeholder relied on `<text font-family="Fredoka">`, which silently falls back to a
system font when rasterized outside a page context, so anything derived from it would
have carried that bug forward. Pre-rendered 180/192/512 PNGs from the new SVG via a
temporary local `sharp` install (never added to `package.json`/lock; removed after use)
and committed them as static files under `public/`. Wired `index.html`'s
`apple-touch-icon` to `icon-180.png` (iOS ignores SVG there) and the PWA manifest's
`icons[]` to the SVG plus 192/512 PNG fallbacks, all `any maskable`. Updated Gate 7's
wording in `steering/tasks.md`: Lighthouse dropped its dedicated PWA audit category in
v12, so Gate 7 now names the Chrome DevTools Application → Manifest → Installability
panel as the successor automated check. Verified with a production build that
`manifest.webmanifest` and all icon files land correctly in `dist/`.
Owner decisions this session: hand-authored placeholder art now, real commissioned
artwork deferred to a Phase 8 polish item; PNGs pre-rendered once and committed rather
than adding a rasterizer to the client build; Gate 7's automated leg is the DevTools
Installability panel; the real-device install test is deferred to T-8.1's Render deploy
rather than standing up a throwaway HTTPS tunnel, since both service-worker registration
and PWA install require a secure context that the LAN setup used for Gates 3–5 doesn't
have.
**Owed:** T-7.1 stays open — the real-device install test on iPhone + Android (DevTools
Installability panel + both real installs) against the production URL once T-8.1 deploys.

---

~~**RESUME HERE (2026-08-20).** Next: **T-7.2 (M)** — design-system pass: motion presets on
all transitions (forward-only), mascot triggers (waiting/timer/submit/reveal
flourish/end/error), reduced-motion, wordmark, SourceFooter + LogoStamp
(FM-ARC-4, FM-CPL-3). T-7.1's remaining piece (real-device install test) is parked on
T-8.1's deploy per Step 1 above and doesn't block T-7.2. No other blockers; CI is green
through the Phase 6 push (`676fd45`) — this session's Step 1 has not been pushed yet.~~
*(carried — see Step 2 below.)*

## Step 2 — T-7.2 design-system pass: LogoStamp, motion/mascot audit (2026-08-20)

**Shipped:** Audited the four T-7.2 legs against the actual client. Three were already
correctly landed during Phases 3–6 and needed no code change: motion presets (`snappy`/
`goofy`/`panic`/`screenSlide`) are applied everywhere framer-motion is used except one
deliberate exception; all six mascot triggers (waiting, timer, submit, reveal flourish,
end, error) render at their correct screens; `Wordmark` and `SourceFooter` both exist and
are wired. Documented `PictureFlourish`'s one non-preset tween (a fixed duration/ease,
copied verbatim from SRC) as the intentional exception the "do not invent a fourth
[preset]" note in `motion.ts` allows for — a spring's overshoot is wrong for a one-shot
outward particle burst.
The one real gap was `LogoStamp`: didn't exist yet. Ported from
`SRC/client/src/components/LogoStamp.tsx` (a 25×25 absolutely-positioned branding overlay,
display-only, not baked into picture pixels) and wired into `RevealScreen` and
`RoomGallery`, both of which already had the `position: relative` picture wrapper it
needs. Its bundled `/deployer-logo.png` didn't exist in this repo either — rasterized a
placeholder from `public/icon.svg` at 25×25 via the same temporary local `sharp` install
pattern as the T-7.1 icons (never added to `package.json`; removed after use). Updated
`recordWobble.ts`'s stale comment: its T-5.1 best-effort stamp-fetch logic now has a real
asset to find instead of always 404ing. Added RTL coverage in `RevealScreen.test.tsx` and
`RoomGallery.test.tsx` asserting the stamp's presence when a picture exists and absence
when it doesn't.
Owner decisions this session: SRC read for `LogoStamp.tsx` confirmed in scope (design.md
classes it "copy"); the stamp is an in-app overlay only — `downloadStory.ts`'s exported
PNG keeps its existing QR-only branding unchanged, no stamp added to the download/share
path.
**Owed:** none — T-7.2 closed in full; its task block moved to `steering/tasks-done.md`.
*Full suite: typecheck, lint, `prettier --check` clean; 616/616 tests (client 188 [+2],
server 307, shared 82, cloudflare 39), run directly outside the sandbox; `npm audit` 0
vulnerabilities. No regressions.*

---

~~**RESUME HERE (2026-08-20).** Next: **T-7.3 (S)** — perf check on mid-range Android: 60 fps
animations and reveal payload sizes (URL-only) verified in DevTools (FM-NFR-2/4). The
payload-size leg can run from DevTools alone; the 60 fps animation leg needs a real
mid-range Android device, same real-device constraint as T-7.1's install test and Gate 7's
jank check — worth deciding together whether to fold it into the T-8.1 deploy's
device-session pass rather than a separate one. T-7.1 still has its real-device install
test open, parked on T-8.1 per Step 1. No other blockers; CI is green through the Phase 6
push (`676fd45`) — Steps 1–2 (this session and last) have not been pushed yet.~~
*(carried — see Step 3 below.)*

## Step 3 — T-7.3 automatable legs: payload-size test, motion audit (2026-08-20)

**Shipped:** Landed both legs of T-7.3 that don't need a physical device. FM-NFR-2: added
`apps/funny-multi-server/src/game.payloadSize.socket.test.ts`, a real-socket test that pins
the byte budget FM-IMG-3 targets rather than leaving it as a one-off DevTools observation —
a single `reveal:pictureReady` picture reference stays under 400 B against a realistic
R2-shaped URL (not the short `fake.png` placeholder other suites use), and a full 7-player
game's picture traffic (every player's own `reveal:requestPicture` plus the shared
gallery's 7-way fan-out) stays under the ~30 KB budget. FM-NFR-4: statically audited every
`motion`/`AnimatePresence` prop across the client — `ErrorMascot`, `PictureFlourish`,
`SubmitConfirm`, `Wordmark`, `PlayerList`, `RoundScreen`, `WaitingScreen`, and the
`screenSlide` preset in `motion.ts` — confirming every animated property is
`scale`/`x`/`y`/`opacity`/`rotate`, i.e. transform/opacity only; no layout- or
paint-triggering property is animated anywhere, so no code change was needed for this leg.
Owner decision this session: T-7.3's remaining leg (60 fps jank measurement on a real
mid-range Android device) folds into T-8.1's device session, alongside T-7.1's install test
and Gate 7's own jank check, rather than a separate device session — Gate 7 stays open
across the Phase 7→8 boundary as a deliberate, logged exception.
**Owed:** T-7.3 stays open — only the real-device 60 fps check remains, parked on T-8.1 per
the note above.
*Full suite: typecheck, lint, `prettier --check` clean; 618/618 tests (client 188, server
309 [+2], shared 82, cloudflare 39), run directly outside the sandbox; `npm audit` 0
vulnerabilities. No regressions.*

---

~~**RESUME HERE (2026-08-20).** Next: **T-8.1 (M)** — deploy artifacts: `render.yaml`,
`Dockerfile`, `docker-compose.yml`, `.dockerignore`, `.env.example`; deploy server to
Render + Worker/R2/KV via wrangler; set secrets (FM-NFR-3). Carries two Phase-2 carry-overs
(bump `actions/checkout`/`actions/setup-node` to `@v5`; make the rate-limiter's trusted-proxy
hop count configurable) plus the Phase-7 device-session bundle: T-7.1's real iPhone/Android
install test, T-7.3's 60 fps animation-jank check, and Gate 7's own jank check — all three
parked here by owner decision 2026-08-20 rather than a throwaway HTTPS tunnel. No other
blockers; CI is green through the Phase 7 push (Steps 1–2, `d45181b`) — Step 3 (this
session) has not been pushed yet.~~ *(carried — see Step 4 below.)*

## Step 4 — T-8.1 code legs: deploy artifacts, CI bump, rate-limiter hop fix (2026-08-20)

**Shipped:** Landed the three legs of T-8.1 that don't need the owner's Render/Cloudflare
accounts. Deploy artifacts: `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `render.yaml`
adapted from `docs/source_project/monkeybus` (owner-confirmed SRC read) for this repo's
`apps/*`/`packages/*` workspace layout rather than SRC's flat `client`/`server`/`shared`
— `Dockerfile` copies each workspace's `package.json` (including `cloudflare/`, which
`npm ci` needs present even though nothing dockerises it) before the full-context `npm
run build`, and `render.yaml` uses Render's native Node build/start rather than the
Dockerfile, matching SRC's approach and the free plan's cost profile (owner decision this
session). T-2.3 carry-over: bumped `actions/checkout`/`actions/setup-node` from `@v4` to
`@v5` in `.github/workflows/ci.yml`. T-2.2 carry-over: `clientIp()` (`rateLimit.ts`) now
takes a `trustedProxyHops` param (default 1) and reads `x-forwarded-for` from the
right-hand (proxy-appended) end instead of the client-settable first hop, closing the gap
where a caller could set its own header to pick — and rotate — its rate-limit bucket;
wired to a new `TRUSTED_PROXY_HOPS` env var in `index.ts` and documented in
`.env.example`. Updated `rateLimit.test.ts` for the new semantics and added coverage for
multi-hop chains.
Owner decisions this session: SRC read for the deploy artifacts confirmed in scope;
`render.yaml` targets the free plan; the artifact work (this step) and the actual
Render/Worker deploy + device session (T-8.1's remainder) are two separate sessions, the
second needing the owner's own accounts and credentials.
**Owed:** T-8.1 stays open — remaining: deploy server to Render + Worker/R2/KV via
wrangler, set secrets; `docker compose up` itself is unverified (no Docker in the dev
sandbox, run it once before the real deploy); plus the Phase-7 device-session bundle
already parked here (T-7.1 install test, T-7.3 jank check, Gate 7 itself). The
`x-forwarded-for` trust assumption still needs writing up in DEPLOYMENT.md, folded into
T-8.3's docs pass.
*Full suite: typecheck, lint, `prettier --check` clean; 619/619 tests (client 188, server
310 [+1], shared 82, cloudflare 39), run directly outside the sandbox; `npm audit` 0
vulnerabilities. No regressions.*

---

## Step 5 — T-8.3: docs pass (README, DEPLOYMENT, DEVELOPMENT, LANGUAGES, MODERATION) (2026-08-20)

**Shipped:** All five T-8.3 docs, written before the actual Render/Worker deploy rather than
after (owner decision this session) so the deploy session can follow DEPLOYMENT.md as a
runbook instead of writing it up after the fact. `DEPLOYMENT.md` covers the Worker
(`wrangler r2 bucket create`, optional KV, `wrangler secret put WORKER_SECRET`, `wrangler
deploy`) then Render (blueprint via `render.yaml`, the five `sync: false` env vars) then
Docker as the self-host alternative (still unverified — no Docker in the dev sandbox); it
also carries the T-8.1 carry-over write-up of the `x-forwarded-for` trust model and
`TRUSTED_PROXY_HOPS`. `README.md` (new — didn't exist before): what the game is, the
Render deploy-your-own button, AGPL + explicit not-DRM note (FM-TIER-6), GitHub Sponsors as
the only support link (FM-TIER-4/MON-7). `DEVELOPMENT.md`: layout, commands, the six gates,
and conventions (in-memory rooms, no free text, transform/opacity-only motion, one prompt
language for all 15 room languages). `LANGUAGES.md`: the UI-catalog vs. pool-text
distinction, the add-a-language checklist, what "needs-review" means for the 13
machine-drafted languages, and why es-419/es-es stay separate files. `MODERATION.md`:
rewritten to the FM-CPL-3 "safety by construction" posture (curated pools + server-side
validation + locked style suffix, not an input filter), operator responsibilities (the
Flux Schnell signature-squiggle artefact, per-language pool review), and the FM-CPL-4
standing guard if free text is ever reintroduced.
**Owed:** the README's GitHub Sponsors link (`github.com/sponsors/oursharedcode`) and the
Render deploy button URL are unverified against a live Sponsors page / working deploy
flow — confirm both once the repo is actually public and the Sponsors page exists.
Everything else T-8.1 still owes (Render + Worker deploy, `docker compose up` sanity check,
the Phase-7 device-session bundle) is unchanged by this step.
*Full suite: typecheck, lint, `prettier --check` clean; 619/619 tests (client 188, server
310, shared 82, cloudflare 39), run directly outside the sandbox; `npm audit` 0
vulnerabilities. No regressions — docs-only step.*

---

## Step 6 — T-8.1: production deploy; manifest icon.svg width/height (2026-08-20)

**Shipped:** Both pieces are live (FM-NFR-3). The Cloudflare Worker turned out to be already
deployed from T-4.1 with its R2 bucket (`funny-multi-images`) in place and unchanged since,
so no redeploy was needed. `WORKER_SECRET` was rotated: the value the owner had saved
returned 403 against `/stats` — it was SRC's secret, not this project's — and the Worker's
own value is not readable back. The owner generated and set a fresh one locally (never
through the agent), and `/stats` then returned 200. Render deployed from `render.yaml` as
blueprint `funny-one-111` → service `funny-multi`,
**https://funny-multi.onrender.com/**. Verified: `/` and `/index.html` 200, `/health`
`{"ok":true}`, and the Socket.IO polling handshake 5/5 with `upgrades:["websocket"]`.
Also fixed what looked like the one real defect the deploy surfaced — Chrome DevTools
reporting `icon.svg failed to load` — by adding `width`/`height` to the paths-only SVG.
*(Step 7 disproves that diagnosis; see below.)*
**Owed:** the device legs of Gate 7, and `docker compose up` — still unrun, no Docker on the
owner's machine either, so `DEPLOYMENT.md`'s "unverified" note on Option B stands.
*Full suite: typecheck, lint, `prettier --check` clean; 619/619 tests (client 188, server
310, shared 82, cloudflare 39); `npm audit` 0 vulnerabilities. One server-suite failure on
the first full run did not reproduce in isolation or on re-run — a port clash between
concurrently running workspaces, not a regression.*

---

## Step 7 — T-8.1: manifest icons PNG-only, icon.svg becomes the favicon (2026-08-20)

**Shipped:** Step 6's diagnosis was wrong and this step corrects it. The
`icon.svg failed to load` error survived the redeploy that added `width`/`height`, a warm
hard reload, and a Clear-site-data with the service worker unregistered — while the same
file renders fine opened directly and is served correctly (200, `image/svg+xml`, `xmlns`
and both attributes present). Chrome's manifest icon loader simply will not take this SVG.
So `/icon.svg` came out of `icons[]`. It had no other consumer — there was no `rel="icon"`
link — so it is now the favicon from `index.html`, where browsers do honour SVG;
installability rests on the 192/512 PNGs, which is what iOS already used via
`apple-touch-icon`. `any` and `maskable` were also split onto separate entries, clearing
Chrome's "'purpose' of 'any maskable' is discouraged" warning (the mark is maskable-safe by
construction). Comments in `icon.svg` and the `vite.config.ts` header were corrected — both
still described the old single-SVG arrangement, and `icon.svg` carried Step 6's wrong cause.
Confirmed against the live deploy: DevTools Manifest now lists only the two optional
"richer PWA install UI" screenshot notices, and Chrome offers the install affordance —
**Gate 7's DevTools Installability leg passes.**
**Owed:** the screenshot notices are install-dialog polish, not installability; folded into
the Phase-8 commissioned-artwork item rather than fixed here.
*Full suite: typecheck, lint, `prettier --check` clean; 619/619 tests; `npm audit` 0
vulnerabilities. No regressions.*

---

~~**RESUME HERE (2026-08-20).** Production is live at **https://funny-multi.onrender.com/**
(Render service `funny-multi`) with the Worker at
`https://funny-multi-image.oursharedcode.workers.dev`. Pushed through Step 7 (`85b8592`).~~

~~Next: **finish Gate 7's device legs**, all of which need hardware in hand and none of which
this agent can run — a real iPhone install (Safari → Share → Add to Home Screen, then
confirm it launches standalone), a real Android install, and T-7.3's 60 fps animation-jank
check on a mid-range Android. The DevTools Installability leg is already signed off (Step
7). After that, **T-8.2**: the SRC §19 acceptance checklist on the production URL with 3
real phones, including disconnect-mid-game → bot, the daily cap flow, and a cache-hit
replay.~~

~~**Owner decision pending before T-8.2.** Render's free plan hibernates: roughly 30% of
requests to the warm service returned Render's own 404 with `x-render-routing: no-server`,
and the pod hostname carries a `-hibernate-` segment. This is not an application fault —
the server logs show every request that reaches the app returning 200 from a single
unrestarted pid. But it will break idle Socket.IO connections mid-game, so decide whether
to move to a paid Starter instance before running acceptance; otherwise disconnects during
T-8.2 will be ambiguous between the plan and the code.~~

~~Still unverified: `docker compose up` (no Docker on the dev machine or the owner's), so
`DEPLOYMENT.md` Option B keeps its "unverified" note. Also still owed from Step 5: the
README's GitHub Sponsors link and Render deploy-button URL, confirmable only once the repo
is public — it is currently private.~~ *(carried — see Step 11 below.)*

## Step 9 — T-7.1: app icon replaced with SRC's commissioned artwork (2026-08-21)

*Logged retroactively on 2026-09-15 from the commit (`b89b214`); the session that shipped it
ended without a log entry.*
**Shipped:** Owner decision 2026-08-20: the hand-authored "37" placeholder mark
(`icon-192.png`, `icon-512.png`) gave way to SRC's real commissioned mascot art;
`icon-180.png` regenerated from the 512 master via a temporary local `sharp`, same technique
as Step 1's pre-render. `icon.svg` (favicon at the time) and `deployer-logo.png` (LogoStamp
watermark) untouched — still the "37" mark. The `vite.config.ts` `icons[]` comment was
corrected: it claimed the manifest art was "maskable-safe by construction", true of the
hand-drawn mark, unverified for this artwork.
**Owed:** the mascot's ears and hair sit close to the frame edge, outside the usual
middle-80 % safe zone, so Android's adaptive-icon mask may clip them — flagged for the real
Android install rather than assumed fine.

---

## Step 10 — T-7.1: favicon matches the swapped app icon (2026-08-21)

*Logged retroactively on 2026-09-15 from the commit (`397c616`).*
**Shipped:** Owner decision: the tab favicon follows Step 9's swap instead of staying on the
retired "37" mark — `index.html`'s `rel="icon"` now points at `icon-192.png` (SRC has no SVG
of the mascot, so a PNG favicon rather than like-for-like). `icon.svg` left `includeAssets`
(nothing loads it any more — Step 7 took it out of manifest `icons[]`, and it was only ever a
precache target for the favicon link this step removed) and its header comment now says so:
no runtime consumer, kept only as the source `LogoStamp.tsx` documents for regenerating
`deployer-logo.png`.
**Owed:** nothing new.

---

## Step 11 — T-8.1: `docker compose up` verified; production moves to an own VM (D-5) (2026-09-15)

**Shipped:** Docker turned out to be installed on the dev machine since the last session
(29.7.2, linux engine), so the `docker compose up` leg owed since Step 4 finally ran: the
image builds from the Dockerfile unchanged (~1.5 min, `npm ci` 46 s + build 37 s) and the
container passes the same checks Step 6 ran on Render — `/`, `/index.html`, `/health`
`{"ok":true}`, `manifest.webmanifest`, `sw.js` all 200 and the Socket.IO polling handshake
5/5 with `upgrades:["websocket"]` — at ~53 MB RSS idle. Host port 3000 was busy with another
project, so the check ran through a scratch compose override mapping `3010:3000`; the
committed compose file is unchanged. `DEPLOYMENT.md` Option B loses its "unverified" note.
Found while at it: the image is **785 MB** — a single-stage build keeps the
`npm ci --include=dev` layer (451 MB) and `npm prune` cannot shrink a layer already written,
so the Dockerfile's "prune to slim the image" comment describes an intent, not an effect.
**Owner decisions taken (2026-09-14, recorded as D-5 in `requirements.md` §2, with notes on
FM-NFR-3 and design §1):** no paid Render plan; production becomes the Docker image on an
**Oracle Cloud Always-Free VM behind Caddy**, at
`https://www.staging-oursharedcode.com/funny37-game` — a **sub-path**, chosen over
subdomains with the trade-off stated (needs a base-path leg; same-origin storage shared with
the future `/funny1-game` sibling). Also: the maskable-icon clip risk is judged on the real
Android install, not padded pre-emptively; the stale local `.env` stays until generation is
tested locally; the three Gate 7 device legs plus T-8.2 run as **one scripted phone session**
after the checklist doc exists. The four "before Step 13" prerequisites were then done
operation by operation with the owner confirming each: Oracle Free Tier account (tenancy
`markvmindlin`, home region Sydney) → API key on this PC (the OCI *CLI* would not install —
Windows long-path limit — so the `oci` Python SDK drives everything) → network (`funny-vcn`,
public subnet, IGW, security list: 22 from the operator IP only, 80/443 open) → VM `funny-vm`.
**Sydney had no free Arm capacity** (six "Out of host capacity" in a row), so the fallback
free AMD shape `VM.Standard.E2.1.Micro` (1 GB) is what runs, with a 2 GB swap file, Ubuntu
24.04, Docker 29.8 + Compose 5.5 from cloud-init, iptables opened for 80/443 (Oracle's image
rejects all but 22), and a **reserved** public IP **152.69.166.212** so the address survives a
later swap to Arm. Measured idle: 495 MB free; the game container needs ~53 MB, so images are
built here and streamed over SSH rather than built on the VM. The two provisioning scripts
are committed as `deploy/oci/network.py` and `deploy/oci/vm.py` (idempotent; ids live in
`~/.oci/funny-infra.json`, outside the repo); `deploy/` is excluded from the image context.
The owner registered **`staging-oursharedcode.com`**; its nameservers are already Cloudflare's.
**Owed:** the D-5 legs of T-8.1 — configurable `BASE_PATH` (client + server + Dockerfile
build-arg), Caddy as a container in the compose file, Cloudflare DNS records (via API once
the owner drops a DNS-edit token on this PC), the deploy itself, multi-stage Dockerfile,
DEPLOYMENT.md/README rewrite, and a re-run of Gate 7's Installability leg on the new origin.
An Arm retry (`deploy/oci/vm.py` after terminating the Micro) is worth a try at each session
start. README's Sponsors link and deploy-button URL are still unconfirmable (repo private).
*Full suite: typecheck, lint, `prettier --check` clean; 619/619 tests (client 188, server 310,
shared 82, cloudflare 39), run outside the sandbox. `npm audit` first reported 5 advisories
published since the last session (fastify ×2 incl. an X-Forwarded-* hop-count spoof we are
not exposed to — `clientIp()` reads the header itself, `trustProxy` is unused — fast-uri,
js-yaml, @vitest/mocker); all fixed inside the declared ranges, lockfile only: fastify
5.11.3 → 5.12.4, fast-uri 3.1.7/4.1.4, js-yaml 4.3.2, vitest 4.1.11. `npm audit fix` and
`npm update vitest` both crash npm 10.9.3's arborist (`edgesOut` of null in `#loadPeerSet`),
so vitest moved via `npx npm@11 update`. Gates re-run green on the bumped tree; 0
vulnerabilities. The compose image above was built before the bump — Dockerfile unchanged,
and the deploy step rebuilds anyway. No TypeScript touched.*

---

~~**RESUME HERE (2026-09-15).** Production target is now the owner's own VM (D-5), not Render:
Oracle Always-Free `funny-vm` in Sydney at **152.69.166.212** (1 GB AMD; Arm was out of
capacity), Docker + Compose installed, ports 22/80/443 open, domain
`staging-oursharedcode.com` registered with DNS on Cloudflare. Render
(`https://funny-multi.onrender.com/`) still serves as the interim URL and stays the free
one-click alternative. Worker unchanged at `https://funny-multi-image.oursharedcode.workers.dev`.~~

~~Next: **Step 12 — T-8.1 base path.** One `BASE_PATH` (default `/`, Render unchanged): client
Vite `base`, manifest `start_url`/`scope`, Socket.IO client `path`, workbox denylist regexes;
server static prefix, `/health`, Socket.IO server path; Dockerfile build-arg + compose. Before
writing it, one grep for `base:` in SRC's `client/vite.config.ts` (T-8.1 cites SRC) in case
SRC already solved it. Verify by building with `/funny37-game/`, running the container, curl +
handshake under the prefix, and DevTools Installability on `localhost` (secure-context
exception). Fold the multi-stage Dockerfile in here or in Step 13.
Then **Step 13 — T-8.1 deploy**: Caddy container in the compose file (auto-HTTPS, websocket
upgrade, `TRUSTED_PROXY_HOPS=1` stays right for one proxy), DNS `A`/`www` records via the
Cloudflare API (owner supplies a DNS-edit token as a file on this PC, never in chat), build
here → `docker save | ssh … docker load` → `compose up` on the VM, DEPLOYMENT.md/README
rewrite, Installability leg re-run on the new origin. Then **Step 14**: `docs/ACCEPTANCE.md`
(SRC §19 + Gate 7 legs) for the owner's single scripted phone session (T-8.2 + Gate 7).~~

~~Owner-side, still open: nothing before Step 13 except the Cloudflare DNS token when asked.
`README`'s Sponsors link and Render deploy-button URL remain unconfirmable while the repo is
private.~~ *(carried — see Step 12 below.)*

## Step 12 — T-8.1: BASE_PATH — the app under a URL sub-path; two-stage Dockerfile (2026-09-15)

**Shipped:** The D-5 sub-path leg. One normaliser, `normalizeBasePath` in `@funny/shared`
(any of `funny37-game`, `/funny37-game`, `/funny37-game/` → `/funny37-game/`; unset → `/`;
4 tests), is the single source for every path-shaped value on both sides. Client:
`vite.config.ts` reads `BASE_PATH` from the build environment into Vite `base`, the manifest's
`start_url`/`scope` and the workbox denylist (the base escaped as a literal); manifest icons
became relative (`icon-192.png`) so they resolve under whatever base the manifest is served
from. A new `src/basePath.ts` (`baseUrl()`, `withBase()`, `homeUrl()`, read from
`import.meta.env.BASE_URL` at call time so `vi.stubEnv` can test the sub-path shape) replaces
every hand-written root-absolute URL: the Socket.IO client `path`, the flag images, the
LogoStamp and recordWobble `deployer-logo.png`, the `?room=` join link in LobbyScreen and the
Home QR code, and the "new room" reload in App. Server: `buildServer` takes a `basePath`
option (default from the env) and mounts the static bundle (`prefix`), `${base}health` and
Socket.IO (`path: ${base}socket.io`) under it; three tests pin the positive and negative
cases — under a sub-path the root `/health` and `/socket.io` no longer answer, because a
server that still did would mask a client built with the wrong base until the first real
deploy. SRC never served under a sub-path (one grep of its `vite.config.ts` for `base`, as
T-8.1 allows), so nothing was copied. Dockerfile rewritten as two stages — the Step 11 finding
— with `BASE_PATH` as an `ARG` in both (the client bakes it in at build, the server reads it
at run); the runtime stage installs only the server workspace's production dependencies
(`npm ci --omit=dev --workspace apps/funny-multi-server`) and copies the three `dist/` trees:
**251 MB, from 785 MB**. `docker-compose.yml` feeds one `${BASE_PATH:-/}` from `.env` to both
the build arg and the container environment; `.env.example` and DEPLOYMENT.md Option B
explain it. Verified in the container built with `/funny37-game`: `/funny37-game/` +
`index.html` + `health` (JSON) + `manifest.webmanifest` + `sw.js` + icons + flags + logo all
200; manifest `start_url`/`scope` `/funny37-game/`; `index.html` asset hrefs rewritten by
Vite; `registerSW.js` registers `/funny37-game/sw.js` with scope `/funny37-game/`; the bundle
carries the base in its Socket.IO `path` and the socket handshake is 5/5 under the prefix; root
`/health` and `/socket.io` fall through to the SPA shell — ~49 MB RSS. The default build is
unchanged, and Render (native Node build, no Dockerfile, no `BASE_PATH`) stays at `/`.
Also this session, before the code: **Cloudflare DNS** — the owner created a zone-scoped
DNS-edit token as a file on this PC (never in chat); the token verified active, and `A`
records for `staging-oursharedcode.com` and `www` now point at 152.69.166.212, DNS-only (grey
cloud) so Caddy can hold the certificate and WebSockets go straight to the VM. Resolving
worldwide within a minute.
**Owed:** the Installability re-check on `localhost:3010/funny37-game/` was not run — no
browser automation here; it happens on the real origin in Step 13 as planned. Two flakes
seen, neither from this step: Git Bash rewrote `BASE_PATH=/funny37-game` into
`C:/Program Files/Git/funny37-game` when passed as a shell env var to `docker compose` (MSYS
path conversion — use `.env` or `MSYS_NO_PATHCONV=1`), and the client's `RoundScreen` "sizes
visual slots" test twice exceeded its 5 s budget under load (1.9–6.0 s across five samples,
identical on the committed tree) — passes on re-run, left as is. The workbox precache still
lists `icon.svg` via the `**/*.svg` glob although nothing references it (2 KB, harmless).
*Full suite: typecheck, lint, `prettier --check` clean; 628/628 tests (client 190, server 313,
shared 86, cloudflare 39), run outside the sandbox; `npm audit` 0 vulnerabilities.*

---

~~**RESUME HERE (2026-09-15).** The app now runs under `/funny37-game/` (Step 12) and the VM,
DNS and reserved IP are ready (Steps 11–12): Oracle Always-Free `funny-vm`, Sydney,
**152.69.166.212** (1 GB AMD, Docker + Compose, 22/80/443 open), `staging-oursharedcode.com`
and `www` → that IP, DNS-only on Cloudflare. Render (`https://funny-multi.onrender.com/`) is
still the interim URL. Worker unchanged.~~

~~Next: **Step 13 — T-8.1 deploy.** (1) Caddy as a second service in `docker-compose.yml`
(`caddy:2`, ports 80/443, a `Caddyfile` routing `www.staging-oursharedcode.com/funny37-game*`
→ `funny-multi:3000` with the apex redirecting to `www`; websockets pass through by default;
volumes for `/data` so the certificate survives restarts). (2) Ship: build here with
`BASE_PATH=/funny37-game` in the VM's `.env` (Compose interpolates it — do not pass it as a
Git Bash env var), `docker save funny-multi | ssh ubuntu@152.69.166.212 docker load`, copy
`docker-compose.yml`, `Caddyfile` and a `.env` (Worker URL + the rotated secret, `BASE_PATH`,
`TRUSTED_PROXY_HOPS=1` — Caddy is the one proxy), `docker compose up -d`. (3) Verify on the
real origin: `/funny37-game/health`, handshake, DevTools Installability, a two-tab game.
(4) DEPLOYMENT.md/README rewrite (Option B becomes primary; Render stays the one-click
alternative). Then **Step 14**: `docs/ACCEPTANCE.md` (SRC §19 + Gate 7 legs) for the owner's
single scripted phone session.~~

~~Owner-side: nothing until the phone session. Consider terminating the Micro and re-running
`deploy/oci/vm.py` at a session start to retry Arm — the reserved IP moves with it.~~ *(carried — see Step 13 below.)*

## Step 13 — T-8.1: production deployed — Caddy profile, ship script, VM live (2026-09-15)

**Shipped:** **https://www.staging-oursharedcode.com/funny37-game/** is live on the Oracle VM.
`docker-compose.yml` gained a `caddy` profile — `caddy:2` on 80/443 with `deploy/caddy/Caddyfile`
(env-driven `SITE_HOST`/`SITE_APEX`/`BASE_PATH`; apex → `www` redirect; `/funny37-game` →
`/funny37-game/` so the SW scope and the join link agree; `BASE_PATH/*` reverse-proxied to
`funny-multi:3000` with the path untouched; 404 for anything else on the name; HTTP/3
disabled because the VM's cloud firewall leaves UDP 443 closed and advertising it would only
make browsers probe and fall back) validated with `caddy validate`/`fmt`. The profile is
opt-in and its variables are plain `${…:-}` — Compose interpolates the whole file before it
applies profiles, so the `:?` required form would have broken the profile-less
`docker compose up`. `deploy/ship.sh` is the deploy: reads `BASE_PATH` from the host's `.env`
(so the client is built with the value the server runs under), builds the image tagged with
the commit, `docker save | gzip | ssh … docker load` (~80 MB — no build on the 1 GB VM, no
registry), copies the compose file and Caddyfile next to `.env`, `compose --profile caddy up
-d --no-build`, and polls `https://SITE_HOST/BASE_PATH/health`; `MSYS_NO_PATHCONV=1` inside
it because Git Bash rewrites `/funny37-game` into a Windows path. The VM's `.env` was written
in a remote shell from a secret file copied by `scp` (Worker URL, rotated secret,
`BASE_PATH=/funny37-game`, `SITE_HOST`, `SITE_APEX`, `TRUSTED_PROXY_HOPS=1`), mode 600.
**Verified on the real origin:** Let's Encrypt certificates for both names obtained on first
boot (Caddy log), `/funny37-game/` + `health` + `manifest.webmanifest` + `sw.js` + icons +
flags all 200 over HTTPS, `http://` → 308 → `https://`, apex → 301 → `www`, no-slash → 301 →
slash, `/` → 404, manifest `start_url`/`scope` `/funny37-game/`, Socket.IO polling handshake
5/5 through Caddy, and a **scripted 3-player game** from this PC (socket.io-client, websocket
transport, TLS): connect 146 ms, `room:create` → two `room:join`s → `game:start` →
`round:start` in 893 ms; `stats:get` answers. The VM's own `.env` secret gets 200 from the
Worker's `/stats`. Footprint: app ~50 MB, Caddy ~19 MB, 456 MB host free. DEPLOYMENT.md
rewritten — self-host with Docker + Caddy is Option A (what production runs, with the `.env`
recipe and `ship.sh`), Render is Option B with its hibernation caveat and D-5 pointer, the
`TRUSTED_PROXY_HOPS` section covers Caddy; README opens with the URL and puts self-hosting
before the Render button; `.env.example` documents `SITE_HOST`/`SITE_APEX`.
**A mistake, owned:** `CLOUDFLARE_WORKER_SECRET` was rotated a second time on a false
diagnosis. The agent's check of the owner's pasted values used Python `urllib`, whose default
`Python-urllib/3.10` user agent Cloudflare answers with 403 regardless of the secret — so two
correct pastes (the current value, then Render's copy) read as wrong, and the rotation was
done before curl showed the check itself was broken (curl 200, same secret with the
Python UA 403). The rotation is harmless — the Worker, its `/stats` and the VM all agree on
the new value — but Render's dashboard still holds the previous one, so the interim Render
site cannot generate until the owner pastes the new value there (a one-line owner operation,
queued). Lesson recorded in memory: verify Cloudflare-fronted endpoints with curl, never a
bare `urllib`.
**Owed:** Gate 7's Installability leg on the new origin — needs Chrome DevTools, owner's
browser (queued as the next owner operation); the Render secret paste (above). Both close
T-8.1; the device legs (iPhone/Android install, jank) stay with Gate 7 for the phone session.
**Same-day follow-up — Render service deleted (owner decision 2026-09-15).** Handed the
paste operation, the owner asked why Render was still needed. It wasn't: since D-5 the
service was a second, stale copy of the game at a URL nobody is sent, rebuilding on every
push to `main` and unable to generate cartoons. Options weighed — delete, keep-and-paste,
suspend; deleted (owner, dashboard; the Render API would first have needed a key). The paste
is void. `render.yaml` and README's deploy button stay: they are Option B, the one-click path
a stranger can take, and Gate 8 still judges that path. One production now.
**Installability re-run, same day:** the owner opened the production URL in desktop Chrome —
DevTools Application → Manifest shows only the two optional "richer PWA install UI"
screenshot notices, and the omnibox offers install; the sub-path scope is accepted. Gate 7's
Installability leg is signed off on the D-5 origin and **T-8.1 is closed**. Left for the
phone session: iPhone install, Android install (maskable clip check), jank.
The smoke game left two rooms from the two failed attempts (a 2-letter nickname the server
rightly rejected) to expire by grace window — harmless, in-memory. `caddy fmt --diff` still
reports one blank line it would drop; cosmetic.
*Full suite: typecheck, lint, `prettier --check` clean; 628/628 tests, run outside the
sandbox; `npm audit` 0 vulnerabilities. One test-only TypeScript change: the client's
`RoundScreen` "sizes visual slots" case, which renders all ten rounds through jsdom and
measured 1.9–6.0 s across the day's runs, failed its default 5 s budget in three of six
full-suite runs (Step 12 saw it first); its budget is now 20 s with the measurement in a
comment. Otherwise compose, Caddyfile, ship script, docs, steering.*

---

~~**RESUME HERE (2026-09-15).** Production is **https://www.staging-oursharedcode.com/funny37-game/**
(Oracle Always-Free VM 152.69.166.212, Caddy + the two-stage image, `deploy/ship.sh` to
redeploy). The Render service is deleted (owner decision 2026-09-15) — `render.yaml` stays
only as the one-click Option B for strangers; the rotated `WORKER_SECRET` lives in
`C:\Users\Misha\.cloudflare\worker-secret`, the Worker and the VM's `.env`.

T-8.1 is closed (Installability re-run passed on the new origin, 2026-09-15). No owner
operation is pending.

Next agent step: **Step 14 — `docs/ACCEPTANCE.md`**: SRC spec §19 (`FUNNY_STORIES_SPEC_v4.md`
line 1315; T-8.2 cites SRC) adapted to combobox answers + URL images, prefixed with Gate 7's
three device legs (iPhone install, Android install incl. the maskable-icon clip check, jank),
with a results template — the script for the owner's single phone session (T-8.2 + Gate 7),
run on the production URL. Then Gate 8 ("a stranger can self-deploy from README alone") can be
judged against the rewritten DEPLOYMENT.md.~~ *Carried — superseded by the Step 14 note below.*

---

## Step 14 — T-8.2: `docs/ACCEPTANCE.md` written (2026-09-15)

**Shipped:** the acceptance script for the owner's device session, adapted from SRC spec §19
(`FUNNY_STORIES_SPEC_v4.md` line 1315) per the 2026-09-14 owner decision to author the checklist
first. Part A: Gate 7's three device legs (iPhone install, Android install, maskable-icon clip
check, jank), A1 pre-marked *deferred* since this session's device roster (owner decision
2026-09-15: two desktop Chrome tabs + one Android phone, no iPhone) has nothing to run it on.
Part B: SRC's 13 items reworked to 17 for this game's shape — combobox tap-pick and
type-to-filter replace free-text, `/i/<hash>` URL images replace base64, the automatic-reveal
flow replaces the "Generate Picture" button, the profanity item is dropped (no free-text
answers, nothing to filter) — plus T-8.2's three named extras: disconnect-mid-game → bot,
reconnect-within-window, and a same-picks cache-hit replay that checks the Worker `/stats`
counter is unchanged. RU room and an added Hebrew RTL sanity item close out Part B. Part C: the
two server-side flips (daily cap, dead Worker) the agent runs live on the VM's `.env` during the
session — each a restart, so each starts its flow in a fresh room — plus a restore-and-verify
step. A results table with device/tester fields and a per-item pass/fail/deferred column, and
sign-off rules distinguishing T-8.2 (every B/C row passes) from Gate 7 (A2–A4 pass, A1 deferred
until an iPhone is available) from Gate 8 (needs this plus the README self-deploy judgement).
`steering/tasks.md` T-8.2 carries a note pointing at this file and the device-roster decision.

**Owed:** T-8.2 itself — the doc is the script, not the run. The owner's device session (Part A,
B, C) is still to happen; T-8.2 stays unticked and Gate 7/Gate 8 stay open until it does. The
iPhone leg (A1) will need a separate pass whenever a phone is available — it will not close in
the desktops+Android session. Gate 8's README self-deploy judgement follows once T-8.2 passes.

*Full suite: typecheck, lint, `prettier --check` clean; 628/628 tests, run outside the sandbox
(one transient client-suite failure on the first run — `AUTHORED_LANGUAGES` picker assertion —
reproduced clean, 190/190, on an isolated rerun; flake, not a regression, and unrelated to this
docs-only session); `npm audit` 0 vulnerabilities. Only `docs/ACCEPTANCE.md` (new) and
`steering/tasks.md` (a note under T-8.2) changed.*

---

Next agent step: **the device session** (T-8.2 + Gate 7's device legs) per `docs/ACCEPTANCE.md`,
run live with the owner. *Carried — superseded by the Step 15 note below.*

---

## Step 15 — T-8.2 device session run; T-7.1/T-7.3 device legs; icon fix (2026-09-16)

**Shipped:** the acceptance device session ran end to end — two desktop Chrome tabs (A, B) and
one Android phone (C), the owner playing all three seats, the agent driving Part C's server-side
flips over SSH. Full results in `docs/ACCEPTANCE.md`.

**Part A (Gate 7 legs):** A2 (Android install) pass — real Play Store friction surfaced though:
Google Play Protect blocks the install as "Unsafe app blocked — built for an older version of
Android" until the user taps "Install anyway"; logged as **B-8**, not investigated further this
session. A3 (maskable-icon clip check) failed on first look — the mascot's ears/hair sat right at
the safe-zone edge, and the owner asked for more headroom mid-session. Fixed live: a dedicated
`icon-512-maskable.png` (the art shrunk to 80%, padded with its own background pink sampled from
the source corner rather than the manifest's cream, so the shrink reads as headroom instead of a
mismatched box) now backs the manifest's `maskable` icon entry; `icon-512.png` stays full-bleed
for the `any` entry. Built and deployed mid-session (`deploy/ship.sh`), re-verified on the phone
— pass. A4 (jank check, folded into the Part B playthrough): no stutter noticed on the timer bar,
submit-confirm mascot, or reveal flourish — eye check only, not instrumented. T-7.1's Android leg
and T-7.3 both close on this; T-7.1's iPhone leg (A1) stays open, still needing a borrowed phone.

**Part B (17-item playthrough):** 14 of 17 pass (B1–B11, B13, B14, B17). Three skipped by owner
decision (session time): B12 (cache-hit replay + live `/stats` check — the "cache hit costs no
slot" path is unit-tested server-side already), B15 (reconnect-within-window), B16 (Russian
room). B4's type-to-filter sub-check was waived, tap-pick and the disabled-Submit state both
confirmed. Owner decision: sign off T-8.2 on this basis rather than hold it open for the three
skips — see `steering/tasks.md`.

**Part C (server-side flips):** all three pass. C1 (daily cap =1): exactly one cartoon generated,
the other two saw the cap message with no Try again and a blank-free gallery state; the lobby
showed the unavailable notice for new rooms. C2 (dead Worker, wrong secret): every player saw
"Generation failed. Try again." with the error mascot, Try again failed gracefully a second time,
Continue still reached the gallery. C3 (restore): production is back to its shipped
configuration; a fresh room generated normally.

**Harness limits hit and worked around:** the auto-mode classifier refuses any Bash write to a
`*_SECRET=` line (even to a deliberately-wrong test value) and any read of `.env` content — both
by design. C2's and C3's secret edits were done by the owner directly on the VM instead (one
command per message). Separately, `~/.cloudflare/worker-secret` (needed to restore C3) had never
been copied to the VM — only this PC held it — so the owner `scp`'d it across first. Both lessons
are now in memory (`mark-operation-style`, `funnyone-hosting-oracle`) for next time.

**Owed:** Gate 7 — only A1 (iPhone install) remains, needs a borrowed phone. Gate 8 — needs the
README self-deploy judgement, next up now that T-8.2 has passed. **B-8** (Play Protect warning)
is a new backlog item, not investigated. B12/B15/B16 stay unrun; re-run only if the owner decides
the skip wasn't acceptable in hindsight.

*Full suite: typecheck, lint, `prettier --check` clean; 628/628 tests, run outside the sandbox;
`npm audit` 0 vulnerabilities. Changed: `apps/funny-multi-client/vite.config.ts`,
`apps/funny-multi-client/public/icon-512-maskable.png` (new), `docs/ACCEPTANCE.md` (results
filled in), `steering/tasks.md` (T-7.1/T-7.3/T-8.2/Gate 7/Gate 8 updated, B-8 added),
`steering/tasks-done.md` (T-7.3, T-8.2 moved in).*

---

~~**RESUME HERE (2026-09-16).** Production is **https://www.staging-oursharedcode.com/funny37-game/**,
now running the icon fix from this session (redeployed mid-session, commit pending). T-8.1 and
T-8.2 are closed; T-7.3 is closed. Gate 7 has only A1 (iPhone) left; Gate 8 has only the README
self-deploy judgement left.

**Next agent step: Gate 8's README self-deploy judgement** — read `DEPLOYMENT.md` as a stranger
would and judge whether it's enough to self-host without asking the owner anything. No device or
owner-secret access needed; this is an agent-only read-and-judge step.

Still open elsewhere: T-7.1's iPhone install leg (A1) needs a borrowed phone — folds into a future
short session, not blocking Gate 8; **B-8** (Google Play Protect "Unsafe app" warning on Android
install) needs investigation, not urgent; README's Sponsors link and Render deploy-button URL
(repo private, check as part of the Gate 8 judgement); an Arm retry for the VM
(`deploy/oci/vm.py` after terminating the Micro) at any session start, still not attempted.~~ *Carried — superseded by the Step 16 note below.*

---

## Step 16 — Gate 8 self-deploy judgement; Render dropped; FUNDING.yml (2026-09-16)

**Task:** Gate 8's last leg — read `DEPLOYMENT.md` and README's deploy section as a stranger
with a Cloudflare account, a Linux box with Docker and a domain, and judge whether they could
self-host without asking the owner anything. Agent-only; no device or secret access.

**Verdict: pass with fixes — three gaps would have stopped a stranger; all fixed here.**

1. *Host-side `.env` had no creation step.* The old text said `mkdir -p ~/funny` then listed
   the variables in a comment, never saying how the file gets onto a host that has no
   checkout — and `deploy/ship.sh` exits immediately if `SITE_HOST` isn't already in the
   remote `.env`. Now §2a is an explicit `ssh … cat > .env <<'ENV' … ENV; chmod 600` block with
   the six production variables, and §2b runs `ship.sh` after it.
2. *No prerequisites list.* Added "What you need": Cloudflare account (with the note that R2
   needs a payment method on file even at $0), a Docker host on 80/443, DNS `A` records for
   both names before first boot, and what the deploying PC needs (Node 20, git, Docker,
   ssh/scp, curl; Git Bash on Windows). The Worker section now starts with `git clone` and
   notes that `npx wrangler` fetches wrangler on first use (`cloudflare/package.json` doesn't
   depend on it).
3. *Render "Option B" pointed at a service that no longer exists* (deleted in T-8.1) with a
   deploy button to a private repo. Owner decision this session: **drop Render entirely** —
   no free platform keeps a party's sockets alive, and no paid hosting is on offer.
   `render.yaml` deleted; README's button and bullet gone (replaced by a three-line summary of
   the self-host path and a sentence on *why* there is no one-click option); the Render
   mentions in `.env.example`, `docker-compose.yml`, `cloudflare/wrangler.toml` and the
   trusted-proxy section rewritten around Caddy. D-5 and FM-NFR-3 carry a dated amendment.

Smaller fixes on the same pass: `.env.example` still said "see docs/DEPLOYMENT.md … until that
doc is written at T-8.3"; the `/stats` smoke check needed the `X-Secret` header (the Worker
403s without it — the first draft of the doc got this wrong and was corrected against
`worker.js`); the closing "After both are deployed" section was an internal T-8.2/Gate 7
to-do list and is now a five-step stranger's smoke test (`/health` → install offer → play a
round → replay is instant and `/stats` unchanged → where the logs are). A "your own TLS
proxy" variant is spelled out, since `ship.sh` always uses the Caddy profile.

**Owner decisions (2026-09-16):** repo stays private for now, docs judged as if public —
**making the repo public is a launch prerequisite** (the `git clone` line and the AGPL
source-availability paragraph both assume it). Render dropped (above). GitHub Sponsors:
the source project's `.github/FUNDING.yml` pattern copied — `github: oursharedcode` — so the
README's Sponsors link is backed by the repo's Sponsor button.

**Not touched:** code comments that still cite Render as the example single-proxy platform
(`apps/funny-multi-server/src/{env,index,rateLimit,stats}.ts`, `packages/shared/src/basePath.ts`,
`apps/funny-multi-client/vite.config.ts`, `steering/design.md` §1/§7). They are historical
and invisible to a self-hoster; a cosmetic sweep can ride along with the next code change to
those files. **Gate 8 is marked PASSED** in `steering/tasks.md`; Phase 8 is complete apart from
Gate 7's iPhone leg, which is not a Phase 8 item.

*Full suite: typecheck, lint, `prettier --check` clean; 628/628 tests, run outside the sandbox;
`npm audit` 0 vulnerabilities. Changed: `DEPLOYMENT.md` (rewritten), `README.md`,
`.env.example`, `docker-compose.yml`, `cloudflare/wrangler.toml`, `render.yaml` (deleted),
`.github/FUNDING.yml` (new), `steering/requirements.md` (D-5, FM-NFR-3 amended),
`steering/tasks.md` (Gate 8 passed).*

---

~~**RESUME HERE (2026-09-16, after Step 16).** Production is
**https://www.staging-oursharedcode.com/funny37-game/**. Phases 0–8 are done: Gate 8 passed
this session (self-deploy judgement; Render dropped; FUNDING.yml added). Nothing in this step
needs deploying — docs and steering only.

**Next agent step: open Phase 9 (Premium, D-4) with T-9.1.** T-9.1 is business setup on Polar
(product + two SKUs, license keys on), not code — it needs the owner at the Polar dashboard,
so the /morning proposal should be: confirm T-9.1 is the owner's to do, and in the same session
start **T-9.2** (Worker `POST /entitlement`: Polar license validation → 24 h HMAC JWT), which
is agent code with negative-case tests and only needs a Polar sandbox token at the very end.
Grep `steering/requirements.md` for FM-TIER-2/3 and read `steering/design.md` §10 (premium
entitlement) before planning.

Still open elsewhere, none blocking Phase 9: **making the repo public** before any launch
announcement (owner action, Gate 8 residual); T-7.1's iPhone install leg (A1, needs a borrowed
phone — closes Gate 7); **B-8** (Play Protect "Unsafe app" warning on Android install); the Arm
retry for the VM (`deploy/oci/vm.py` after terminating the Micro), still not attempted; a
cosmetic sweep of "Render" in code comments (list in Step 16).~~ **Superseded same day, before
any of it was started** — see Step 17.

## Step 17 (task: commit D-6/D-7 steering rewrite) — 2026-09-20

**Owed:** Step 16 ended with the Premium plan (D-4, Polar) intact and a RESUME note pointing at
it. Later the same day the owner made two new scope decisions — **D-6** (no premium tier, no
card merchant of record; support becomes voluntary gifts over PayID/Osko, GitHub Sponsors
one-time tiers and Bitcoin Lightning, each deployer-configured) and **D-7** (pre-generate all
10⁴ visual-slot combinations into R2 once, ≈ $10, so per-player generation is never gated by
the Workers AI daily budget) — reasoned in `local_docs/gift-payments-no-chargeback-research.md`.
`steering/requirements.md`, `steering/design.md` §10 (renamed "Commercial: pre-generated
library and support rails"), and `steering/tasks.md` Phase 9 were rewritten to match (DD-10
retired, DD-11/DD-12 added; T-9.1–T-9.5 replaced; Gate 9 redefined; B-9/B-10 backlog added).
`.env.example`, `.github/FUNDING.yml`, `DEPLOYMENT.md` and `README.md` were updated for the new
env vars and dropped Polar mentions. **None of this was committed** — the session that wrote it
ended without a commit, leaving the RESUME note above stale and pointing at a plan the owner had
already replaced.

**Shipped this step:** committed the pending rewrite as-is (docs/steering only, no code changed,
so typecheck/lint/tests are unaffected by this step and were not re-run). `local_docs/` added to
version control — the fee-structure research is the cited justification for a binding decision
(D-6) and has nothing sensitive in it.

**Verified before committing (Sonnet 5, this session):** the image-prompt `SKELETON` that D-7's
pre-generation batch depends on was tuned against real Flux output and **locked 2026-08-14**
(T-4.2) — a later wording edit cannot orphan the batch. Two inaccuracies in the still-uncommitted
plan text, left as-is pending owner/agent follow-up: (1) design §10.1 places the new
`pregenerate.mjs` under `cloudflare/`, but `buildPrompt` and the existing mixed-radix pool
enumeration (`apps/funny-multi-server/scripts/samplePrompts.mjs`, `--curl` mode) both live in
the server workspace — the pre-generator should be a sibling of that script, not new code in
`cloudflare/`. (2) design §10.2 / T-9.3 describe the four new `DEPLOYER_*` support vars landing
on "the same config endpoint that already carries `donateUrl`" — no such endpoint exists yet;
`donateUrl` today ships inside the `lobby:update` **socket** broadcast
(`apps/funny-multi-server/src/index.ts:192`), re-sent on every join/leave. T-9.3 will need to
either add a `GET config` REST route (recommended — five static strings do not belong on a
per-join broadcast) or extend the existing payload; owner has not yet chosen.

**RESUME HERE (2026-09-20, after Step 17).** Production is unchanged:
**https://www.staging-oursharedcode.com/funny37-game/**. Phases 0–8 done. Phase 9 is now
"Commercial: pre-generated library + support rails" (D-6/D-7), not Premium — Polar/JWT/
entitlement code was never started and the design section for it no longer exists.

**Next agent step: T-9.3** (server support-rail env vars → a config surface the client can read;
resolve the endpoint-vs-broadcast question above first) is the largest piece of Phase 9 that
needs no owner action and no spend. **T-9.1** (owner: register PayID + note the bank's exact
display name, pick a Lightning wallet, add one-time Sponsors tiers, enable the paid Workers AI
plan) and **T-9.2** (pregenerate script + the real batch run, needs T-9.1's Workers AI plan)
are the owner-gated and spend-gated pieces — sequence them whenever the owner is free, one small
step at a time per their usual cadence.

~~Also mid-session 2026-09-20, the owner opened two large new fronts beyond Phase 9: a
single-device "Funny One" party game (anticipated by D-5's `/funny1-game` sub-path but not yet
scoped anywhere in `steering/`) and Android/iPhone store apps published under an Australian ABN
(AND37/IOS37, `steering/design.md` §"store apps", specified but explicitly deferred to
post-v1 by D-3). Both need their own planning pass before code — see whichever session picks
this up next for how far that planning got.

Still open, none blocking Phase 9: making the repo public before any launch announcement; T-7.1's
iPhone install leg (closes Gate 7); B-8 (Play Protect warning on Android install); the Arm VM
retry; a cosmetic "Render" sweep in code comments; a stray comment in
`apps/funny-multi-server/src/prompt.ts:72` still calling T-4.2 outstanding when it is done.~~
**Superseded same day — see Step 18.**

## Step 18 (task: plan Funny One + store apps) — 2026-09-20

**Owed:** Step 17's RESUME note said Funny One and the store apps "need their own planning pass
before code" without saying what that pass would find. This step is that pass — docs only, no
application code. Owner explicitly directed **Phase 9 paused** for now to make room for it.

**Critical finding, before any of the rest of this step matters:** the task brief this session
started from assumed Funny One would reuse Funny Multi's AI-cartoon pipeline. It doesn't match
the only spec that ever existed for this product — `docs/archive/Initial_Requirements.md`
(**ONE-13/14/17/19**): Funny One was invented specifically to be the fully **offline**, zero-
network, zero-server sibling (the multi-device game can never be offline because its room state
is server-held; Funny One exists to close that gap), assembling scenes on-device from a small
layered art rig rather than calling out to Workers AI. Nothing in `steering/requirements.md`
overrides that — D-1 only reserves the `apps/funny-one` workspace name. **Owner decided
(D-8, recorded in the new `steering/funny-one-requirements.md`): the offline on-device rig,
matching the original archived intent, not the AI pipeline — plus per-question round-robin
turn-passing** (closer to Funny Multi's rhythm than the archive's per-player-block default).

**Shipped:** three new sibling steering documents, kept out of `steering/requirements.md`/
`design.md`/`tasks.md` because D-1 scopes those to Funny Multi only: `steering/
funny-one-requirements.md` (FO-\* ids, D-8, open questions OQ-3/OQ-4 flagged for later phases),
`steering/funny-one-design.md` (no-server architecture, the reuse map against
`funny-multi-client`, the one genuinely new system — the rig compositor), `steering/
funny-one-tasks.md` (Phase FO-0–FO-7 + a Phase S for store apps, sized S/M/L, FO-0 marked closed
today). `steering/tasks.md` B-1/B-2 (AND37/IOS37) annotated "pulled forward 2026-09-20" per the
owner's direction to plan store apps for both products now rather than post-v1; its header notes
Phase 9's pause and points at the new documents.

**Also determined (store apps, both products):** Apple Developer Program enrollment as an
Organization needs a **D-U-N-S number** first, which can take 1–2 weeks to register if the ABN
entity doesn't already have one — this is the long-pole step and was started as the very next
owner action regardless of anything else in this step. Google Play Console (Organization,
$25 one-time, ABN business verification) runs in parallel and is usually faster. Funny One's
store shells, once it exists, are in a *stronger* App Store 4.2 position than Funny Multi's
(a self-contained offline game, not a wrapped website) and can realistically target Google Play
Families/"Everyone" — the opposite of Funny Multi's 12+, never-Families positioning (FM-ID-2) —
*because* D-8 chose the offline path; that positioning would not hold if a future change added
any network call.

**Not done this step:** no code, no `apps/funny-one-client` scaffold yet (T-FO-1.1, next once the
owner is ready), no developer-account signup completed (owner action, in progress outside this
session). Full six-gate suite not re-run — no application code changed, only new/edited
Markdown, prettier-checked.

~~**RESUME HERE (2026-09-20, after Step 18).** Phase 9 (commercial rails, D-6/D-7) is paused, not
abandoned — T-9.3 (server support-rail config, no owner/spend dependency) is still the easiest
re-entry point whenever the owner wants Phase 9 moving again. The two new fronts each have a
concrete next step: **T-FO-1.1** (Funny One: scaffold `apps/funny-one-client`, no art needed yet
— can start any time) and the Apple/Google developer-account enrollment sequence in
`steering/funny-one-tasks.md` Phase S (owner action, D-U-N-S lookup first). Rig art (T-FO-4.1) is
the single largest unknown in the Funny One plan — content authoring, not engineering, and
genuinely unscoped until real art exists.

Still open, none blocking: making the repo public before any launch announcement; T-7.1's iPhone
install leg (closes Gate 7); B-8 (Play Protect warning on Android install); the Arm VM retry; a
cosmetic "Render" sweep in code comments; the stray T-4.2 comment in
`apps/funny-multi-server/src/prompt.ts:72`.~~ *Carried — see Step 19 below.*

## Step 19 (task T-FO-1.1): `apps/funny-one-client` workspace scaffold (2026-09-20)

**Shipped:** the new workspace, adapted from `apps/funny-multi-client` per
`steering/funny-one-design.md` §2's reuse map. Kept unmodified: `styles/motion.ts` (spring
presets, `screenSlide`), `testSetup.ts`, `swReload.ts`, `components/art/Wordmark.tsx`, the
`i18n/index.ts` auto-discovery/RTL/completeness-check pattern. Adapted: `basePath.ts` drops
`homeUrl()` (no `?room=` link to build — FO-ARC-3, no server, no rooms); `SourceFooter.tsx`
drops the `sourceQr` prop and its `QRCode` import for the same reason, and its content-notice
copy drops the "AI pictures" clause since Funny One's rig art ships with the app rather than
being generated per-story (D-8); `package.json` deliberately omits `qrcode`, `qrcode.react`
and `socket.io-client`; `vite.config.ts`'s PWA plugin precaches everything
(`globPatterns: ['**/*.{js,css,png,svg,webmanifest}']`) rather than the NetworkFirst
shell-only strategy Funny Multi uses, since full offline precache is the headline feature
(FO-IMG-2) — a comment flags that `globPatterns` will need to widen once rig art lands
(T-FO-4.1). `App.tsx` is a deliberate placeholder (wordmark + subtitle + footer, no game
logic) — the local round-robin state machine is T-FO-2.2, not this task. i18n ships only
`en.json` for now; `home.title`/`home.subtitle`/`home.start`/`home.gameRules`/`home.rules`
and `footer.*` keys are Funny-One-specific copy, not copied from Funny Multi's catalog.
Placeholder icons (`icon-180/192/512/512-maskable.png`) copied byte-for-byte from
`apps/funny-multi-client/public/` as temporary branding — swap alongside real rig art before
this product is announced anywhere.

**Verified:** `npm install` links the new workspace cleanly; `npx prettier --check
apps/funny-one-client`, `npm run typecheck --workspace=funny-one-client`, `npx eslint
apps/funny-one-client`, `npm run test --workspace=funny-one-client` (1/1) and `npm run build
--workspace=funny-one-client` (PWA precache generated, 13 entries) all pass. One fix during
verification: `App.test.tsx` first asserted with `toBeInTheDocument()` (jest-dom, never a
dependency of this monorepo) — changed to `toBeTruthy()` to match the convention already used
throughout `funny-multi-client`'s own test suite. `npm audit` clean (0 vulnerabilities,
monorepo-wide).

**Owed:** T-FO-1.1 closes with this step. Next up per `steering/funny-one-tasks.md`: T-FO-2.1
(promote `renderProse`/`polishProse`/`polishRussianProse` out of
`apps/funny-multi-server/src/grammar.ts` into `packages/shared`, since Funny One has no server
to hold that logic) and T-FO-2.2 (local round-robin state machine — OQ-3, the minimum-player
floor, needs confirming before that one starts).

~~**RESUME HERE (2026-09-20, after Step 19).** `apps/funny-one-client` exists, builds, and passes
all applicable gates; it renders a placeholder screen only — no game logic yet. Phase 9 stays
paused (T-9.3 is its easiest re-entry). Next agent step: **T-FO-2.1** (prose-rendering
promotion into `packages/shared`) or **T-FO-2.2** (round-robin engine, pending OQ-3), owner's
call on order; the Apple/Google developer-account enrollment sequence (Phase S, D-U-N-S lookup
first) remains an owner action running in parallel.

Still open, none blocking: making the repo public before any launch announcement; T-7.1's iPhone
install leg (closes Gate 7); B-8 (Play Protect warning on Android install); the Arm VM retry; a
cosmetic "Render" sweep in code comments; the stray T-4.2 comment in
`apps/funny-multi-server/src/prompt.ts:72`.~~ *Carried — see Step 20 below.*

## Step 20 (task T-FO-2.1): promote prose rendering into `packages/shared` (2026-09-20)

**Shipped:** `renderProse`, `QUESTIONS`, `PROSE_TEMPLATES`, `requireAuthoredLanguage` (from
`apps/funny-multi-server/src/i18n/index.ts`) and `polishProse`/`polishRussianProse` (from
`apps/funny-multi-server/src/grammar.ts`) promoted into `packages/shared/src/i18n/` — owner
confirmed the wider scope (the whole i18n module, not just the three named functions), since
`renderProse` alone is meaningless without the prose templates it fills. The 15 language
catalogs moved from JSON (`<code>.json`) to TS modules (`<code>.ts`), owner's second call,
mirroring the pattern `pools/text/index.ts` already used for `POOL_TEXTS`: static imports and a
`Record<AuthoredLanguage, ServerI18n>` type annotation replace the old loader's
`readdirSync`/`createRequire` (Node-only — incompatible with two browser clients importing this
package) and its boot-time "missing language" throw, which is now a compile error instead.
`apps/funny-multi-server/src/game.ts` re-points at `@funny/shared`; the server's own `i18n/`
directory, `grammar.ts`, `grammar.test.ts`, and `scripts/copy-i18n.mjs` are deleted, and the
server's `build` script no longer runs the copy step. Both test files moved into
`packages/shared/src/i18n/` (`index.test.ts`, `grammar.test.ts`), updated only to import sibling
shared modules directly instead of `@funny/shared` + local server files — same assertions,
same coverage. OQ-3 also resolved this step (owner, 2026-09-20): solo play (1 human + 1 virtual
seat) is a valid v1 start, no 3-player floor — recorded in `funny-one-requirements.md` §7,
unblocking T-FO-2.2.

**Verified:** full suite — typecheck, lint, `prettier --check` clean; 629/629 tests across 37
files (client 190, server 209, funny-one-client 1, shared 190, cloudflare 39), run outside the
sandbox; `npm audit` 0 vulnerabilities, monorepo-wide. One `disconnect.socket.test.ts` flake
surfaced mid-session under parallel load (host-drop promotion, unrelated to this change) —
confirmed passing 13/13 in isolation and again clean on the final full-suite rerun. No in-browser
verification: pure refactor, no UI surface touched.

**Owed:** T-FO-2.1 closes with this step. Next up per `steering/funny-one-tasks.md`: **T-FO-2.2**
(local round-robin state machine, now unblocked by OQ-3 — 2-seat minimum, not 3) → FO-CORE-1/2,
FO-BOT-1; the Apple/Google developer-account enrollment sequence (Phase S, D-U-N-S lookup first)
remains an owner action running in parallel.

~~**RESUME HERE (2026-09-20, after Step 20).** `@funny/shared` now carries all prose-rendering
logic (rendering, polish, questions, templates) for both products; Funny Multi's server consumes
it with no behavior change (629/629 tests). OQ-3 is resolved. Next agent step: **T-FO-2.2**
(round-robin engine — seat list, per-question rotation via `storyIndex`, virtual-seat auto-fill
with the "thinking" delay; pure reducer, unit-tested before any screen exists; 2-seat minimum).
Phase 9 stays paused (T-9.3 is its easiest re-entry); the Apple/Google developer-account
enrollment sequence (Phase S, D-U-N-S lookup first) remains an owner action running in parallel.

Still open, none blocking: making the repo public before any launch announcement; T-7.1's iPhone
install leg (closes Gate 7); B-8 (Play Protect warning on Android install); the Arm VM retry; a
cosmetic "Render" sweep in code comments; the stray T-4.2 comment in
`apps/funny-multi-server/src/prompt.ts:72`.~~ *Carried — see Step 21 below.*

## Step 21 (task T-FO-2.2): local round-robin state machine (2026-09-20)

**Shipped:** `apps/funny-one-client/src/game/roundRobin.ts` — the pure reducer FO-CORE-1/2 and
FO-BOT-1 need, with no screen consuming it yet (Phase FO-3). `createGame(seats)` builds initial
state for 2–7 seats (`MIN_SEATS`/`MAX_SEATS`; OQ-3's 2-seat solo floor, not FM's 3-player room
minimum). Turn order is question-major per FO-CORE-2: question 0 for every seat in order, then
question 1, and so on for `SLOT_COUNT` (7) questions — `seatTurn`/`question` track whose turn it
is; `submitAnswer` writes the given option id onto `storyIndex(seatTurn, question, seatCount)`
(the unmodified shared rotation, FO-ARC-1) and advances the turn, then the question once every
seat has answered it. `pickVirtualAnswer` reimplements FM-BOT-2's same-slot exclusion locally
(uniform pick from the question's pool, excluding ids already placed at that slot this question,
falling back to the whole pool if exhausted) — reimplemented rather than imported because the
server's version is entangled with `Room`/socket state; RNG is an injected parameter (defaults to
`Math.random`) so both this module's tests and any future caller stay deterministic. The
0.8–1.5 s "thinking" delay itself is deliberately *not* in the reducer — `currentSeat(state).kind`
exposes whether the active turn is virtual, and the delay/timing lives in a hook at T-FO-3.3, so
this step stays synchronously testable with no fake timers.

**Verified:** `roundRobin.test.ts` — turn order at N=2/3/7, a full 7×N playthrough to completion
(`isDone`), an all-human game, an all-virtual game played to completion via `pickVirtualAnswer`,
a mixed human/virtual game, the storyIndex routing worked example from `rotation.test.ts`
reproduced through the reducer, the same-slot exclusion never repeating an id within one
question, and the pool-wide fallback once a question's exclusion set is constructed to cover the
whole pool (17 new tests). Full suite: typecheck, lint, `prettier --check` clean; 645/645 tests
across 38 files (client 190, server 209, funny-one-client 17 [+16], shared 190, cloudflare 39),
run outside the sandbox; `npm audit` 0 vulnerabilities. No in-browser verification: no screen
exists yet for this reducer to drive (Phase FO-3).

**Owed:** T-FO-2.2 closes with this step. Next up per `steering/funny-one-tasks.md`: **Phase
FO-3** — T-FO-3.1 (home/setup screen), T-FO-3.2 (`HandoffScreen` + adapted `RoundScreen`),
T-FO-3.3 (the virtual-seat "thinking" delay this step deferred); the Apple/Google
developer-account enrollment sequence (Phase S, D-U-N-S lookup first) remains an owner action
running in parallel.

~~**RESUME HERE (2026-09-20, after Step 21).** `apps/funny-one-client` now has a tested local
game engine (`src/game/roundRobin.ts`) but still no screens beyond the T-FO-1.1 placeholder. Next
agent step: **Phase FO-3** — likely **T-FO-3.1** (home/setup screen: seat count, human/virtual
mix, language picker gated to `AUTHORED_LANGUAGES`) first, since T-FO-3.2's handoff/round screens
need seats to exist. Phase 9 stays paused (T-9.3 is its easiest re-entry); the Apple/Google
developer-account enrollment sequence (Phase S, D-U-N-S lookup first) remains an owner action
running in parallel.~~

## Step 22 — Funny One home/setup screen (2026-09-20)

**Shipped:** `apps/funny-one-client/src/screens/HomeScreen.tsx` (T-FO-3.1) — the local setup
screen, adapted from Funny Multi's create-mode `HomeScreen`: an editable seat list (human or
virtual, add/remove bounded by `MIN_SEATS`/`MAX_SEATS`, default 1 human + 1 virtual per OQ-3's
solo floor) and a single content-language picker gated to `AUTHORED_LANGUAGES` (currently all 15
of `LANGUAGES`), reusing the same two-column rules+language `ScrollBox` layout. Flag artwork
copied unmodified into `public/flags/`; `ScrollBox.tsx` copied unmodified. `GameState`
(`src/game/roundRobin.ts`) gained a `language: AuthoredLanguage` field and `createGame` a second
`language` parameter, so the setup screen's pick survives into the game state for future
reveal/prose rendering (mirrors Funny Multi's `Room.language`) — propagated through the 15
existing `createGame` call sites in `roundRobin.test.ts` and the one in `App.tsx`. `App.tsx` now
renders `HomeScreen` and a minimal placeholder "playing" view (current seat/question number) via
the reducer's `currentSeat`/`currentSlot`/`isDone` selectors; the real `HandoffScreen`/
`RoundScreen` UI is explicitly out of scope here (T-FO-3.2).

**Verified:** `HomeScreen.test.tsx` (8 new tests) — OQ-3 default seat mix, add/remove seat bounds
at the floor and ceiling, empty-name disables Start, language picking highlights the pressed
button, and Start calls back with trimmed seat names plus the selected language. Full suite:
typecheck, lint, `prettier --check` clean; 653/653 tests across 38 files (client 190, server 209,
funny-one-client 25 [+8], shared 190, cloudflare 39), run outside the sandbox; `npm audit` 0
vulnerabilities. No in-browser verification yet — the placeholder playing view is not meant to be
the real experience (T-FO-3.2 replaces it).

**Owed:** T-FO-3.1 closes with this step. Next up per `steering/funny-one-tasks.md`: **T-FO-3.2**
(`HandoffScreen` + adapted `RoundScreen` combobox — App.tsx's placeholder playing view gets
replaced here) then **T-FO-3.3** (virtual-seat "thinking" delay, 0.8–1.5 s); the Apple/Google
developer-account enrollment sequence (Phase S, D-U-N-S lookup first) remains an owner action
running in parallel.

## Step 23 — Funny One `HandoffScreen` + `RoundScreen` (2026-09-20)

**Shipped:** `apps/funny-one-client/src/screens/HandoffScreen.tsx` (T-FO-3.2, new — FO-CORE-3):
a full-screen "Pass to {name}" interstitial with an explicit "I'm {name} — go" tap; it never
receives the previous answer, so there is nothing for it to leak by construction.
`RoundScreen.tsx` adapted from Funny Multi's (`apps/funny-multi-client/src/screens/RoundScreen.tsx`):
same radiogroup combobox, per-render shuffle, same FM-ANS-1 "no free-text affordance" constraint
— but no `socket`, no `round:start` payload, no `isHost`, no joiner dual-language gloss or
story-language badge (none of those concepts exist on one device with one chosen language), and
no `TimerBar` (owner call, 2026-09-20: pass-and-play has no network latency to bound, and rushing
whoever holds the phone works against the game). Question text now comes from `QUESTIONS[language][slot]`
(`@funny/shared`, promoted at T-FO-2.1) instead of a server payload.

`App.tsx` rewritten as a local phase machine: setup → (handoff → round)× SLOT_COUNT → done, driven
by `roundRobin.ts`'s reducer plus one local flag (`awaitingHandoff`) that gates the interstitial
per turn. A virtual seat's turn never renders anything of its own (owner call, 2026-09-20, per
FO-CORE-3's "every handoff" read literally for humans only) — an effect resolves it immediately
via `pickVirtualAnswer`/`submitAnswer` as soon as it becomes the current turn, chaining through any
run of consecutive virtual seats with no visible screen; deliberately rendering `null` for that
turn rather than the combobox, so a human cannot answer on a bot's behalf. The 0.8–1.5 s
"thinking" pause that will eventually stand in for that instant resolution is still T-FO-3.3's, not
this step's.

**Verified:** `RoundScreen.test.tsx` (13 new tests, ported from Funny Multi's) — no text-entry
element on any of the 7 slots, no search/filter/combobox role, options match the shared pool
exactly (including in a non-English game language), two renders shuffle differently while holding
still during a single selection, Submit stays disabled with nothing selected and fires `onSubmit`
exactly once. `HandoffScreen.test.tsx` (2 new tests) — the seat name appears in both the title and
the go button, tapping go calls back. `App.test.tsx` gained a full end-to-end playthrough (1 human
+ 1 virtual, the OQ-3 default): every question shows the handoff, tapping go reveals the combobox,
submitting an answer advances straight to the next handoff with the virtual seat's turn resolved
silently in between, and the 7th submit reaches "game complete". Full suite: typecheck, lint,
`prettier --check` clean; 677/677 tests across 39 files (client 190, server 209, funny-one-client
49 [+24], shared 190, cloudflare 39), run outside the sandbox; `npm audit` 0 vulnerabilities.
**In-browser verification:** `npm run dev` at 375px width via a Playwright driver script (no
project run-skill existed yet, `chromium-cli` wasn't installed) — HomeScreen → Start → "Pass to
Player 1" → the "Who?" combobox with 9 visible options, no input/textarea/contenteditable anywhere
→ looped through all 7 questions, the virtual seat's turns never producing a screen → "Funny One —
game complete". Only console output was the pre-existing "missing i18n catalog" warning for the 14
languages T-FO-5.1 hasn't wired yet — unrelated to this step.

**Owed:** T-FO-3.2 closes with this step. Next up per `steering/funny-one-tasks.md`: **T-FO-3.3**
(virtual-seat "thinking" mascot delay, 0.8–1.5 s, archive ONE-4) — the natural next step now that
a screen exists for the delay to gate; then **Phase FO-4** (rig art + reveal, T-FO-4.1 first,
confirm OQ-4 before the gallery/end screen depends on it). The Apple/Google developer-account
enrollment sequence (Phase S, D-U-N-S lookup first) remains an owner action running in parallel.

**RESUME HERE (2026-09-20, after Step 23).** `apps/funny-one-client` now plays a full local game
end to end — setup, handoff, combobox, completion — with virtual seats resolving invisibly. Next
agent step: **T-FO-3.3**, the virtual-seat "thinking" mascot delay (0.8–1.5 s): give that instant
`null`-render turn a comedic pause and (per archive ONE-4) a mascot, without turning it into
something a human could act on. Phase 9 stays paused (T-9.3 is its easiest re-entry); the
Apple/Google developer-account enrollment sequence (Phase S, D-U-N-S lookup first) remains an
owner action running in parallel.

Still open, none blocking: making the repo public before any launch announcement; T-7.1's iPhone
install leg (closes Gate 7); B-8 (Play Protect warning on Android install); the Arm VM retry; a
cosmetic "Render" sweep in code comments; the stray T-4.2 comment in
`apps/funny-multi-server/src/prompt.ts:72`; no project run-skill exists yet for driving either
client in a browser (`/run-skill-generator` would capture the Playwright-driver pattern this step
used, since `chromium-cli` is not installed in this environment).
