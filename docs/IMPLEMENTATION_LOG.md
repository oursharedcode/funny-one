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

~~**RESUME HERE (2026-09-20, after Step 23).** `apps/funny-one-client` now plays a full local game
end to end — setup, handoff, combobox, completion — with virtual seats resolving invisibly. Next
agent step: **T-FO-3.3**, the virtual-seat "thinking" mascot delay (0.8–1.5 s): give that instant
`null`-render turn a comedic pause and (per archive ONE-4) a mascot, without turning it into
something a human could act on. Phase 9 stays paused (T-9.3 is its easiest re-entry); the
Apple/Google developer-account enrollment sequence (Phase S, D-U-N-S lookup first) remains an
owner action running in parallel.~~ *(carried — see Step 24 below.)*

## Step 24 — Funny One virtual-seat "thinking" mascot delay (2026-09-20)

**Shipped:** `apps/funny-one-client/src/game/thinkingDelay.ts` (T-FO-3.3, FO-BOT-1, archive ONE-4)
— `pickThinkingDelayMs`, RNG-injected the same way as `roundRobin.ts`'s `pickVirtualAnswer`
(defaults to `Math.random`), uniform in `[THINKING_DELAY_MIN_MS, THINKING_DELAY_MAX_MS)` =
`[800, 1500)`. `ThinkingScreen.tsx` (new) reuses Funny Multi's `WaitingMascot` copied unmodified
into `src/components/art/`, with only the one CSS animation it actually uses (`mascot-tap`) ported
into `src/styles/index.css` — deliberately not the whole FM mascot set. The screen is purely
decorative: no button, no interactive element of any kind, so a human cannot act on a bot's behalf.

`App.tsx`'s virtual-seat effect changed from resolving the turn instantly (Step 23) to scheduling
`submitAnswer` after `pickThinkingDelayMs()` via `setTimeout`, with a `clearTimeout` cleanup and a
functional `setGame(prev => …)` update — closing over `prev` rather than the possibly-stale `game`
from the effect's closure, which also makes the effect correct under React 18 StrictMode's dev-only
mount→cleanup→mount double-invoke. While a virtual seat's timer is pending, `App.tsx` renders
`ThinkingScreen` for that seat instead of the earlier `null`.

**Verified:** `thinkingDelay.test.ts` (3 new tests) — floor at `rng()=0`, approaches but never
reaches the ceiling as `rng()→1`, 200-iteration real-`Math.random` bounds check.
`ThinkingScreen.test.tsx` (2 new tests) — seat name renders, zero interactive elements (`button`,
`input`, `textarea`, `[contenteditable]`). `App.test.tsx`'s full-playthrough test updated to fake
timers (`vi.useFakeTimers`/`advanceTimersByTimeAsync`, same pattern as Funny Multi's own
`App.test.tsx`): after each human submit it now asserts the `ThinkingScreen` text and zero buttons
before advancing past `THINKING_DELAY_MAX_MS` and continuing. Full suite: typecheck, lint,
`prettier --check` clean; 682/682 tests across 41 files (client 190, server 209, funny-one-client
54 [+5], shared 190, cloudflare 39), run outside the sandbox; `npm audit` 0 vulnerabilities.
**In-browser verification:** same Playwright-driver pattern as Step 23, phone-width (375px) —
after a human's Submit, `ThinkingScreen` appeared with zero `<button>` elements and the "Bot 1 is
thinking…" mascot; elapsed time to the next handoff measured 858 ms, inside the 800–1500 ms FO-BOT-1
bound; the only console output was the same pre-existing "missing i18n catalog" warning as Step 23,
unrelated to this step. Both screenshots inspected visually.

**Owed:** T-FO-3.3 closes with this step. Next up per `steering/funny-one-tasks.md`: **Phase FO-4**
(rig art + reveal), starting with **T-FO-4.1** (rig art — content authoring, not code) — but
**confirm OQ-4 (any cross-device sharing) with the owner first**, since the gallery/end screen
(T-FO-4.3) depends on that answer. The Apple/Google developer-account enrollment sequence (Phase S,
D-U-N-S lookup first) remains an owner action running in parallel.

~~**RESUME HERE (2026-09-20, after Step 24).** `apps/funny-one-client` now plays a full local game
end to end with virtual seats pausing on a comedic "thinking" mascot screen before their turn
resolves — Phase FO-3 is closed. Next agent step: propose **T-FO-4.1** (rig art) to the owner, but
first get an explicit answer on **OQ-4** (any cross-device sharing) since it gates T-FO-4.3's
design. Phase 9 stays paused (T-9.3 is its easiest re-entry); the Apple/Google developer-account
enrollment sequence (Phase S, D-U-N-S lookup first) remains an owner action running in parallel.~~

**OQ-4 resolved (2026-09-20/21, owner).** Cross-device sharing is wanted for Funny One's finished
story/cartoon, via the OS native share sheet only (AirDrop, Bluetooth, Messages, email,
save-to-photos) — no upload, no link, no network call from the app itself, so FO-IMG-2 (offline
PWA) and FO-ID-1 (Play Families eligibility) both stay intact as written. Recorded in
`funny-one-requirements.md` §7 and `funny-one-tasks.md`'s T-FO-4.1 note. This settles T-FO-4.2/4.3
scope (reuse Funny Multi's local `downloadStory.ts`-style canvas export, not its `/i/<hash>`
upload+link pattern) without itself closing any task — no code changed.

~~**RESUME HERE (2026-09-21, after OQ-4's resolution).** Phase FO-3 is closed (Step 24). OQ-4 is now
resolved, unblocking Phase FO-4's design. Next agent step: **T-FO-4.1** (rig art — backgrounds,
characters, co-characters, props matched to the existing mascot style; content-authoring time, not
code) — since this is art content rather than something an agent implements directly, the concrete
next step is likely drafting the asset spec/list first, then handing off for the actual artwork,
unless the owner already has art in hand and wants to jump to T-FO-4.2 (compositor) once assets
exist. Phase 9 stays paused (T-9.3 is its easiest re-entry); the Apple/Google developer-account
enrollment sequence (Phase S, D-U-N-S lookup first) remains an owner action running in parallel.

Still open, none blocking: making the repo public before any launch announcement; T-7.1's iPhone
install leg (closes Gate 7); B-8 (Play Protect warning on Android install); the Arm VM retry; a
cosmetic "Render" sweep in code comments; the stray T-4.2 comment in
`apps/funny-multi-server/src/prompt.ts:72`; no project run-skill exists yet for driving either
client in a browser (`/run-skill-generator` would capture the Playwright-driver pattern Steps 23–24
used, since `chromium-cli` is not installed in this environment).~~ *(carried — see Step 25 below.)*

## Step 25 — T-FO-4.1: all 40 rig art assets drawn (2026-09-22)

**Shipped:** all 40 rig assets under `apps/funny-one-client/src/components/art/rig/` — 10 each of
`where` (background, `0 0 400 300` viewBox, full-bleed), `who` (character), `with`
(co-character), `did` (prop, all three `0 0 100 100`), one file per pool id from
`packages/shared/src/pools/options.ts`'s slots 0/1/2/4, matched to the existing mascot style
(`DESIGN_SYSTEM.md` §5: exaggerated misaligned eyes, `#1f2937` 2.5px outlines, hand-drawn wobble,
the 8-token brand/state palette, no gradients). Owner-approved split (2026-09-22): separate `.svg`-
style `.tsx` files (not inline components), drawn by the agent (not commissioned), a 4-asset
vertical slice first to validate the style before the other 36. `RIG_ART.md` (new) is the written
spec — file/id mapping, canvas conventions, z-order, style rules — authored before any art, then
extended with a full 40-row table once the set was complete. The 4-asset slice caught one real bug:
`AngryGeese.tsx`'s third goose had its beak positioned past its own SVG viewBox (owner-reported from
a screenshot), fixed by pulling the goose transforms back inside bounds — noted in `RIG_ART.md` as
a thing to double-check on any asset with off-center elements.

**Verified:** all six gates re-run clean across the full `rig/` tree and the whole repo — eslint,
`prettier --check`/`--write`, `npm run typecheck` (all 4 workspaces), `npm run lint`,
`npm run format:check`, `npm run test --workspace=apps/funny-one-client` (54/54, 7 files),
`npm audit --omit=dev` (0 vulnerabilities). Visual review: bundled all 40 components with esbuild
(entry file placed temporarily inside `apps/funny-one-client` for node_modules resolution, deleted
after use — nothing committed there) and rendered them via `react-dom/server` into a composed grid,
screenshotted with the Playwright CLI (same pattern as the 4-asset slice) and inspected — all 40
render inside their frame, no clipping, consistent style, on-palette.

**Owed:** none — T-FO-4.1 closes with this step (no registry yet, by design: `rigIndex.ts` is
T-FO-4.2's job now that all 40 exist).

*Full suite: typecheck, lint, `prettier --check` clean; 54/54 `funny-one-client` tests (the other
workspaces unaffected by this content-only change), run in-session; `npm audit` 0 vulnerabilities.
No TypeScript logic changed — new art components and `RIG_ART.md` only.*

---

~~**RESUME HERE (2026-09-22, after Step 25).** All 40 rig assets exist and render cleanly
(`apps/funny-one-client/src/components/art/rig/`); `RIG_ART.md` documents the full set. T-FO-4.1 is
closed. Next agent step: **T-FO-4.2** — the rig compositor: a `rigIndex.ts` id→component registry
(deferred here on purpose), layered assembly (`where` → `who` → `with` → `did`, z-index 0–3 per
`RIG_ART.md`'s canvas conventions), spring-physics reveal reusing `motion.ts` presets (FO-IMG-3),
and in-round dedup reusing FO-BOT-1's existing same-slot exclusion logic (no new algorithm needed).
Then **T-FO-4.3**: `StoryGallery` + end screen, adapted from Funny Multi's.

Still open, none blocking: making the repo public before any launch announcement; T-7.1's iPhone
install leg (closes Gate 7); B-8 (Play Protect warning on Android install); the Arm VM retry; a
cosmetic "Render" sweep in code comments; the stray T-4.2 comment in
`apps/funny-multi-server/src/prompt.ts:72`; no project run-skill exists yet for driving either
client in a browser (`/run-skill-generator` would capture the Playwright-driver pattern Steps 23–25
used, since `chromium-cli` is not installed in this environment).~~ *(carried — see Step 26 below.)*

## Step 26 — T-FO-4.2: rig compositor — registry, layered assembly, spring reveal (2026-09-22)

**Shipped:** `art/rig/rigIndex.ts` — a static `OptionId → component` map for the 4 visual slots,
one import per asset (no dynamic `import()`, matching the rest of the client's bundling). Guarded
by `rigIndex.test.ts`, which asserts the map's key set is exactly `POOLS[0/1/2/4]`'s id set — the
failure mode worth catching here is a pool edit silently losing its art (or the reverse: orphaned
art for a retired id), not the lookup itself. `components/RigScene.tsx` is the compositor
(FO-IMG-1): given a `Story`, it layers `where` (z0, full-bleed) → `who` (z1, stage-left third,
bottom-anchored) → `with` (z2, stage-right third) → `did` (z3, centered, bridging the two) inside
a `relative`/`absolute` stack per `RIG_ART.md`'s conventions — CSS, no canvas (funny-one-design.md
§3, the FM-NFR-2 low-end-Android bar). A layer with no answer yet (`story.answers[slot] === null`)
simply isn't rendered, so a partial story degrades gracefully. `reveal` (default `false`) drives
FO-IMG-3's spring-physics stagger, reusing `motion.ts`'s `goofy` preset unmodified — each layer
fades/springs in with a per-layer delay when `true`, or renders already-settled when `false` (the
mode T-FO-4.3's gallery needs, so a finished story doesn't replay its reveal on every scroll).

**Owner decisions this session:** FO-IMG-4 (in-round dedup) stays **bot-only** — the existing
`usedOptionsThisQuestion` exclusion in `roundRobin.ts` already covers virtual seats; humans keep
the unfiltered pool. Reasoning: it's a SHOULD, a visually identical scene needs all 4 slots to
collide (~1-in-10⁴), and greying out an option a human player wants is worse feel than a rare
repeat. The 400×300 (4:3) frame from `RIG_ART.md` is **locked**, not revisited — no reason to
redraw 40 assets. Recorded in `funny-one-tasks.md`'s T-FO-4.2 note.

**Verified:** typecheck (all 4 workspaces), `eslint .`, `prettier --check .`, full `npm test`
(688/688 across all 6 workspaces, run outside the sandbox), `npm audit --omit=dev` (0
vulnerabilities) — all clean. Visual check: a render harness (temporarily inside
`apps/funny-one-client`, esbuild-bundled with a compiled Tailwind stylesheet inlined, deleted after
use) rendered three `RigScene`s via `react-dom/server` — two full combos and one partial story —
screenshotted with the Playwright CLI. Confirmed: background full-bleed, `who`/`with` on opposite
sides bottom-anchored, `did` bridging them in the foreground, correct z-order, no crash on the
partial story. The spring reveal itself (an animation, not a still) was not eyeballed live in
`npm run dev` — noted as owed below rather than assumed from the static layout check.

**Not done here, by design:** `RigScene` isn't wired into any screen yet — `App.tsx`'s done phase
is still the Step 23 stub. That wiring belongs to **T-FO-4.3** (`StoryGallery` + end screen).

**Owed:** the live spring-reveal animation (not just its settled layout) wants one eyeball pass on
`npm run dev` before this is fully trusted — folding into T-FO-4.3's own in-browser check is fine,
since that's the first screen that will actually show `reveal={true}`.

*Full suite: typecheck, lint, `prettier --check` clean; 688/688 tests across all 6 workspaces
(funny-multi-client 190, funny-multi-server 209, funny-one-client 60 [+6], @funny/shared 190,
cloudflare 39), run outside the sandbox; `npm audit` 0 vulnerabilities. New: `RigScene.tsx`,
`RigScene.test.tsx`, `art/rig/rigIndex.ts`, `art/rig/rigIndex.test.ts`. No existing file's logic
changed.*

---

~~**RESUME HERE (2026-09-22, after Step 26).** T-FO-4.2 is closed: `RigScene` (compositor + spring
reveal) and `art/rig/rigIndex.ts` (id→component registry, bijection-tested) exist under
`apps/funny-one-client/src/components/`. Not wired to any screen yet — `App.tsx`'s done phase is
still Step 23's placeholder text.

Next agent step: **T-FO-4.3** — `StoryGallery` + end screen, adapted from Funny Multi's
`RoomGallery`/`EndScreen`. Wire `RigScene` (with `reveal={true}` the first time a story's picture is
shown, `reveal={false}` on any later view) into `App.tsx`'s done phase, one scene per seat's story.
While there, do the owed live eyeball of the spring reveal on `npm run dev` (Step 26 only checked
the settled layout via static render).

Still open, none blocking: making the repo public before any launch announcement; T-7.1's iPhone
install leg (closes Gate 7); B-8 (Play Protect warning on Android install); the Arm VM retry; a
cosmetic "Render" sweep in code comments; the stray T-4.2 comment in
`apps/funny-multi-server/src/prompt.ts:72`; no project run-skill exists yet for driving either
client in a browser (`/run-skill-generator` would capture the Playwright-driver pattern Steps 23–26
used, since `chromium-cli` is not installed in this environment).~~ *(carried — see Step 27 below.)*

## Step 27 — T-FO-4.2a: `when` badges — 22 assets, top-left badge layer (2026-09-22)

**Why this step exists:** after Step 26 the owner asked for the three prose slots (`when`, `why`,
`end`) to get *real art in the real `RigScene`*, not just prose under the picture. That amends
FO-IMG-1 (which locked four layers) and adds 66 assets; the owner chose to land it as three gated
sub-steps, one slot each, rather than one drop. This is the first.

**Shipped:** 22 `when` assets under `art/rig/when/`, one per `POOLS[3]` id (PascalCase-of-slug
filenames, same default-export/`className`-only contract as the 40 scene assets), plus
`when/Plate.tsx` — a shared sticker plate (hard ink shadow under a wobbly cream card) every badge
draws on, so the 22 read as one set over any of the 10 backgrounds. Question marks and snores are
paths, not `<text>`, so nothing breaks under the 15 languages. `rigIndex.ts` registers all 22;
`rigIndex.test.ts` now checks bijection against `RIG_SLOTS = [0, 1, 2, 3, 4]` — Funny One's own
list, deliberately *not* shared's `VISUAL_SLOTS`, which drives Funny Multi's AI prompt builder and
both `RoundScreen`s and stays at the four prose-free slots. `RigScene.tsx` gains a fifth layer: slot
3 at z-index 4, pinned `top-[4%] left-[3%]`, 22% × 30% of the frame. Each layer now carries its own
`enter` offset, so the badge drops in from above (y −16) while the ground layers keep rising
(y +16); the `goofy` spring and `LAYER_STAGGER_S` are untouched. `RigScene.test.tsx` expects five
layers `[0,1,2,3,4]` and adds a "skips the prose-only slots that have no art yet" case
(`why`/`end` answered → still one layer), which 4.2b/c will narrow as they land.

**Owner decisions this session:** (1) all seven slots get rig art — FO-IMG-1 amended in
`funny-one-requirements.md`, formula line in `funny-one-design.md` §1 updated; (2) placement:
`when` = badge top-left, `why` = thought bubble above `who`, `end` = stamp top-right, z-order
continuing where→who→with→did→when→why→end; (3) three gated sub-steps T-FO-4.2a/b/c, each
committing on all six gates. Recorded under T-FO-4.2 in `funny-one-tasks.md`. `RIG_ART.md`'s
canvas table now carries all seven rows (`why`/`end` marked pending), the 22-row `when` id→file
table, and the 400×300 frame recorded as locked.

**Verified:** typecheck (all 4 workspaces), `eslint .`, `prettier --check .` (after a `--write` on
`RIG_ART.md`'s new tables), `npm audit` (0 vulnerabilities), full `npm test` outside the sandbox —
689/689 across all 6 workspaces (funny-multi-client 190, funny-multi-server 209, funny-one-client
61 [+1], @funny/shared 190, cloudflare 39). Worth writing down: it took three full runs to get one
clean one, and both failures were load-induced timeouts in workspaces with **no local diff**. Run
1 (esbuild + Playwright still busy) failed `funny-multi-server`'s `disconnect.socket.test.ts`
"deletes the room once the last player's window closes" (`await settle()`, then `getRoom` still
defined — a real-socket timing test); run 2 (Prettier running alongside) failed
`funny-multi-client`'s `HomeScreen.test.tsx` "offers only authored languages" — a synchronous
jsdom render that took 6.1 s against vitest's 5 s default. Each workspace passed alone on re-run
(209/209, 190/190), and run 3 on an idle machine was clean end to end. Filed as flakes, not
regressions; the lesson is simply: don't run the suite while anything heavy is going. Visual
check: the Step 26 throwaway-harness pattern (esbuild bundle + compiled
Tailwind inlined, `react-dom/server`, Playwright screenshot, files deleted after use) rendered all
22 badges as a grid plus one composed scene (`when.hat-festival` over Draft 4's kitchen / pirate /
geese / pancakes). No clipping, the plate reads consistently, the badge sits clear of the prop.

**Owed:** unchanged from Step 26 — the live spring reveal (now including the badge's drop-in) gets
its `npm run dev` eyeball in T-FO-4.3, the first screen that shows `reveal={true}`. If the server
disconnect flake recurs on CI, its `settle()` margin deserves a look — separate from this work.

*Full suite: typecheck, lint, `prettier --check` clean; 689/689 tests across all 6 workspaces, run
outside the sandbox; `npm audit` 0 vulnerabilities. New: `art/rig/when/` (22 assets +
`Plate.tsx`). Changed: `rigIndex.ts`, `rigIndex.test.ts`, `RigScene.tsx`, `RigScene.test.tsx`,
`RIG_ART.md`, `funny-one-requirements.md` (FO-IMG-1), `funny-one-design.md` §1,
`funny-one-tasks.md`. `packages/shared` untouched.*

---

~~**RESUME HERE (2026-09-22, after Step 27).** T-FO-4.2a is closed: the `when` badge layer (22 assets
+ `when/Plate.tsx`) is registered in `rigIndex.ts` and composited by `RigScene` at z-index 4.
Sub-steps 4.2b and 4.2c remain before T-FO-4.3 — the owner wants all seven slots on the picture
first.

Next agent step: **T-FO-4.2b** — `why` thought bubbles. 22 assets under `art/rig/why/` (ids =
`POOLS[5]`, PascalCase of slug; texts in `packages/shared/src/pools/text/en.ts`), on a shared
bubble shape (cloud outline + two trailing dots down-left toward `who`) the way `when/Plate.tsx`
anchors the badges. `RigScene.tsx` adds slot 5 at z-index 5, about `top-[6%] left-[26%] h-[30%]
w-[30%]`, entering from above; `RIG_SLOTS` adds 5; `RigScene.test.tsx` expects six layers and its
"skips the prose-only slots" case narrows to `end` only; `RIG_ART.md` gets the 22-row table and the
`why` canvas row loses its "pending" mark. Same visual harness, six gates, commit
`Step 28 (task T-FO-4.2b): …`, no push. Then **T-FO-4.2c** (`end` stamps, z-index 6, top-right,
slight rotation) the same way, then **T-FO-4.3** (`StoryGallery` + end screen, with the owed live
reveal check).

Still open, none blocking: making the repo public before any launch announcement; T-7.1's iPhone
install leg (closes Gate 7); B-8 (Play Protect warning on Android install); the Arm VM retry; a
cosmetic "Render" sweep in code comments; the stray T-4.2 comment in
`apps/funny-multi-server/src/prompt.ts:72`; no project run-skill exists yet for driving either
client in a browser (`/run-skill-generator` would capture the Playwright-driver pattern Steps 23–27
used, since `chromium-cli` is not installed in this environment).~~ *(carried — see Step 28 below.)*

## Step 28 — T-FO-4.2b: `why` bubbles — 22 assets, thought-bubble layer (2026-09-22)

**Why this step exists:** second of the three gated sub-steps the owner chose for the amended
FO-IMG-1 (all seven story slots on the picture, not just the four scene slots). `when` landed in
Step 27; this is `why`.

**Shipped:** 22 `why` assets under `art/rig/why/`, one per `POOLS[5]` id (PascalCase-of-slug file
names, same `className`-only contract as every other rig asset), plus the shared `why/Bubble.tsx`
they all draw on — a scalloped cream cloud over a hard ink shadow with two trailing dots down-left,
pointing back at `who`. The bubble is to `why` what `Plate.tsx` is to `when`: the thing that makes
22 unrelated icons read as one set over any background. Icons stay inside roughly x 22–82 / y 16–64
so nothing collides with the scallops. `rigIndex.ts` registers all 22; `RIG_SLOTS` in
`rigIndex.test.ts` grows to `[0,1,2,3,4,5]`, so the bijection test now guards slot 5 too.
`RigScene.tsx` gains one layer — slot 5, z-index 5, `top-[6%] left-[26%] h-[30%] w-[22%]`, dropping
in from above like the badge. `RigScene.test.tsx` expects six layers in z-order `[0..5]` and its
"skips the prose-only slots" case narrows to `end` alone.

Two deviations from the RESUME HERE plan, both deliberate. The layer is `w-[22%]`, not the sketched
`w-[30%]`: at 30% the bubble crowded the `when` badge beside it. And `packages/shared` is untouched
again — `POOLS[5]`'s "prose only" comment is about Funny Multi's AI picture prompt (DD-3), which
this change does not affect.

**Visual check** (same throwaway harness as Steps 26–27, files deleted before commit): all 22 as a
grid plus two composed scenes — `why.impress-a-pigeon` over Draft 4's kitchen/pirate/geese/pancakes
and `why.simply-hungry` over the cloud castle. Two icons failed that pass and were redrawn:
`never-back-down`'s fist and `pointless-point`'s hand both read as yellow lumps at badge size. The
fist got four real knuckle arcs, finger creases and a thumb clamped across; the hand got a thinner
pointing finger against a taller palm. Both read at thumbnail size now. Nothing clips the bubble,
and the bubble clears both the badge and the prop in the composed scenes.

**Owed:** unchanged — the live spring reveal (background, characters, prop, badge, now bubble) still
gets its `npm run dev` eyeball in T-FO-4.3, the first screen that renders `reveal={true}`.

*Full suite: typecheck, lint, `prettier --check` clean; 689/689 tests across all 6 workspaces
(multi-client 190, multi-server 209, one-client 61, shared 190, cloudflare 39), run outside the
sandbox on an idle machine — clean first try, no repeat of Step 27's load flakes; `npm audit` 0
vulnerabilities. New: `art/rig/why/` (22 assets + `Bubble.tsx`). Changed: `rigIndex.ts`,
`rigIndex.test.ts`, `RigScene.tsx`, `RigScene.test.tsx`, `RIG_ART.md`, `funny-one-tasks.md`.
`packages/shared` untouched.*

---

~~**RESUME HERE (2026-09-22, after Step 28).** T-FO-4.2b is closed: the `why` thought-bubble layer
(22 assets + `why/Bubble.tsx`) is registered in `rigIndex.ts` and composited by `RigScene` at
z-index 5. Six of the seven story slots now draw. Only 4.2c remains before T-FO-4.3.

Next agent step: **T-FO-4.2c** — `end` stamps. 22 assets under `art/rig/end/` (ids = `POOLS[6]`,
PascalCase of slug; texts in `packages/shared/src/pools/text/en.ts`), on a shared stamp shape the
way `Plate.tsx` and `Bubble.tsx` anchor their sets — think a rotated ink-bordered seal, the "this
is how it ended" mark. `RigScene.tsx` adds slot 6 at z-index 6, top-right (`top-[4%] right-[3%]`,
about `w-[24%] h-[28%]`), with a slight rotation so it reads as stamped rather than placed;
`RIG_SLOTS` adds 6, which makes the bijection test cover every pool; `RigScene.test.tsx` expects
seven layers and loses its "skips the prose-only slots" case entirely (nothing is prose-only any
more — replace it with a partial-story case or fold it into the existing one). `RIG_ART.md` gets
the 22-row `end` table, the canvas row loses its "pending" mark, and the status line becomes the
full 106. Same visual harness, six gates, commit `Step 29 (task T-FO-4.2c): …`, no push. Then
**T-FO-4.3** (`StoryGallery` + end screen, with the owed live reveal check).

Note for whoever runs the gates: `npm test` is flaky under load on this machine — two unrelated
timing failures in Step 27 that both passed on an idle re-run. Run it with nothing else going.

Still open, none blocking: making the repo public before any launch announcement; T-7.1's iPhone
install leg (closes Gate 7); B-8 (Play Protect warning on Android install); the Arm VM retry; a
cosmetic "Render" sweep in code comments; the stray T-4.2 comment in
`apps/funny-multi-server/src/prompt.ts:72`; no project run-skill exists yet for driving either
client in a browser (`/run-skill-generator` would capture the Playwright-driver pattern Steps 23–28
used, since `chromium-cli` is not installed in this environment).~~ *(carried — see Step 29 below.)*

## Step 29 — T-FO-4.2c: `end` stamps — 22 assets, top-right stamp layer (2026-09-23)

**Why this step exists:** last of the three gated sub-steps the owner chose for the amended
FO-IMG-1. `when` landed in Step 27, `why` in Step 28; this is `end`, and it closes T-FO-4.2 — all
seven story slots are now on the picture, 106/106 rig assets drawn.

**Shipped:** 22 `end` assets under `art/rig/end/`, one per `POOLS[6]` id, plus the shared
`end/Seal.tsx` they all draw on. The seal is a white octagonal stamp — hard ink shadow, 3px ink
border, a pink inner rule, a small pink lozenge top and bottom. Deliberately **not** a third cream
shape: `Plate.tsx` is a cream card and `Bubble.tsx` a cream cloud, so at thumbnail size a third one
would have been a coin toss. White plus cut corners gives `end` its own silhouette. Icons stay
inside roughly x 24–76 / y 24–76, pulled in further at the cut corners. A scalloped rosette was
tried first and rejected: at a scallop radius big enough to leave room for the icons, the shadow
overflowed the 100×100 viewBox.

`rigIndex.ts` registers all 22; `RIG_SLOTS` in `rigIndex.test.ts` becomes `[0..6]`, so the
bijection test now covers **every** pool — the guard is complete, not partial. `RigScene.tsx` gains
the seventh layer: slot 6, z-index 6, `top-[4%] right-[3%] h-[28%] w-[24%]`. It is the only layer
with a settled tilt (`rotate: -8`), and it enters oversized and counter-turned (`scale: 1.7`,
`rotate: 10`) so the spring reveal reads as *pressed on* rather than placed — the layer type grew
an optional `rotate` for exactly this, defaulting to 0 everywhere else.

`RigScene.test.tsx`: `FULL_STORY` is a full seven now and expects z-order `[0..6]`; the old "skips
the prose-only slots that have no art yet" case is gone, since nothing is prose-only any more. It
is replaced by a gap case — answers at slots 0 and 6 only — which asserts the drawn layers keep
their own z-indexes (`[1, 6]`) instead of being renumbered. `packages/shared` is untouched for the
third sub-step running: `POOLS[6]`'s "prose only" comment is about Funny Multi's AI picture prompt
(DD-3), which none of this affects.

**Visual check** (same throwaway harness as Steps 26–28, files deleted before commit): all 22 as a
tilted 128px grid plus three composed scenes at true stage scale (pirate/geese/kitchen,
llama/walrus/cloud-castle, dragon/goat/cookbook-library). One icon failed outright and was redrawn:
`neighbors-applauded`'s two mullioned windows read as a waffle with feet under it — it is now a
pair of clapping hands with impact marks under a single lit window. Three smaller fixes in the same
round: `everyone-fell-asleep`'s two Zs were merging into one (separated and resized),
`museum-exhibit`'s glass highlights crossed the exhibit itself (moved clear, so it stops reading as
a crossed-out blob), and `smelled-like-lemons` had an ink slash across the fruit (now a white
highlight). The stamp clears the `when` badge and the `why` bubble at the opposite corner in all
three scenes.

**Owed:** unchanged — the live spring reveal (background, characters, prop, badge, bubble, now
stamp) still gets its `npm run dev` eyeball in T-FO-4.3, the first screen that renders
`reveal={true}`.

*Full suite: typecheck, lint, `prettier --check` clean; 689/689 tests across all 6 workspaces
(multi-client 190, multi-server 209, one-client 61, shared 190, cloudflare 39), run outside the
sandbox on an idle machine — clean first try; `npm audit --omit=dev` 0 vulnerabilities. The
one-client count is unchanged because this step replaced a test rather than adding one. New:
`art/rig/end/` (22 assets + `Seal.tsx`). Changed: `rigIndex.ts`,
`rigIndex.test.ts`, `RigScene.tsx`, `RigScene.test.tsx`, `RIG_ART.md`, `funny-one-tasks.md`.
`packages/shared` untouched.*

---

~~**RESUME HERE (2026-09-23, after Step 29).** T-FO-4.2 is **closed** — all three sub-steps done.
Every one of the seven story slots draws: `where`/`who`/`with`/`did` as scene art (Step 25–26),
`when` badges (27), `why` bubbles (28), `end` stamps (29). 106/106 assets, `rigIndex.ts` bijective
with all seven pools, `RigScene` compositing z-index 0–6 with the spring reveal.

Next agent step: **T-FO-4.3** — `StoryGallery` + end screen, adapted from Funny Multi's
(`apps/funny-multi-client`). This is the first screen that renders `RigScene` with `reveal={true}`,
so it also settles the debt carried since Step 26: eyeball the live spring reveal under
`npm run dev` — all seven layers staggering in, the stamp landing last. `reveal={false}` is the
mode the gallery itself wants, so a finished story doesn't replay on every scroll.

Note for whoever runs the gates: `npm test` is flaky under load on this machine — two unrelated
timing failures in Step 27 that both passed on an idle re-run. Run it with nothing else going.
Multi-line commit messages must go through `git commit -F <file>`: PowerShell 5.1 mangles
here-strings containing double quotes on the way to `git.exe`.

Still open, none blocking: making the repo public before any launch announcement; T-7.1's iPhone
install leg (closes Gate 7); B-8 (Play Protect warning on Android install); the Arm VM retry; a
cosmetic "Render" sweep in code comments; the stray T-4.2 comment in
`apps/funny-multi-server/src/prompt.ts:72`; no project run-skill exists yet for driving either
client in a browser (`/run-skill-generator` would capture the Playwright-driver pattern Steps 23–29
used, since `chromium-cli` is not installed in this environment).~~ *(carried — see Step 31 below.)*

## Step 30 — T-FO-4.3: `StoryGallery` + end screen, rig image export (2026-09-23)

**Why this step exists:** closes Phase FO-4's last task. Owner confirmed (2026-09-23) three plan
decisions: split T-FO-4.3 into gated sub-steps 4.3a/4.3b, mirroring T-FO-4.2a/b/c's precedent;
reveal-once-per-story-on-first-view (not replay-every-time); end screen offers "Play again" (same
seats/language, instant restart) + "Change players" (back to Home/setup). Owner then explicitly
directed committing both sub-steps together rather than separately — this entry covers both.

**Shipped:**

*T-FO-4.3a.* `StoryGallery.tsx` + `EndScreen.tsx`, adapted from Funny Multi's
`RoomGallery.tsx`/`EndScreen.tsx` with every socket/lobby/host concept stripped. First real
consumer of T-FO-2.1's shared prose pipeline: new `game/resolveStory.ts` wraps `POOL_TEXTS`/
`renderProse`/`polishProse` from `@funny/shared` into a `Story → { answers, prose }` resolver,
mirroring the server's own `resolveAnswers`/`revealProse` pattern. Reveal-once-per-story: a `seen`
index `Set` plus `RigScene` remounted per index (`key={index}`) so navigating to an unseen story
always gets a fresh `initial` mount, while revisiting a seen one mounts fresh too but with
`reveal={false}` — relies on framer-motion's `initial` prop being read only at mount, not on every
prop change. `App.tsx` wires `isDone(game)` to `EndScreen`; "Play again" reruns `createGame` on the
same seats/language, "Change players" clears `game` back to Home. New `gallery.*`/`end.*` i18n
keys. `ProseText.tsx`, `prose.ts` (`splitProse`) and `art/EndMascots.tsx` copied verbatim from
Funny Multi (same "copy, unmodified" reuse class as `ScrollBox.tsx`/`SourceFooter.tsx`/
`LogoStamp.tsx`).

*T-FO-4.3b* (OQ-4 scope: local canvas export + native share sheet only — no upload/link, no
network call, no video/wobble recording). `components/art/rig/rigGeometry.ts` pulls the
`RIG_LAYERS` position table (previously inline Tailwind position classes in `RigScene.tsx`) out
into numeric `xPct`/`yPct`/`wPct`/`hPct`/`rotate`/`enter` percentages of the 400×300 stage — the
same numbers now drive both the on-screen compositor and the new exporter, rather than a second
hand-derivation that could silently drift. `rigExport.ts` composites a story into a PNG: each rig
layer's Art component is serialized via `renderToStaticMarkup`, given explicit `width`/`height` on
its root `<svg>` (its `className` prop is Tailwind, which has no effect rendered standalone) via
`DOMParser`/`XMLSerializer`, then rasterized through `HTMLImageElement.decode()` off a `data:`
URI. Funny One's picture has no fetchable bitmap URL — unlike Funny Multi's `PictureRef.url` —so
`downloadStory.ts`'s `fetch`/`createImageBitmap` path didn't apply; `recordWobble.ts`'s `new
Image()`/`.decode()` pattern was the fit instead. Layer compositing (including `ctx.translate`/
`ctx.rotate` for the tilted end-stamp) reads `RIG_LAYERS` directly; the prose/name/QR-footer layout
below the rig reuses `downloadStory.ts`'s wrap/measure math unchanged. `share.ts`, `ShareButton.tsx`
and `testutils/canvasStub.ts` copied verbatim from Funny Multi. `StoryGallery` gained Download +
Share buttons (Share hidden where `canShareFiles()` is false, same capability probe as Multi's
gallery); `qrcode`/`@types/qrcode` added to `funny-one-client/package.json`.

**Owed:** none new — the live-reveal eyeball debt carried since Step 26 is closed in Step 31 below,
not duplicated here.

*Full suite: typecheck, lint, `prettier --check` clean; 703/703 tests across all 6 workspaces
(multi-client 190, multi-server 209, one-client 75, shared 190, cloudflare 39), run outside the
sandbox — clean first try, no flakes this run; `npm audit` 0 vulnerabilities. New (one-client):
`components/{ProseText,ShareButton,StoryGallery,StoryGallery.test}.tsx`,
`components/art/EndMascots.tsx`, `components/art/rig/rigGeometry.ts`,
`game/{resolveStory,resolveStory.test}.ts`, `prose.ts`, `rigExport.ts`, `rigExport.test.ts`,
`screens/EndScreen.tsx`, `share.ts`, `testutils/canvasStub.ts`. Changed: `App.tsx`, `App.test.tsx`,
`RigScene.tsx`, `i18n/en.json`, `styles/index.css`, `package.json`. `packages/shared` untouched.*

## Step 31 — Playwright devDependency + live reveal verification (2026-09-24)

**Why this step exists:** closes the "eyeball the live spring reveal" debt carried since Step 26
(Steps 27–29's RESUME notes kept deferring it to T-FO-4.3, the first screen rendering
`reveal={true}`) and the "no project run-skill for driving a browser" gap noted in every RESUME
note since Step 23.

**Shipped:** `playwright` added as a root devDependency (Chromium binary was already cached
locally — no install needed). Used to drive `apps/funny-one-client`'s own dev server headlessly
(standalone `vite` — the client has no server dependency, so the root `concurrently` script isn't
needed) through a full 2-seat game (1 human + 1 virtual) to the end screen, screenshotting the
reveal at ~100–150ms intervals. Confirmed: story 1's reveal stages exactly as `RIG_LAYERS` orders
it — background at t=0, `who`/`with` corner characters by t≈400ms, prop by t≈900ms, `when`-badge +
`why`-bubble by t≈1600ms, tilted `end`-stamp landing last around t≈2000ms; stepping to story 2
("Next story") replays the same staggered sequence from empty; stepping back to story 1 ("Previous
story") renders fully settled immediately, no replay — confirming the reveal-once contract that
`StoryGallery.test.tsx`'s mocked-`RigScene` assertions only exercised indirectly. No console/page
errors beyond the already-known missing-locale-file warning (T-FO-5.1's territory, not a
regression). The driver script itself was a throwaway (written, run, deleted) — not saved as a
repo skill.

**Owed:** no project run-skill/`SKILL.md` committed for this Playwright driver — `/run-skill-
generator` would capture the pattern if a future session wants a durable one.

*No source changes in this step (devDependency + verification only); Step 30's gate run already
covers the code these screenshots exercised. `npm audit` re-run clean (0 vulnerabilities) after the
dependency add.*

---

~~**RESUME HERE (2026-09-24, after Step 31).** Phase FO-4 is **closed** — T-FO-4.3 (both sub-steps)
landed in Step 30, and the live-reveal eyeball debt it inherited from Step 26 closed in Step 31.
Funny One is now a complete local game end to end: setup → round-robin play → end screen with a
browsable, downloadable/shareable story gallery, verified in a real headless browser.

Next agent step: **Phase FO-5** — `T-FO-5.1`, wiring all 15 languages for Funny One's UI catalog
(`steering/funny-one-tasks.md` §Phase FO-5). Pool texts are already shared per D-2, so this is
UI-catalog authoring/wiring only, following Funny Multi's existing 15-language pattern
(`apps/funny-multi-client/src/i18n/*.json`) — no new translation content to invent from scratch,
just port the catalog shape. Funny One currently ships only `en.json`; the boot-time
`console.error` for missing `<code>.json` files names exactly which are left.

Note for whoever runs the gates: `npm test` is flaky under load on this machine — run it with
nothing else going, and re-run any lone timing failure in isolation before treating it as a
regression. Multi-line commit messages must go through `git commit -F <file>`: PowerShell 5.1
mangles here-strings containing double quotes on the way to `git.exe`.

Still open, none blocking: making the repo public before any launch announcement; T-7.1's iPhone
install leg (closes Gate 7); B-8 (Play Protect warning on Android install); the Arm VM retry; a
cosmetic "Render" sweep in code comments; the stray T-4.2 comment in
`apps/funny-multi-server/src/prompt.ts:72`; no repo-committed Playwright run-skill yet (Step 31
used a throwaway driver — see that step's Owed).~~

## Step 32 (task T-FO-5.1a) — UI-language wiring (2026-09-25)

**Why this step exists:** T-FO-5.1 (all 15 languages for Funny One's UI catalog) split into two
gated sub-steps (owner decision 2026-09-25) — nothing in Funny One ever called
`i18n.changeLanguage`, so landing 14 new catalogs alone would have changed nothing a player could
see. This sub-step lands the wiring first, verifiable on its own before the ~550-string catalog
diff (T-FO-5.1b).

**Shipped:** new `apps/funny-one-client/src/i18n/uiLanguage.ts` — `pickInitialLanguage`/
`matchLanguageTag` resolve a boot language from a remembered `localStorage` pick, else
`navigator.languages` (mapping region variants like `es-MX`→`es-419`, `pt-PT`→`pt-br`, legacy
`iw`→`he`), else English; `loadStoredLanguage`/`storeLanguage` wrap `localStorage` in try/catch
so a blocked/private-mode store degrades to "not remembered," not a boot crash. `i18n/index.ts`
now boots via `initialLanguage()` instead of a hardcoded `'en'`. `HomeScreen.tsx`'s single
language picker (previously content-language only) now also calls `i18n.changeLanguage` and
`storeLanguage` on every pick, and pre-selects whatever the UI is already in — the Home/
"Change players" screen and a relaunch both land on the last choice. 12 new tests
(`uiLanguage.test.ts` + 3 in `HomeScreen.test.tsx`); 2 existing `HomeScreen.test.tsx` tests
that read English text after picking Russian were reordered (assert before the click) so they
survive `ru.json` landing in T-FO-5.1b. Owner decision 2026-09-25 recorded as **D-9**
(`funny-one-requirements.md` §2) and in `CLAUDE.md`'s binding RU-names rule: Funny One's
localized product name (`home.title`) is **«Одна Чепуха: по кругу»** in Russian, kept distinct
from Funny Multi's per-language titles; the other 13 languages are deferred to T-FO-5.1b, drafted
and flagged `needs-<code>-review` the same way Funny Multi's machine-drafted catalogs are.
Verified in a real headless browser (Playwright): a phone set to `he-IL` boots right-to-left with
the Israeli flag pre-selected; a phone set to `en-US` boots on English/GB; picking Deutsch and
reloading keeps German. All six gates: typecheck, lint, format:check (Prettier reflowed one new
file), `npm test` (715/715, run outside the sandbox, one-client 75→87), `npm audit` (0
vulnerabilities). CI not yet run — nothing pushed this session until now.

**Owed:** the UI still renders English text everywhere except the language names/flags —
`en.json` is still the only catalog. T-FO-5.1b (14 catalogs: 11 keys lifted verbatim per language
from Funny Multi, 28 drafted and flagged `needs-<code>-review`, ported `catalogs.test.ts`) is
what makes a language pick visibly change the game.

---

~~**RESUME HERE (2026-09-25, after Step 32).** T-FO-5.1a is closed — picking a language on Home
now switches the whole UI and remembers the pick; the boot language follows the device locale on
first launch. Only `en.json` exists, so today every language still renders English text (bar
names/flags in the picker itself).

Next agent step: **T-FO-5.1b** — the 14 missing UI catalogs (`steering/funny-one-tasks.md`
§Phase FO-5). 11 of Funny One's 39 keys already exist verbatim, same path and English text, in
every one of Funny Multi's 15 catalogs (`round.pick/optionsLabel/scrollHint/submit/
submitDisabled/submitted`, `gallery.prev/next/shareButton`, `home.gameRules`, `footer.source`) —
lift those per language for free. The other 28 need drafting, flagged `needs-<code>-review` like
Funny Multi's machine-drafted catalogs (see any of `apps/funny-multi-client/src/i18n/de.json`
etc. for the `_note` convention — the wording there cites a `CONTRIBUTING.md` that does not exist
in this repo; point the new ones at `docs/` instead, or drop the citation). RU's `home.title` is
fixed by D-9: «Одна Чепуха: по кругу». Port `apps/funny-multi-client/src/i18n/catalogs.test.ts`
into Funny One's `i18n/` folder, dropping the `questions`/`errors`/`round.placeholder` assertions
(Funny One has no server-driven questions array, no `ErrorCode` union, no free-text answers).
In-browser check once catalogs land: `he` for RTL layout on screens Funny Multi never had
(`HandoffScreen`, the seat-list rows, `EndScreen`'s two buttons), `de`/`ta` for text overflow
(both ran long in Funny Multi's own layouts), and the RU home header specifically — «Одна Чепуха:
по кругу» is the longest title in the set.

Note for whoever runs the gates: `npm test` is flaky under load on this machine — run it with
nothing else going, and re-run any lone timing failure in isolation before treating it as a
regression. Multi-line commit messages must go through `git commit -F <file>`: PowerShell 5.1
mangles here-strings containing double quotes on the way to `git.exe`.

Still open, none blocking: making the repo public before any launch announcement; T-7.1's iPhone
install leg (closes Gate 7); B-8 (Play Protect warning on Android install); the Arm VM retry; a
cosmetic "Render" sweep in code comments; the stray T-4.2 comment in
`apps/funny-multi-server/src/prompt.ts:72`; no repo-committed Playwright run-skill yet (Step 31
used a throwaway driver — see that step's Owed).~~

## Step 33 (task T-FO-5.1b) — 14 UI catalogs, closes Phase FO-5 (2026-09-25)

**Why this step exists:** T-FO-5.1a wired the picker to `i18n.changeLanguage`; the 14 remaining
catalogs are what makes a language pick actually render translated text. Closes Phase FO-5.

**Shipped:** `apps/funny-one-client/src/i18n/{de,fr,ru,id,it,zh,ja,ko,pt-br,es-419,es-es,uk,he,
ta}.json` — 39 keys × 14 languages. 13 keys (11 named in Step 32's note, plus `home.start` from
Multi's `lobby.startGame` and `gallery.storyBy` modulo a `{{nickname}}`→`{{name}}` rename, both
found while diffing rather than drafted) were lifted verbatim per language from Funny Multi's
catalogs; the other 26 were drafted by two parallel Sonnet subagents and flagged
`needs-<code>-review`, with the citation of the non-existent `CONTRIBUTING.md` dropped
(owner decision 2026-09-25; Funny Multi's catalogs still cite it —
left as a follow-up). `ru.json` is flagged like the rest (owner decision) except for
`home.title`, fixed by D-9. `catalogs.test.ts` ported from Funny Multi's, dropping the
`questions`/`errors`/`round.placeholder` assertions Funny One has no equivalent of; added a check
that `ru.json`'s `home.title` stays D-9's exact string.

New `scripts/funny-one-screens.mjs` (+ `.claude/skills/run-funny-one/SKILL.md`, owner decision —
committed rather than thrown away this time, since FO-6's deploy verification will want it too):
starts Funny One's own Vite dev server, plays a full game in a headless phone-sized Chromium once
per language, screenshots every screen type, and flags any element narrower than its content or a
horizontally-scrolling page. Run across all 15 languages, it caught two real bugs, both fixed
this step:
- `pt-br`/`es-es` rendered English throughout — i18next's default `lowerCaseLng` rewrote them to
  `pt-BR`/`es-ES` before the resource lookup, missing the file and silently falling back.
  `i18n/index.ts` now sets `lowerCaseLng: true`; new `i18n/index.test.ts` renders `home.subtitle`
  in all 15 languages and asserts it matches that language's own catalog (fails for exactly
  `pt-br`/`es-es` with the fix reverted).
- Hebrew's gallery prev/next buttons (◀ ▶) didn't mirror under `dir="rtl"` — flex already swaps
  which button sits on which side, but the glyphs stayed pointing the original way.
  `StoryGallery.tsx`'s arrows now wrap in `rtl:-scale-x-100`.

Verified in-browser across all 15 languages (not just `he`/`de`/`ta`/`ru` as originally scoped):
every language reaches the end screen with 0 console/page errors and 0 overflow; RU's two-line
home title renders fully; Hebrew's mirrored screens (handoff, seat rows, end buttons) read
correctly, including the corrected gallery arrows. All six gates: typecheck, lint, format:check,
`npm test` (735/735, up from 715, run outside the sandbox), `npm audit` (0 vulnerabilities). CI
not yet run — nothing pushed this session until now.

**Owed:** Funny Multi carries the same two bugs this step found in Funny One (`pt-br`/`es-es`
falling back to English, Hebrew's gallery arrows not mirroring) — not yet fixed there. The 13
`home.title`s besides `en`/`ru` are machine-drafted and unreviewed by a native speaker, same as
Funny Multi's catalogs always have been. Default seat names ("Player 1", "Bot 1" in
`HomeScreen.tsx`) are hardcoded English in every language, not catalog-driven — not in this
task's scope, flagged during the session as a possible follow-up.

---

~~**RESUME HERE (2026-09-25, after Step 33).** Phase FO-5 is **closed** — all 15 languages now
render translated UI text end to end, verified in a real headless browser with 0 errors and 0
overflow. `scripts/funny-one-screens.mjs` is a repo-committed run-skill any future Funny One
screen work can reuse.~~ Carried forward: the two Funny Multi bugs below are fixed in Step 34.

## Step 34 — Funny Multi: `pt-br`/`es-es` fallback and Hebrew gallery-arrow mirroring (2026-09-26)

**Shipped:** the two bugs Step 33 found and fixed in Funny One turned out to have the identical
root cause in Funny Multi, owed since that step. `apps/funny-multi-client/src/i18n/index.ts` gets
the same `lowerCaseLng: true` (i18next was rewriting `pt-br`/`es-es` to `pt-BR`/`es-ES`, missing
the resource and silently falling back to English); `RoomGallery.tsx`'s ◀ ▶ prev/next buttons now
wrap in `rtl:-scale-x-100` so they mirror under Hebrew. `i18n/index.test.ts` ported from Funny
One's — asserts every one of the 15 catalogs renders `home.subtitle` from its own JSON; fails for
exactly `pt-br`/`es-es` with the fix reverted, confirmed both ways this session.

No in-browser verification this step (Funny Multi needs a live server + room to reach a gallery
screen, unlike Funny One's local rig) — the fix is the same one-liner already verified in-browser
in Funny One. All six gates: typecheck, lint, format:check, `npm test` (750/750, up from 735, run
outside the sandbox), `npm audit` (0 vulnerabilities). CI checked after push together with Step 35.

**Owed:** none.

## Step 35 (task T-FO-6.1) — Funny One: full precache, real airplane-mode playthrough (2026-09-26)

**Shipped:** Funny One reaches genuine offline-first (FO-IMG-2). Built for the real deploy path
(`BASE_PATH=/funny1-game`) and audited with two new scripts:

- `scripts/funny-one-play.mjs` — the play-a-full-game driver factored out of
  `funny-one-screens.mjs` so both it and the new offline check share one playthrough.
- `scripts/funny-one-offline.mjs` — builds, serves with `vite preview`, plays a full game online
  while asserting zero cross-origin requests, then kills the server, takes the browser context
  offline, opens the app cold, plays a second full game, exports a story picture (the lazily
  loaded QR chunk), and checks the Fredoka font actually loaded from cache. Run across `en`/`he`
  (Hebrew exercises both the RTL layout and a different font subset).

That audit found and this step fixed four real bugs, none caught by the existing browser
screenshots (Step 33) because none of them needed the network gone to reproduce them wrong, or in
QR export's case, a real (non-stubbed) canvas:

- **The one runtime network call left:** `index.html` loaded Fredoka from `fonts.googleapis.com`.
  Self-hosted now — `public/fonts/fredoka-{latin,latin-ext,hebrew}.woff2` (43 KB, the three
  subsets Fredoka actually ships; no Cyrillic/Tamil/CJK coverage, so those languages fall back to
  `system-ui` exactly as before) plus `OFL.txt`, wired via `@font-face` in `styles/index.css`.
- **`index.html` itself was never precached.** `vite.config.ts`'s `globPatterns` overrides the
  plugin's default and had dropped `html` (and now `woff2` for the fonts above) — confirmed by
  building with the old pattern and finding zero `index.html` entries in the service worker's
  precache manifest, i.e. an installed app couldn't have opened offline at all.
- **First visit reloaded itself mid-setup.** `swReload.ts`'s `controllerchange` listener fires the
  first time a service worker claims the page (`clientsClaim`), not just on a later update; the
  once-per-session guard copied from Funny Multi stopped it looping but still reloaded once,
  wiping whatever seats/players were mid-setup. Now gated on `navigator.serviceWorker.controller` having existed before the event, so
  it only fires for a genuine update. New `swReload.test.ts`; fails on the pre-fix code.
- **Story export never actually worked in a browser.** `rigExport.ts`'s `sizedSvgDataUri` builds a
  standalone `data:image/svg+xml` from each rig-art component's markup, but none of the 112 art
  components (nor `renderToStaticMarkup`) emit an `xmlns` — valid for SVG inlined in HTML, not for
  a freestanding SVG document, which `HTMLImageElement.decode()` then rejects with "The source
  image cannot be decoded". Step 30's unit tests used a canvas stub and couldn't see it. Now adds
  the namespace when missing; new tests in `rigExport.test.ts` cover both cases (missing and
  already-present), fail on the pre-fix code.

Verified in-browser (not just the unit regressions): both `en` and `he` reach the end screen with
0 errors in both the online and airplane passes, all airplane-pass requests served from cache
(21–22 per language), Fredoka reports loaded fonts in both languages, and the exported PNG
downloads successfully offline — visually inspected the Hebrew export and it's complete (art,
translated text, font, QR). `funny-one-screens.mjs` still passes for `en`/`he` after the shared
extraction. All six gates: typecheck, lint, format:check, `npm test` (754/754, run outside the
sandbox), `npm audit` (0 vulnerabilities). CI not yet run — nothing pushed this session until now.

**Owed:** Funny Multi has the same first-visit-reload bug in its own `swReload.ts` — not yet
fixed there. A mid-game reload on a real update
(not just first install) would still wipe the game in progress in Funny One too — not in this
task's scope, flagged as a possible follow-up. The exported picture's Hebrew paragraph renders
left-to-right rather than right-to-left (canvas `ctx.direction` isn't set) — cosmetic, pre-existing
since Step 30, not caused or fixed by this step. T-FO-6.1's checkbox stays unticked below: it also
called for a device session, which is a real-phone airplane-mode play test this session didn't
have hardware for — the scripted browser-level equivalent above is what's done.

---

~~**RESUME HERE (2026-09-26, after Step 35).** T-FO-6.1's automated half is done — Funny One is a
genuine offline-first PWA, verified by a real online+airplane browser playthrough in two
languages including an offline story export. Not yet done: an actual device session (see Owed).
Also fixed this session: Funny Multi's `pt-br`/`es-es` and Hebrew-arrow bugs (Step 34), closing
last step's carried-forward item.

Next agent step: **T-FO-6.2** — deploy Funny One's static build under `/funny1-game` on the
existing Oracle VM's Caddy (`steering/funny-one-tasks.md` §Phase FO-6). Owner decisions already
made for this step: ship with Funny Multi's placeholder icons (swap before any announcement, not
before deploy); point `sourceUrl.ts`'s QR/label at the live `/funny1-game/` URL instead of the
still-private GitHub repo (wording changes in all 15 catalogs' `gallery`-adjacent source-label
string — grep for it, don't assume the key name). Needs: a second `handle /funny1-game/*` block in
`deploy/caddy/Caddyfile`, a read-only static-file volume on the `caddy` service in
`docker-compose.yml`, and a new `deploy/ship-funny-one.sh` (build with `BASE_PATH=/funny1-game`,
scp `dist/` to the VM, curl-verify). No new container or image stream — this is a static bundle.
Once live, an actual phone in airplane mode should confirm T-FO-6.1's real device-session leg
before Phase FO-6 is called closed; the owner will need to do the airplane-mode part by hand.

Note for whoever runs the gates: `npm test` is flaky under load on this machine — run it with
nothing else going, and re-run any lone timing failure in isolation before treating it as a
regression. Multi-line commit messages must go through `git commit -F <file>`: PowerShell 5.1
mangles here-strings containing double quotes on the way to `git.exe`.

Still open, none blocking: making the repo public before any launch announcement; T-7.1's iPhone
install leg (closes Gate 7); B-8 (Play Protect warning on Android install); the Arm VM retry; a
cosmetic "Render" sweep in code comments; the stray T-4.2 comment in
`apps/funny-multi-server/src/prompt.ts:72`; Funny Multi's own first-visit `swReload.ts` reload bug
(see Step 35 Owed); a mid-game reload-on-update risk in both clients' `swReload.ts`; the exported
story picture's Hebrew text rendering LTR instead of RTL; all non-`en`/`ru` `home.title`s in both
clients await native-speaker review.~~ Carried forward: T-FO-6.2 shipped in Step 36, the Funny Multi `swReload.ts` bug in Step 37, the device leg in Step 38.

## Step 36 (task T-FO-6.2) — Funny One live under `/funny1-game` (2026-09-26)

**Shipped:** Funny One is live at `https://www.staging-oursharedcode.com/funny1-game/`, served
as static files by the Caddy already fronting Funny Multi — no container, image or secret.

- `deploy/caddy/Caddyfile` — `redir /funny1-game` → `/funny1-game/` and a
  `handle /funny1-game/*` block (`uri strip_prefix`, `root /srv/static/funny-one`, `try_files`,
  `file_server`). Cache headers: `no-cache` for `/`, `index.html`, `sw.js`, `registerSW.js` and
  the manifest, so an installed copy picks up a new deploy; `immutable` for hashed `assets/`.
  Header matchers use the full, unstripped path — `header` runs before `uri` in Caddy's
  directive order.
- `docker-compose.yml` — `./static:/srv/static:ro` on `caddy`. The parent is mounted, not
  `funny-one/`: a bind mount pins its starting inode, so the script's directory swap would
  otherwise go unseen until a Caddy restart.
- `deploy/ship-funny-one.sh` — builds with `BASE_PATH=/funny1-game`, tar-streams `dist/` into
  `static/funny-one.new` and swaps it in, copies compose + Caddyfile, `up -d caddy` plus an
  explicit `caddy reload` (a changed bind-mounted file isn't picked up by `up` alone — the same
  latent gap exists in `deploy/ship.sh`), then curl-checks the page, `sw.js`, manifest, redirect
  and Funny Multi's `/health`. `DEPLOYMENT.md` §2c; `/static/` gitignored.
- Owner decisions from the plan: the footer link and the exported picture's QR/URL now point at
  the game, not the private GitHub repo — `sourceUrl.ts` → `gameUrl.ts`, derived at runtime
  (`location.origin` + `BASE_URL`) so the staging domain isn't baked into shared pictures and a
  self-hoster's copy points at itself. `footer.source` ("Source on GitHub") is replaced by
  `footer.gameLink` ("Link to this game", footer, plain link icon instead of the GitHub mark) and
  `footer.playYourself` ("Play it yourself", export label) in all 15 catalogs, each in its
  catalog's register (voseo in `es-419`, informal in `ru`/`uk`, plural in `he`). New
  `gameUrl.test.ts`.

Verified: the real Caddyfile in a local `caddy:2` container (301/200/404 and all three cache
headers); `funny-one-offline.mjs` for `en`/`he`/`ru` (all airplane requests from cache; the `ru`
export visually checked — new label, runtime URL); then live: page/`sw.js`/manifest 200,
redirect 301, `no-cache` on `sw.js`, index references `/funny1-game/assets/`, Funny Multi
`/health` 200. Gates: typecheck, lint, format:check, `npm audit` (0), `npm test` 758/758 — the
server's real-socket suite threw a different lone timing failure on two full runs and passed
twice run alone (known flake; server untouched). CI runs on push.

Also this session: SSH to the VM timed out — the owner's home IP had changed. Re-ran
`deploy/oci/network.py 118.102.109.169` (idempotent) to update the port-22 rule. The deploy was
run by the owner from a Git Bash terminal: the agent's attempt was refused by the auto-mode
classifier, and the chat panel's `!` prefix doesn't execute in the VS Code extension.

**Owed:** a pre-existing `caddy fmt` warning (blank line after the Caddyfile's header comment),
cosmetic; `deploy/ship.sh`'s missing `caddy reload` (above); real icons before any announcement
(owner decision: placeholders are fine for deploy).

## Step 37 (task T-FO-6.2a) — Funny Multi: no reload on first visit (2026-09-26)

**Shipped:** Step 35's fix ported to `apps/funny-multi-client/src/swReload.ts` — the
`controllerchange` fired by the first `clientsClaim` no longer reloads the page (which wiped a
room mid-setup as soon as the precache finished); only a page that already had a controller
reloads, once. New `swReload.test.ts` (same shape as Funny One's), confirmed failing on the
pre-fix code.

**Owed:** a mid-game reload on a _real_ update still wipes a game in progress, in both clients —
unchanged, still flagged.

## Step 38 (task T-FO-6.1) — Funny One: real-phone airplane-mode playthrough (2026-09-26)

**Shipped:** T-FO-6.1's owed leg. The owner installed Funny One on a Samsung phone from the live
URL, turned airplane mode on, played a full Russian game to the end screen (screenshot: airplane
icon in the status bar, rig art and prose rendered) and exported a story picture successfully.
T-FO-6.1 ticked; **Phase FO-6 closed.**

**Owed:** nothing for this task. Only Russian was played on the phone — the 15-language check on
a real device belongs to Gate FO.

---

~~**RESUME HERE (2026-09-26, after Step 38).** Phase FO-6 is **closed** — Funny One is live at
`https://www.staging-oursharedcode.com/funny1-game/` and proven offline on a real phone.

Next agent step: **T-FO-7.1** — the device acceptance session (`steering/funny-one-tasks.md`
§Phase FO-7), modelled on `docs/ACCEPTANCE.md`. Gate FO needs, on a real phone: a full game in
airplane mode (done in Step 38 for `ru` — decide whether it counts or is repeated inside the
scripted session), all 15 languages rendering, and the six gates clean. Agent's part: write the
Funny One acceptance checklist (one language per line, with what to look for — RTL in `he`,
overflow in `de`/`ta`, fallback fonts in `ja`/`ko`/`zh`) and pre-check each language headlessly
with `scripts/funny-one-screens.mjs` against the live URL, so the phone pass only confirms.
Owner's part: the phone pass.

Note for whoever runs the gates: `npm test` is flaky under load on this machine — run it with
nothing else going, and re-run any lone timing failure in isolation before treating it as a
regression. Multi-line commit messages must go through `git commit -F <file>`. SSH to the VM is
allowed only from the owner's home IP; when it times out, re-run `deploy/oci/network.py <ip>`
(current IP from `curl https://api.ipify.org`). Production deploys are run by the owner in a Git
Bash terminal — the agent's auto mode refuses them.

Still open, none blocking: making the repo public before any launch announcement; real Funny One
icons before any announcement; T-7.1's iPhone install leg (closes Gate 7); B-8 (Play Protect
warning on Android install); the Arm VM retry; a cosmetic "Render" sweep in code comments; the
stray T-4.2 comment in `apps/funny-multi-server/src/prompt.ts:72`; `deploy/ship.sh` lacks a
`caddy reload` (Step 36); a mid-game reload-on-update risk in both clients' `swReload.ts`; the
exported story picture's Hebrew text rendering LTR instead of RTL; all non-`en`/`ru`
`home.title`s in both clients await native-speaker review.~~ *(carried — see Step 39 below.)*

## Step 39 (task T-FO-7.1) — Funny One: acceptance doc + 15-language headless pre-check (2026-09-27)

**Shipped:** the agent's half of T-FO-7.1. `scripts/funny-one-screens.mjs` gained a `--url`
flag so it can drive a deployed build instead of only a local dev server. All 15 languages
played a full game headlessly against the live `/funny1-game/` URL at 360px: 0 overflow hits,
0 console errors, `he` reports `dir=rtl`. New `docs/ACCEPTANCE_FUNNY_ONE.md`, modelled on
`docs/ACCEPTANCE.md`: Part A (install), Part B (one full online game), Part C (offline — Step
38's airplane-mode Russian playthrough recorded as a pass per owner decision 2026-09-27, plus
one force-close re-check), Part D (six languages to eyeball on the phone: `ru`/`en`/`he`/`ta`/
one of `ja`/`ko`/`zh`/`de`), and a results table. Owner decisions this session: Step 38's
offline pass counts for Gate FO (no repeat needed); the pre-check hits the live URL, not local
dev; six languages get a phone pass, the other nine rest on headless; the maskable-icon check
(A3) is marked deferred until real icons ship, not waived — it stays required before any
announcement.

**Owed:** the owner's phone pass through `docs/ACCEPTANCE_FUNNY_ONE.md` — T-FO-7.1 stays
unticked and Gate FO stays open until that session's results are recorded.

---

~~**RESUME HERE (2026-09-27, after Step 39).** T-FO-7.1's agent half is done; the phone session is
next, run by the owner alone (no agent needed — Funny One has no server to flip). Fill in
`docs/ACCEPTANCE_FUNNY_ONE.md`'s results table on the phone; once every row is pass/deferred,
tell the next agent so it can tick T-FO-7.1, close Gate FO and Phase FO-7, move the task's block
to `steering/tasks-done.md`, and start Phase S-3 (Funny One's store-app replicate of S-1/S-2,
`steering/funny-one-tasks.md`).

Note for whoever runs the gates: `npm test` is flaky under load on this machine — run it with
nothing else going, and re-run any lone timing failure in isolation before treating it as a
regression. Multi-line commit messages must go through `git commit -F <file>`. SSH to the VM is
allowed only from the owner's home IP; when it times out, re-run `deploy/oci/network.py <ip>`
(current IP from `curl https://api.ipify.org`). Production deploys are run by the owner in a Git
Bash terminal — the agent's auto mode refuses them.

Still open, none blocking: making the repo public before any launch announcement; real Funny One
icons before any announcement (also blocks A3 in the new acceptance doc); T-7.1's iPhone install
leg (closes Gate 7, Funny Multi); B-8 (Play Protect warning on Android install, both games); the
Arm VM retry; a cosmetic "Render" sweep in code comments; the stray T-4.2 comment in
`apps/funny-multi-server/src/prompt.ts:72`; `deploy/ship.sh` lacks a `caddy reload` (Step 36); a
mid-game reload-on-update risk in both clients' `swReload.ts`; the exported story picture's
Hebrew text rendering LTR instead of RTL; all non-`en`/`ru` `home.title`s in both clients await
native-speaker review.~~ *(carried — see Step 40 below.)*

## Step 40 (task T-9.2) — `cloudflare/pregenerate.mjs`: the library pre-generator, code and tests (2026-09-27)

**Shipped:** the agent's half of T-9.2. `cloudflare/pregenerate.mjs` walks every combination of
the four `VISUAL_SLOTS` (10⁴ with today's pools, generic in the pool sizes), builds each prompt
with the server's own `buildPrompt` from `apps/funny-multi-server/dist` so the R2 keys are the
game's bytes, probes `/exists` and calls `/generate` only on a miss. Resumable by construction,
≤ 4 requests in flight, 429/5xx/network errors retried with exponential backoff (1 s → 60 s, six
attempts), any other non-200 fatal — stop taking new work, let the in-flight calls settle, exit
1. `--dry-run` probes only (free); `--limit N` caps generations, counted before the await so
parallel workers cannot overshoot. Progress every 100, summary with an ≈ $0.001/image estimate.
`npm run pregenerate -w cloudflare` builds shared + server first. `cloudflare/pregenerate.test.js`
(11 tests against a fake Worker): exactly 10⁴ distinct prompts matching `buildPrompt`; skip-
existing; second run generates nothing; dry run never hits `/generate`; `--limit` holds under
concurrency; peak in-flight is exactly 4; backoff sequence 1 s, 2 s, 1 s; a 401 stops after one
probe; retry budget exhausted → fatal; a `/generate` that raced a live game to the image counts
as existed. Gates: typecheck, lint, format:check, `npm test` (5 workspaces, all green), `npm
audit` 0 vulnerabilities. Also this step: `local_docs/tests/` gitignored (owner decision
2026-09-28 — phone screenshots stay local; the acceptance docs carry the results).

**Owed:** the production run. A `--dry-run` against the live Worker stopped correctly on its
first probe with 403 — the local `.env` secret is not production's — so there is no live proof
yet. The real run needs T-9.1's paid Workers AI plan (deferred) plus the production
`CLOUDFLARE_WORKER_URL`/`CLOUDFLARE_WORKER_SECRET` in a Git Bash shell: `--dry-run`, then
`--limit 5`, then the full run on a quiet day (every miss bumps the Worker's daily counter). T-9.2
stays unticked until R2 holds 10⁴ objects.

## Step 41 (task T-9.1) — support rails registered: PayID, Lightning, Sponsors tiers (2026-09-28)

**Shipped:** owner ops, recorded under T-9.1 in `steering/tasks.md`. PayID
`funny@oursharedcode.com`, bank displays **MARK WEB TOOLS**. Lightning
`curvyhockey439@walletofsatoshi.com`, verified resolving via LNURL-pay. GitHub Sponsors: three
one-time tiers $1/$3/$5 published on `github.com/sponsors/oursharedcode`, verified via GraphQL.
Decisions on the way: Strike was the first choice (direct AUD withdrawal) but its app is not
offered in Play AU and web sign-up hands off to the app for ID checks, so Wallet of Satoshi
(Australian, custodial) was chosen; the random address is published as-is — a custom name costs
10 LN transactions plus ≥ 100k sats on-chain, and a branded LNURL proxy on our own domain was
judged cosmetic and dropped; cash-out is Lightning → Kraken → AUD, never on-chain.

**Owed:** the paid Workers AI plan — deferred by the owner 2026-09-28. T-9.1 stays unticked on
that one item; it gates T-9.2's production run and Gate 9's "library complete" leg, nothing else.

---

~~**RESUME HERE (2026-09-28, after Step 41).** Next is **T-9.3** (server: `DEPLOYER_PAYID`,
`DEPLOYER_PAYID_NAME`, `DEPLOYER_SPONSORS_URL`, `DEPLOYER_LIGHTNING_ADDRESS` → the config
endpoint's `support` object, never in a socket event; tests unset → nulls, set → passed through)
— every value is now known (Step 41), so T-9.3 and then T-9.4 (the `SupportScreen`) can land
without waiting on the paid plan. Two owner items run in parallel and block nothing here: the
Funny One phone pass through `docs/ACCEPTANCE_FUNNY_ONE.md` (closes Gate FO, unblocks Phase
S-3), and the paid Workers AI plan followed by T-9.2's production run (`--dry-run`, `--limit 5`,
full). Owner decision still pending from the 2026-09-27 morning plan: which track after Gate FO
— finish Phase 9, or S-1/S-2, or S-3.

Note for whoever runs the gates: `npm test` is flaky under load on this machine — run it with
nothing else going, and re-run any lone timing failure in isolation before treating it as a
regression. Multi-line commit messages must go through `git commit -F <file>`. SSH to the VM is
allowed only from the owner's home IP; when it times out, re-run `deploy/oci/network.py <ip>`
(current IP from `curl https://api.ipify.org`). Production deploys are run by the owner in a Git
Bash terminal — the agent's auto mode refuses them. The local `.env`'s Worker secret is not
production's: any live Worker call from this PC needs the production pair exported first.

Still open, none blocking: making the repo public before any launch announcement; real Funny One
icons before any announcement (also blocks A3 in `docs/ACCEPTANCE_FUNNY_ONE.md`); T-7.1's iPhone
install leg (closes Gate 7, Funny Multi); B-8 (Play Protect warning on Android install, both
games); the Arm VM retry; a cosmetic "Render" sweep in code comments; the stray T-4.2 comment in
`apps/funny-multi-server/src/prompt.ts:72`; `deploy/ship.sh` lacks a `caddy reload` (Step 36); a
mid-game reload-on-update risk in both clients' `swReload.ts`; the exported story picture's
Hebrew text rendering LTR instead of RTL; all non-`en`/`ru` `home.title`s in both clients await
native-speaker review.~~ *(carried — see Step 42 below.)*

## Step 42 — `undici` 7.29.0 → 7.30.0: `npm audit` clean again (2026-09-29)

**Shipped:** a lockfile-only bump, found while running T-9.3's gates and not caused by that
step's diff. `npm audit` reported one moderate advisory, GHSA-3wwx-pv8p-q78v (denial of service,
`undici` 7.28.0–7.29.0). `undici` is in the tree only through `jsdom@28.1.0`, a dev dependency
of the Funny Multi client's tests, and `jsdom`'s declared range `^7.21.0` already admits the
fixed release — so `npm audit fix` changed three lines of `package-lock.json` (version, resolved
URL, integrity hash) and nothing else; no `package.json` changed. Production was never exposed:
`npm audit --omit=dev` was clean before the bump, and the runtime image installs with
`--omit=dev`. `npm audit signatures` verifies the new tree. Owner decision 2026-09-29: fix now,
in its own commit, rather than carry a known advisory through the rest of Phase 9. An
`overrides` pin and a `jsdom` major bump were considered and rejected — an in-range fix needs
neither, and an override would outlive its reason.

**Owed:** nothing. Noted on the way: CI (`.github/workflows/ci.yml`) has no `npm audit` step, so
that gate is local-only. Adding one is an owner decision — it would also turn CI red on a day
nobody touched the code.

## Step 43 (task T-9.3) — `GET /config`: the support rails' config surface (2026-09-29)

**Shipped:** T-9.3, closed. The "config endpoint" that the task and design §10.2 assumed did
not exist — `donateUrl` has always travelled in the `lobby:update` broadcast (flagged at Step
17). Owner decision 2026-09-29: a new REST route, not a wider socket payload, because the Home ♥
has to show before any room exists. `GET ${base}config` returns `{ support: { payId, payIdName,
sponsorsUrl, lightningAddress, donateUrl } }`, each `string | null`, built once at boot from the
four new `DEPLOYER_*` vars plus `DEPLOYER_DONATE_URL`; an empty value counts as unset, which is
what copying `.env.example` untouched gives. `SupportConfig` is exported from `@funny/shared`
for T-9.4's client. Design §10.2 corrected. Five tests: unset → nulls; empty → nulls; set →
passed through; mounted under the base path (root `/config` is 404); and the socket guarantee —
with all four rails set, two real sockets go through a create and a join while every event and
both acks are recorded, and neither a rail value nor a rail field name appears. That test was
proven non-vacuous by a deliberate leak into `lobby:update`, since reverted. Test values are
made-up `example` addresses, never the real rails. Two defects caught in review and fixed before
logging: the route read the environment on every request although the design says "once at
boot", and the socket test checked one `lobby:update` where the task says "any socket event".
Verified on the built server under `BASE_PATH=funny37-game`: `/funny37-game/config` → 200
`application/json`, root `/config` → 404. Gates: typecheck, lint, format:check, `npm test` (5
workspaces, 774 tests, all green), `npm audit` 0 vulnerabilities. No in-browser check: nothing
consumes the route until T-9.4.

**Owed:** `lobby:update` still carries `donateUrl` — the move to `/config` is filed as T-9.4a
and lands with the `SupportScreen`, when the socket test extends to `DEPLOYER_DONATE_URL`.
`DEPLOYMENT.md` does not describe the four variables yet (T-9.5; `.env.example` and README
already name them). Production serves `/config` only after the next deploy.

---

## Step 44 (task T-9.4, T-9.4a) — support screen: Home ♥, end screen, tap-to-copy (2026-09-29)

**Shipped:** T-9.4 and T-9.4a, both closed and landed together as filed. `SupportScreen`:
PayID → Sponsors → Lightning → donate URL, each row conditional on its field being set;
PayID row states "your bank will display: <name>"; Sponsors row carries the "choose one-time"
hint; Lightning row is a `lightning:` link plus a QR rendered by the existing `QRCode`
component (owner decision: reuse over vendoring a new canvas encoder — design §10.2 corrected);
copy buttons use `navigator.clipboard.writeText` with a `textarea`/`execCommand('copy')`
fallback and a 1.5 s "Copied!" flash; header states the gift is voluntary, nothing owed. Entry
points: a small ♥ in Home's corner (`hasAnyRail` gates it — hidden with no rail set) and a
button on the end screen replacing the old bare donate link. All support strings in the 15
locale catalogs. T-9.4a: `donateUrl` dropped from `LobbyUpdatePayload` and `broadcastLobby`;
`App.tsx`, `HomeScreen` and `EndScreen` now read all five rails from one source, the `GET
/config` route T-9.3 built; T-9.3's socket-leak test extended to set `DEPLOYER_DONATE_URL` too
and assert it never reaches a socket event. `App.tsx` fetches `${base}config` once at mount,
shape-checked (`data?.support`) rather than `res.ok`-checked, so production's pre-deploy
`index.html`-at-200 response is treated the same as offline — no rails, no ♥ — matching the
RESUME note's plan.

Found and fixed along the way: the mount-time fetch used a same-origin relative URL, which in
dev (client on :5173, server on :3000, per T-8.1's existing split) always resolved against
Vite's own dev server and silently never reached the API — the support feature was broken in
every local dev session while working in production, where the origins coincide. Generalized
`socket.ts`'s existing inline dev/prod split into `basePath.ts`'s new `serverOrigin()`, used by
both `socket.ts` (replacing its old inline constant) and the new fetch call. Covered by a test
in `basePath.test.ts`. Confirmed by direct `curl` comparison of `:3000/config` vs `:5173/config`
before writing the fix, not just by the Playwright check below.

Gates: typecheck, lint, format:check clean. `npm test`, run outside the sandbox: client 225/225,
server 214/214, shared 190/190, cloudflare 50/50, all green. `funny-one-client` showed 3 timing
failures on the full run (`App.test.tsx`, `StoryGallery.test.tsx`) — this session never touched
that workspace; re-run alone it was 113/113, confirming the documented load-flakiness rather
than a regression. `npm audit`: 0 vulnerabilities (run before the `serverOrigin()` fix, which
added no dependency). In-browser pass via headless Playwright plus manual `curl`: no-rail case
clean at desktop 1280×800, mobile 360×740, and `he` (RTL) — no ♥ in any of the three; with-rail
case at the same three — ♥ present, opens to the correct PayID/donate rows, Close leaves the ♥
in place — confirmed both before and after the `serverOrigin()` fix (the fix being what made the
with-rail case observable in dev at all).

**Owed:** T-9.4's "gated off in store-shell builds" clause — not built. Owner decision this
session (recommendation, approved): no shell build exists yet to gate against (B-1/B-2 are still
Post-v1 backlog), so a flag today would gate nothing; deferred to whichever of B-1/B-2 lands
first. Noted on both `steering/tasks.md`'s B-1/B-2 bullets and design.md's store-shell line.
T-9.5 (docs: README, `.env.example`/DEPLOYMENT.md, ACCEPTANCE.md) not started. Gate 9's real-
money device pass (PayID, Sponsors, Lightning, on desktop and Android) not run — needs the owner
to hold the device and make real transfers.

---

~~**RESUME HERE (2026-09-29, after Step 44).** Next is **T-9.5** (docs: README "Support" and "Why
no card payments" paragraphs, `.env.example` + DEPLOYMENT.md's four `DEPLOYER_*` variables, an
ACCEPTANCE.md support-screen row). After that, Gate 9 itself needs the owner in the loop: the
real-money device pass (a real $1 PayID transfer arrives under the displayed name, a $1
Sponsors payment, a Lightning invoice from a second wallet — desktop and Android). Two owner
items still run in parallel and block nothing here: the Funny One phone pass through
`docs/ACCEPTANCE_FUNNY_ONE.md` (closes Gate FO, unblocks Phase S-3), and the paid Workers AI
plan followed by T-9.2's production run (`--dry-run`, `--limit 5`, full).

Note for whoever runs the gates: `npm test` is flaky under load on this machine — run it with
nothing else going, and re-run any lone timing failure in isolation before treating it as a
regression. Multi-line commit messages must go through `git commit -F <file>`. SSH to the VM is
allowed only from the owner's home IP; when it times out, re-run `deploy/oci/network.py <ip>`
(current IP from `curl https://api.ipify.org`). Production deploys are run by the owner in a Git
Bash terminal — the agent's auto mode refuses them. The local `.env`'s Worker secret is not
production's: any live Worker call from this PC needs the production pair exported first.

Still open, none blocking: making the repo public before any launch announcement; real Funny One
icons before any announcement (also blocks A3 in `docs/ACCEPTANCE_FUNNY_ONE.md`); T-7.1's iPhone
install leg (closes Gate 7, Funny Multi); B-8 (Play Protect warning on Android install, both
games); the Arm VM retry; a cosmetic "Render" sweep in code comments; the stray T-4.2 comment in
`apps/funny-multi-server/src/prompt.ts:72`; `deploy/ship.sh` lacks a `caddy reload` (Step 36); a
mid-game reload-on-update risk in both clients' `swReload.ts`; the exported story picture's
Hebrew text rendering LTR instead of RTL; all non-`en`/`ru` `home.title`s in both clients await
native-speaker review; whether CI should run `npm audit` (owner decision — a local gate today).~~ *(carried — see Step 45 below.)*

*(2026-09-29, after Step 43 — carried: superseded by the note above.)*

## Step 45 — `engine.io`, `fast-uri`, `brace-expansion` bumps: `npm audit` clean again (2026-09-30)

**Shipped:** a lockfile-only bump, found while running Step 46's gates and not caused by that
step's diff. `npm audit` reported three advisories: `engine.io` 6.6.9 → 6.6.11
(GHSA-2gc4-cqfq-p2gv, high, protocol-revision-mismatch DoS — under `socket.io` on the Funny
Multi server); `fast-uri` 4.1.4 → 4.2.1 and 3.1.7 → 3.1.8 (GHSA-hrr3-gc8f-f4qj,
GHSA-jvvf-x445-j334, moderate — under fastify's `ajv` and `fast-json-stringify`); and
`brace-expansion` 1.1.18 → 1.1.21, 2.1.4 → 2.1.7, 5.0.9 → 5.0.12 (GHSA-q2hr-2g5m-vwhr,
GHSA-qhr7-859c-m2p7, GHSA-6j4f-fj2g-mc7p, high, DoS — mostly ESLint/glob/workbox tooling, but 5.x
also sits under `@fastify/static`'s `glob`). Every fixed release is inside its dependents'
declared ranges, so `npm audit fix` changed exactly those 13 lockfile entries (and `engine.io`
6.6.11 drops its `base64id` dependency); no `package.json` changed. Unlike Step 42, production
was exposed: `npm audit --omit=dev` reported all three. `npm audit signatures` verifies the new
tree. Owner decision 2026-09-30: fix now, in its own commit ahead of the port move's, per the
Step 42 rule. Gates on the lockfile-only tree: typecheck, lint, format:check clean; `npm test`
outside the sandbox — client 225/225, server 214/214, funny-one-client 113/113, shared 190/190,
cloudflare 50/50; `npm audit` 0 vulnerabilities.

**Owed:** the fix reaches production only with the next owner-run deploy (`deploy/ship.sh`);
until then the live server still runs `engine.io` 6.6.9.

## Step 46 — dev ports into funnyone's decade: 5173 → 5183, 5174 → 5184 (2026-09-30)

**Shipped:** the move recorded for this repo in the machine port register
(`C:\Mark\Dev\machine\ports.md`, made 2026-09-30 because several projects' agent sessions
share this laptop; each project owns a decade, funnyone's is the 5180s plus 3000). Both Vite
clients sat on geoheli's numbers: `funny-multi-client` 5173 → 5183 (`vite.config.ts:173`),
`funny-one-client` 5174 → 5184 (`vite.config.ts:76`); both keep `strictPort`, so a busy port
fails loudly instead of bumping. The server's dev CORS origin followed
(`apps/funny-multi-server/src/index.ts:74`, and its test at `index.test.ts:95,97`), as did the
`serverOrigin()` comment in `basePath.ts`. `scripts/funny-one-screens.mjs` and
`funny-one-offline.mjs` ask Vite for port 0 and needed nothing; production is untouched (the
client is served from the server's own origin there). The old numbers in earlier log entries are
history and stay. In the `machine` repo, the register's two funnyone rows now read 5183/5184 and
its rule line says only 3000 is still shared (smartmaphue's move to 3001 is its own session).
Gates on the final tree: typecheck, lint, format:check clean; `npm test` outside the sandbox all
green (225/214/113/190/50); `npm audit` 0 after Step 45. Both clients, started from their real
configs, answered 200 on 5183 and 5184.

**Owed:** nothing.

---

~~**RESUME HERE (2026-09-30, after Step 46).** Next is **T-9.5** (docs: README "Support" and "Why
no card payments" paragraphs, `.env.example` + DEPLOYMENT.md's four `DEPLOYER_*` variables, an
ACCEPTANCE.md support-screen row). After that, Gate 9 itself needs the owner in the loop: the
real-money device pass (a real $1 PayID transfer arrives under the displayed name, a $1
Sponsors payment, a Lightning invoice from a second wallet — desktop and Android). Owner items
that block nothing here: a production deploy to take Step 45's `engine.io` fix live; the Funny
One phone pass through `docs/ACCEPTANCE_FUNNY_ONE.md` (closes Gate FO, unblocks Phase S-3); and
the paid Workers AI plan followed by T-9.2's production run (`--dry-run`, `--limit 5`, full).

Note for whoever runs the gates: `npm test` is flaky under load on this machine — run it with
nothing else going, and re-run any lone timing failure in isolation before treating it as a
regression. Multi-line commit messages must go through `git commit -F <file>`. Dev ports are
5183 (Funny Multi client), 5184 (Funny One client) and 3000 (server); read
`C:\Mark\Dev\machine\ports.md` before binding anything new. SSH to the VM is allowed only from
the owner's home IP; when it times out, re-run `deploy/oci/network.py <ip>` (current IP from
`curl https://api.ipify.org`). Production deploys are run by the owner in a Git Bash terminal —
the agent's auto mode refuses them. The local `.env`'s Worker secret is not production's: any
live Worker call from this PC needs the production pair exported first.

Still open, none blocking: making the repo public before any launch announcement; real Funny One
icons before any announcement (also blocks A3 in `docs/ACCEPTANCE_FUNNY_ONE.md`); T-7.1's iPhone
install leg (closes Gate 7, Funny Multi); B-8 (Play Protect warning on Android install, both
games); the Arm VM retry; a cosmetic "Render" sweep in code comments; the stray T-4.2 comment in
`apps/funny-multi-server/src/prompt.ts:72`; `deploy/ship.sh` lacks a `caddy reload` (Step 36); a
mid-game reload-on-update risk in both clients' `swReload.ts`; the exported story picture's
Hebrew text rendering LTR instead of RTL; all non-`en`/`ru` `home.title`s in both clients await
native-speaker review; whether CI should run `npm audit` (owner decision — a local gate today).~~ *(carried — see Step 47 below.)*

## Step 47 (task T-9.5) — support docs: README, `.env.example`, DEPLOYMENT.md, ACCEPTANCE.md Part D (2026-10-01)

**Shipped:** T-9.5, closed. Most of it already existed: Step 17's D-6 rewrite (2026-09-16) had
put the support and no-card text into README's AGPL section and all five rails into
`.env.example`, before T-9.3/T-9.4 built anything. So this step moved and corrected the text
rather than writing it from scratch. README: a new "Support" section — the ♥ on Home and
_Support this server_ on the end screen, the three rails (tap-to-copy on PayID and Lightning;
Sponsors is a link with the one-time hint; Lightning is also a link and a QR code), the
`DEPLOYER_*` variables, no ♥ with nothing set — and under it "Why no card payments" (the
$15–30 dispute fee on a $1 gift, and why each of the three rails has no chargeback; the
Sponsors wording follows `local_docs/gift-payments-no-chargeback-research.md`: GitHub is the
merchant of record, so a dispute is not debited from the recipient). The AGPL section keeps
the "nothing to buy" paragraph (FM-TIER-6). `.github/FUNDING.yml`'s comment now names the
"Support" heading. `.env.example`: the rails are read once at boot and served at
`<BASE_PATH>/config`, so restart after editing. DEPLOYMENT.md: a new "Optional: the Support
screen" subsection under 2a — an example block (no inline comments, and the PayID name
quoted, so Compose's env-file parser reads it safely), a note per variable, the restart
command, `curl …/config` to check — and a fifth item in the five-minute check (no ♥ → `curl`
`/config`). `docs/ACCEPTANCE.md`: Part D, the script for Gate 9's real-money device pass — the
preconditions (production on Step 44 or later; the agent sets T-9.1's four values on the VM;
the owner brings a second bank account, a second GitHub account and a second Lightning wallet)
and rows D1–D5 (entry points and screen contents on desktop and Android, tap-to-copy, then one
$1 gift each over PayID, Sponsors and Lightning), with their own results table. `steering/tasks.md`'s
Gate 9 line points at it. Checked on the way: production's `/funny37-game/config` still
answers with `index.html` (200, `text/html`) — Steps 43–46 are not deployed yet.

Gates: typecheck, lint, format:check clean; `npm test` outside the sandbox — client 225/225,
server 214/214, funny-one-client 113/113, shared 190/190, cloudflare 50/50; `npm audit` 0
vulnerabilities. Docs-only step, so no in-browser pass.

**Owed:** nothing inside T-9.5. Noted: design §10.2 says the "Copied!" state lasts 2 s; the
code (`SupportScreen.tsx`) and Step 44's entry say 1.5 s, and Part D follows the code. One of
the two needs correcting — owner's call, not blocking.

---

~~**RESUME HERE (2026-10-01, after Step 47).** Phase 9's agent-only work is done. What is left
needs the owner in the loop, in this order: (1) a production deploy (`deploy/ship.sh`, owner
in Git Bash) — it takes Steps 43–47 live, including `GET /config` and Step 45's `engine.io`
fix; (2) the agent sets the four `DEPLOYER_*` rails in `~/funny/.env` on the VM, restarts and
checks `curl …/funny37-game/config` (`docs/ACCEPTANCE.md` Part D, "Before the session");
(3) the Part D device session, D1–D5, recorded in its results table; (4) the paid Workers AI
plan, then T-9.2's production run (`--dry-run`, `--limit 5`, full) — the library half of
Gate 9. Gate 9 closes when both halves pass; then the store-app phases (owner decision
2026-09-29: Phase 9 first). The Funny One phone pass through `docs/ACCEPTANCE_FUNNY_ONE.md`
(closes Gate FO, unblocks Phase S-3) still runs in parallel and blocks nothing here.

Note for whoever runs the gates: `npm test` is flaky under load on this machine — run it with
nothing else going, and re-run any lone timing failure in isolation before treating it as a
regression. Multi-line commit messages must go through `git commit -F <file>`. Dev ports are
5183 (Funny Multi client), 5184 (Funny One client) and 3000 (server); read
`C:\Mark\Dev\machine\ports.md` before binding anything new. SSH to the VM is allowed only from
the owner's home IP; when it times out, re-run `deploy/oci/network.py <ip>` (current IP from
`curl https://api.ipify.org`). Production deploys are run by the owner in a Git Bash terminal —
the agent's auto mode refuses them. The local `.env`'s Worker secret is not production's: any
live Worker call from this PC needs the production pair exported first.

Still open, none blocking: making the repo public before any launch announcement; real Funny One
icons before any announcement (also blocks A3 in `docs/ACCEPTANCE_FUNNY_ONE.md`); T-7.1's iPhone
install leg (closes Gate 7, Funny Multi); B-8 (Play Protect warning on Android install, both
games); the Arm VM retry; a cosmetic "Render" sweep in code comments; the stray T-4.2 comment in
`apps/funny-multi-server/src/prompt.ts:72`; `deploy/ship.sh` lacks a `caddy reload` (Step 36); a
mid-game reload-on-update risk in both clients' `swReload.ts`; the exported story picture's
Hebrew text rendering LTR instead of RTL; all non-`en`/`ru` `home.title`s in both clients await
native-speaker review; whether CI should run `npm audit` (owner decision — a local gate today);
design §10.2's 2 s vs the code's 1.5 s "Copied!" (Step 47).~~ *(carried — see Steps 48–49 below.)*

## Step 48 — `fastify` 5.12.4 → 5.12.5: `npm audit` clean again (2026-10-01)

**Shipped:** a lockfile-only bump, found while running Step 49's gates and not caused by that
step's diff. `npm audit` reported GHSA-4mh8-r7rc-xpvc (moderate): `fastify` below 5.12.5 can be
crashed by an unhandled exception on HTTP/2 trailer responses. 5.12.5 is inside the server's
declared range (`^5.11.3`), so `npm audit fix` changed only that one lockfile entry; no
`package.json` changed. Production was not exposed: the server never enables HTTP/2 (Caddy
terminates TLS and proxies HTTP/1.1). It goes live with the next `deploy/ship.sh`. Owner
decision 2026-10-01: fix now, in its own commit ahead of Step 49's, per the Step 42 rule.
`npm audit signatures` verifies the new tree. Gates on the lockfile-only tree: typecheck, lint,
format:check clean; `npm test` outside the sandbox — client 225/225, server 214/214,
funny-one-client 113/113, shared 190/190, cloudflare 50/50; `npm audit` 0 vulnerabilities.

**Owed:** nothing.

## Step 49 — production deploy, VM support rails, Part D device pass (2026-10-01)

**Shipped:** the owner's leg of Phase 9's support half, run one small operation at a time.
(1) The owner ran `deploy/ship.sh ubuntu@152.69.166.212`: production now runs `11037cd` (Steps
43–47, including `GET /config` and Step 45's `engine.io` fix); `/funny37-game/health` answered
`{"ok":true}` and `/funny37-game/config` now answers JSON. (2) The agent added T-9.1's four
rails to `~/funny/.env` on the VM over SSH (backup `~/funny/.env.bak-2026-10-01`, mode 600 kept;
the empty `DEPLOYER_DONATE_URL=` line left as it was), recreated the container with `docker
compose --profile caddy up -d`, and checked `/config` returns all four with `donateUrl: null`.
Also checked from here: the Sponsors page answers 200 and offers $1/$3/$5 one-time tiers; the
Lightning address resolves via LNURL-pay. (3) The Part D session, recorded in
`docs/ACCEPTANCE.md`: D1 (♥ on Android and desktop, end-screen link after a three-tab game),
D2 (tap-to-copy, both rails, both devices) and D3 ($1 PayID gift, payee shown as MARK WEB
TOOLS, arrived) pass. D4 is deferred: the owner reported paying the $1 one-time tier but could
not check the Sponsors dashboard, and the agent's `gh` token (scopes without `read:user`)
listed 0 sponsorships even with `activeOnly: false` — inconclusive. D5 is deferred: (b) the
address link on Android opened a Lightning wallet with the address filled in; (a) the QR
payment from a second wallet was not done. An attempt to drive the desktop legs with a
headless Playwright run against production was refused by the agent's auto mode, so the
owner ran them by hand.

Gates: typecheck, lint, format:check clean; `npm test` outside the sandbox — client 225/225, server 214/214, funny-one-client 113/113, shared 190/190, cloudflare 50/50;
`npm audit` 0 vulnerabilities (after Step 48). Docs-only step.

**Owed:** D4 — confirm the $1 one-time sponsorship on
`github.com/sponsors/oursharedcode/dashboard/your_sponsors` (signed in as `oursharedcode`), or
the agent can check it once `gh auth refresh -s read:user` has been run. D5(a) — a QR payment
from a second Lightning wallet. Both stand between Part D and Gate 9's support leg.

---

**RESUME HERE (2026-10-01, after Step 49).** Production runs `11037cd` with the four support
rails live; Step 48's `fastify` bump is not deployed yet (not urgent — no HTTP/2). Part D:
D1–D3 pass; D4 (Sponsors arrival) and D5(a) (QR payment from a second wallet) are owed by the
owner whenever convenient — see Step 49's **Owed**. Next in order: the
paid Workers AI plan (owner, Cloudflare dashboard — T-9.1's last item), then T-9.2's production
run (`--dry-run`, `--limit 5`, full; the production Worker pair must be exported in the shell
first) — the library half of Gate 9. Gate 9 closes when both halves pass; then the store-app
phases (owner decision 2026-09-29: Phase 9 first). The Funny One phone pass through
`docs/ACCEPTANCE_FUNNY_ONE.md` (closes Gate FO, unblocks Phase S-3) still runs in parallel and
blocks nothing here.

The owner wants owner-facing work run one small operation per message (≤50 words, who does
what, wait for "done", automate first). Production's `.env` now holds the support rails; the
backup from before the change is `~/funny/.env.bak-2026-10-01` on the VM.

Note for whoever runs the gates: `npm test` is flaky under load on this machine — run it with
nothing else going, and re-run any lone timing failure in isolation before treating it as a
regression. Multi-line commit messages must go through `git commit -F <file>`. Dev ports are
5183 (Funny Multi client), 5184 (Funny One client) and 3000 (server); read
`C:\Mark\Dev\machine\ports.md` before binding anything new. SSH to the VM is allowed only from
the owner's home IP; when it times out, re-run `deploy/oci/network.py <ip>` (current IP from
`curl https://api.ipify.org`). Production deploys are run by the owner in a Git Bash terminal —
the agent's auto mode refuses them, and also refused a headless browser run against production
(Step 49). The local `.env`'s Worker secret is not production's: any live Worker call from this
PC needs the production pair exported first.

Still open, none blocking: making the repo public before any launch announcement; real Funny One
icons before any announcement (also blocks A3 in `docs/ACCEPTANCE_FUNNY_ONE.md`); T-7.1's iPhone
install leg (closes Gate 7, Funny Multi); B-8 (Play Protect warning on Android install, both
games); the Arm VM retry; a cosmetic "Render" sweep in code comments; the stray T-4.2 comment in
`apps/funny-multi-server/src/prompt.ts:72`; `deploy/ship.sh` lacks a `caddy reload` (Step 36); a
mid-game reload-on-update risk in both clients' `swReload.ts`; the exported story picture's
Hebrew text rendering LTR instead of RTL; all non-`en`/`ru` `home.title`s in both clients await
native-speaker review; whether CI should run `npm audit` (owner decision — a local gate today);
design §10.2's 2 s vs the code's 1.5 s "Copied!" (Step 47).
