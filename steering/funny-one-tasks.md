# Funny One «Семейная Чепуха» — Tasks (steering)

| | |
|---|---|
| **Document** | `steering/funny-one-tasks.md` |
| **Status** | Phases FO-0–FO-3 closed. Full local game playable end to end (setup, handoff, combobox, thinking-delay virtual seats, completion). Next: Phase FO-4 (rig art + reveal). |

Execution plan for `steering/funny-one-requirements.md` (FO-\*) per
`steering/funny-one-design.md`. Same discipline as Funny Multi: phases in order, verify each
gate before moving on. Numbered FO-0.. / S-.. to avoid colliding with Funny Multi's Phase 0–9 in
`steering/tasks.md`.

Sizing: (S) ≤ half a day · (M) about a day · (L) multiple days (or, for owner-only steps with
external wait time, elapsed time rather than effort).

---

## Phase FO-0 — decide the fork (CLOSED 2026-09-20, D-8)

- [x] **T-FO-0.1 (S)** Resolved: on-device rig (not the AI pipeline), round-robin turn-passing.
      Recorded as D-8 in `funny-one-requirements.md` §2.

## Phase FO-1 — repo scaffold (CLOSED 2026-09-20)

- [x] **T-FO-1.1 (S)** `apps/funny-one-client` workspace: package.json, tsconfig, Vite/Tailwind/
      PWA config copied from `funny-multi-client` and adapted (`BASE_PATH` read via
      `normalizeBasePath`, same as Funny Multi — `/funny1-game` is the intended deploy value per
      D-5, set at build time, not hardcoded); full-precache PWA strategy (FO-IMG-2) instead of
      Funny Multi's NetworkFirst shell; `qrcode`/`socket.io-client` deliberately omitted
      (FO-ARC-3). Placeholder `App.tsx` (wordmark + subtitle, no game logic) and one smoke test.
      CI wiring needs no change (existing `apps/*` workspace glob already covers it). All six
      gates verified for the new workspace (typecheck, lint, format, test, build, audit).

## Phase FO-2 — local game engine

- [x] **T-FO-2.1 (M)** Promote `renderProse`/`polishProse`/`polishRussianProse` from
      `apps/funny-multi-server` into `packages/shared`; re-point Funny Multi's server at the
      shared version; unit tests before either client consumes it. → FO-ARC-2
      *Step 20 (2026-09-20): scope widened to the whole i18n module (owner call), not just the
      three named functions — `renderProse` needs the prose templates it fills. JSON catalogs
      converted to TS modules (owner call), mirroring `pools/text/index.ts`. See
      `docs/IMPLEMENTATION_LOG.md` Step 20 for the full record.*
- [x] **T-FO-2.2 (M)** Local round-robin state machine: seat list (human/virtual), per-question
      rotation via the unmodified `storyIndex`, virtual-seat auto-fill with the "thinking" delay.
      Pure reducer logic, unit-tested before any screen exists. **Confirm OQ-3 (min player
      floor) before starting.** → FO-CORE-1/2, FO-BOT-1
      *Step 21 (2026-09-20): `apps/funny-one-client/src/game/roundRobin.ts` — the "thinking"
      delay itself is deferred to T-FO-3.3 (no screen exists yet); this step only exposes which
      seat is up and its kind. See `docs/IMPLEMENTATION_LOG.md` Step 21.*

## Phase FO-3 — core screens (CLOSED 2026-09-20)

- [x] **T-FO-3.1 (M)** Home/setup screen (seat count, human/virtual mix, language picker gated
      to `AUTHORED_LANGUAGES`).
      *Step 22 (2026-09-20): `apps/funny-one-client/src/screens/HomeScreen.tsx`, adapted from
      Funny Multi's create-mode `HomeScreen` (two-column rules+language layout, `ScrollBox`,
      flag artwork copied under `public/flags/`). `GameState` gained a `language` field so the
      picked content language survives into `App.tsx`'s (still-placeholder) playing view. See
      `docs/IMPLEMENTATION_LOG.md` Step 22.*
- [x] **T-FO-3.2 (M)** `HandoffScreen` + adapted `RoundScreen` combobox.
      *Step 23 (2026-09-20): `apps/funny-one-client/src/screens/HandoffScreen.tsx` (new,
      FO-CORE-3) and `RoundScreen.tsx` (adapted from Funny Multi's, no `TimerBar`, owner call).
      `App.tsx` rewritten as a local phase machine: setup → (handoff → round)× → done. A virtual
      seat's turn resolves immediately with no screen (owner call) — the "thinking" pause lands at
      T-FO-3.3. See `docs/IMPLEMENTATION_LOG.md` Step 23.*
- [x] **T-FO-3.3 (S)** Virtual-seat "thinking" mascot delay (archive ONE-4, 0.8–1.5 s).
      *Step 24 (2026-09-20): `apps/funny-one-client/src/game/thinkingDelay.ts` (FO-BOT-1,
      RNG-injected like `pickVirtualAnswer`) + `ThinkingScreen.tsx` (reuses Funny Multi's
      `WaitingMascot` unmodified, no button/affordance). `App.tsx`'s virtual-seat effect now
      schedules `submitAnswer` via `setTimeout` with a `clearTimeout` cleanup (functional
      `setGame` update, avoids stale closures under StrictMode's dev double-invoke) instead of
      resolving instantly. See `docs/IMPLEMENTATION_LOG.md` Step 24.*

## Phase FO-4 — rig art + reveal

- [x] **T-FO-4.1 (L)** Rig art: backgrounds, characters, co-characters, props — new content,
      matched to the existing mascot art style. Sizing is content-authoring time, not code.
      *OQ-4 resolved 2026-09-20 (owner): cross-device sharing wanted, via the OS native share
      sheet only — no upload/link, no network call. See `funny-one-requirements.md` §7.*
      *Step 25 (2026-09-22): all 40 assets (10 each of `where`/`who`/`with`/`did`) drawn under
      `apps/funny-one-client/src/components/art/rig/`, spec and full id→file mapping in
      `rig/RIG_ART.md`. No `rigIndex.ts` registry yet — that's T-FO-4.2. See
      `docs/IMPLEMENTATION_LOG.md` Step 25.*
- [x] **T-FO-4.2 (M)** Rig compositor: layered assembly, spring reveal, in-round dedup. →
      FO-IMG-1/3/4
      *Step 26 (2026-09-22): `art/rig/rigIndex.ts` (id→component registry, bijection-tested
      against `POOLS[0/1/2/4]`) + `components/RigScene.tsx` (the compositor: `where`→`who`→
      `with`→`did` z-order/positions per `RIG_ART.md`, spring reveal reusing `motion.ts`'s
      `goofy` preset unmodified, `reveal={false}` settled mode for T-FO-4.3's gallery). Owner
      decision (2026-09-22): FO-IMG-4 dedup stays bot-only (existing `usedOptionsThisQuestion`)
      — humans keep the full pool, a repeat needs a 4-way collision (~1/10⁴) and greying out a
      wanted answer is worse feel than a rare repeat. 400×300 (4:3) frame locked, not revisited.
      Not wired to any screen yet — that's T-FO-4.3. See `docs/IMPLEMENTATION_LOG.md` Step 26.*
- [ ] **T-FO-4.3 (M)** `StoryGallery` + end screen, adapted from Funny Multi's.

## Phase FO-5 — i18n breadth

- [ ] **T-FO-5.1 (M)** All 15 languages wired for Funny One's UI catalog (pool texts already
      shared per D-2 — nothing new to author there).

## Phase FO-6 — PWA + deploy

- [ ] **T-FO-6.1 (M)** Full precache verification: zero runtime network calls, real airplane-mode
      playthrough. → FO-IMG-2
- [ ] **T-FO-6.2 (S)** Deploy under `/funny1-game` on the existing Oracle VM's Caddy (static
      files, no new container).

## Phase FO-7 — acceptance

- [ ] **T-FO-7.1 (M)** Device session (`docs/ACCEPTANCE.md`-style script), including a genuine
      offline (airplane-mode) full playthrough.
- **Gate FO**: a full game playable start-to-finish, airplane mode, on a real phone; all 15
  languages render; typecheck/lint/format/test/audit clean (six gates apply as usual).

## Phase S — store apps AND37/IOS37 (both products; see `steering/tasks.md` B-1/B-2)

*Owner developer-account enrollment (Apple + Google, under the existing ABN) runs in parallel
with everything above — it has its own multi-week lead time and does not block phases FO-1..7.*

- **Phase S-1/S-2**: Funny Multi's Android TWA / iOS Capacitor shell — tracked in
  `steering/tasks.md` backlog B-1/B-2, pulled forward from post-v1 per the owner's 2026-09-20
  direction. Not duplicated here.
- **Phase S-3 (Funny One replicate)**: **blocked on Phase FO-6** (a deployable client). Once
  unblocked, expect an *easier* pass than Funny Multi's — no App Store 4.2 online-only risk, and
  Google Play Families eligibility is a realistic target (FO-ID-1) — plus one new task neither
  product's deploy has yet: publish `.well-known/assetlinks.json` for Android Digital Asset
  Links verification.

## Dependency notes

- FO-1 → FO-2 → FO-3 → FO-4 → FO-5 → FO-6 → FO-7, strictly in order, same discipline as Funny
  Multi's phases.
- T-FO-4.1 (rig art) is the largest single unknown — it is content authoring, not engineering,
  and its size is genuinely open until real art exists.
- Phase S-3 cannot start before Gate FO closes.
