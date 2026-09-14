# Funny Multi «Чепуха 37» — Tasks (steering)

| | |
|---|---|
| **Document** | `steering/tasks.md` |
| **Version** | 1.0 draft |
| **Date** | 2026-08-15 |
| **Status** | for review |
| **Progress** | Phases 0–6 complete (Gates 0–6 passed); closed task blocks live in `steering/tasks-done.md`. Current state and next step: the RESUME HERE note at the foot of `docs/IMPLEMENTATION_LOG.md`. |
| **Build state** | Tracked per step in `docs/IMPLEMENTATION_LOG.md`. |

Execution plan for `steering/requirements.md` (FM-*) per `steering/design.md` (§, DD-*).
Discipline inherited from the source spec §16: **do phases in order, verify each phase's
gate before moving on**. SRC = `docs/source_project/monkeybus` (read-only; copy, never edit).

Sizing: (S) ≤ half a day · (M) about a day · (L) multiple days.

---

*Phases 0–6 (closed) live in `steering/tasks-done.md`.*

## Phase 7 — PWA + polish

- [ ] **T-7.1 (S)** PWA: manifest, icons, service worker, stale-cache reload strategy
      (`swReload.ts`); install test on a real iPhone and Android. → FM-NFR-1
      *Partly landed at T-3.1, which had to: a PWA will not install without a manifest and an
      icon, so `vite.config.ts` already carries the manifest, the NetworkFirst navigation
      strategy and the un-precached `index.html`, and `swReload.ts` is copied.
      **Icon work landed 2026-08-20:** `public/icon.svg` rewritten as a paths-only vector (no
      `<text>`/webfont dependency, which silently falls back to a system font when rasterized
      outside a page context); 180/192/512 PNGs pre-rendered once via a temporary local `sharp`
      install (never added to `package.json`) and committed as static files, since iOS ignores
      SVG for `apple-touch-icon` — `index.html` now points it at `icon-180.png`.
      *(Superseded 2026-08-20, Step 7: manifest `icons[]` briefly carried the SVG plus the PNG
      fallbacks; Chrome will not load an SVG manifest icon, so `icons[]` is now the 192/512 PNGs
      only, with `any` and `maskable` split onto separate entries, and `icon.svg` serves as the
      favicon via a new `rel="icon"` link.)* Real commissioned artwork deferred
      to Phase 8 polish (owner decision 2026-08-20); this hand-authored "37"-on-brand-cream mark
      is the placeholder until then.
      **Artwork landed early (2026-08-21, Steps 9–10):** the 180/192/512 PNGs are now SRC's
      commissioned mascot (owner decision 2026-08-20), and `index.html`'s favicon follows them
      (`icon-192.png`; SRC has no SVG of the mascot). `icon.svg` has no runtime consumer left —
      it survives only as the source for `deployer-logo.png` (the LogoStamp watermark, still the
      "37" mark). **Open flag:** the mascot's ears and hair sit outside the maskable safe zone,
      so Android's circular mask may clip them — owner decision 2026-09-14: judge on the real
      Android install rather than pad a `maskable`-only variant pre-emptively.
      **Remaining for T-7.1:** the real-device install test on iPhone + Android — the part of
      this task that was never automatable, and separately blocked on a secure context: PWA
      install and service-worker registration both require HTTPS, which the LAN setup used for
      Gates 3–5 doesn't have. Owner decision 2026-08-20: defer this check to T-8.1's Render
      deploy rather than stand up a throwaway tunnel — run the DevTools Installability panel and
      both real-device installs against the production URL once it exists, then close Gate 7.*
- [ ] **T-7.3 (S)** Perf check on mid-range Android: 60 fps animations, reveal payload sizes
      (URL-only) verified in devtools. → FM-NFR-2/4
      *Both automatable legs landed 2026-08-20: a committed server test
      (`game.payloadSize.socket.test.ts`) pins FM-NFR-2's byte budget — a single `PictureRef`
      under 400 B, a full 7-player game's picture traffic (every player's own request plus the
      shared gallery's fan-out) under 30 KB — against a realistic R2-shaped URL rather than the
      short placeholder other suites use. A static audit of every `motion`/`AnimatePresence`
      prop in the client (`ErrorMascot`, `PictureFlourish`, `SubmitConfirm`, `Wordmark`,
      `PlayerList`, `RoundScreen`, `WaitingScreen`, `screenSlide` in `motion.ts`) confirmed
      FM-NFR-4: every animated property is `scale`/`x`/`y`/`opacity`/`rotate` — transform/opacity
      only, no layout- or paint-triggering property anywhere — so no code change was needed.
      **Remaining for T-7.3:** the 60 fps jank measurement itself needs a real mid-range Android
      device; owner decision 2026-08-20 folds it into T-8.1's device-session pass alongside
      T-7.1's install test and Gate 7's jank check, rather than a separate session.*
- **Gate 7**: Chrome DevTools Application → Manifest → Installability panel passes (Lighthouse
  dropped its dedicated PWA audit category in v12, so this is its successor check); install
  confirmed on a real iPhone and Android; animation jank check passed on a real device.
  *Stays open across the Phase 7→8 boundary by owner decision 2026-08-20 — its three
  device-dependent legs (T-7.1 install test, T-7.3 jank check, this gate's own jank check) are
  folded into T-8.1's device session rather than blocking Phase 8's start.*
  **Installability leg passed 2026-08-20 (Step 7)** against
  https://funny-multi.onrender.com/: the Manifest panel is clean apart from the two optional
  "richer PWA install UI" screenshot notices, and Chrome offers the install affordance. Getting
  there needed a real fix — Chrome's manifest loader rejects `/icon.svg` outright (error
  survived a redeploy adding `width`/`height`, a warm hard reload, and Clear-site-data with the
  SW unregistered), so the manifest is PNG-only now and the SVG is the favicon.
  **Still open:** real iPhone install, real Android install, and the jank check — all three in
  one scripted device session (owner decision 2026-09-14) once T-8.1's new deploy target is up.
  *The Installability sign-off above was against the Render origin; D-5 moves production to a
  different origin **and** a sub-path scope, so that leg is re-run there before the session.*

## Phase 8 — Deploy + acceptance + docs

- [ ] **T-8.1 (M)** Deploy artifacts adapted: `render.yaml`, `Dockerfile`, `docker-compose.yml`,
      `.dockerignore`, `.env.example`; deploy server to Render + Worker/R2/KV via wrangler;
      set secrets. → FM-NFR-3
      *Artifacts landed 2026-08-20: `Dockerfile`, `.dockerignore`, `docker-compose.yml`,
      `render.yaml` adapted from `docs/source_project/monkeybus` for the `apps/*`/`packages/*`
      workspace layout; `render.yaml` on the free plan (owner decision 2026-08-20).
      `docker compose up` itself is unverified — no Docker available in the dev sandbox; run it
      once before the real deploy on a machine that has Docker.*
      *T-2.3 carry-over landed 2026-08-20: `actions/checkout` and `actions/setup-node` bumped
      `@v4` → `@v5` in `.github/workflows/ci.yml`.*
      *T-2.2 carry-over landed 2026-08-20: `clientIp()` (`rateLimit.ts`) now takes a
      `trustedProxyHops` param (default 1) and reads `x-forwarded-for` from the right-hand
      (proxy-appended) end instead of the client-settable first hop; wired to a new
      `TRUSTED_PROXY_HOPS` env var in `index.ts`, documented in `.env.example`. The
      DEPLOYMENT.md write-up of this assumption landed with T-8.3 (`steering/tasks-done.md`).*
      **Deploy landed 2026-08-20 (Steps 6–7).** Production: **https://funny-multi.onrender.com/**
      (Render blueprint `funny-one-111` → service `funny-multi`, free plan). The Worker was
      already live from T-4.1 with its R2 bucket, so only `WORKER_SECRET` needed attention —
      rotated, because the value the owner had saved returned 403 (it was SRC's secret, not
      ours) and a Worker secret cannot be read back. Verified: `/` and `/index.html` 200,
      `/health` `{"ok":true}`, Socket.IO handshake 5/5 with a websocket upgrade offered.
      **`docker compose up` verified 2026-09-15 (Step 11)** on the dev machine (Docker 29.7,
      linux/amd64): image builds from the Dockerfile unchanged and passes the same four checks as
      the Render deploy. `DEPLOYMENT.md` Option B's "unverified" note is gone.
      **Owner decision taken 2026-09-14 (D-5):** no paid Render plan — production moves to the
      Docker image on an Oracle Cloud *Always Free* VM behind Caddy at
      `https://www.staging-oursharedcode.com/funny37-game`. Provisioned 2026-09-15 via the
      committed `deploy/oci/network.py` + `vm.py` (Sydney; VCN `funny-vcn`, VM `funny-vm` on the
      free AMD 1 GB shape because Arm was out of capacity, 2 GB swap, Docker 29.8 + Compose 5.5
      via cloud-init, reserved IP `152.69.166.212`); domain `staging-oursharedcode.com`
      registered, DNS on Cloudflare. Images are built on the dev machine and streamed to the VM
      over SSH (no build on 1 GB, no registry). Render stays as the free one-click alternative.
      **Remaining for T-8.1 (new legs, D-5):** (1) configurable `BASE_PATH` — client `base`,
      manifest `start_url`/`scope`, Socket.IO path, workbox denylist; server static prefix,
      `/health`, Socket.IO path; Dockerfile build-arg + compose — default `/` so Render is
      unchanged; (2) Caddy as a container in the same compose, DNS A records via the Cloudflare
      API, deploy to the VM, `TRUSTED_PROXY_HOPS` for Caddy, DEPLOYMENT.md/README rewrite;
      re-run Gate 7's Installability leg on the new origin; (3) multi-stage Dockerfile — the
      single-stage image is 785 MB because `npm prune` cannot shrink the already-written
      `npm ci --include=dev` layer (451 MB), and it has to be streamed to a 1 GB VM.
      *Carry-over from Phase 7 (owner decision 2026-08-20): the device pass must still close
      T-7.1's real iPhone/Android install, T-7.3's 60 fps jank check, and Gate 7 itself. The
      Installability leg of that bundle is done — see Gate 7 below.*
- [ ] **T-8.2 (M)** Acceptance test: SRC spec §19 checklist adapted to combobox + URL images,
      run with 3 real phones on the production URL; include disconnect-mid-game → bot,
      cap flow, cache-hit flow. → design §13
      *Owner decision 2026-09-14: the checklist is authored first as `docs/ACCEPTANCE.md`, with
      Gate 7's three device legs prepended, so the phone session — on the D-5 URL, not Render —
      runs as one scripted pass.*
- **Gate 8**: acceptance checklist signed off; a stranger can self-deploy from README alone.
  *T-8.3 (README, DEPLOYMENT, DEVELOPMENT, LANGUAGES, MODERATION) closed 2026-08-20 —
  `steering/tasks-done.md`. Gate itself still open: needs T-8.1's deploy and T-8.2's
  acceptance pass before "a stranger can self-deploy" can actually be verified.*

## Phase 9 — Premium (final phase, D-4)

- [ ] **T-9.1 (S)** Polar: product + subscription SKUs ($2.99/mo, $19.99/yr Family Pass),
      license keys enabled. (Business setup, not code.) → FM-TIER-2
- [ ] **T-9.2 (M)** Worker `POST /entitlement`: Polar license validation → 24 h HMAC JWT
      (`ENTITLEMENT_SECRET`); negative cases (invalid/expired/refunded). → FM-TIER-3
- [ ] **T-9.3 (M)** Server: `entitlementToken` on `room:create`, JWT verify, `room.premium`,
      cap bypass debiting monthly KV fair-use counter `fu:<yyyy-mm>:<keyHash>` (generations
      only, 300/mo ceiling, distinct at-ceiling message). Tests: bypass, ceiling, cache hits
      free. → FM-TIER-2/3
- [ ] **T-9.4 (S)** Client: "I have a key" redemption field (Home, ⭐ affordance), JWT in
      localStorage, premium badge in lobby. **No prices, no buy buttons, no purchase copy.** → FM-TIER-4
- [ ] **T-9.5 (S)** Docs: premium section in README (web checkout link lives outside the app),
      fair-use policy stated plainly. → FM-TIER-2/6
- **Gate 9**: end-to-end: buy test key on Polar sandbox → redeem → premium room generates past
  the free daily cap → fair-use ceiling triggers correctly.

## Post-v1 backlog (not scheduled)

- **B-1** AND37: TWA (Bubblewrap) wrapper + Play listing (12+, not Families) — FM-APP-1.
- **B-2** IOS37: Capacitor shell + App Store listing; 4.2-risk mitigation review — FM-APP-2.
- **B-3** Native-speaker review of the 13 machine-drafted pool languages (OD-F5).
- **B-4** Per-option gloss in joiner's UI language on the combobox (design §8.1 deferral).
- **B-5** Theme packs as pool extensions (pirates/space/dinosaurs — MON-3 mechanism, shared
  with future Funny One).
- **B-6** RuStore investigation (CMP-4); OD-F3 cap-granularity revisit; OD-F4 12+ revisit.
- **B-7** Optional AI Gateway / output classifier if the audience broadens (MODERATION.md
  operator guidance).

## Dependency notes

- Phases are strictly ordered 0→8; Phase 9 requires only Gate 4 technically but is scheduled
  last by decision D-4.
- T-1.5 (en/ru pools) blocks Gate 1 but T-1.6 and Phase 2 tasks T-2.1/T-2.2 can proceed in
  parallel with it.
- T-6.3 (13 pool languages) is the largest content task; it can start any time after T-1.4
  freezes the id set.
