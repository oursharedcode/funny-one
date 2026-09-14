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

**RESUME HERE (2026-09-15).** Production target is now the owner's own VM (D-5), not Render:
Oracle Always-Free `funny-vm` in Sydney at **152.69.166.212** (1 GB AMD; Arm was out of
capacity), Docker + Compose installed, ports 22/80/443 open, domain
`staging-oursharedcode.com` registered with DNS on Cloudflare. Render
(`https://funny-multi.onrender.com/`) still serves as the interim URL and stays the free
one-click alternative. Worker unchanged at `https://funny-multi-image.oursharedcode.workers.dev`.

Next: **Step 12 — T-8.1 base path.** One `BASE_PATH` (default `/`, Render unchanged): client
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
(SRC §19 + Gate 7 legs) for the owner's single scripted phone session (T-8.2 + Gate 7).

Owner-side, still open: nothing before Step 13 except the Cloudflare DNS token when asked.
`README`'s Sponsors link and Render deploy-button URL remain unconfirmable while the repo is
private.
