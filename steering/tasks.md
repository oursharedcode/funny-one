# Funny Multi «Чепуха 37» — Tasks (steering)

| | |
|---|---|
| **Document** | `steering/tasks.md` |
| **Version** | 1.0 draft |
| **Date** | 2026-08-12 |
| **Status** | for review |
| **Progress** | Phases 0, 1 and 2 complete (Gates 0, 1 and 2 passed). Phase 3 **code complete** — all six screens are real. **Gate 3's manual two-phone run is outstanding**, running in parallel with Phase 4, which is now **code complete**: T-4.1–T-4.4 done, Worker deployed, skeleton wording tuned and locked, reveal wiring built and tested against a mocked Worker (2026-08-14). **Gate 4's manual run — real Worker, real devices — is outstanding**, same shape as Gate 3. |
| **Build state** | typecheck / lint / format / `npm test` all green — 417 tests across 4 workspaces (43 shared + 214 server + 121 client + 39 worker); `npm audit` 0 vulnerabilities; CI green on `main` as of the last push (this session's work is not yet pushed). |

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
  **Still to do, and it needs hands:** two real phones on one room — create, join by QR, play
  seven rounds, and confirm what only a device shows: tap-target size on the option cards, the
  selection spring, the timer bar's colour turns and panic, PWA-shell scrolling on a small
  screen, and that the forward slide-fade reads as forward. Follow Gate 2's precedent: what can
  be automated has been, and the manual run is now only for what eyes and thumbs are for.
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
