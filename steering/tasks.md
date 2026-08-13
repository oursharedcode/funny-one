# Funny Multi «Чепуха 37» — Tasks (steering)

| | |
|---|---|
| **Document** | `steering/tasks.md` |
| **Version** | 1.0 draft |
| **Date** | 2026-08-12 |
| **Status** | for review |
| **Progress** | Phases 0, 1 and 2 complete (Gates 0, 1 and 2 passed). Phase 3 in progress: T-3.1 and T-3.2 done. **T-3.3 next.** |
| **Build state** | typecheck / lint / format / `npm test` all green — 248 tests across 3 workspaces (43 shared + 156 server + 49 client); `npm audit` 0 vulnerabilities; CI green on `main`. |

Execution plan for `steering/requirements.md` (FM-*) per `steering/design.md` (§, DD-*).
Discipline inherited from the source spec §16: **do phases in order, verify each phase's
gate before moving on**. SRC = `docs/source_project/monkeybus` (read-only; copy, never edit).

Sizing: (S) ≤ half a day · (M) about a day · (L) multiple days.

---

## Phase 0 — Repo bootstrap

- [x] **T-0.1 (S)** Root workspace: `package.json` (workspaces `apps/*`, `packages/*`, scripts
      mirroring SRC root: dev/build/test/lint/typecheck with shared prebuilds),
      `tsconfig.base.json`, `.gitignore`, `LICENSE` (AGPL-3.0-only). → FM-ARC-1, FM-ARC-6
      *Also created the `packages/shared` shell (package.json + tsconfigs + `src/index.ts`
      placeholder) — without it the root `pre*` shared-build scripts cannot resolve.*
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
- [ ] **T-3.3 (L)** **RoundScreen combobox** per design §8.1: tap-card radio list from shared
      pools (room language), per-player-per-round shuffle, selection spring highlight, Submit
      gated on selection, SubmitConfirm overlay, question gloss kept, ScrollBox for 20–30-option
      slots. → FM-ANS-1/3/4, FM-CORE-8
- [ ] **T-3.4 (S)** WaitingScreen copy; timer bar; forward-only screen transitions per SRC §17. → FM-ARC-4
- **Gate 3**: two phones (or tabs) create/join/play 7 rounds end-to-end with real UI;
  no free-text affordance anywhere; shuffle differs between players.
  *Two of the three clauses are properties of a rendered screen, and T-3.2 landed the DOM test
  environment that makes them assertable — so automate them at T-3.3 rather than re-checking
  them by hand: **no free-text affordance** is "RoundScreen renders no `input` or `textarea`",
  a permanent guard on FM-ANS-1 rather than a one-off observation, and **shuffle differs
  between players** is a comparison of two renders. Follow Gate 2's precedent (see its note):
  the manual run stays for what is genuinely visual — tap-target size, the selection spring,
  timer-bar animation, real two-phone play.*

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
      *The **client half already exists** — T-3.2 carried the Home-screen counter and the Lobby
      cap banner, both subscribed and both inert because nothing answers `stats:get`. This task
      is therefore server-side: `stats.ts`, the handler, and the `broadcastStats(io)` calls SRC
      makes after create/leave (deferred from T-2.2) and in `finalizePlayerRemoval` (deferred
      from T-2.4). The client tests already assert what should appear once a payload arrives.*
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
      *Partly landed at T-3.1, which had to: a PWA will not install without a manifest and an
      icon, so `vite.config.ts` already carries the manifest, the NetworkFirst navigation
      strategy and the un-precached `index.html`, and `swReload.ts` is copied.
      **Remaining for T-7.1:** replace the placeholder `public/icon.svg` with real artwork
      (SRC's icons are its own branding and were not carried), decide whether to ship raster
      192/512 alongside it for stores that dislike SVG, and run the real-device install test —
      which is the part of this task that was never automatable.*
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
      *Carry-over from T-2.3: bump `actions/checkout` and `actions/setup-node` from `@v4` to
      `@v5` in `.github/workflows/ci.yml`. GitHub now warns that both target the deprecated
      Node 20 runner and is force-running them on Node 24; nothing is broken today, but the
      warning is on every run. Unrelated to the repo's own Node 20 target, which is what the
      `node-version: 20` step pins and which the nanoid `^5` decision depends on.*
      *Carry-over from T-2.2: make the rate limiter's trusted-proxy-hop count configurable.
      `clientIp()` currently takes `x-forwarded-for`'s first hop per spec §17, which a client can
      set itself to pick — and rotate — its own bucket key. Once the real proxy chain is known,
      count hops from the right-hand (proxy-appended) end instead, and document the assumption
      in DEPLOYMENT.md rather than inheriting SRC's claim that it already works this way.*
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
