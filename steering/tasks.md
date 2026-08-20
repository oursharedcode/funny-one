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
      SVG for `apple-touch-icon` — `index.html` now points it at `icon-180.png`; manifest
      `icons[]` carries the SVG plus 192/512 PNG fallbacks. Real commissioned artwork deferred
      to Phase 8 polish (owner decision 2026-08-20); this hand-authored "37"-on-brand-cream mark
      is the placeholder until then.
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
      DEPLOYMENT.md write-up of this assumption is still owed — folds into T-8.3's docs pass.*
      **Remaining for T-8.1:** deploy server to Render + Worker/R2/KV via wrangler, set secrets
      — needs the owner's accounts/credentials, a separate owner-driven session.
      *Carry-over from Phase 7 (owner decision 2026-08-20): once deployed, this session's device
      pass must also close T-7.1's real-device install test (DevTools Installability panel +
      real iPhone/Android install against the production URL), T-7.3's 60 fps animation-jank
      check, and Gate 7 itself — all three were parked here rather than blocked on a throwaway
      HTTPS tunnel.*
- [ ] **T-8.2 (M)** Acceptance test: SRC spec §19 checklist adapted to combobox + URL images,
      run with 3 real phones on the production URL; include disconnect-mid-game → bot,
      cap flow, cache-hit flow. → design §13
- [ ] **T-8.3 (M)** Docs for this repo: README (what it is, deploy-your-own buttons pattern,
      AGPL/no-DRM honesty note per MON-5, GitHub Sponsors link only), DEPLOYMENT, DEVELOPMENT,
      LANGUAGES (pools workflow), MODERATION rewritten to FM-CPL-3 posture. → FM-TIER-4/6, FM-CPL-2/3
- **Gate 8**: acceptance checklist signed off; a stranger can self-deploy from README alone.

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
