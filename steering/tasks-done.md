# Funny Multi «Чепуха 37» — Tasks done (steering)

Closed phases of `steering/tasks.md`, moved here verbatim (2026-08-20) to keep the active
file small. Task ids, ticks, gate records and closure notes are unchanged. Session-level
history and the RESUME HERE note live in `docs/IMPLEMENTATION_LOG.md`.

---

## Phase 0 — Repo bootstrap

- [x] **T-0.1 (S)** Root workspace: `package.json` (workspaces `apps/*`, `packages/*`, scripts
      mirroring SRC root: dev/build/test/lint/typecheck with shared prebuilds),
      `tsconfig.base.json`, `.gitignore`, `LICENSE` (AGPL-3.0-only). → FM-ARC-1, FM-ARC-6
      *Also created the `packages/shared` shell (package.json + tsconfigs + `src/index.ts`
      placeholder) — without it the root `pre*` shared-build scripts cannot resolve.*
      *T-4.1 added a third workspace entry, `cloudflare`, so the Worker's suite runs under root
      `npm test` like every other directory's. The two globs above are no longer the whole list.*
- [x] **T-0.2 (S)** Tooling copied from SRC and path-adapted: `.eslintrc.json`,
      `.prettierrc.json`, `.env.example`. → FM-ARC-5
      *Added `.prettierignore` (new): keeps the read-only SRC copy and the hand-wrapped
      `docs/` + `steering/` markdown out of `npm run format`.*
- [x] **T-0.3 (S)** CI: one GitHub Actions workflow — typecheck + lint + test. No deploy jobs. → FM-ARC-5
      *`master` → `main` is the only change from SRC's workflow.*
- [x] **Gate 0**: `npm install` clean; CI green on the empty skeleton.
      *Verified 2026-08-12: `npm ci` → 0 vulnerabilities; typecheck, lint, test, `prettier
      --check` all exit 0.*

**Toolchain deviations from SRC** (decided at Gate 0):

- **vitest `^1.6.0` → `^4.1.10`.** SRC's pin carries 4 advisories, one critical (Vitest UI
  arbitrary file read/execute). Migrating cost nothing with zero test files in the repo;
  deferring would have meant porting every copied SRC test twice. Audit is now clean.
- **vite** — SRC's client pins `^5.3.3`, inside the same vulnerable range. Bump when T-3.1
  bootstraps the client. ***Done at T-3.1: `^8.2.1`***, with `@vitejs/plugin-react ^6` and
  `vite-plugin-pwa ^1.3`. Audit clean.
- **ESLint stays at `^8.57.1`** (EOL, no advisories) because T-0.2's deliverable *is*
  `.eslintrc.json`, which ESLint 9 no longer reads. Tracked as OD-F8 in `requirements.md` §12.

## Phase 1 — packages/shared

- [x] **T-1.1 (S)** `languages.ts` copied verbatim from `SRC/shared/languages.ts` (15 languages,
      exhaustiveness sentinel). → D-2
      *Code body verified byte-identical to SRC; only comment path references adapted
      (`client/`→`apps/funny-multi-client/`, the dropped `filter/standins.ts` line replaced by
      `pools/text/<code>.ts`). Re-exported from the package barrel.*
- [x] **T-1.2 (M)** `rotation.ts`: extract `storyIndex` from `SRC/server/src/game.ts` **with
      `rotation.test.ts` written first** (≥ 5 known-value assertions + range guards; port SRC's
      cases). → FM-CORE-6, FM-ARC-2
      *Test written first and confirmed red (module unresolved) before `rotation.ts` existed.
      16 tests: SRC's 9 ported verbatim, plus N∈[3..7] bijection/coverage over the shipped room
      range, `[0,N)` range guard, N=1 modulo boundary, period-N periodicity, and NaN/Infinity/
      non-integer guards in every argument position. Function body verified byte-identical to
      SRC. Added `test`/`test:watch` scripts to `packages/shared`.*
- [x] **T-1.3 (M)** Pool schema (`pools/schema.ts`, slot config: visual 0/1/2/4 = 9–12,
      prose 3/5/6 = 20–30) + `pools.test.ts` validation suite per design §4.2 (coverage,
      uniqueness, ≤ 70 chars, promptEn rules, RU slot-1 «с/со» regex). Tests red until T-1.5. → FM-POOL-1/3/4
      *41 assertions; **7 red by design** (one per slot: "slot 0 (who) has 0 options; author
      9–12 of them"). `SLOTS` carries an id `prefix` per slot so a mis-filed option id fails
      T-1.4, and `AuthoredLanguage`/`AUTHORED_LANGUAGES` is the en+ru→15 switch that T-6.3
      flips. Empty scaffolds created for `options.ts` and `text/{en,ru,index}.ts` so typecheck
      and lint stay green while the suite is red — the red is on real assertions, not on
      unresolved imports.*
- [x] **T-1.4 (M)** Canonical option ids + English prompt fragments (`pools/options.ts`):
      author the full id set with `promptEn` for visual slots. Family-friendly, no real
      people/brands. → FM-POOL-1/6, FM-IMG-2
      *106 ids: 10 per visual slot (10⁴ = 10,000 picture prompts, inside the 6.5k–20k window
      design §4.3 sized the cache against; 10 > the 7-player max so same-slot auto-fill
      exclusion never runs dry) and 22 per prose slot. The id set is now **frozen** — T-6.3 can
      start. Slot 0 and slot 1 draw from disjoint kinds (leads vs. companions), so SRC's
      `looksLikeSameSubject` / "two of them" chimera anchor is unreachable by construction and
      T-4.2 need not port it. Slot-4 fragments are `are` + gerund to complete "They {4}"; every
      slot-2 fragment was read back after "in" and two were rephrased. Worst-case assembled
      prompt is 481 chars against SRC's 500 cap, so the builder cannot truncate — but only 19
      chars of headroom remain.*
- [x] **T-1.5 (L)** Hand-author **en** and **ru** display texts (`pools/text/en.ts`, `ru.ts`);
      RU pre-declined per slot case, composed against the RU prose template. Pool tests green
      for en+ru (other languages temporarily excluded from the coverage matrix). → FM-POOL-3/5
      *212 texts (106 ids × 2). Verified by rendering sample stories through SRC's actual
      `renderProse` + `polishRussianProse` — structure tests cannot tell whether prose reads,
      and this caught a class of bug they missed: the RU template joins slots 0–4 with bare
      spaces, so a text ending in an unclosed subordinate/participial phrase bleeds into the
      next slot. Four RU texts were rephrased («с роботом, говорящим загадками» → «с говорящим
      загадками роботом»). RU slot 4 is **plural past throughout** — the comitative «X с Y»
      agrees with a plural verb, which is gender-free; SRC's masculine-singular stand-ins
      silently misgendered every feminine slot-0 answer.*
      *Two authoring invariants added to `schema.ts` + `pools.test.ts` (43 tests now): EN
      slot-5 texts must open with a connective (`EN_WHY_CONNECTIVE`) or `renderProse` prepends
      a literal "for " and yields "for out of pure stubbornness" — the English counterpart of
      the documented RU «с/со» rule; and RU slot-6 texts must exceed `RU_ENDING_MIN_WORDS`, or
      `ruSlot6IsBareNoun` prepends «это закончилось». Both were relied on while authoring, so
      they are now enforced rather than remembered.*
      *Not fixed here — **EN prose opens lowercase** ("a grumpy pirate and …"), exactly as SRC
      shipped it: RU gets its capital from `polishRussianProse`, English has no equivalent
      pass. Texts are deliberately left caseless (capitalization is presentation, and each
      language puts a different slot first), so the fix belongs in T-2.3's prose assembly.*
- [x] **T-1.6 (M)** `events.ts` adapted per design §5: `optionId` submit, `PictureRef`,
      resolved-text reveal payloads, `INVALID_OPTION`, `wobbleEngine` removed. → FM-ANS-2, FM-IMG-3
      *All 28 types re-exported from the barrel (checked mechanically against the module's own
      declarations, not by eye). Verified with a throwaway compile-time contract file —
      `keyof`-based assertions that `pictureUrl`/`answer`/`wobbleEngine` are gone and
      `picture`/`optionId` present, plus a deliberate negative control to prove the assertions
      were not vacuously true — then deleted; the types are exercised for real by Phase 2/3.*
      *Two judgement calls beyond the design text: `GameStartPayload` held nothing but
      `wobbleEngine`, so rather than leave an empty interface it is dropped and `game:start`
      takes no payload (DD-9's "removing the field is the honest protocol", applied to the
      payload itself). And `Story.answers` is typed `(OptionId | null)[]` rather than
      `(string | null)[]` — same type, but it names which of the two meanings the field
      carries, since `RevealStartPayload.answers` and `GalleryEntry.answers` reuse the name for
      resolved display texts. That collision is required (the copied client screens highlight
      those strings inside the prose) and is flagged on all three types.*
      *`entitlementToken` / `room.premium` deliberately NOT added: design §10 puts them in
      T-9.3/T-9.4, and D-4 keeps premium risk in the final phase.*
- [x] **Gate 1**: `npm test -w packages/shared` green (rotation + pools en/ru + schema).
      *Passed 2026-08-12: 43 tests green (16 rotation + 27 pool), typecheck / lint / prettier
      clean. Phase 1 closed out with T-1.6 the same day; `packages/shared` is now feature
      complete for v1 apart from T-6.3's 13 remaining pool languages.*

## Phase 2 — Server core (no images yet)

- [x] **T-2.1 (S)** `apps/funny-multi-server` bootstrap from `SRC/server`: Fastify + Socket.IO,
      `/health`, CORS for dev, `env.ts` (minus dropped vars). **Do not copy** `filter/**`,
      `translate.ts`, stand-in arrays. → design §3
      *Four files: `env.ts`, `types.ts`, `index.ts`, `index.test.ts`. Verified beyond CI by
      booting the compiled `dist/index.js` and curling `/health` (200 + dev CORS header).*
      *`env.ts` path depth: SRC resolved `../../.env` from `server/dist/env.js`; this app sits
      one level deeper, so the repo root is `../../../.env`. `loadEnvFile`'s catch is silent, so
      a wrong depth degrades to unset config rather than an error — the path is therefore
      exported as `ENV_PATH` and asserted in a test, confirmed red by temporarily restoring
      SRC's depth before it was accepted as green.*
      *`buildServer()` split out of SRC's monolithic `main()` so the shell is testable without
      binding a port; `main()` is now a thin entry guarded by a `pathToFileURL` argv check
      (a `file://` template literal does not compose on Windows). T-2.2+ register their socket
      handlers inside `buildServer`.*
      ***`maxHttpBufferSize: 8e6` deliberately not carried.** SRC raised the 1 MB Socket.IO
      default because `gallery:ready` shipped every player's picture as base64. Pictures are now
      URLs (FM-IMG-3 / DD-5, the MUL-2 socket-size mandate), so a 7-player gallery is a few KB
      of text. Carrying the override would preserve a workaround for a problem the design
      removed — and would mask a regression if bytes ever crept back onto the socket.*
      *Also dropped: `POST /test/image` — a dev-only harness for the Test\* client screens
      design §3 drops, and its purpose was inspecting the translate stack DD-8 deletes
      (`translationFailed` does not exist in this codebase). `DISCONNECT_GRACE_MS` is left for
      T-2.4, since `noUnusedLocals` rejects it until the disconnect timers exist.*
      *Handlers absent by design, each tagged in the file with the task that owns it: T-2.2
      room:create/join/leave, T-2.3 game:start/round:submit/game:ready/restart/end, T-2.4
      disconnect rules, T-4.4 reveal picture requests, T-5.1 gallery:share, T-5.3 stats:get.*
      *Carry-over for T-2.3: SRC's `server/scripts/copy-i18n.mjs` post-build step is not ported
      yet — nothing needs it until the i18n JSON lands. Add it to `build` at T-2.3, or the
      compiled server will not find its prose templates at runtime.*
      *Carry-over for T-3.1: root `dev` and `build` scripts still reference
      `apps/funny-multi-client`, which does not exist — both fail until the client is
      bootstrapped. CI is unaffected (it runs typecheck/lint/test only), and
      `npm run build -w apps/funny-multi-server` works standalone.
      **Resolved by T-3.1** — root `npm run build` runs both workspaces.*

**Toolchain deviations from SRC** (decided at T-2.1), same rationale as Gate 0's vitest bump:

- **fastify `^4.28.1` → `^5.11.3`**, with `@fastify/cors` `^9` → `^11` and `@fastify/static`
  `^7` → `^10` (the majors are coupled). Fastify 4 left LTS in June 2025 and no longer gets
  security patches. The surface this repo touches is tiny — `Fastify()`, two `register`s,
  one `get`, `setNotFoundHandler`, `ready`, `listen` — and none of it changed across the major,
  so the migration cost was zero. Deferring would have meant migrating T-2.2/T-2.3/T-2.4 code
  as well. `npm audit` is clean at 0 vulnerabilities.
- **socket.io `^4.7.5` → `^4.8.3`** — in-major bump, no contract change.
- **`nanoid` not added yet.** SRC's server depends on it for room codes; that belongs to T-2.2,
  which should decide 5.x → 6.x (a major) at the point the dependency is actually used.
- `socket.io-client` is a **devDependency** here, used only to drive the transport smoke test.
- [x] **T-2.2 (M)** Rooms: copy `rooms.ts` (codes, rate limits 5/30 per IP/min, MAX_ROOMS,
      nickname 3–20) + lobby events wiring in `index.ts`. → FM-CORE-1/4
      ***The rate limiter is not a copy — SRC never implemented it.*** Spec §17 mandates
      5 `room:create` / 30 `room:join` per IP per minute, `RATE_LIMITED` ships in SRC's error
      union, and all 15 SRC client catalogs carry a translated `errors.RATE_LIMITED` string —
      but nothing in `SRC/server` reads `x-forwarded-for` or tracks a bucket, so `RATE_LIMITED`
      is a code the SRC server can never emit. SRC's own `DEPLOYMENT.md` nevertheless tells
      operators "the rate limiter reads `x-forwarded-for`", which is what makes the gap easy to
      miss. Written here from the spec as `rateLimit.ts`, with 15 tests of its own.*
      *Token bucket with **continuous** refill rather than a fixed window: a fixed window lets a
      caller spend the full budget at 0:59 and again at 1:01, i.e. 2× the intended rate across
      the boundary. There is a test for exactly that. Buckets are per server instance (not
      module scope) so each `buildServer()` in a test gets a clean limiter, swept on an
      `unref`'d interval and stopped on Fastify's `onClose`.*
      ***Open item — `x-forwarded-for` is client-settable.** Taking the first hop (as spec §17
      directs) means a caller who sends their own `X-Forwarded-For` chooses their own bucket key
      and can rotate it to evade the limit. The spec'd behavior ships rather than a silent
      divergence, but the real fix is a configurable trusted-hop count; raised against **T-8.1**,
      where deploy/proxy config is settled.*
      *`rooms.ts` itself is near-verbatim: only `shared` → `@funny/shared` and the removal of
      `wobbleEngine` from `createRoom`'s signature and the `Room` it builds (DD-9 — a server
      still setting it would not typecheck). Added `__resetRoomsForTest()`, since the store is a
      module-level singleton and suites that create rooms must reset between cases.*
      *SRC shipped `rooms.ts` with no dedicated suite (coverage came incidentally via
      `game.test.ts`), so `rooms.test.ts` is new: 25 tests pinning the unambiguous code alphabet,
      code uniqueness over 300 rooms, the `MAX_ROOMS` ceiling incl. nonsense values, nickname
      bounds either side of 3/20, and the lobby-splice vs. in-game-botify split that rotation
      integrity depends on.*
      ***Divergence from the literal spec text, deliberate:** §17 says a rate-limit hit should
      "emit `error`". That is right for `room:create` (whose ack has no error branch) but wrong
      for `room:join` — the copied SRC `HomeScreen` join path only ever inspects `ack.error`, so
      an emitted `error` would leave its busy spinner stuck forever. Each event keeps its own SRC
      error convention; only the transport differs, and both carry the spec's code.*
      *Not wired here: `broadcastStats(io)`, which SRC calls after create/leave. It belongs to
      T-5.3 with the rest of `stats.ts`.*
      *`nanoid` pinned to **`^5.1.16`, not 6.x** — nanoid 6 declares
      `engines.node: ^22 || ^24 || >=26`, and this repo targets Node >= 20 with CI on Node 20.
      Revisit only if the project's Node floor moves.*
- [x] **T-2.3 (L)** Round flow in `game.ts`: rotation from shared; `submitAnswer` validates
      `optionId` (reject `INVALID_OPTION`, no submitted mark); bot/timeout auto-fill = random
      pool pick with same-slot exclusion; 60 s timer; waiting broadcast; reveal entry resolving
      ids → room-language texts; RU `grammar.ts` polish copied. → FM-CORE-5..8, FM-BOT-1/2, FM-ANS-2/4/5
      *Carry-over from T-1.5 **now closed**: `polishProse(language, prose)` gives every language
      the opening capital, terminal period and space collapse that only RU had; RU still routes
      through the verbatim-copied `polishRussianProse` for its clause commas. EN prose now reads
      "A grumpy pirate and a haunted toaster were …" — verified against a real assembled story,
      not just asserted.*
      *`INVALID_OPTION` rejects out-of-pool ids, valid-but-wrong-slot ids (the subtle tampering
      case: a real id submitted in the wrong round), and non-strings — in every case with **no
      submitted mark**, so a crafted payload cannot skip a slot and leave a hole in someone's
      story; the player is auto-filled at the deadline like any silent one.*
      *Auto-fill excludes ids already used at this slot in this room this round. The exclusion
      cannot run dry — smallest pool is 10 against a 7-player max (T-1.4 sized it that way) — and
      falls back to plain uniform if a future pool edit breaks that. A 7-bot room is asserted to
      produce 7 distinct options at every one of the 7 slots.*
      ***SRC's three render-time repair transforms dropped**, not carried: the EN slot-5 "for "
      prefix, the RU slot-1 «и » prefix, the RU slot-6 «это закончилось» prefix. Each repaired
      free-typed input that no longer exists; T-1.5 authored the texts to compose directly, and
      `pools.test.ts` enforces those rules. `game.test.ts` re-derives SRC's own predicates and
      asserts no shipped text triggers one, so this is checked, not assumed.*
      ***Room language gated to `AUTHORED_LANGUAGES` (en, ru)** — a correctness fix on T-2.2's
      `isValidLanguage`, which accepted all 15. `de` is a real registry entry, so a room could
      be created in it, play seven full rounds, and throw at reveal with the whole story already
      written. Rejecting at creation is the honest failure. `isValidLanguage`, the i18n boot
      check and `POOL_TEXTS` all key off the same union so Phase 6 widens them together;
      `rooms.test.ts` pins the current behavior with a note to flip it at T-6.3.*
      *Per-language `imagePrompt` dropped from the i18n JSON (DD-4 — one English skeleton for all
      15 lives in `prompt.ts` at T-4.2). `copy-i18n.mjs` ported from SRC and wired into `build`;
      verified the hard way by deleting the copied JSON from `dist/` and confirming the boot
      check throws `[i18n] Missing …` at startup rather than 500-ing mid-game.*
      *32 game tests: rotation placement against `storyIndex` at 3 and 7 players, full simulated
      games at both sizes, per-player-distinct reveals, no reveal to bot slots, timer-expiry
      auto-fill under fake timers, en+ru prose snapshots, and a check that every resolved answer
      survives the polish pass verbatim (case-insensitively) — the client highlights answers by
      matching them inside the prose, so a stray inserted comma would orphan a highlight.*
      *`game:start` no longer re-broadcasts the lobby: SRC did that solely to push the
      hard-locked `wobbleEngine`, which DD-9 removed.*
- [x] **T-2.4 (M)** Disconnect rules per SRC `index.ts`: grace window, lobby leave, mid-game
      botification (auto-fill current round), host migration, `player:lost`. → FM-CORE-3
      *`disconnect.ts` is **new** — SRC kept its pending-removal timers in a bare Map inline in
      `main()`. Extracted to a factory (the `rateLimit.ts` shape) for two reasons SRC did not
      have: a server that shuts down needs `clearAll()` on Fastify's `onClose`, or a pending
      65 s window fires against a room store the next test has already reset and emits on a
      closed io; and the 65 s window itself is only checkable on fake timers, which cannot be
      used in a socket test without also freezing Socket.IO's heartbeats.*
      *`buildServer` gained `disconnectGraceMs`. Production never passes it — being longer than
      the recovery window is the point — but without the seam no test can watch a window close.*
      ***Divergence from SRC: `room:leave` now shares the removal path.*** SRC called
      `removePlayer` directly there, so a player who quit mid-game was botified but their current
      round was never auto-filled — the rest of the room then waited out the full 60 s round
      timer for an answer that could not arrive. Not a hang (the timer rescues it), but a minute
      of dead air with an obvious cause. Deliberate leave and elapsed window reach the same end
      state, so they share the handling; only the delay differs.*
      *18 new tests. `disconnect.test.ts` (7) pins the timing on fake timers: survival right up
      to the deadline, cancel-on-return, no double-fire when a flapping socket re-arms, and
      `cancel` refusing to claim a removal that already ran. `disconnect.socket.test.ts` (11)
      drives real sockets: slot held until the window closes, **connection-state recovery
      restoring the slot with the same socket id**, host migration in both lobby and mid-game,
      botification auto-filling and advancing the round, `player:lost` reaching the promoted host
      when the host is the one lost, all-bot room deletion, and no `player:lost` for a lobby
      departure.*
      *Negative-controlled three ways, each confirmed red before restoring: dropping the
      recovery `cancel` (pending stayed 1), removing `handleMidGameBotification` (both auto-fill
      tests timed out — the round genuinely stalls), and removing the grace window entirely
      (slot-held and recovery tests both failed).*
      *Carry-overs, deferred to the tasks that own them: `finalizePlayerRemoval` should also
      re-broadcast stats (T-5.3) and, when the drop lands in the reveal phase, kick off bot-story
      pictures (T-4.4) — SRC does both here.*
- [x] **T-2.5 (M)** Adapt SRC `game.test.ts` + i18n coverage tests: option-id fixtures; full
      simulated 3- and 7-player games; INVALID_OPTION case; en+ru prose snapshots. → design §13
      *Mostly landed early: T-2.3 shipped `game.test.ts` (32 tests — option-id fixtures, full
      in-process 3- and 7-player games, INVALID_OPTION, en+ru prose snapshots) and
      `game.socket.test.ts` (11 tests — the same games over real sockets, closing Gate 2; see
      the gate note below), and T-2.4 shipped `disconnect.socket.test.ts` (11) for the
      disconnect/botification scenarios. This task closed the remainder:*
      ***`src/i18n/index.test.ts` (22 tests) — written, not adapted.** Every case in SRC's
      `i18n/index.test.ts` exercises one of the three render-time repair transforms, and all
      three are deliberately gone (T-2.3; see design §9). Adapting the file would have meant
      re-adding the code to keep its tests. `game.test.ts` already covers the **pool** side of
      that removal — no shipped text would trigger a repair; this covers the **module** side:
      loader coverage (questions + prose + `POOL_TEXTS` keyed by exactly `AUTHORED_LANGUAGES`,
      so a stray half-translated JSON cannot become renderable), 7 non-blank non-duplicate
      questions per language, every `{0}`–`{6}` present exactly once per template (a missing
      slot silently discards an answer), verbatim substitution including the RU reordering,
      no re-substitution of a brace inside an answer, blank-not-`undefined` for a short answers
      array, and `requireAuthoredLanguage` rejecting a registered-but-unauthored `fr`.
      Negative-controlled four ways, each confirmed red: an off-by-one slot index (8 failures),
      re-adding SRC's slot-5 "for " repair (3), dropping `{5}` from the RU template (3), and
      removing the `isAuthored` guard (3).*
      ***Fixed a real flake found while verifying, not introduced by it.*** *`game.socket.test.ts`'s
      restart case failed ~50% of runs. `playFullGame` attached a `round:start` auto-answer
      listener per client and never detached it, so after `game:restart` all three clients raced
      to answer round 0 of the second game while the test was still asserting the board was
      empty. Extracted `attachAutoPlay`, which returns a detach function; the restart case now
      detaches, asserts the reset deterministically, then re-attaches and plays the second game
      through to a reveal — which is what its name claimed all along and it never actually did.*
      ***Added `apps/funny-multi-server/vitest.config.ts`*** *(`testTimeout`/`hookTimeout` 20 s).
      Four suites here each run a real Fastify + Socket.IO server, and vitest fans test files
      out across all cores — vitest's default 5 s ceiling tripped on merely-slow runs under that
      load, in two different files. Nothing here should take seconds, so a genuine hang still
      fails; only the load-sensitivity is gone. Verified with 6 consecutive full-suite runs.*
- **Gate 2**: server tests green; **full 7-round game over real Socket.IO connections**, correct
  story assembly verified (rotation placement). Runs in CI on every build.
  ***Resolved 2026-08-13 — the manual 3-tab run is replaced by an automated one.*** The gate as
  written depended on a "test client" that no task created, and Phase 3 is where a real UI first
  exists. Rather than write a throwaway stub that would be run once and rot,
  `game.socket.test.ts` drives real clients through a real Fastify + Socket.IO server: create,
  join, start, seven rounds of `round:submit`, reveal — asserting both what each client received
  and what the server stored. That covers what the manual run was for (an answer landing in the
  wrong player's story, a broadcast reaching the wrong room, a reveal going to the wrong socket)
  and now regression-guards it forever. Genuinely visual checks — combobox layout, timer-bar
  animation — were always Gate 3's job and stay there.*
  *This immediately paid for itself: the first run failed because the fixtures used the nickname
  `'p0'`, which is 2 characters against a 3-character minimum. `game.test.ts` never caught it
  because it calls `createRoom` directly and bypasses `validateNickname` — exactly the class of
  gap that only appears on the wire.*

## Phase 3 — Client core

- [x] **T-3.1 (M)** `apps/funny-multi-client` bootstrap from `SRC/client`: Vite/Tailwind/PWA
      config, `App.tsx` phase routing, `socket.ts`, styles, art components, en+ru UI catalogs
      (full 15 wired in Phase 6). **Do not copy** `recordWobbleLottie.ts`, Test* screens. → design §3
      *Copied as-is: the 9 `components/art/*` mascots, `styles/{index.css,motion.ts}`,
      `swReload.ts`, `version.ts`, `socket.ts` (package name only), `public/flags/*.png`,
      `tailwind.config.js`, `postcss.config.js`, `tsconfig.json`.*
      ***`App.tsx` — one change:*** *`wobbleEngine` is gone from `LobbyState` and the
      `lobby:update` handler. T-2.1 removed it from the socket contract (ARC-3/DD-9, single CSS
      recorder), so carrying it would store a value the server never sends. The phase machine,
      the subscription set, the §17 forward slide-fade and both overlays are carried verbatim.*
      ***`main.tsx`:*** *SRC branched on a `?test=` parameter to mount one of five dev-only
      harness screens; design §3 drops those, and the branch with them.*
      ***`i18n/index.ts`:*** *carried, except the boot completeness check is keyed to
      `AUTHORED_LANGUAGES` rather than all 15 `LANGUAGES` — the same en+ru→15 switch the
      server's i18n loader and `POOL_TEXTS` use, so T-6.2 widens all three at once.*
      ***Catalogues (`en.json`, `ru.json`) are adapted, not copied.*** *Identity is Funny Multi /
      «Чепуха 37» (FM-ID-1); the rules text says players *pick* rather than write; `round.placeholder`
      ("Type your answer…") is gone and the combobox keys T-3.3 needs are in
      (`round.pick/optionsLabel/scrollHint/submitDisabled`); `errors.INVALID_OPTION` added.*
      ***Screen scaffolds.*** *A phase router needs six destinations, but the screens land across
      five later tasks. Each screen file renders `PlaceholderScreen` — its phase, the task that
      replaces it, and the live state App routed in, so the wiring is provably working and
      nothing reads as finished. All six are replaced wholesale, not extended.*
      ***`public/icon.svg` is a placeholder*** *— SRC shipped a 192/512 PNG pair of its own
      branding, which is the wrong product's identity to carry. Stands in because the PWA
      manifest needs a valid icon to install at all; **replacing it is T-7.1's**, which owns
      icons and the real-device install test.*
      ***Not carried yet, by task boundary:*** *`components/**` beyond `art/` (TimerBar,
      PlayerList, QRCode, ProseText, ScrollBox…) arrive with the screens that use them, as do
      `prose.ts`, `share.ts`, `downloadStory.ts`, `recordWobble.ts`, `capReset.ts`,
      `videoFooter.ts` (T-3.2→T-5.2), along with their dependencies (`qrcode`, `qrcode.react`).*
      ***Tests:*** *`src/i18n/catalogs.test.ts` (7) — the one part of a bootstrap that can break
      silently, since i18next falls back to English without complaint. Key-set parity between
      catalogues, no blanks, matching `{{interpolations}}`, 7 questions each, and a
      `Record<ErrorCode, true>` that makes a missing error translation a **typecheck** failure
      rather than a runtime fallback. Negative-controlled five ways, each confirmed red: a
      dropped key, a drifted interpolation, a missing `INVALID_OPTION` in the catalogue, a
      returning `round.placeholder`, and a missing `INVALID_OPTION` in the record (`error TS2741`).*
      ***Verified:*** *`npm run build` at root (both workspaces) and a real dev server serving
      `index.html`, `main.tsx`, the catalogues and `icon.svg`; `vite preview` serving the built
      bundle with the generated manifest and precache (37 entries).*
- [x] **T-3.2 (S)** Home + Lobby screens copied (create/join modes, `?room=` link, QR,
      player list, start). Remove wobble-engine toggle. → FM-CORE-1
      *Components carried alongside them, all verbatim: `QRCode`, `ScrollBox`, `SourceFooter`,
      `PlayerList` (package name only) and `capReset.ts`. `qrcode.react` is the one new runtime
      dependency; `qrcode` + `@types/qrcode` are **not** installed — SRC needed them for the
      canvas share card, which is T-5.2's.*
      ***The create-mode language picker is gated to `AUTHORED_LANGUAGES` — the reason design §3
      calls these screens a copy and they are not.*** *That picker sets the room's **content**
      language, and T-2.3 narrowed the server's `isValidLanguage` to en+ru so a room cannot be
      created in a language whose pools would throw at reveal. SRC offered all 15 here, so a host
      picking German would have failed the create with no way to understand why. The join-mode
      picker is deliberately untouched at all 15: it switches the **interface** only, where
      i18next falling back to English is correct behaviour. Both lists derive from the same
      `LANGUAGES` registry, so T-6.3 widens `AUTHORED_LANGUAGES` once and the picker follows.*
      *Cross-checked against the real server rather than against a reading of it: a throwaway
      script drove `room:create` for all 15 registry languages over real sockets (a fresh
      `buildServer()` each, since 15 creates blow the 5-per-minute bucket) — accepted `en, ru`,
      rejected the other 13, exactly the set the picker offers.*
      ***Found by that cross-check and fixed here — a latched Create button.*** *An unacceptable
      `room:create` **never acks**: its ack type has no error branch, so the server reports the
      failure by emitting `error` (T-2.2's rate limiter does the same). Both screens set `busy`
      before the emit and clear it only inside the ack, so a host who taps Create past the
      5-per-minute budget — or who shares an IP behind CGNAT with someone who has — got App's
      error toast and a permanently dead button, with a reload as the only escape. Now both
      screens release `busy` on `error`; the toast is left to App rather than shown twice. The
      language gating makes the invalid-language route unreachable, but the rate-limit route is
      reachable by an ordinary impatient player.*
      *Other adaptations, each forced by an earlier decision: `game:start` is emitted with no
      arguments at all (T-1.6 dropped the payload type with its only field); `wobbleEngine` is
      gone from both `LobbyState` constructions; `LANGUAGES`/`isLanguage` come from
      `@funny/shared`, as T-3.1 carried no client-local registry.*
      ***The stats block and the lobby's cap banner are carried but inert.*** *`stats:get` has no
      server handler until T-5.3, and an unanswered Socket.IO ack simply never fires — so `stats`
      stays null, `isCapReached(null)` is false, and neither renders. That degrades correctly,
      but it is copied code that does nothing today; both are pinned by tests asserting the
      current behaviour **and** the behaviour once a payload arrives, so T-5.3 has something to
      flip rather than something to discover.*
      ***Dropped SRC's `eslint-disable-next-line react-hooks/exhaustive-deps` in `ScrollBox`.***
      *This repo does not configure that plugin — and neither did SRC's own `.eslintrc.json` —
      so the directive was an unknown-rule lint **error**, suppressing nothing. Replaced by a
      comment saying why the dependency array is empty.*
      ***Client DOM test environment is new (the decision T-3.1 left open).*** *`jsdom`,
      `@testing-library/react` + `@testing-library/dom`, and `vitest.config.ts` — deliberately
      separate from `vite.config.ts` so a test run does not build a service worker, and carrying
      the same `__APP_VERSION__`/`__BUILD_DATE__` `define`s, without which anything importing
      `SourceFooter` throws at import time (which is how it was found). `src/testSetup.ts` stubs
      the two things jsdom lacks that shipped code reaches — `ResizeObserver` and `matchMedia` —
      and runs Testing Library's `cleanup`, which does not self-register without `globals: true`.
      Taken here rather than at T-3.3 because T-3.3 is the largest task in the phase and Gate 3's
      "no free-text affordance anywhere" is an assertion about a rendered screen.*
      ***42 new tests*** *(client total 7 → 49). Assertions read rendered text, not translation
      keys, so a screen naming a key that does not exist renders the bare key and fails —
      `catalogs.test.ts` checks en and ru agree with each other, this checks the screens agree
      with the catalogue. Negative-controlled six ways, each confirmed red before restoring:
      reverting the picker to all 15 `LANGUAGES` (2 failures), restoring SRC's `game:start`
      payload (1), restoring `wobbleEngine` on the created `LobbyState` (1), dropping the
      `stats:update` subscription (1), and removing the busy-release (2).*
      ***Two test-isolation traps, both caught by a failing run rather than by inspection.***
      *i18next's active language is module-global and outlives unmount, so the tests that pick
      Russian left six later tests asserting English strings against a Russian screen; the suite
      now resets it per test, and the two Russian tests assert the Russian labels, which is the
      host's language-preview behaviour made explicit. And a socket callback is a React state
      update arriving from outside React: without an `act` wrap the re-render had not flushed by
      the next assertion, which silently turned every "…is not shown" assertion into a vacuous
      pass. The wrap lives in `testutils/socketMock.ts` so no suite can forget it — removing it
      again reds 6 tests.*
      ***Verified beyond CI:*** *root `npm run build` (both workspaces, 37 precache entries) and
      the live-server language cross-check above.*
- [x] **T-3.3 (L)** **RoundScreen combobox** per design §8.1: tap-card radio list from shared
      pools (room language), per-player-per-round shuffle, selection spring highlight, Submit
      gated on selection, SubmitConfirm overlay, question gloss kept, ScrollBox for 20–30-option
      slots. → FM-ANS-1/3/4, FM-CORE-8
      *The one screen in the client that is **authored, not copied** — SRC's is a textarea, a
      character counter and a non-empty check. Everything design §8.1 asks for landed:
      `role="radiogroup"` over `<button role="radio">` cards (which keeps Space/Enter activation
      native), arrow-key navigation with wrap plus Home/End, roving tabindex so the whole list is
      one tab stop, the `snappy` selection spring, Submit gated on a selection with
      `round.submitDisabled` as its title, the SubmitConfirm overlay, the joiner-only question
      gloss and story-language reminder, and `ScrollBox` + `round.scrollHint` for the three
      20–30-option prose slots (the visual slots' 9–12 sit in page flow).*
      ***Options are rendered locally, never received*** *(DD-2): `round:start` carries only the
      round number, question and deadline, so the screen reads `POOLS[slot]` and
      `POOL_TEXTS[roomLanguage]` from the same `@funny/shared` build the server uses. One round
      per slot, so the round number **is** the slot index — the client's `slot` and the server's
      `slotOf` are the same statement made twice, and a test asserts each round renders exactly
      its own pool.*
      ***Shuffle is deliberately unseeded.*** *FM-ANS-3 wants the order to differ per player per
      round; any shared seed — room code, round number — would give everyone in the room the same
      order and defeat it. Fisher-Yates over `Math.random`, held in a `useMemo` keyed on the slot
      so it is stable for every re-render **within** a round: reshuffling on render would move
      the list under the player's finger on each selection, which is a way to commit an answer
      you cannot take back.*
      ***`LobbyState.language` narrowed from `Language` to `AuthoredLanguage`*** *(App.tsx), with
      the narrowing done where the value enters the client — HomeScreen's join ack. `POOL_TEXTS`
      is keyed by `AuthoredLanguage`, and the server already refuses to create a room in any
      other (T-2.3), so the wide type was a fact the code knew and the types did not; stating it
      once makes it compile-time for every screen instead of a cast in each. The unreachable
      branch is handled rather than asserted away: a room language this build cannot render is
      refused with a new `home.unsupportedLanguage` string, reachable only if a newer server
      meets an older client mid-rollout. (Not an `errors.*` key — that record is pinned
      exhaustively to the `ErrorCode` union by `catalogs.test.ts`.)*
      ***`TimerBar` carried here, not at T-3.4*** *which lists it: this screen is what puts a 60 s
      deadline on screen, and WaitingScreen has no timer of its own.*
      ***35 new tests*** *(client 49 → 84), negative-controlled **eleven** ways. The two Gate 3
      clauses that are properties of a rendered screen are now permanent guards: **no free-text
      affordance** is asserted per round across all seven slots — no `input`, `textarea`,
      `[contenteditable]` or `[placeholder]`, and no searchbox/textbox/combobox role, since a
      filter field is a text field by the back door — and **shuffle differs between players**
      compares two seeded renders and additionally asserts the second is a permutation of the
      first, so a truncated list cannot pass as a shuffled one.*
      ***One control failed to go red, and the test was wrong rather than the code.*** *Deleting
      the `submitted` early-return inside `submit()` changed nothing: the button is already
      disabled by then, so that guard never runs, and a test named "cannot be submitted twice"
      was really testing the `disabled` attribute. Renamed to say so, with the redundancy
      recorded in both the test and the component rather than left as a claim the suite did not
      support. The guard stays — the action is irreversible — but it is explicitly not counted
      as covered.*
- [x] **T-3.4 (S)** WaitingScreen copy; timer bar; forward-only screen transitions per SRC §17. → FM-ARC-4
      *Scope was already reduced on arrival: `TimerBar` landed at T-3.3 (RoundScreen owns the 60 s
      deadline) and App.tsx's slide-fade was carried at T-3.1, leaving the WaitingScreen copy and
      a pass over the transitions now that there is something real to transition between.*
      *`WaitingScreen` is a straight copy; the only change is dropping SRC's local `WaitingData`
      interface for the `RoundWaitingPayload` already on the socket contract. No timer on it, and
      a test says so: once you have submitted, a countdown only tells you how long you may be
      stuck watching a mascot.*
      ***The §17 transition moved into `styles/motion.ts` as `screenSlide`.*** *It was four inline
      literals in App.tsx. The §17 lock is that direction never varies — a screen enters from the
      left whether the phase machine went forwards or backwards — and a directional slide is the
      obvious later "improvement" that no screenshot would catch. Naming the constant lets a test
      hold it.*
      ***`App.tsx` had no tests at all until now*** *— every screen suite renders its screen
      directly, so nothing checked that a `round:start` actually reaches RoundScreen, or that the
      phase machine hands each screen the state it needs. Phase 3 is the point where all six
      destinations exist and that becomes checkable. 24 tests: routing for all six phases,
      `lobby:update` applying a host migration (the client loses Start), the error toast
      translating by code and auto-clearing, the host's player-lost notice, and listener
      detachment on unmount.*
      ***The transition tests are behavioural, not a restatement of the constant.*** *framer-motion
      writes real inline transforms under jsdom, so "enters from the left" is observable as
      `translateX(-100%)` on the incoming screen — asserted for a forward move (home→lobby) and,
      the part that matters, for a backward one (lobby→home via Leave). Both screens being in the
      tree mid-transition is asserted too, which is what `mode="wait"`'s absence buys.*
      ***Two jsdom facts had to be handled rather than worked around.*** *framer-motion drives its
      springs off `requestAnimationFrame`, which never advances by itself under jsdom — so exit
      animations never complete, the outgoing screen stays mounted forever, and returning to a
      phase reuses the stale element instead of remounting. Faking timers fixes it, but only if
      faked **once for the file**: framer-motion resolves its frame loop the first time it
      schedules and keeps it, so a per-test `useFakeTimers`/`useRealTimers` swap leaves it driving
      a dead clock. Both cost a debugging round and are recorded in the suite so the next one is
      cheaper.*
      ***Negative-controlled seven ways.*** *Six went red as expected: `mode="wait"` added (10
      failures), a genuinely directional `initial` (the backward test — and note that flipping
      only `exit` reds just the declarative check, which is why both kinds are there), an
      undetached listener, a hard-coded WaitingScreen total, and removing either the phase switch
      or the round payload from `onRoundStart`.*
      ***The seventh found an overstated assertion, as at T-3.3.*** *Deleting `setWaiting(null)`
      from `onRoundStart` reds nothing: App only renders WaitingScreen while the phase **is**
      `waiting`, so a stale count cannot surface. The line is hygiene, not behaviour; the test now
      says so instead of implying it covers it.*
- **Gate 3**: two phones (or tabs) create/join/play 7 rounds end-to-end with real UI;
  no free-text affordance anywhere; shuffle differs between players.
  ***Two of the three clauses are now automated (done at T-3.3), leaving one genuinely manual
  run.*** *`RoundScreen.test.tsx` asserts **no free-text affordance** per round across all seven
  slots — no `input`, `textarea`, `[contenteditable]`, `[placeholder]`, and no
  searchbox/textbox/combobox role — and **shuffle differs between players** by comparing two
  seeded renders and checking the second is a permutation of the first. T-3.4 added the phase
  machine itself: `App.test.tsx` drives home→lobby→writing→waiting→reveal→end over the socket
  double, so "create/join/play through the phases" is covered in CI too.*
  ***Three things the setup turned up*** *(2026-08-13, while preparing the run). The gate says
  "two phones (or tabs)", but `game:start` rejects a room under three players (spec §4, enforced
  since T-2.2) — so the run needs a third client; two phones plus a laptop tab, which also gives
  somewhere to watch the log. It must be the **production** build (`npm run build` then
  `NODE_ENV=production npm start`), not `npm run dev`: in dev the client hard-codes
  `http://localhost:3000` for the socket, which on a phone means the phone itself. Production
  serves both from one origin, so the QR's `window.location.origin` is the LAN address and join
  by scan works. And the **service worker will not register over LAN HTTP** — a bare IP is not a
  secure context — so this pass covers app-shell layout and scrolling in the mobile browser,
  while the installed-standalone check stays with T-7.1, which already carries a real-device
  install test.*
  ***Resolved 2026-08-15 — the manual run is done.*** *Two phones plus a laptop tab (the required
  third client), one Wi-Fi, production build, LAN address. Multiple full 7-round games played end
  to end across several room codes — host on the laptop tab, guests joining both phones. One early
  run produced a picture on the laptop but not on either phone; server logs showed no app-level
  errors, only real Wi-Fi disconnects, so flaky LAN wireless is the leading explanation rather than
  a code fault. A fresh room afterward, and every run since, generated and displayed pictures
  correctly on all three devices. The device-only visual checklist (tap-target size, selection
  spring, timer-bar colour turns/panic, PWA-shell scrolling, forward slide-fade direction) came
  back clean. Separately, after roughly an hour idle, one tab's socket outlived the 60 s
  `connectionStateRecovery` window and stopped reflecting new joins until reloaded — the client has
  no resync-on-reconnect logic; reload-and-rejoin is the workaround. Worth a follow-up task, not a
  gate blocker.*

**Toolchain deviations from SRC** (decided at T-3.1), same policy as Gate 0 — carry SRC's pins
unless they carry advisories:

- **vite `^5.3.3` → `^8.2.1`**, with `@vitejs/plugin-react ^4` → `^6` and `vite-plugin-pwa
  `^0.20` → `^1.3`. This is the bump Gate 0 deferred to this task.
- **Tailwind stays at `^3.4`.** v4 moves configuration into CSS; taking it would mean rewriting
  the copied design system as part of a bootstrap task, and v3.4 carries no advisories — so
  nothing forces the move. Revisit when the design system is next touched for its own reasons.
- **React stays at `^18.3.1`** with `framer-motion ^11`, `i18next ^23`, `react-i18next ^14` —
  SRC's pins, no advisories. Every screen in Phases 3–5 is a copy or an adaptation of an SRC
  screen written against these; moving to React 19 mid-copy would mix two kinds of change in
  the same diff. `npm audit` is clean at these versions.
- **`lottie-web` and `nanoid` are not installed at all** — the Lottie recorder is dropped
  (ARC-3) and nothing on the client generates ids.
- **Added at T-3.2:** `qrcode.react ^3.2` (runtime — SRC's pin, no advisories) and, as
  devDependencies, `jsdom ^28` + `@testing-library/react ^16` + `@testing-library/dom ^10` for
  the DOM test environment. SRC had no client tests at all, so these are additions rather than
  carried pins. `qrcode` and `@types/qrcode` stay uninstalled until T-5.2 needs the canvas share
  card. `npm audit` is clean at 0 vulnerabilities.

## Phase 4 — Image pipeline

- [x] **T-4.1 (M)** Worker rewrite per design §7.2: sha256 → R2 head → hit `{url,w,h,cached:true}` /
      miss → Flux 4 steps → R2 put → KV bump → `{…,cached:false}`; `GET /i/<hash>.png` route
      (immutable cache, CORS); `GET /exists`; `/stats` kept; wrangler.toml with R2 + KV
      bindings. → FM-IMG-3
      *A rewrite, not an adaptation: only the secret gate, `/stats` and the best-effort KV bump
      survive as SRC wrote them. SRC's Worker generated on every call and streamed bytes back for
      the server to re-broadcast as base64; this one owns a content-addressed cache and returns a
      URL (DD-5), which inverts the whole generate path and brings failure modes SRC could not
      have — a key that shifts between deploys orphans every image ever generated, and a hit
      reported as a miss spends a daily cap slot that was never needed (§7.3).*
      ***Three divergences from design §7.2, all recorded there.*** *(1) **Dimensions are parsed
      from the bytes** (PNG `IHDR` / JPEG `SOF`) rather than echoed from request parameters —
      Flux Schnell accepts `prompt` and `steps` and nothing else, so there were no parameters to
      echo and the design's "fixed 1024×768" would have been an unverifiable constant. It matters
      because RevealScreen reserves layout space from these numbers (T-4.4): a wrong constant is a
      visible jump on every phone, and it would go wrong silently the day the model's output size
      changes. Parsed dimensions go into R2 `customMetadata` so a cache hit reports what the fresh
      generation did; 1024×768 survives only as the fallback for unreadable headers. (2) The
      stored `contentType` is **sniffed**, because Flux Schnell returns base64 JPEG — SRC labelled
      it `image/jpeg` too — so the design's `contentType: image/png` was a lie browsers happen to
      tolerate. The `.png` in the key and route stays: it is cosmetic, and §8.3's download
      re-encodes through a canvas anyway. (3) SRC's **raw-stream fallback for pre-Flux models is
      dropped** — a stream cannot be sniffed for type or size before it is stored, and this Worker
      has to store it; the model is pinned in the same file, so an unexpected shape is a 502
      rather than a mis-typed cache entry.*
      ***`cloudflare/` is now an npm workspace***, *which SRC's copy explicitly was not. SRC had
      nothing to test there; this Worker holds the cache, and root `npm test` is how every other
      directory's suite reaches CI — a second mechanism for one directory would be worse than the
      third workspace entry. It declares no dependencies, so `wrangler deploy` still bundles
      `worker.js` alone.*
      ***39 tests, negative-controlled thirteen ways, all thirteen red.*** *No miniflare: the
      Worker's entire environment is three bindings, so fakes for `AI`, `IMAGES` and `STATS_KV`
      are the whole harness, and each records what the real binding would have been asked. The
      controls that matter are the ones guarding invisible failures — `SHA-256`→`SHA-1` (8 red),
      `cached:true`→`false` on the hit path (6 red), a counter that bumps on a hit, `steps` 4→8,
      a swallowed R2 `put` failure, and the secret gate disabled (5 red).*
      *Also decided here: R2's binding ships **uncommented** in `wrangler.toml`, unlike the KV
      block SRC had to comment out. A KV `id` belongs to the account that created it, so a
      hard-coded one breaks anyone else's `wrangler deploy`; a bucket **name** is just a string in
      whichever account runs the deploy, and the cache is not optional the way the stats counter
      is. `wrangler r2 bucket create funny-multi-images` is the one-time step, documented in the
      file.*
      *Two smaller calls, both with the reasoning in the code: the public `/i/` route rejects
      anything not matching `^i/[0-9a-f]{64}\.png$` without asking R2, which states the URL
      contract in one place; and there is deliberately **no `OPTIONS` handler**, because every
      request we make for these URLs is a plain `GET` with no custom headers and is therefore
      never preflighted. Add one the day a request here carries a header.*
      ***Verified for real, 2026-08-14.*** *Deployed to `funny-multi-image.oursharedcode.workers.dev`
      (R2 bucket `funny-multi-images` created, `WORKER_SECRET` set). All three fakes' contracts
      held: `/exists` correctly reported a miss then a hit, `/generate` returned real Flux Schnell
      output at 1024×1024 (not the documented 1024×768 fallback — dimension-from-bytes parsing is
      what caught that, exactly as designed), and a repeated `/generate` call on an already-cached
      prompt returned in 312 ms with `cached:true` and the identical URL — no second AI call. One
      config bug found and fixed in the same pass: `wrangler.toml` had `preview_urls = false` under
      a comment claiming it disabled the `*.workers.dev` route; that key only controls per-version
      preview aliases (a different, newer Cloudflare feature) — `wrangler deploy` warned that
      `workers_dev` defaulted to enabled regardless. Corrected the comment rather than the setting:
      SRC's own security doc is explicit that the route being guessable is fine (`funny-stories-
      image.<account>.workers.dev` was published in SRC's own repo) because `X-Secret` is the
      entire boundary on every route but `/i/*`, and this route **is** what becomes
      `CLOUDFLARE_WORKER_URL` — disabling it would have left the server nothing to call.*
- [x] **T-4.2 (M)** `prompt.ts` deterministic builder (skeleton + fragments, slots 0/1/2/4,
      STYLE_SUFFIX verbatim); determinism + snapshot + length tests. Tune skeleton wording
      against real Flux output on ~20 combos, then **lock it** (edits orphan the cache). → FM-IMG-2, DD-3
      ***SKELETON tuned against real Flux output and locked, 2026-08-14 — unchanged from the
      reasoned-but-unverified wording below.*** *`npm run prompts -w apps/funny-multi-server --
      --curl` generated all 20 of the deterministic spread against the deployed Worker; each of the
      20 images was inspected. Verdict: ship as-is, no skeleton edit.*
      - *The **left/right anchoring held on every one of the 20** — slot 0's subject rendered on
        the left and slot 1's on the right with no exceptions, including the case designed to
        stress it hardest (`cats-in-a-trench-coat`, a three-cat chimera in slot 0): it composed as
        one lead figure beside its slot-1 companion, never merging into the companion or splitting
        across the frame.*
      - *No merged/fused bodies observed on any sample; scene (slot 2) and action (slot 4) both
        legible in every image.*
      - *8–9 of the 20 (~40–45%) carry a hallucinated corner squiggle resembling a painter's
        signature. Checked against SRC's own decision on the identical suffix (spec §22): SRC tried
        appending "no text, no words" in earlier pre-v0.1.0 iterations, reverted it because
        CLIP-conditioned models interpret negation poorly and naming the unwanted concept
        reinforces rather than suppresses it, then formally accepted the artefact — nonsense
        letterforms, not a reproduction of any real signature, cost of every mitigation (false-
        positive corner crops, a heavier model's Neuron-budget hit, reopening the `STYLE_SUFFIX`
        lock) judged higher than the cost of the squiggle itself. `STYLE_SUFFIX` is verbatim-locked
        from SRC independent of this task, so it was never in scope to change here regardless —
        this is a confirmation of an inherited decision, not a new one.*
      - *One dimension fact the pass confirmed rather than assumed: real output is **1024×1024**,
        not the design's documented 1024×768 fallback. Harmless by construction — T-4.1 reads
        dimensions from the bytes rather than trusting a constant, which is exactly the failure
        this would have been if it hadn't.*
      The builder is twelve lines, and almost nothing of SRC's 200 survives:
      `STYLE_SUFFIX` verbatim, and that is all. Translation, the English profanity re-check, the
      RU/EN slot-1 connective synthesis, `ruActionHint` and `looksLikeSameSubject` with its "two
      of them" chimera anchor all existed to make free-typed text safe and grammatical. The pools
      do that at authoring time, so what is left is a lookup and a substitution — which is the
      clearest measure of what FM-ANS-1 bought.*
      *The interesting work was therefore in the tests, not the code. The builder's output is a
      **cache key** shared by every room in every language and permanent from v0.1.0, so the
      properties worth asserting are determinism, uniqueness and the exact bytes: the assembled
      prompt is **pinned in full**, all **10 000 combinations** are walked to prove no two stories
      can collide onto one picture (and, in the same pass, that every prompt is printable ASCII —
      a non-ASCII character would mean a display text had leaked into the picture, which is what
      DD-4's one-cache-for-15-languages rests on), and changing a **prose** slot is asserted to
      leave the prompt untouched. That last one is the only guard against the cache quietly
      gaining a ×22 factor (DD-3).*
      ***Three decisions design §7.1 had not settled, now recorded there.*** *(1) Fragments are
      looked up **per slot** rather than from one flat id→fragment map: both are a line, but the
      flat one renders a companion as the lead if anything upstream writes to the wrong index —
      a plausible picture, cached forever, for a story nobody played. (2) An unfilled or
      out-of-pool visual slot **throws**; unreachable in a played game, so the only question is
      which failure is better, and a reveal taking the error-with-retry path T-4.4 already draws
      beats a real image cached under a prompt describing a story that never happened. (3)
      `MAX_PROMPT_LENGTH` is a **bound the pools are held to in the test**, not a runtime
      truncation — SRC truncated because typed answers are unbounded; ours are static data in
      this repo, so the worst case is computable (481 of 500, confirming T-1.4's measurement),
      and truncating would silently turn a too-long prompt into a different one.*
      ***17 tests, negative-controlled seven ways, all seven red.*** *The one worth naming is the
      seventh: rewording a single `promptEn` fragment in `packages/shared` reds the pinned prompt.
      That is the cache-orphan alarm working — after v0.1.0 that failure is the point, because
      the edit would strand every image already generated from the old wording.*
      `npm run prompts -w apps/funny-multi-server` prints a deterministic spread of 20 assembled
      prompts, and `-- --curl` turns them into `/generate` calls against `$CLOUDFLARE_WORKER_URL` —
      the tuning pass above is that command, run for real.
- [x] **T-4.3 (M)** `image.ts` adapted: exists-check → reserve → generate → refund-on-cached
      flow per design §7.3; JSON response parsing; `releaseImageSlot()` + tests incl. cap and
      refund races; KV recovery (`max(local,worker)`) kept. → FM-TIER-1
      *The counter half (`reserveImageSlot`, `imagesGeneratedToday`, `syncImageCounterFromWorker`,
      `maybeSyncImageCounter`, the `max(local,worker)` KV-recovery logic) is a near-verbatim port
      of SRC's `image.ts` — same constants, same rollover-at-UTC-midnight behaviour, same
      silently-absorbed sync failures. `generateImage` itself is new: SRC's version streamed base64
      bytes back over the socket; this one calls the Worker's `/exists` probe first (capless), and
      only reserves + calls `/generate` on a genuine miss, returning a `PictureRef` instead of a
      data URL (design §7.3, DD-5).*
      ***`releaseImageSlot()`, new, closes the race `/exists` cannot.*** *Two rooms can land on the
      same story in the gap between this room's probe (a miss) and this room's own `/generate`
      call; the Worker's own head check inside `serveGenerate` (worker.js) then reports
      `cached:true` for a call that already reserved a slot. `generateImage` refunds that
      reservation on exactly that signal — net zero cost for a request that turned out to be free.
      Floors at zero and re-checks the UTC day before decrementing, matching `reserveImageSlot`'s
      own rollover guard, so a refund arriving just after midnight cannot borrow against the new
      day's (empty) counter — pinned by a `vi.setSystemTime` test that crosses the boundary mid-test
      rather than asserting the floor in the abstract.*
      ***A failed `/exists` probe degrades to a miss, not a thrown error.*** *Network failure or a
      non-2xx status is swallowed and treated as `{cached:false}` rather than surfaced, because
      `/generate` repeats the identical R2 head server-side and will report `cached:true` anyway if
      the prompt really is cached — at which point the refund above fires. The only cost of a flaky
      probe is one redundant (and then refunded) reservation, never a wrong picture or a reveal
      that fails just because the cheap check happened to time out.*
      ***`ImageCapReachedError`, a new exported class, is the cap/failure discriminator T-4.4
      needs.*** *SRC's caller checked `reserveImageSlot()` itself before calling `generateImage` and
      built the `CAP_REACHED` vs `GENERIC` wire code from that boolean. That pattern cannot survive
      here: whether to reserve at all now depends on the `/exists` result, so the reserve check
      moved inside `generateImage`, and the caller needs a way to tell "cap was full" apart from
      "the Worker call failed" without re-implementing the reserve logic. A distinct thrown type,
      checked with `instanceof`, is that signal.*
      ***JSON response parsing is defensive, not because the Worker is untrusted, but because it's
      an HTTP boundary.*** *`parseHit`/`parseGenerated` validate the shape (`cached`, `url`,
      `width`, `height` with the right types) rather than casting; a `/generate` response missing a
      field throws with a message naming the defect instead of handing `undefined` on to a
      `PictureRef` the client will try to render with `<img src={undefined}>`.*
      ***23 tests.*** *The counter suite (11) is the closest thing to a straight SRC port in this
      task. The rest is new: cache-hit costs no slot and calls `/exists` only; genuine miss reserves
      and calls `/generate`; cap-full on a miss throws `ImageCapReachedError` before ever calling
      `/generate`; the refund race (`/generate` reports `cached:true` after a reserved miss) nets
      the counter back to zero; a broken `/exists` probe still reaches a correct result via the
      miss path, tested both for a network throw and a non-2xx status; `/generate` failure — network
      throw and a malformed success body alike — leaves the reservation standing (attempts, not
      successes, carried over from SRC's own reasoning) and is retried exactly as many times as the
      carried-over `MAX_RETRIES` constant says; missing Worker configuration throws before any
      fetch. Retry-path tests run on real timers (`RETRY_DELAY_MS` is 1 s, unchanged from SRC) with
      a raised per-test timeout rather than mocked, matching this repo's existing convention
      (`translate.test.ts` in SRC did the same at a shorter delay) over fake-timer bookkeeping for
      a cost of a few real seconds on the suite.*
- [x] **T-4.4 (M)** Reveal wiring: auto-trigger on reveal, bot-story server-side generation,
      `PictureRef` payloads, RevealScreen URL images with dimensions + fade-in, retry,
      CAP_REACHED caption, error mascot. → FM-IMG-1, FM-CORE-9
      *Server: `game.ts` gains `generateStoryPicture` (write-once cache around `buildPrompt` +
      `generateImage`, `buildPrompt`'s invariant-throw caught defensively even though
      unreachable in a played game), `handlePictureRequest` (identical handler for
      `reveal:requestPicture`/`retryPicture`, per spec §11 — a retry is just another request
      against the same write-once story), and `generateBotStoryPictures` (sequential, so a
      multi-bot room doesn't burn the shared daily cap in one tick ahead of a human still
      waiting). `enterRevealPhase` fires the bot generation before emitting any `reveal:start`,
      matching SRC's ordering rationale: the request must not wait on text rendering.
      `index.ts` wires the two socket events and, in `finalizePlayerRemoval`, fires
      `generateBotStoryPictures` again for a player who botifies **during** reveal — the case
      `enterRevealPhase`'s own call cannot reach, since that player was still human when reveal
      began.*
      ***Not carried from SRC, both load-bearing absences.*** *(1) No `translationFailed`/CSAM/
      hard-block branch in `generateStoryPicture` — `buildPrompt` here is a pure synchronous
      function of curated pool ids (DD-8, FM-ANS-1), so the only two outcomes are "generated"
      and "the Worker/cap failed", collapsing SRC's five-way `PictureOutcome` union to four. (2)
      No `broadcastStats`/gallery re-broadcast call sites — `stats.ts` (T-5.3) and `buildGallery`/
      `gallery:share` (T-5.1) don't exist in this repo yet; SRC called both from the exact
      pipeline this task owns, but adding calls into modules that don't exist would be scope
      creep dressed as fidelity. `generateBotStoryPictures` takes no `io` parameter as a result —
      bots have no client to notify and there is no gallery to refresh — noted in its docstring
      as a parameter to add back the day T-5.1's call site exists, not before.*
      ***Client: `RevealScreen.tsx` replaces the T-4.4-scaffolded `PlaceholderScreen` wrapper.***
      *`prose.ts` and `ProseText.tsx` ported verbatim from SRC (design §3: unchanged reuse — the
      resolved-display-text contract on `reveal:start`/gallery payloads means the highlighting
      logic needs no PictureRef-era changes) since nothing had brought them into this repo yet.
      The one production adaptation is `<img src width height>` instead of `<img src>`: SRC's
      base64 `pictureUrl` carried no dimensions to reserve, so the browser could only lay out
      the image after it decoded; `PictureRef.width`/`height` (T-2.3/T-4.3) let the layout space
      exist before the first byte arrives (design §8.2). `<LogoStamp />` is not carried — it
      doesn't exist in this repo yet and arrives at T-7.2 with the rest of the design-system
      polish pass; the picture renders correctly without the branding overlay, which is the only
      thing missing until then.*
      ***CAP_REACHED wiring reused `capReset.ts`'s `hoursUntilUtcMidnight` exactly as T-3.2 flagged
      it would, resolving that carry-over.*** *The i18n keys (`reveal.capReached` and siblings)
      were already present in both catalogs from an earlier bootstrap pass and needed no changes.*
      ***`imagePrompt` rides the wire but is not rendered***, *matching SRC's own production
      screen: SRC only ever displayed it on the dev-only `TestImageScreen`/`TestDemoImageScreen`,
      which design §3 explicitly drops from this repo. Carrying the field without a debug UI to
      show it in is not a gap — it is the same choice SRC's real players' screen already made.*
      ***A real-timing bug, not a logic bug, surfaced while writing the socket-level test.***
      *`Promise.reject(new ImageCapReachedError())` assigned directly to a mock's captured
      variable is an unhandled rejection until something awaits it — invisible in the two
      in-process test files because the mock is consumed same-tick, but exposed by
      `game.picture.socket.test.ts`'s real socket round-trip, which leaves the promise
      unconsumed for several ticks. Fixed by making the mock a factory (`() => Promise.reject(…)`)
      called only when `generateImage` actually runs, applied to all three files that share the
      pattern for consistency rather than leaving two fixed and one fragile.*
      ***23 new tests across three files, plus one fix to an existing one.*** *`game.pictureError
      .test.ts` (6, ported from SRC's item 4 of BUGS_AND_IMPROVEMENTS_02.md, adapted for
      `PictureRef`/`ImageCapReachedError`) covers `handlePictureRequest`'s CAP_REACHED/GENERIC/
      success/wrong-phase/no-story/write-once-retry paths. `game.botPictures.test.ts` (8, ported
      from SRC's item 3) covers the bot-generation loop including a genuinely sequential-not-
      parallel assertion (order-of-events, not just end-state — a concurrent implementation would
      pass an end-state-only check). `game.picture.socket.test.ts` (4, new — SRC never had a
      real-socket equivalent) proves the events are wired under their real names end to end,
      including the mid-game-botify-then-reveal path with a short `disconnectGraceMs`, the same
      technique `disconnect.socket.test.ts` already established. `RevealScreen.test.tsx` (13,
      new) covers the wait-control delay, the fade-in/flourish sequencing, both error codes, the
      write-once retry, and listener detachment on unmount. `App.test.tsx`'s reveal-routing
      assertion, written against the placeholder screen's plain-text prose, is updated for
      `ProseText`'s span-per-phrase rendering — the fix is a different query, not a behaviour
      change.*
- **Gate 4**: manual — dead-Worker URL → error+retry path; `MAX_IMAGES_PER_DAY=1` → second
  distinct story capped; **same picks twice → second reveal instant from cache with counter
  unchanged**; RU room and EN room with same picks → same image URL.
  ***The Worker/R2/deploy half of this gate is done*** *(T-4.1/T-4.2, 2026-08-14): the R2 bucket
  exists, the Worker is live, the fakes' contracts held against real Workers AI and real R2, and
  the cache-hit path (same prompt twice → second call 312 ms, `cached:true`, identical URL) is
  already confirmed at the Worker level.* ***The server+client wiring half is also done*** *(T-4.3/
  T-4.4, same day): every path in the checklist above is now exercised by an automated test —
  against a *mocked* Worker. What is left for this gate is exactly what mocking cannot prove: a
  played game against the real deployed Worker, on real devices, where a dead-Worker URL, a
  `MAX_IMAGES_PER_DAY=1` room, a repeated pick, and an RU/EN pair really happen.*
  ***Resolved 2026-08-15 — two of four checks run against the real deployed Worker on real
  devices, two skipped by decision.*** *Confirmed on real devices: a dead-Worker URL produces the
  error state and a working retry (mascot, `reveal.error` caption, story text unaffected);
  `MAX_IMAGES_PER_DAY=1` let exactly one of three distinct stories in a room generate a picture
  and correctly capped the other two with the `reveal.capReached` caption (`.env` reverted to the
  default cap afterward). Skipped by explicit call, not oversight: same-picks-twice cache-hit
  timing and the RU/EN same-picks-same-URL check. Both are already covered short of a live device
  — the cache-hit path is confirmed at the Worker level in the T-4.1/T-4.2 note above (312 ms,
  `cached:true`), and the RU/EN case follows directly from the prompt builder using only the four
  shared visual slots hashed as the cache key regardless of room language, which T-4.2's unit
  tests already assert. Residual risk is silent cache-cost fragmentation if that path ever broke,
  but nothing in it changed today, so the existing coverage was judged sufficient.*

## Phase 5 — Gallery, end, share

- [x] **T-5.1 (M)** Room gallery (host share, self-heal on late pictures, `PictureRef`
      entries) + EndScreen (ready toggle, one-more-game guard ≥ 3 non-bots, finish → finale
      image) + restart reset. → FM-CORE-10/11
      *Restart reset and the App-level plumbing for this whole task **already existed** — App.tsx
      has subscribed `gallery:ready`/`game:restartReady`/`game:over` and passed `gallery`/
      `readyIds`/`gameOver` down to `EndScreen` since an earlier bootstrap pass, and
      `handleReadyToggle`/`prepareRestart` were already in `game.ts` with `game:ready`/
      `game:restart` wired in `index.ts`. What this task actually added: `buildGallery` +
      `shareGallery` in `game.ts`, the `gallery:share` handler in `index.ts`, the late-picture
      re-broadcast (`handlePictureRequest`'s `'ready'` branch and `generateBotStoryPictures`, which
      gained an `io` parameter it deliberately lacked before this task existed), and the client's
      `RoomGallery` + real `EndScreen`.*
      ***`buildGallery` reuses `resolveAnswers`/`revealProse`*** *(already in `game.ts` from T-2.3)
      rather than SRC's inline `.map((a) => a ?? '')` — SRC's answers were already display text;
      ours are option ids that still need resolving, so the gallery must resolve them the same way
      `reveal:start` does, or a story could read differently in the gallery than the player already
      saw it. A test asserts exactly that equivalence.*
      ***The re-broadcast only fires on a fresh `'ready'` outcome, never `'cached'`*** *(matching
      SRC): a `'cached'` result means the picture already existed before this call, which means it
      already passed through `'ready'` once — and already re-broadcast then, if the gallery was
      shared at that point. `buildGallery` also reads `room.stories[i]?.picture` live, so a
      `gallery:share` itself always sees whatever is cached at share time with no separate
      broadcast needed.*
      ***Client: `RoomGallery.tsx` is new, adapted from SRC's, with three things deliberately
      absent.*** *Download/share/video buttons (SRC's `downloadStory.ts`/`share.ts`/
      `recordWobble.ts`) are T-5.2's — this screen browses the gallery, it doesn't export it yet.
      `<LogoStamp />` is T-7.2's, same absence T-4.4 already noted for RevealScreen. The
      `wobbleEngine` prop is gone because the type it read no longer exists in this repo's wire
      contract at all (ARC-3/DD-9, T-1.6) — there is only the CSS engine, so there is nothing left
      to choose between. What's carried: the `picture-wobble-*` CSS classes, sitting unused in
      `styles/index.css` since T-3.1 with a comment naming "reveal + gallery animated preview" as
      their intended use — this is the first place that actually uses them for the gallery half.*
      ***EndScreen.tsx replaces the T-3.1-era `PlaceholderScreen` wrapper wholesale.*** *Purely
      presentational — App.tsx already owns every subscription this screen needs, so unlike
      RevealScreen it has no `useEffect` of its own, only outgoing emits (`game:restart`,
      `game:end`, `game:ready`, `gallery:share`). Two things SRC's version had are gone: the
      `monkeys-on-bus.png` header photo (SRC's own branding — design §3's file-treatment table
      already drops it, and no replacement raster asset exists in this repo), and the inline QR +
      source-link footer markup, replaced by the already-carried `SourceFooter` component (its own
      doc comment already names "the Home and End screens" as its two call sites — this is the
      second).*
      ***A design judgement call, recorded here since nothing upstream settled it.*** *`EndMascots`
      (already ported at T-3.1 for exactly this screen, previously unused) stands in as the sole
      hero visual in place of SRC's photo + mascot-duo pairing, sized up from the small overlay SRC
      used. This is FM-CORE-11's "pre-bundled finale image" — bundled with the app rather than
      generated, shown regardless of `gameOver` exactly as SRC's own mascots were.*
      *43 new tests: server-side `game.gallery.test.ts` (8, unit — `buildGallery` shape/ordering/
      picture-presence/answer-resolution-equivalence, `shareGallery`'s host/phase/broadcast paths),
      `game.gallery.socket.test.ts` (6, real sockets — room-wide broadcast including to the host
      itself, isolation from a second uninvolved room, `NOT_HOST` rejection, the self-heal
      re-broadcast reaching every player on a late picture, and its two negative cases: no
      broadcast before any share, none on a cache-hit retry), 4 more in `game.botPictures.test.ts`
      for the bot-generation path's own re-broadcast (18 server tests total: 224 → 242). Client-side
      `EndScreen.test.tsx` (24, new) and 1 new in `App.test.tsx` for the reveal→end-not-yet-over
      transition, which is client-only — the one phase change in the whole app that isn't
      server-driven (its `game:over` case was updated for the real screen's text, not added; 25
      client tests total: 121 → 146).*
      ***Found and fixed while writing the socket tests, not introduced by them: a latent
      test-isolation bug in `game.botPictures.test.ts`.*** *Its "sequential, not parallel" case set
      the image mock's behaviour via `vi.mocked(generateImage).mockImplementation(...)` directly
      instead of the file's own `__setImageResult` indirection — which **replaces** the mock's
      whole body, permanently bypassing `__setImageResult` for every test that runs afterward in
      the same file. Harmless while it was the last test in its `describe` block; broke silently
      the moment this task's new `describe` block landed after it (a leaked call counter changed a
      URL one test asserted on, and a leaked always-succeeds implementation made a cap-reached test
      observe two broadcasts it expected zero of). Fixed by routing that test through
      `__setImageResult` like every other test in the file already does.*
- [x] **T-5.2 (M)** Download/share adapted to URL images (fetch → blob → canvas, CORS);
      wobble video via CSS engine only; `videoFooter`, `capReset` copied. → design §8.3
      *`capReset.ts` needed nothing here — already copied and wired at both call sites since
      T-3.2 ([LobbyScreen.tsx](../apps/funny-multi-client/src/screens/LobbyScreen.tsx), reveal
      cap-reached caption). The real scope was four new client files (`downloadStory.ts`,
      `share.ts`, `videoFooter.ts`, `recordWobble.ts`) plus `ShareButton.tsx`, and wiring all
      three buttons into `RoomGallery.tsx` — exactly the hole its own header comment had been
      naming since T-5.1.*
      ***The CORS adaptation design §8.3 calls for only applies to the still-image download.***
      *SRC's `downloadStory.ts` drew a base64 data URL straight into a canvas via `<img src>` +
      `img.decode()` — same-origin by construction, so `canvas.toBlob()` never tainted. Our
      `PictureRef.url` is served by the Cloudflare Worker (T-4.1), a different origin from the
      client, so the same `<img>` path would taint the canvas and throw on `toBlob()`. Adapted to
      `fetch(url)` → `blob()` → `createImageBitmap(blob)`, which never touches an `<img>` element
      at all — `ctx.drawImage()` accepts an `ImageBitmap` exactly like it accepts an
      `HTMLImageElement`, so nothing else in SRC's composite logic changes. This depends on the
      Worker route already sending `Access-Control-Allow-Origin: *` (T-4.1, confirmed still
      present at [worker.js:97](../cloudflare/worker.js#L97)) — without it the `fetch` itself
      would fail, not just the canvas draw.*
      ***`recordWobble.ts` needed no equivalent change.*** *SRC's version already loads the
      picture via `img.crossOrigin = 'anonymous'` before `img.src = pictureUrl` — the standard
      way to load a cross-origin image into a canvas without tainting it, paired with exactly the
      `Access-Control-Allow-Origin: *` response header the Worker already sends. So unlike
      `downloadStory.ts`, whose SRC version assumed a same-origin data URL and had to change
      approach entirely, `recordWobble.ts`'s approach was already correct for a cross-origin URL
      and carried over unchanged (copied verbatim, only the header comment updated to say why no
      change was needed). SRC's `recordWobbleLottie.ts` sibling isn't carried — ARC-3/DD-9 (T-1.6)
      dropped the wire-level `WobbleEngine` choice entirely, so `RoomGallery.tsx` always uses the
      CSS engine, matching what T-5.1's header comment already said the missing prop would resolve
      to once this task landed.*
      *Two components stay deliberately absent from `RoomGallery.tsx`, both already called out by
      T-5.1 as belonging to later tasks and untouched by this one: `<LogoStamp />` (T-7.2) and the
      `wobbleEngine` prop (doesn't exist in this repo's wire contract, per above). The video
      recorder's best-effort `/deployer-logo.png` stamp is left in as-is even though the asset
      doesn't exist here yet — its `try/catch` already degrades to "no stamp" on the resulting
      404, the same non-breaking gap `<LogoStamp />` leaves in-app until T-7.2 supplies branding.*
      *New dependency: `qrcode ^1.5.4` + `@types/qrcode` (client). Already present in SRC's
      `client/package.json` — this repo had only carried `qrcode.react` (the SVG React component
      used by the in-app `<QRCode />`), not `qrcode` (the canvas renderer `downloadStory.ts` and
      `videoFooter.ts` lazy-`import()` for the downloadable/recorded QR). `npm audit`: 0
      vulnerabilities with it added.*
      *40 new client tests: `share.test.ts` (12 — `canShareFiles`/`shareFiles` capability and
      fallback branches, `downloadFile`'s anchor-click/revoke sequence), `downloadStory.test.ts`
      (5 — asserts the fetch→createImageBitmap path is actually exercised and that an `<img>`
      element is never involved, plus filename sanitization and fetch-failure propagation),
      `videoFooter.test.ts` (6 — QR sizing, footer height floor, story-font auto-shrink under a
      tight height budget), `recordWobble.test.ts` (7 — capability detection, a full simulated
      5-second recording loop, the best-effort logo 404 path), `components/RoomGallery.test.tsx`
      (10 — button visibility per capability/picture combination, each click's call-through with
      the resolved args, the recording-disabled state). `share.ts`/`videoFooter.ts` and
      `recordWobble.ts`/`downloadStory.ts` draw through a shared `testutils/canvasStub.ts` (new,
      mirrors `testutils/socketMock.ts`'s role for the screen suites): jsdom implements the
      `<canvas>` element but neither its 2D context, `toBlob`, nor `captureStream`, so exercising
      real draw calls needs a fake context in the same way the socket suites need a fake
      transport. `recordWobble.test.ts`'s full-recording test fakes `performance.now()` and
      `requestAnimationFrame` to advance in fixed 200 ms steps rather than racing real timers —
      25 synchronous frames to close out the 5000 ms loop deterministically. Client total:
      146 → 186.*
- [x] **T-5.3 (S)** Home-screen stats + live `stats:update` (copy `stats.ts`, client hook). → FM-CORE-12
      *The **client half already existed** — T-3.2 carried the Home-screen counter and the Lobby
      cap banner, both subscribed and both inert because nothing answered `stats:get`. This task
      was server-side only: `apps/funny-multi-server/src/stats.ts` (near-verbatim port —
      `buildStats`/`broadcastStats` over the already-ported `roomCount`/`imagesGeneratedToday`/
      `maxImagesPerDay`), the `stats:get` ack handler (`await maybeSyncImageCounter(); ack(
      buildStats())`), and `broadcastStats(io)` calls after `room:create` and `game:end`, plus one
      inside `finalizePlayerRemoval` gated on `result.deleted` — which covers both the deferred
      T-2.2 (`room:leave`) and T-2.4 (disconnect-grace-expiry) call sites in one place, since T-2.4
      already unified those two paths. Neither client screen needed a code change; only their
      "inert until T-5.3" comments and test-describe titles were updated to say so.*
      *Eager startup sync (`void syncImageCounterFromWorker()`) added to `main()`, not
      `buildServer()` — SRC ran it after `fastify.listen()` for the same fire-and-forget reason
      (a dead Worker at boot must not block accepting connections), and keeping it out of
      `buildServer()` means the ~200 tests that call `buildServer()` directly never trigger a real
      network call.*
      ***Deliberately not wired: `broadcastStats` inside `game.ts`'s picture-generation
      pipeline.*** *SRC also called it right after `reserveImageSlot()` succeeded, so the
      Home-screen counter ticked live mid-generation rather than only on remount — `game.ts`'s own
      header comment still named this as T-5.3's. Not carried: T-4.3 deliberately moved reservation
      inside `image.ts`'s `generateImage()`, which owns the whole exists→reserve→generate→refund
      flow with no socket.io dependency by design. Threading `io` through it to recover one live
      tick would re-couple a module that flow intentionally decoupled, for a gain the `stats:get`
      ack's TTL-bounded `maybeSyncImageCounter` already approximates on every mount. Recorded as a
      follow-up in `game.ts` rather than done here.*
      *14 new tests (`stats.test.ts` (4): `buildStats` shape against live room/image counters,
      `broadcastStats` emits `stats:update` with that shape; `index.test.ts` (+6): `stats:get` ack
      contents, broadcast on create, broadcast on `room:leave`-to-empty, **no** broadcast on a
      partial leave, broadcast on `game:end`; `disconnect.socket.test.ts` (+1): the grace-window
      all-bot deletion also broadcasts, observed by a fourth socket that outlives every player's
      disconnect). Two of the new `index.test.ts` cases hit the same race the `room:leave` suite
      already documents for `lobby:update` — `room:create`'s own `stats:update` can still be in
      flight when its ack resolves, so a `once()` registered right after reads that broadcast
      instead of the deletion one two calls later. Fixed the same way: drain the create's
      broadcast before listening for the one under test.*
- **Gate 5**: full game on two real phones: gallery share, story download (image renders with
  picture), share sheet, restart into second game.
  ***Resolved 2026-08-16 — real two-phone-plus-laptop-tab session, production build, LAN
  address (same setup as Gates 3/4).*** *Decided upfront: `navigator.share` requires a secure
  context, which a plain LAN address isn't, so the Share button was expected to be entirely
  absent on phones — confirmed absent, matching `canShareFiles()`'s gate. Treated as covered by
  `share.ts`'s 12 unit tests rather than blocking on a tunnel, the same kind of explicit low-risk
  call Gate 4 made for two of its own four checks. Everything else confirmed on real devices: a
  full 7-round game across three clients; the host's gallery share reaching both other devices
  live with pictures; a downloaded story PNG genuinely containing the picture, story text and QR
  footer (past a Chrome "insecure download" prompt — same secure-context root cause as the Share
  button, non-blocking, confirmed by tapping through); the ready-quorum → host-restart flow
  starting a clean second game on all three devices. Bonus, not in the gate's literal text but
  landed alongside it: the 5-second wobble-video download also confirmed working.*

## Phase 6 — Full 15-language breadth (D-2)

- [x] **T-6.1 (M)** Wire all 15 UI catalogs from SRC + add new combobox keys to every catalog
      (machine-draft + `needs-<code>-review` flag where not en/ru). → FM-POOL-5 discipline
      *Copied SRC's 13 non-en/ru catalogs (`de, es-419, es-es, fr, he, id, it, ja, ko, pt-br, ta,
      uk, zh`) verbatim apart from the combobox-era delta already applied to `en`/`ru` at T-3.1/
      T-3.2: dropped `round.placeholder` (the free-text affordance FM-ANS-1 removed), added
      `round.pick/optionsLabel/scrollHint/submitDisabled`, `home.unsupportedLanguage`, and
      `errors.INVALID_OPTION` — all six machine-translated per language, landing inside SRC's
      existing `_note: "needs-<code>-review — machine-translated stub…"` header, which already
      covered the whole file. Verified programmatically, not by eye: a script diffed every
      catalog's leaf-key set against `en.json`'s (`_note` excluded, since it's a review flag, not
      content) — zero missing, zero extra, across all 13.*
      ***UI language and room content language are different axes — split here, not before.***
      *`catalogs.test.ts`'s coverage assertion and `i18n/index.ts`'s boot check were both keyed to
      `AUTHORED_LANGUAGES` since T-3.1, which was correct when only 2 catalogs existed but
      conflated two things: the room's *content* language (still gated to `AUTHORED_LANGUAGES`
      until T-6.3 — `rooms.ts`, `POOL_TEXTS`) and the *UI* language (i18next, which degrades
      correctly to English on a missing key). Both now key off the full `LANGUAGES` registry;
      the room-creation picker was already narrower (T-3.2), so nothing downstream changes.*
      *All 510 existing tests still pass unchanged (the coverage checks loop internally, so
      catalog count doesn't change the test count); typecheck, lint and `prettier --check` clean.
      One fix along the way: importing `it.json` as `it` collided with vitest's `it` — aliased to
      `itCatalog`.*
- [x] **T-6.2 (M)** Server i18n: QUESTIONS + prose templates for all 15 copied; stand-ins
      stripped. → design §9
      *Copied SRC's 13 non-en/ru server JSONs (`de, es-419, es-es, fr, he, id, it, ja, ko, pt-br,
      ta, uk, zh`), keeping only `{_note, questions, prose}` — dropping `imagePrompt` the same way
      T-2.3 already did for en/ru (DD-4: one English skeleton in `prompt.ts` serves every
      language's cache, so 15 per-language templates would be dead weight that drifts from the
      real builder). "Stand-ins stripped" needed no action here: `filter/standins.ts` was global
      client/server free-text repair machinery dropped wholesale at T-1.1, and none of SRC's
      per-language i18n JSONs ever carried a stand-in array of their own.*
      *`_note`'s `needs-<code>-review` flag is carried, matching T-6.1's client catalogs — none of
      these 13 languages has had native-speaker review.*
      *Verified each of the 13 independently of the loader: every prose template's `{0}`–`{6}`
      placeholders present exactly once (a missing or duplicated slot would silently discard or
      double-print an answer), and exactly 7 questions per language.*
      ***None of this is live yet, by design.*** *`i18n/index.ts`'s loader (T-2.3) filters
      `readdirSync` through `isAuthored`, which still checks `AUTHORED_LANGUAGES` (en, ru only) —
      so these 13 files sit on disk unread until T-6.3 widens that union alongside the matching
      pool texts. `index.test.ts`'s existing "rejects a registered language that has no texts yet"
      case already asserted this for `fr`; still true with `fr.json` now present. All 510 tests
      pass unchanged (test count is unaffected — the loader, not file count, gates what's counted),
      typecheck/lint/`prettier --check` clean.*
- [x] **T-6.3 (L)** Machine-draft pool display texts for the 13 remaining languages against
      their prose templates; flag headers; re-enable full 15-language coverage matrix in
      `pools.test.ts` and get it green. → FM-POOL-2/5
      *1,378 texts (106 ids × 13 languages), authored fresh — unlike T-6.1/T-6.2, SRC has no
      pool concept to copy from, so every phrase is a new translation of the curated en pool's
      *meaning*, adapted to fit each language's already-copied (T-6.2) prose template, not
      translated word-for-word. Dispatched as 13 parallel agents, one per language, each briefed
      with the full 106-id canonical list and a per-slot grammar analysis of its own template
      (which words the template hardcodes, which case/preposition/connective each slot must
      therefore supply itself). Every file carries a `needs-<code>-review` header, the same flag
      convention as the i18n JSONs (FM-POOL-5, OD-F5).*
      *The 13 templates turned out to fall into distinct grammatical shapes, each demanding a
      different authoring strategy: de/es-419/es-es/it/pt-br/id hardcode a "with" preposition
      before slot 1 (bare noun, no gender/number agreement risk since Romance preterite and
      Indonesian verbs don't conjugate for it); uk mirrors ru's structure exactly (instrumental
      preposition inline on slot 1, plural slot 4 to dodge gender, full-clause slot 6 above the
      bare-noun threshold); he interleaves an inline ו- (and) prefix on slot 1 and keeps EN's
      two-sentence shape; zh/ja/ko concatenate several slots with no separator at all, so word
      boundaries had to be engineered into the text itself (e.g. zh slot 1 opens with 和/跟, ja
      slot 4 ends in a te-form that flows into slot 5, ko slot 4 ends in a connective form before
      slot 5's plain-past close); ta is verb-final (SOV), so its "did" slot — everywhere else
      mid-sentence — is the last word before the period. fr's `a/ont` and ko's `이(가)`/`와(과)`
      template artifacts (SRC left both grammatical-number/particle forms slashed together,
      unable to pick one for free-typed input) are pre-existing T-6.2 content, out of scope here
      and left as-is.*
      *`AuthoredLanguage` widened from `Extract<Language, 'en' | 'ru'>` to `Language` itself, and
      `AUTHORED_LANGUAGES` from 2 to all 15 codes — a single edit in `schema.ts` that every
      consumer (`rooms.isValidLanguage`, the server i18n loader's exhaustiveness check,
      `pools.test.ts`'s `it.each` coverage loop) picked up automatically, exactly as each of
      their T-2.3/T-2.5/T-1.3 comments predicted. `pools.test.ts` went from 43 to 82 passing
      tests with no test-file edits at all. Three tests elsewhere had hardcoded a *specific*
      still-unauthored language and had to be rewritten now that none remain: `rooms.test.ts`
      (`isValidLanguage('de'/'zh')` flipped from asserting `false` to asserting `true` for every
      registry language, with `'klingon'` as the new not-a-language negative case),
      `apps/funny-multi-server/src/i18n/index.test.ts` (the `fr`-is-registered-but-unauthored
      case no longer exists — replaced with `'klingon'`; the `ja`-throws-with-its-name-in-the-
      message case also switched to `'klingon'`, since `ja` now succeeds), and
      `HomeScreen.test.tsx` (the create-language picker's "omits `de`" case flipped to "offers
      `de`" — content and interface language pickers now offer the same 15-language set, closing
      the gap T-3.2/T-2.3 opened).*
      *Full suite: typecheck, lint and `prettier --check` clean; test count rose from 510 to 614
      (+104: +39 shared pool coverage, +65 elsewhere from the wider `it.each` loops in
      `i18n/index.test.ts` and no structural additions needed anywhere else). No regressions.*
- [x] **T-6.4 (S)** Spot-check gates: full RU game (declined grammar reads correctly), one
      CJK game (zh or ja), RTL sanity pass for `he` (combobox layout mirrored correctly). → design §13
      *No headless browser here, so the "eyes" §13 asks for were applied two ways: scripted,
      not manual, for the two prose gates, and a direct source read for the layout gate. A scratch
      script (deleted after use) called the real `renderProse`/`polishProse`/`POOL_TEXTS` pipeline
      — the same code path `enterRevealPhase` uses — to render 10 random full RU games, 6 zh games
      and 4 he games and print the prose for reading.*
      *RU: all 10 read as grammatically correct declined sentences — nominative subject,
      instrumental «с/со» phrase, prepositional location, plural past verb (dodging gender
      agreement per design §9), comma correctly inserted before «чтобы»/«потому что», capitalised
      opening, terminal period. he: all 4 read correctly RTL-shaped two-sentence stories with the
      inline ו- "and". zh surfaced a real bug (see below), fixed and re-verified clean.*
      *Bug found and fixed: `ensureTerminalPeriod` (`apps/funny-multi-server/src/grammar.ts`)
      only recognised ASCII `.!?…` as sentence-final, so the zh/ja templates' own ideographic
      `。` didn't count — every zh/ja story shipped with a doubled `。.` at the end. Widened the
      regex to `[.!?…。！？]`. This was a pre-existing bug from T-1.5/T-2.3 (the function predates
      T-6.3's languages), only surfaced now that zh/ja stories could actually be rendered
      end-to-end.*
      *RTL layout: `document.documentElement.dir` flips correctly on language change
      (`apps/funny-multi-client/src/i18n/index.ts`), but `ScrollBox` — used by every combobox in
      the app (`RoundScreen`'s 20–30-option prose lists, both `HomeScreen` language pickers) — pinned
      its custom scrollbar thumb with physical `right-0.5`/`left-0`, so under `dir="rtl"` it stayed
      glued to the visual right edge instead of mirroring to the reading-start side. `RoundScreen`
      also hardcoded `text-left` on option buttons and a physical `pr-3` scroll-gutter, and both
      `HomeScreen` pickers had the same `pr-2` gutter. Fixed by switching to Tailwind's logical
      utilities: `end-0.5`/`start-0` (thumb), `text-start` (option text), `pe-2`/`pe-3` (gutters) —
      Tailwind 3.4 (already the pinned version) supports all four. No RTL layout test existed
      before or exists now (design §13 calls this a permanent manual/eyes gate); the fix is
      verified by reading the four changed files, not by a new test.*
      *Full suite still green post-fix: typecheck, lint, `prettier --check` clean; 614/614 tests
      (client 186, server 307, shared 82, cloudflare 39) — the client run hit a one-off
      worker-pool timeout under load on the first attempt (unrelated to any change here; unit
      tests do not touch `ScrollBox`'s pixel layout) and passed clean in isolation on retry.*
- **Gate 6**: pool + i18n coverage tests green for all 15; the three spot-check games pass.

## Phase 7 — PWA + polish

*In progress — Gate 7 and T-7.1 (the iPhone install leg) are still open in
`steering/tasks.md`. Only fully closed tasks are moved here as they land.*

- [x] **T-7.2 (M)** Design-system pass: motion presets on all transitions (forward-only),
      mascot triggers (waiting/timer/submit/reveal flourish/end/error), reduced-motion,
      wordmark, SourceFooter + LogoStamp. → FM-ARC-4, FM-CPL-3
      *Closed 2026-08-20. Audit found motion presets, the six mascot triggers, wordmark and
      SourceFooter already landed correctly during Phases 3–6 — nothing to fix there, and
      `PictureFlourish`'s one non-preset tween got a comment explaining it's an intentional
      exception (a spring would make a one-shot particle burst oscillate). The one real gap was
      `LogoStamp`, ported from SRC and wired into RevealScreen and RoomGallery; its bundled
      `/deployer-logo.png` (25×25, none shipped before) is the same placeholder-now/real-art-
      deferred-to-Phase-8 owner decision as the T-7.1 PWA icons, rasterized from `public/icon.svg`
      via the same temporary local `sharp` install. Decision: the stamp is an in-app overlay only
      — `downloadStory.ts`'s exported PNG keeps its existing QR-only branding unchanged;
      `recordWobble.ts`'s video export already had its own best-effort stamp fetch from T-5.1 and
      now has a live asset to find. New RTL coverage in `RevealScreen.test.tsx` and
      `RoomGallery.test.tsx` asserts the stamp's presence/absence.*
      *Full suite: typecheck, lint, `prettier --check` clean; 616/616 tests (client 188 [+2],
      server 307, shared 82, cloudflare 39). `npm audit` 0 vulnerabilities. No regressions.*

- [x] **T-7.3 (S)** Perf check on mid-range Android: 60 fps animations, reveal payload sizes
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
      **Jank check run 2026-09-16 (device session, A4):** a full game played on a real Android
      phone — timer bar's final 10 s, submit-confirm mascot, picture reveal flourish — showed no
      noticeable stutter or dropped frames. Eye check only, not instrumented; T-7.3 closes on
      that basis.*

## Phase 8 — Deploy + acceptance + docs

- **Gate 8 — PASSED 2026-09-16.** Self-deploy judgement (log Step 16): read `DEPLOYMENT.md` and
  README's deploy section as a stranger with a Cloudflare account, a Linux Docker host and a
  domain. Found and fixed three blocking gaps — the host `.env` step never said how to create
  the file (`ship.sh` needs it in place first), no prerequisites list, and a Render path whose
  service no longer existed (deleted T-8.1). Owner decisions the same day: Render dropped
  entirely (`render.yaml` deleted, README button removed, D-5/FM-NFR-3 amended);
  `.github/FUNDING.yml` added (`github: oursharedcode`) so the README's Sponsors link is backed
  by the repo's own Sponsor button; repo stays private for now, docs judged as if public — making
  the repo public before any launch announcement is a recorded prerequisite. Phase 8 is complete.

- [x] **T-8.1 (M)** Deploy artifacts adapted: `render.yaml`, `Dockerfile`, `docker-compose.yml`,
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
      **Deploy landed 2026-08-20 (Steps 6–7).** Production until D-5: **https://funny-multi.onrender.com/**
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
      **`BASE_PATH` landed 2026-09-15 (Step 12):** one normaliser in `@funny/shared`
      (`normalizeBasePath`, tested) feeds Vite `base`, manifest `start_url`/`scope`, relative
      manifest icons, the workbox denylist and — via `src/basePath.ts` reading
      `import.meta.env.BASE_URL` — the Socket.IO client path, flag/logo asset URLs and the
      `?room=` join link; the server mounts static, `/health` and Socket.IO under the same
      value (`basePath` option for tests, which pin that the root paths no longer answer).
      Dockerfile is two-stage (251 MB, was 785 MB) with `BASE_PATH` as a build-arg that
      `docker-compose.yml` feeds from `.env` to both the build and the runtime. Verified
      end-to-end in the container at `/funny37-game/`: routes, manifest scope, SW registered
      at `/funny37-game/sw.js`, socket handshake 5/5, root `/health` gone. Default `/` keeps
      Render (native Node build, no Dockerfile) unchanged. DNS `A` records for the apex and
      `www` were created the same day via the Cloudflare API (DNS-only, not proxied).
      **Production deployed 2026-09-15 (Step 13):** **https://www.staging-oursharedcode.com/funny37-game/**
      — `docker-compose.yml` gained a `caddy` profile (`deploy/caddy/Caddyfile`: auto-HTTPS,
      apex→`www`, `/funny37-game`→`/funny37-game/`, `BASE_PATH/*` → container, 404 elsewhere;
      HTTP/3 off because UDP 443 is closed) and `deploy/ship.sh` builds here with the host's
      `BASE_PATH`, streams the image over SSH and runs `compose --profile caddy up`. Verified on
      the real origin: Let's Encrypt certs for both names on first boot, all routes, both
      redirects, socket handshake 5/5, and a scripted 3-player create/join/start over TLS
      WebSockets in 0.9 s; the VM's `.env` secret returns 200 from the Worker. `WORKER_SECRET`
      was rotated once more (the agent's Python check was a false negative — Cloudflare 403s
      the `Python-urllib` user agent — and the rotation was done before that was understood;
      Render's copy was never updated — see the deletion below). DEPLOYMENT.md rewritten (self-host + Caddy = Option A,
      Render = Option B) and README points at the URL. `TRUSTED_PROXY_HOPS=1` is right for
      Caddy, the one proxy.
      **Owner decision 2026-09-15: the Render service `funny-multi` is deleted.** Asked why it was
      still needed, the answer was: it isn't — since D-5 it was a second, stale copy that rebuilt
      on every push and could not generate (old secret). One production now. `render.yaml` and
      README's button stay as Option B, the one-click path for strangers (Gate 8).
      **Closed 2026-09-15:** Gate 7's Installability leg re-run on the new origin passed (owner,
      Chrome DevTools — see Gate 7). The device legs stay with Gate 7 for T-8.2's phone session.
      *Carry-over from Phase 7 (owner decision 2026-08-20): the device pass must still close
      T-7.1's real iPhone/Android install, T-7.3's 60 fps jank check, and Gate 7 itself. The
      Installability leg of that bundle is done — see Gate 7 below.*

- [x] **T-8.3 (M)** Docs for this repo: README (what it is, deploy-your-own buttons pattern,
      AGPL/no-DRM honesty note per MON-5, GitHub Sponsors link only), DEPLOYMENT, DEVELOPMENT,
      LANGUAGES (pools workflow), MODERATION rewritten to FM-CPL-3 posture. → FM-TIER-4/6, FM-CPL-2/3
      *Landed 2026-08-20, ahead of T-8.1's remainder (owner-decided order swap) so the actual
      deploy session can follow DEPLOYMENT.md as a runbook. Also closed the T-8.1 carry-over
      write-up of the `x-forwarded-for` trust model / `TRUSTED_PROXY_HOPS` in DEPLOYMENT.md.
      Owed: the README's GitHub Sponsors link and Render deploy button are unverified against
      a live repo/Sponsors page.*
      *Full suite: typecheck, lint, `prettier --check` clean; 619/619 tests (client 188,
      server 310, shared 82, cloudflare 39), run directly outside the sandbox; `npm audit` 0
      vulnerabilities. No regressions — docs-only step.*


- [x] **T-8.2 (M)** Acceptance test: SRC spec §19 checklist adapted to combobox + URL images,
      run with 3 real phones on the production URL; include disconnect-mid-game → bot,
      cap flow, cache-hit flow. → design §13
      *Owner decision 2026-09-14: the checklist is authored first as `docs/ACCEPTANCE.md`, with
      Gate 7's three device legs prepended, so the phone session — on the D-5 URL, not Render —
      runs as one scripted pass.*
      *Step 14 (2026-09-15): `docs/ACCEPTANCE.md` written — Part A (Gate 7 legs), Part B (§19
      adapted, 17 items), Part C (cap / dead-Worker flips the agent performs live), results
      template. Owner decision 2026-09-15: devices are two desktops + one Android; the iPhone
      leg is deferred, so Gate 7 keeps that one leg open after the session.*
      **Step 15 (2026-09-16): session run.** Part A (A2–A4) and Part C (C1–C3) all pass; Part B
      passed 14 of 17 items (B1–B11, B13, B14, B17) — B12 (cache-hit `/stats` replay), B15
      (reconnect-within-window) and B16 (Russian room) were skipped by owner decision (time),
      and B4's type-to-filter sub-check was waived. Full results in `docs/ACCEPTANCE.md`. Owner
      decision 2026-09-16: sign off T-8.2 on this basis rather than hold it open for the three
      skipped items — the named extras (disconnect→bot, cap flow, cache-hit *unit* coverage)
      are otherwise covered. A2–A3 also drove a real fix: `icon-512-maskable.png` (T-7.1 note).*
      *Full suite: typecheck, lint, `prettier --check` clean; 628/628 tests, run outside the
      sandbox; `npm audit` 0 vulnerabilities.*

## Phase 9 — Commercial: pre-generated library + support rails (final phase, D-6/D-7)

- [x] **T-9.3 (S)** Server: `DEPLOYER_PAYID`, `DEPLOYER_PAYID_NAME`, `DEPLOYER_SPONSORS_URL`,
      `DEPLOYER_LIGHTNING_ADDRESS` → config endpoint `support` object. Tests: unset → nulls,
      set → passed through, never in any socket event. → FM-TIER-3
      *Landed Step 43 (2026-09-29). The "config endpoint" did not exist, so the step created it
      (owner decision 2026-09-29: a REST route, not a wider `lobby:update`): `GET ${base}config`
      → `{ support: { payId, payIdName, sponsorsUrl, lightningAddress, donateUrl } }`, each
      `string|null`, read once at boot, empty counted as unset; `SupportConfig` exported from
      `@funny/shared`; design §10.2 corrected. Five tests — unset, empty, set, base-path mount,
      and no rail value or field name in any event or ack through a create + join, proven by a
      deliberate leak. `lobby:update` still carries `donateUrl`: moving it is T-9.4a.*
      *Full suite: typecheck, lint, `prettier --check` clean; 774/774 tests (client 207, server
      214, funny-one-client 113, shared 190, cloudflare 50), run outside the sandbox; `npm
      audit` 0 vulnerabilities after Step 42's `undici` bump.*

- [x] **T-9.4a (S)** *Filed 2026-09-29 (scope beyond T-9.4's text; owner decision the same
      day):* move `donateUrl` off the `lobby:update` broadcast onto `GET /config`, so all five
      support strings have one source: drop the field from `LobbyUpdatePayload` and
      `broadcastLobby`, feed `App.tsx`, `HomeScreen` and `EndScreen` from the fetched config,
      and extend T-9.3's socket test to `DEPLOYER_DONATE_URL`. Lands in the same step as T-9.4.
      → FM-TIER-3
      *Landed Step 44 (2026-09-29), together with T-9.4. `donateUrl` dropped from
      `LobbyUpdatePayload`/`broadcastLobby`; the three client consumers read all five rails from
      `GET /config` instead; T-9.3's socket-leak test now sets `DEPLOYER_DONATE_URL` too and
      asserts it never reaches a socket event.*
      *Full suite: typecheck, lint, `prettier --check` clean; client 225/225, server 214/214,
      shared 190/190, cloudflare 50/50, run outside the sandbox (`funny-one-client`'s 3 timing
      failures on the full run were load-flakiness, unrelated to this step — confirmed 113/113
      on an isolated re-run); `npm audit` 0 vulnerabilities.*

- [x] **T-9.5 (S)** Docs: README "Support" and "Why no card payments" paragraphs; `.env.example`
      + DEPLOYMENT.md variables; ACCEPTANCE.md gets a support-screen row. → FM-TIER-3/6
      *Landed Step 47 (2026-10-01). Most of the README text and all five `.env.example` rails
      already existed from Step 17 (the D-6 rewrite, 2026-09-16), inside README's AGPL section.
      This step gave them their own "Support" section with a "Why no card payments" subsection,
      brought them in line with what T-9.3/T-9.4 built (the end-screen entry, which rails have
      tap-to-copy, no ♥ with nothing set), and pointed `.github/FUNDING.yml`'s comment at the new
      heading. `.env.example`: read once at boot, served at `<BASE_PATH>/config`, restart after
      editing. DEPLOYMENT.md: a new "Optional: the Support screen" subsection under 2a (example
      block, a note per variable, restart, `curl …/config`) and a support item in the
      five-minute check. ACCEPTANCE.md: Part D, rows D1–D5 with their own results table — the
      script for Gate 9's real-money device pass.*
