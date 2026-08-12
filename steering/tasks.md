# Funny Multi «Чепуха 37» — Tasks (steering)

| | |
|---|---|
| **Document** | `steering/tasks.md` |
| **Version** | 1.0 draft |
| **Date** | 2026-08-12 |
| **Status** | for review |

Execution plan for `steering/requirements.md` (FM-*) per `steering/design.md` (§, DD-*).
Discipline inherited from the source spec §16: **do phases in order, verify each phase's
gate before moving on**. SRC = `docs/source_project/monkeybus` (read-only; copy, never edit).

Sizing: (S) ≤ half a day · (M) about a day · (L) multiple days.

---

## Phase 0 — Repo bootstrap

- [ ] **T-0.1 (S)** Root workspace: `package.json` (workspaces `apps/*`, `packages/*`, scripts
      mirroring SRC root: dev/build/test/lint/typecheck with shared prebuilds),
      `tsconfig.base.json`, `.gitignore`, `LICENSE` (AGPL-3.0-only). → FM-ARC-1, FM-ARC-6
- [ ] **T-0.2 (S)** Tooling copied from SRC and path-adapted: `.eslintrc.json`,
      `.prettierrc.json`, `.env.example`. → FM-ARC-5
- [ ] **T-0.3 (S)** CI: one GitHub Actions workflow — typecheck + lint + test. No deploy jobs. → FM-ARC-5
- **Gate 0**: `npm install` clean; CI green on the empty skeleton.

## Phase 1 — packages/shared

- [ ] **T-1.1 (S)** `languages.ts` copied verbatim from `SRC/shared/languages.ts` (15 languages,
      exhaustiveness sentinel). → D-2
- [ ] **T-1.2 (M)** `rotation.ts`: extract `storyIndex` from `SRC/server/src/game.ts` **with
      `rotation.test.ts` written first** (≥ 5 known-value assertions + range guards; port SRC's
      cases). → FM-CORE-6, FM-ARC-2
- [ ] **T-1.3 (M)** Pool schema (`pools/schema.ts`, slot config: visual 0/1/2/4 = 9–12,
      prose 3/5/6 = 20–30) + `pools.test.ts` validation suite per design §4.2 (coverage,
      uniqueness, ≤ 70 chars, promptEn rules, RU slot-1 «с/со» regex). Tests red until T-1.5. → FM-POOL-1/3/4
- [ ] **T-1.4 (M)** Canonical option ids + English prompt fragments (`pools/options.ts`):
      author the full id set with `promptEn` for visual slots. Family-friendly, no real
      people/brands. → FM-POOL-1/6, FM-IMG-2
- [ ] **T-1.5 (L)** Hand-author **en** and **ru** display texts (`pools/text/en.ts`, `ru.ts`);
      RU pre-declined per slot case, composed against the RU prose template. Pool tests green
      for en+ru (other languages temporarily excluded from the coverage matrix). → FM-POOL-3/5
- [ ] **T-1.6 (M)** `events.ts` adapted per design §5: `optionId` submit, `PictureRef`,
      resolved-text reveal payloads, `INVALID_OPTION`, `wobbleEngine` removed. → FM-ANS-2, FM-IMG-3
- **Gate 1**: `npm test -w packages/shared` green (rotation + pools en/ru + schema).

## Phase 2 — Server core (no images yet)

- [ ] **T-2.1 (S)** `apps/funny-multi-server` bootstrap from `SRC/server`: Fastify + Socket.IO,
      `/health`, CORS for dev, `env.ts` (minus dropped vars). **Do not copy** `filter/**`,
      `translate.ts`, stand-in arrays. → design §3
- [ ] **T-2.2 (M)** Rooms: copy `rooms.ts` (codes, rate limits 5/30 per IP/min, MAX_ROOMS,
      nickname 3–20) + lobby events wiring in `index.ts`. → FM-CORE-1/4
- [ ] **T-2.3 (L)** Round flow in `game.ts`: rotation from shared; `submitAnswer` validates
      `optionId` (reject `INVALID_OPTION`, no submitted mark); bot/timeout auto-fill = random
      pool pick with same-slot exclusion; 60 s timer; waiting broadcast; reveal entry resolving
      ids → room-language texts; RU `grammar.ts` polish copied. → FM-CORE-5..8, FM-BOT-1/2, FM-ANS-2/4/5
- [ ] **T-2.4 (M)** Disconnect rules per SRC `index.ts`: grace window, lobby leave, mid-game
      botification (auto-fill current round), host migration, `player:lost`. → FM-CORE-3
- [ ] **T-2.5 (M)** Adapt SRC `game.test.ts` + i18n coverage tests: option-id fixtures; full
      simulated 3- and 7-player games; INVALID_OPTION case; en+ru prose snapshots. → design §13
- **Gate 2**: server tests green; manual 3-tab full 7-round game with combobox picks stubbed
  via test client, correct story assembly verified (rotation placement).

## Phase 3 — Client core

- [ ] **T-3.1 (M)** `apps/funny-multi-client` bootstrap from `SRC/client`: Vite/Tailwind/PWA
      config, `App.tsx` phase routing, `socket.ts`, styles, art components, en+ru UI catalogs
      (full 15 wired in Phase 6). **Do not copy** `recordWobbleLottie.ts`, Test* screens. → design §3
- [ ] **T-3.2 (S)** Home + Lobby screens copied (create/join modes, `?room=` link, QR,
      player list, start). Remove wobble-engine toggle. → FM-CORE-1
- [ ] **T-3.3 (L)** **RoundScreen combobox** per design §8.1: tap-card radio list from shared
      pools (room language), per-player-per-round shuffle, selection spring highlight, Submit
      gated on selection, SubmitConfirm overlay, question gloss kept, ScrollBox for 20–30-option
      slots. → FM-ANS-1/3/4, FM-CORE-8
- [ ] **T-3.4 (S)** WaitingScreen copy; timer bar; forward-only screen transitions per SRC §17. → FM-ARC-4
- **Gate 3**: two phones (or tabs) create/join/play 7 rounds end-to-end with real UI;
  no free-text affordance anywhere; shuffle differs between players.

## Phase 4 — Image pipeline

- [ ] **T-4.1 (M)** Worker rewrite per design §7.2: sha256 → R2 head → hit `{url,w,h,cached:true}` /
      miss → Flux 4 steps → R2 put → KV bump → `{…,cached:false}`; `GET /i/<hash>.png` route
      (immutable cache, CORS); `GET /exists`; `/stats` kept; wrangler.toml with R2 + KV
      bindings. → FM-IMG-3
- [ ] **T-4.2 (M)** `prompt.ts` deterministic builder (skeleton + fragments, slots 0/1/2/4,
      STYLE_SUFFIX verbatim); determinism + snapshot + length tests. Tune skeleton wording
      against real Flux output on ~20 combos, then **lock it** (edits orphan the cache). → FM-IMG-2, DD-3
- [ ] **T-4.3 (M)** `image.ts` adapted: exists-check → reserve → generate → refund-on-cached
      flow per design §7.3; JSON response parsing; `releaseImageSlot()` + tests incl. cap and
      refund races; KV recovery (`max(local,worker)`) kept. → FM-TIER-1
- [ ] **T-4.4 (M)** Reveal wiring: auto-trigger on reveal, bot-story server-side generation,
      `PictureRef` payloads, RevealScreen URL images with dimensions + fade-in, retry,
      CAP_REACHED caption, error mascot. → FM-IMG-1, FM-CORE-9
- **Gate 4**: manual — dead-Worker URL → error+retry path; `MAX_IMAGES_PER_DAY=1` → second
  distinct story capped; **same picks twice → second reveal instant from cache with counter
  unchanged**; RU room and EN room with same picks → same image URL.

## Phase 5 — Gallery, end, share

- [ ] **T-5.1 (M)** Room gallery (host share, self-heal on late pictures, `PictureRef`
      entries) + EndScreen (ready toggle, one-more-game guard ≥ 3 non-bots, finish → finale
      image) + restart reset. → FM-CORE-10/11
- [ ] **T-5.2 (M)** Download/share adapted to URL images (fetch → blob → canvas, CORS);
      wobble video via CSS engine only; `videoFooter`, `capReset` copied. → design §8.3
- [ ] **T-5.3 (S)** Home-screen stats + live `stats:update` (copy `stats.ts`, client hook). → FM-CORE-12
- **Gate 5**: full game on two real phones: gallery share, story download (image renders with
  picture), share sheet, restart into second game.

## Phase 6 — Full 15-language breadth (D-2)

- [ ] **T-6.1 (M)** Wire all 15 UI catalogs from SRC + add new combobox keys to every catalog
      (machine-draft + `needs-<code>-review` flag where not en/ru). → FM-POOL-5 discipline
- [ ] **T-6.2 (M)** Server i18n: QUESTIONS + prose templates for all 15 copied; stand-ins
      stripped. → design §9
- [ ] **T-6.3 (L)** Machine-draft pool display texts for the 13 remaining languages against
      their prose templates; flag headers; re-enable full 15-language coverage matrix in
      `pools.test.ts` and get it green. → FM-POOL-2/5
- [ ] **T-6.4 (S)** Spot-check gates: full RU game (declined grammar reads correctly), one
      CJK game (zh or ja), RTL sanity pass for `he` (combobox layout mirrored correctly). → design §13
- **Gate 6**: pool + i18n coverage tests green for all 15; the three spot-check games pass.

## Phase 7 — PWA + polish

- [ ] **T-7.1 (S)** PWA: manifest, icons, service worker, stale-cache reload strategy
      (`swReload.ts`); install test on a real iPhone and Android. → FM-NFR-1
- [ ] **T-7.2 (M)** Design-system pass: motion presets on all transitions (forward-only),
      mascot triggers (waiting/timer/submit/reveal flourish/end/error), reduced-motion,
      wordmark, SourceFooter + LogoStamp. → FM-ARC-4, FM-CPL-3
- [ ] **T-7.3 (S)** Perf check on mid-range Android: 60 fps animations, reveal payload sizes
      (URL-only) verified in devtools. → FM-NFR-2/4
- **Gate 7**: Lighthouse PWA installable; animation jank check passed on a real device.

## Phase 8 — Deploy + acceptance + docs

- [ ] **T-8.1 (M)** Deploy artifacts adapted: `render.yaml`, `Dockerfile`, `docker-compose.yml`,
      `.dockerignore`, `.env.example`; deploy server to Render + Worker/R2/KV via wrangler;
      set secrets. → FM-NFR-3
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
