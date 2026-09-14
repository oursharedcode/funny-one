# Funny Multi «Чепуха 37» — Design (steering)

| | |
|---|---|
| **Document** | `steering/design.md` |
| **Version** | 1.0 draft |
| **Date** | 2026-08-12 |
| **Status** | for review |

Implements `steering/requirements.md` (FM-* ids referenced throughout). The source project
`docs/source_project/monkeybus` is referred to as **SRC** and is read-only; files are *copied*
into this repo and adapted here. SRC spec section references (`spec §N`) point to
`SRC/docs/FUNNY_STORIES_SPEC_v4.md`.

---

## 1. Architecture overview

```
┌──────────────────────────┐        WebSocket         ┌───────────────────────────┐
│  Player phones (PWA)     │ ◄──────────────────────► │  Render web service       │
│  React 18 + Vite         │   room/round/reveal      │  Node 20 + Fastify        │
│  Tailwind + Framer       │   events (URLs only,     │  Socket.IO                │
│  socket.io-client        │   never image bytes)     │  In-memory rooms Map      │
└────────────┬─────────────┘                          └────────────┬──────────────┘
             │ GET image URL                                       │ GET /generate?prompt=…
             │ https://<worker>/i/<hash>                           │ + X-Secret header
             ▼                                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Cloudflare Worker                                                              │
│  /generate → sha256(prompt) → R2 hit? ──yes──► return {url,w,h}  (no AI call)   │
│                    │ no                                                         │
│                    ▼                                                            │
│          Workers AI Flux Schnell (4 steps) → PNG → R2 put → KV count++          │
│  /i/<hash>     → serve PNG from R2 (immutable cache headers, CORS)              │
│  /stats        → { date, count } from KV                                        │
│  /entitlement  → Polar key → 24h JWT          (premium phase)                   │
│  KV: daily counter + premium monthly fair-use counters                          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

Unchanged from SRC: no database, in-memory `Map<roomCode, Room>`, bounded-reconnect
grace window then disconnect = bot (spec §7), no client-side AI calls, one Render service.
*(D-5, 2026-09-14: the one service is now the Docker image on an Oracle Always-Free VM behind
Caddy, at `https://www.staging-oursharedcode.com/funny37-game` — served under a sub-path, so the
client's Vite `base`, manifest `start_url`/`scope`, Socket.IO path and the server's static
prefix all take one configurable `BASE_PATH`, default `/`, which keeps Render working unchanged.)*

Changed vs SRC (each detailed below): combobox answers with server-side validation (§4–§6),
deterministic prompts from pool fragments (§7.1), R2-cached images delivered by URL (§7.2),
no filter/translation stack, premium entitlement (§10).

## 2. Repository layout (FM-ARC-1)

```
funnyone/
├── package.json                  # npm workspaces: apps/*, packages/*
├── tsconfig.base.json            # adapted from SRC root
├── .eslintrc.json, .prettierrc.json, .github/workflows/ci.yml   # from SRC (ARC-7)
├── packages/
│   └── shared/                   # FM-ARC-2 — consumed by both apps; future family products
│       └── src/
│           ├── index.ts          # package barrel (the only entry in `exports`)
│           ├── languages.ts      # copied verbatim from SRC/shared/languages.ts (15 langs)
│           ├── events.ts         # adapted from SRC/shared/events.ts (deltas in §5)
│           ├── rotation.ts       # storyIndex() extracted from SRC/server/src/game.ts
│           ├── rotation.test.ts  # first test in the repo (build order, FM-ARC-2)
│           └── pools/            # NEW — §4
│               ├── schema.ts     # types + slot config
│               ├── options.ts    # canonical ids + English prompt fragments
│               ├── text/<lang>.ts# 15 files of localized display texts
│               ├── text/index.ts # POOL_TEXTS registry, typed by AuthoredLanguage (§4.1)
│               └── pools.test.ts # validation suite (FM-POOL-4)
├── apps/
│   ├── funny-multi-server/       # from SRC/server, minus filter/translate (§6)
│   └── funny-multi-client/       # from SRC/client (§8)
├── cloudflare/                   # a workspace, unlike SRC's — see below
│   ├── worker.js                 # rewritten — §7.2 (SRC worker.js as starting point)
│   ├── worker.test.js            # T-4.1 — fakes for AI/R2/KV; the cache key is pinned
│   ├── package.json              # name + `test` script only; no dependencies
│   └── wrangler.toml             # + R2 bucket binding, KV binding
├── docs/                         # existing requirement docs + read-only source_project
└── steering/                     # this document set
```

`apps/hub` and `apps/funny-one` are added by later products; workspace globs (`apps/*`,
`packages/*`) already cover them.

`cloudflare` is listed as a third workspace entry (T-4.1), which SRC's copy explicitly was not.
SRC's Worker was a pass-through with nothing to test; this one owns the cache, and root
`npm test` — `npm run test -ws --if-present` — is how every other directory's suite reaches CI.
It declares no dependencies: `wrangler deploy` still bundles `worker.js` alone.

## 3. Reuse map (SRC → this repo)

Legend: **copy** = as-is (path/import fixes only) · **adapt** = meaningful edits · **drop** = not carried.

| SRC path | Action | Notes |
|---|---|---|
| `shared/languages.ts` | copy | 15-language registry, exhaustiveness sentinel |
| `shared/events.ts` | adapt | payload deltas in §5 |
| `server/src/index.ts` | adapt | socket wiring kept; remove filter imports; option validation |
| `server/src/rooms.ts` | copy | room lifecycle, codes, capacity ceiling, nickname rules |
| `server/src/rateLimit.ts` | **new** | spec §17's 5/30-per-IP-per-minute limits. Not a copy: SRC specifies them and ships `RATE_LIMITED` + 15 translated catalog strings, but never implemented the limiter (see T-2.2) |
| `server/src/disconnect.ts` | **new** | extracted from SRC's inline `disconnectTimers` map (T-2.4). Same rules; a module so the window is testable on fake timers and can be cleared on server shutdown, which SRC — a process that never shut down — had no need for |
| `server/src/game.ts` | adapt | rotation kept (extracted to shared); submit/auto-fill/prompt paths change (§6) |
| `server/src/game*.test.ts` | adapt | rewrite answer fixtures to option ids |
| `server/src/i18n/index.test.ts` | **new** | not adapted (T-2.5): every SRC case tests one of the three render-time repair transforms this design drops (§9). Rewritten to cover what the loader and `renderProse` guarantee instead — language coverage, slot completeness, verbatim substitution |
| `server/vitest.config.ts` | **new** | 20 s test/hook timeout (T-2.5). Four suites run a real Fastify + Socket.IO server and vitest fans files across all cores; the 5 s default tripped on merely-slow runs, not stuck ones |
| `server/src/image.ts` | adapt | Worker returns JSON `{url,width,height,cached}`; cap skips cache hits (§7.3) |
| `server/src/prompt.ts` | adapt | T-4.2. Deterministic builder (§7.1); `STYLE_SUFFIX` kept verbatim (spec §22 lock) and is the only line of SRC's that survives — translation, the profanity re-check, per-language connectives and the chimera anchor all existed to make typed text safe and grammatical, and the pools do that at authoring time |
| `server/scripts/samplePrompts.mjs` | **new** | T-4.2. Prints a deterministic spread of assembled prompts (`--curl`: as `/generate` calls) for the one-time tuning pass §7.1 requires before the skeleton locks |
| `server/src/stats.ts` | copy | live stats broadcast |
| `server/src/grammar.ts` (+test) | copy | RU prose punctuation polish still applies |
| `server/src/i18n/*` | adapt | QUESTIONS + prose templates kept; stand-in lists removed |
| `server/src/translate.ts` | **drop** | replaced by pre-authored prompt fragments |
| `server/src/filter/**` | **drop** | FM-ANS consequences table; no untrusted text remains |
| `server/src/env.ts` | adapt | new env vars (§11) |
| `client/src/App.tsx` | adapt | phase routing carried; `wobbleEngine` dropped from `LobbyState` and the `lobby:update` handler (DD-9). `LobbyState.language` narrowed to `AuthoredLanguage` (T-3.3) — the server will not create a room in any other (T-2.3), and `POOL_TEXTS` is keyed by it, so the guarantee is stated once rather than cast at each use |
| `client/src/socket.ts`, `swReload.ts`, `version.ts` | copy | package name is the only edit |
| `client/src/sourceUrl.ts` | adapt | this repo's URL — the constant exists to identify the running binary's upstream |
| `client/src/i18n/index.ts` | adapt | boot completeness check keyed to `AUTHORED_LANGUAGES`, not all 15 (§9) |
| `client/src/i18n/{en,ru}.json` | adapt | Funny Multi identity; "pick" not "write"; `round.placeholder` removed, combobox keys added; `INVALID_OPTION` |
| `client/src/main.tsx` | adapt | SRC's `?test=` harness branch dropped with the Test* screens |
| `client/index.html`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js` | adapt | product identity + this project's precached assets; PWA/workbox strategy carried verbatim |
| `client/public/flags/*.png` | copy | language picker |
| `client/public/{icon-192,icon-512}.png`, `monkeys-on-bus.png`, `monkey/`, demo images | **drop** | SRC's branding. Replaced by a placeholder `public/icon.svg` until real artwork exists |
| `client/src/screens/HomeScreen.tsx` | adapt | create-mode language picker gated to `AUTHORED_LANGUAGES` — it sets the room's *content* language, which the server narrowed at T-2.3; join-mode picker stays at all 15 (interface only). `wobbleEngine` dropped from `LobbyState`. Busy flag released on `error`, since a rejected `room:create` reports by event and never acks (T-3.2) |
| `client/src/screens/LobbyScreen.tsx` | adapt | `game:start` emitted with no arguments — T-1.6 dropped the payload type with its only field |
| `client/src/screens/WaitingScreen.tsx` | copy | T-3.4. Only change: SRC's local `WaitingData` interface dropped for the `RoundWaitingPayload` already on the contract |
| `client/src/screens/EndScreen.tsx` | copy | unchanged flow (T-5.1) |
| `client/vitest.config.ts` + `src/testSetup.ts` | **new** | T-3.2. jsdom environment for the first component tests; separate from `vite.config.ts` so test runs skip the PWA build, and repeats its `__APP_VERSION__`/`__BUILD_DATE__` defines. Setup stubs `ResizeObserver` and `matchMedia`, which jsdom lacks and shipped code reaches |
| `client/src/testutils/socketMock.ts` | **new** | T-3.2. `socket.ts` connects at module scope, so every screen suite mocks it; the double `act`-wraps ack and broadcast callbacks, without which React had not re-rendered by the next assertion and absence-assertions passed vacuously |
| `client/src/screens/RoundScreen.tsx` | **rewrite** | not an adaptation in practice (T-3.3): SRC's body is a textarea, a character counter and a non-empty check, and none of it survives §8.1's combobox. Only the header — TimerBar, progress line, question, joiner gloss, story-language reminder — and the SubmitConfirm overlay carry over |
| `client/src/screens/RevealScreen.tsx` | adapt | image by URL + dimensions (§8.2) |
| `client/src/components/**` (TimerBar, PlayerList, QRCode, ProseText, RoomGallery, ShareButton, ScrollBox, SourceFooter, LogoStamp, art/*) | copy | design-system implementation (FM-ARC-4) |
| `client/src/styles/*` | adapt | tokens + the three motion presets copied. `motion.ts` gains `screenSlide` (T-3.4): the §17 phase transition, lifted out of App.tsx so the forward-only lock — direction never varies — is a named value a test can hold rather than four inline literals |
| `client/src/App.test.tsx` | **new** | T-3.4. The phase machine had no coverage: screen suites render their screen directly, so nothing checked that an event reaches the right screen with the right state. Also holds the §17 transition assertions, which are behavioural — framer-motion writes real transforms under jsdom |
| `client/src/prose.ts`, `downloadStory.ts`, `share.ts` | adapt | fetch image URL → blob (CORS) instead of base64 (§8.3) |
| `client/src/recordWobble.ts` | copy | CSS engine only |
| `client/src/recordWobbleLottie.ts` | **drop** | ARC-3: no Lottie |
| `client/src/capReset.ts`, `videoFooter.ts` | copy | cap UX helpers, share footer |
| `client/src/screens/Test*` | drop v1 | dev-only harnesses; re-add on demand |
| `client/src/screens/PlaceholderScreen.tsx` | **new** | T-3.1 scaffold. A phase router needs six destinations; the screens land across five later tasks, so each file renders this until its task replaces it wholesale |
| `client/src/i18n/catalogs.test.ts` | **new** | T-3.1. Catalogue drift is the one silent failure in the bootstrap — i18next falls back to English without complaint. Key parity, interpolation parity, and a compile-time `Record<ErrorCode, true>` |
| `cloudflare/worker.js` | **rewrite** | T-4.1. Only the secret gate, the `/stats` route and the best-effort KV bump survive as SRC wrote them. The generate path inverts: SRC returned image bytes to the server, this one returns a URL into an R2 cache it owns (§7.2, DD-5), which is a different set of failure modes — a shifted key orphans every image, a hit reported as a miss spends a cap slot (§7.3) |
| `cloudflare/worker.test.js`, `package.json` | **new** | T-4.1. SRC shipped the Worker untested; a `fetch(request, env)` export needs no miniflare, only fakes for the three bindings |
| Root `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `render.yaml`, `.env.example` | adapt | workspace paths, new env vars |
| `docs/DEPLOYMENT.md`, `DEVELOPMENT.md`, `CUSTOMIZATION.md` | adapt | rewrite for this repo at Phase 8 |
| `docs/MODERATION.md` | adapt | shrinks to the FM-CPL-3 posture |
| `docs/LANGUAGES.md` | adapt | "adding a language" now = UI catalog + pool texts |

## 4. Answer pools (FM-POOL-*)

### 4.1 Data model — `packages/shared/src/pools/schema.ts`

```ts
export type SlotIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface SlotConfig {
  slot: SlotIndex;
  label: string;               // dev-facing name: who/withWhom/where/when/did/why/ending
  prefix: string;              // id namespace; every id in the slot starts `<prefix>.`
  kind: 'visual' | 'prose';    // visual → options carry promptEn (FM-POOL-1)
  minOptions: number;          // visual 9, prose 20
  maxOptions: number;          // visual 12, prose 30
}

export interface AnswerOption {
  id: string;                  // stable slug, e.g. 'who.grumpy-pirate' — wire format (FM-ANS-2)
  promptEn?: string;           // English image-prompt fragment; REQUIRED on visual slots
}

// per-language display text, one file per language:
//   text/ru.ts: export const ru: Record<OptionId, string> = { 'who.grumpy-pirate': 'сердитый пират', … }
```

Two additions made when this was implemented (T-1.3):

- **`prefix` per slot.** Ids were already namespaced by convention; making the namespace part
  of the config lets `pools.test.ts` reject an option filed under the wrong slot during T-1.4 —
  a mistake that would otherwise surface only as a silently wrong story.
- **`AuthoredLanguage` / `AUTHORED_LANGUAGES`.** `POOL_TEXTS` is typed
  `Record<AuthoredLanguage, PoolTextMap>`, where `AuthoredLanguage = Extract<Language,'en'|'ru'>`
  until T-6.3 widens it to the full `Language` union. That turns "re-enable the 15-language
  coverage matrix" from a step someone must remember into a compile error until all 15 text
  files are registered (D-2, FM-POOL-5).

- Ids are permanent once shipped (they key the R2 cache indirectly via prompts and appear in
  tests); texts are freely editable.
- RU texts pre-declined per slot case (FM-POOL-3): slot 1 instrumental («с сердитым пиратом»
  — written to fit the RU prose template), slot 2 prepositional, etc. Each language file is
  authored against its own prose template, not translated word-for-word.
- Machine-drafted languages carry the SRC convention header: `// needs-<code>-review`.

### 4.2 Validation — `pools.test.ts` (FM-POOL-4)

Asserts for every slot: option count within `[min,max]`; every visual option has non-empty
`promptEn` ≤ 120 chars, ASCII-safe; every language file covers exactly the id set (no missing,
no extra); every text non-empty, ≤ 70 chars, unique within its slot+language; ids unique
globally; no option text collides with a nickname-length rule edge case. This suite is the
gate for pool-authoring tasks.

### 4.3 Slot 3 ("When?") is prose-only

SRC's final prompt template used slots 0–4. Here slot 3 drops out of the picture prompt
(FM-POOL-1 rationale): the four visual slots give 9⁴–12⁴ ≈ 6.5k–20k distinct prompts, so the
R2 cache converges quickly; including a 20–30-option "when" would multiply the space ×25 and
mostly defeat caching. "When" remains in the prose where it does its comedic work.

## 5. Protocol deltas — `packages/shared/src/events.ts`

Everything not listed is carried from SRC unchanged (`Room`, `Player`, phases, lobby/stats/
gallery/restart events, error union).

```ts
// CHANGED — was { answer: string }
export interface RoundSubmitPayload { optionId: string; }

// CHANGED — Story.answers stores picked option ids (or null); prose text is
// resolved server-side at reveal via pools + room language.
export interface Story { answers: (string | null)[]; picture: PictureRef | null; }

// NEW — replaces base64 pictureUrl everywhere (FM-IMG-3)
export interface PictureRef { url: string; width: number; height: number; }

// CHANGED payloads:
//   reveal:pictureReady → { picture: PictureRef; imagePrompt: string }
//   GalleryEntry.picture: PictureRef | null
//   reveal:start / gallery entries keep `answers: string[]` — but they now carry
//   the *resolved display texts* in the room language, so all SRC screens
//   (ProseText highlighting, gallery, download) work unchanged.

// NEW error code: 'INVALID_OPTION' (server rejects out-of-pool ids — FM-ANS-2)

// REMOVED: WobbleEngine type + wobbleEngine fields on GameStartPayload /
// LobbyUpdatePayload / Room (ARC-3: CSS engine only).
```

`round:start` is unchanged: the client owns the pools (shared package is bundled) and renders
the combobox for `(roundNumber, room.language)` locally. Client and server always agree on
pool content because both import the same `packages/shared` build, deployed as one unit
(server serves the client bundle, spec §14).

## 6. Server design — `apps/funny-multi-server`

`game.ts` deltas (everything else per SRC):

- `submitAnswer(room, socketId, optionId, io)`: validate `optionId ∈ pool[currentRound]`;
  invalid → emit `error {code:'INVALID_OPTION'}` and **do not** mark submitted (an honest
  client cannot produce this; a dishonest one gets timer-autofilled). Valid → store the id in
  the rotated story slot (rotation via `shared/rotation.ts`), mark submitted, broadcast
  waiting, maybe advance. No truncation, no filter.
- `autoFillFor(room, socketId)` (bots + timer expiry, FM-BOT-2): uniform random option id from
  `pool[currentRound]`, excluding ids already used at this slot by other stories in this room
  this round when the pool is large enough; otherwise fall back to plain uniform.
- `enterRevealPhase`: unchanged flow (bot pictures kicked off first, then per-player
  `reveal:start`), but answers resolve ids → room-language display texts before prose
  rendering; RU prose still passes through `polishRussianProse` (grammar.ts).
- `generateStoryPicture`: prompt built per §7.1 (synchronous, no await, no `translationFailed`
  branch, no CSAM/hard-block calls). Cap reservation only when the Worker reports an actual
  generation is needed — see §7.3 for the two-step flow.

`index.ts`: same socket wiring minus filter imports; nickname rules, room caps and grace-window
botification all per SRC (FM-CORE-3/4). **Rate limits are the exception** — SRC never implemented
them, so `rateLimit.ts` is written from spec §17 rather than copied (T-2.2). Two notes on how it
wires in:

- Buckets are per server instance, not module scope, and are stopped on Fastify's `onClose`.
- A rate-limit hit follows each event's own error convention rather than spec §17's literal
  "emit `error`": `room:create` emits (its ack has no error branch), `room:join` returns
  `ack.error` — the copied `HomeScreen` join path only inspects the ack, so an emit would leave
  its spinner stuck. Both carry the spec's `RATE_LIMITED` code.

Disconnect handling (T-2.4) follows SRC, with two deltas:

- **`room:leave` shares the removal path** instead of calling `removePlayer` directly. SRC's
  explicit-leave handler botified a mid-game quitter but never auto-filled their current round,
  so everyone else waited out the full 60 s round timer for an answer that could not arrive. A
  deliberate leave and an elapsed grace window reach the same end state, so they get the same
  handling; only the delay differs.
- **`buildServer` accepts `disconnectGraceMs`.** Production never passes it — the default is
  `RECOVERY_WINDOW_MS + 5 s`, and being longer than the recovery window is the whole point. Tests
  pass a few milliseconds, because a 65 s window cannot otherwise close inside a test.

Deferred into the tasks that own them: `finalizePlayerRemoval` also re-broadcasts stats (T-5.3)
and, when the drop lands in the reveal phase, kicks off bot-story pictures (T-4.4).

## 7. Image pipeline

### 7.1 Deterministic prompt builder — `prompt.ts` (FM-IMG-2)

```ts
export const STYLE_SUFFIX = /* verbatim from SRC — spec §22 lock, never edit */;

// Skeleton derived from SRC's English skeleton, slot 3 removed (§4.3):
const IMAGE_PROMPT_EN =
  'two distinct subjects: {0} on the left and {1} on the right, in {2}. They {4}';

export function buildPrompt(story: Story): string {
  // ids → promptEn fragments from packages/shared pools; slots 0,1,2,4.
  // Pure function of the four option ids → unit-testable, culture-independent,
  // identical across all 15 languages → shared R2 cache (FM-POOL-2).
}
```

The exact skeleton wording is tuned once against Flux during Phase 4 (two-subject anchoring
lessons from SRC — "on the left / on the right" — are preserved); after v0.1.0 it is locked
like the style suffix, because edits orphan the entire R2 cache.
`scripts/samplePrompts.mjs` (T-4.2) prints a deterministic spread of assembled prompts for that
pass, and `--curl` turns them into `/generate` calls against a deployed Worker.

Built at T-4.2, with three decisions the sketch above did not settle:

- **Fragments are looked up per slot, not from one flat id→fragment map.** Both are one line;
  the flat one would render a companion as the lead if anything upstream wrote to the wrong
  index — a plausible-looking picture, permanently cached, for a story nobody played.
- **An unfilled or out-of-pool visual slot throws** rather than substituting a placeholder.
  Unreachable in a played game (`advanceRound` fills every slot before reveal, `submitAnswer`
  rejects out-of-pool ids), so the choice is only about which failure is better: a reveal that
  takes the error-with-retry path T-4.4 already draws, or a real image generated and cached
  under a prompt describing a story that never happened.
- **`MAX_PROMPT_LENGTH` is a bound the pools are held to in `prompt.test.ts`, not a runtime
  truncation.** SRC truncated because its answers were typed and unbounded; ours are static data
  in this repo, so the worst case is computable — the longest fragment per visual slot, plus
  skeleton, plus suffix — and it is 481 of 500. Truncating instead would silently turn a
  too-long prompt into a *different* prompt, and cache the picture under a key nobody intended.

Not ported from SRC's `prompt.ts`, each absence load-bearing: `translateToEnglish` (DD-8 removes
the translate stack — fragments are authored English), the English profanity re-check (no
untrusted text remains, FM-ANS), the RU/EN slot-1 connective synthesis and `ruActionHint`
(fragments are authored to compose with this one skeleton), and `looksLikeSameSubject` with its
"two of them" chimera anchor — slots 0 and 1 draw from disjoint kinds, leads versus companions
(T-1.4), so a duplicate pair is unreachable by construction.

### 7.2 Cloudflare Worker — `cloudflare/worker.js` (FM-IMG-3)

Bindings: `AI`, `STATS_KV` (existing), **new** `IMAGES` (R2 bucket). All routes except
`/i/*` require `X-Secret`.

- `GET /generate?prompt=…` → `hash = hex(sha256(prompt))`; `IMAGES.head('i/'+hash+'.png')`:
  - **hit** → `200 {url, width, height, cached:true}` — no AI call, no KV bump.
  - **miss** → Flux Schnell (4 steps, never raise), decode, `IMAGES.put`, bump daily KV counter
    (best-effort, as SRC), return `{url, width, height, cached:false}`. A `put` that fails is a
    `502`: a success here would hand every phone in the room a URL that 404s.
  - **dimensions are read from the stored bytes** (PNG `IHDR` / JPEG `SOF`), not from request
    parameters — Flux Schnell accepts `prompt` and `steps` and nothing else, so there is no size
    to ask for, and a hard-coded 1024×768 would be an unverifiable constant that RevealScreen
    reserves layout from (T-4.4). They are written to R2 `customMetadata`, so a cache hit reports
    the same numbers the fresh generation did; the documented 1024×768 remains only as the
    fallback for bytes whose header cannot be read.
  - **stored `contentType` is sniffed from the magic bytes.** Flux Schnell returns base64 **JPEG**
    (SRC labelled it `image/jpeg` too), so declaring `image/png` would be a lie browsers happen to
    tolerate. The `.png` in the key and the route is cosmetic — the content-addressed URL is never
    read for its extension, and §8.3's download re-encodes through a canvas regardless.
  - `url` = `https://<worker-host>/i/<hash>.png` (Worker-served; R2 egress is free, and the
    Worker route lets us set headers without a public bucket), built from the **incoming request's
    own origin**: whatever host the server reached the Worker on is by construction one that
    resolves, and that same URL then goes to every phone.
- `GET /exists?prompt=…` → the R2 head and nothing else (the §7.3 probe): `{cached:false}` on a
  miss, `{url, width, height, cached:true}` on a hit. Deliberately incapable of generating.
- `GET /i/<hash>.png` → stream from R2 with `Cache-Control: public, max-age=31536000, immutable`,
  `ETag`, and `Access-Control-Allow-Origin: *` (needed by canvas download/share, §8.3). No secret —
  URLs are unguessable (content-hash keyed) and images contain no user data (FM-IMG-4). Keys that
  do not match `^i/[0-9a-f]{64}\.png$` are 404'd without asking R2. No `OPTIONS` handler: every
  request we make for these URLs is a plain `GET` with no custom headers, which is never
  preflighted.
- `GET /stats` → unchanged from SRC.
- `POST /entitlement` → premium phase, §10. Routing dispatches on pathname first, leaving method
  checks to the routes, so this lands without restructuring.

Not carried from SRC: the raw-byte-stream fallback for pre-Flux image models. SRC streamed bytes
straight through; this Worker has to **store** them, and a stream cannot be sniffed for type or
size before it is stored. The model is pinned in the same file, so an unexpected response shape is
a `502` rather than a silently mis-typed cache entry.

### 7.3 Daily cap semantics (FM-TIER-1)

SRC reserved a cap slot before every Worker call. Cache hits must not consume slots, so the
server flow becomes: call `/generate` **without** having reserved; the Worker itself checks
nothing — cap stays server-side authority. To keep reserve-before-await semantics without
letting a burst overshoot: server first does a cheap `HEAD`-equivalent (`GET /exists?prompt=`
— a Worker route doing only the R2 head) — on hit, return the cached URL capless; on miss,
`reserveImageSlot()` then `/generate`. Race between exists-check and generate resolving to a
hit inside the Worker (`cached:true` response) refunds the reservation (`releaseImageSlot()`,
new, test-covered). KV/day counter and `max(local, worker)` recovery logic carry over from SRC
unchanged.

## 8. Client design — `apps/funny-multi-client`

### 8.1 RoundScreen: the combobox (FM-ANS-1..4)

Replaces the textarea. Control: a **single-select scrollable option list** (radio-group
semantics — `role="radiogroup"`, arrow-key navigation), rendered as large tap-target cards in
the design system's card style; this is the "combobox with predefined text" — tap to select,
tap Submit to confirm. No text input exists on the screen; no filtering/search (typing would
reintroduce a free-text affordance).

- Options: `pools[slot]` ids + display text in the **room language**; shuffled once per
  (player, round) with `Math.random` at render (FM-ANS-3).
- The joiner-only dual-display gloss (SRC spec §8/§9) is kept for the *question*; option texts
  render in room language only (v1) — a per-option gloss would double list height; revisit
  post-v1.
- Selection highlights the card (spring preset); Submit disabled until a selection exists
  (FM-ANS-4); submitted state keeps SRC's SubmitConfirm mascot overlay.
- 20–30-option prose slots scroll inside the list (ScrollBox component reused); visual slots
  (9–12) mostly fit one screen.

### 8.2 RevealScreen / RoomGallery: URL images

`reveal:pictureReady` now carries `PictureRef`. `<img src={url} width height>` with the SRC
fade-in flourish; explicit dimensions prevent layout shift. Retry flow, CAP_REACHED caption,
and error mascot unchanged. Gallery entries likewise.

### 8.3 Download / share

`downloadStory.ts` / `share.ts` composed the story card on a canvas from a base64 data URL.
Adapted: `fetch(picture.url)` → blob → `createImageBitmap` (Worker route sends CORS headers,
§7.2). Wobble video recording keeps only the CSS engine (`recordWobble.ts`); the
engine-selection UI and Lottie path are removed.

## 9. i18n (D-2, FM-POOL-2/3/5)

- UI catalogs: all 15 SRC `client/src/i18n/*.json` copied; keys added for the combobox
  (e.g. `round.pickOne`, `round.submitPick`) across all 15 files (machine-drafted + flagged
  where not en/ru).
- Server i18n: `QUESTIONS` and prose templates copied for all 15; stand-in arrays deleted. The
  per-language `imagePrompt` field SRC kept in each JSON is **dropped** (T-2.3): DD-4 replaces
  all 15 with one English skeleton built from pool fragments in `prompt.ts`, so a per-language
  template here would be dead weight that later drifts from the real builder.
- Room (content) language: any of the 15 — pools guarantee coverage by test (§4.2). **Until
  Phase 6 this is gated to `AUTHORED_LANGUAGES` (en, ru)** at room creation (T-2.3). Accepting
  a language whose texts land in T-6.2/T-6.3 would open a room that plays seven full rounds and
  then throws at reveal, with the whole story already written. `rooms.isValidLanguage`, the i18n
  boot check, and `POOL_TEXTS` all key off the same union, so Phase 6 widens them together.
- Prose rendering stays server-side (`renderProse` + polish pass), but **SRC's three render-time
  repair transforms are not carried** (T-2.3): the English slot-5 "for " prefix, the RU slot-1
  «и » prefix, and the RU slot-6 «это закончилось» prefix. All three repaired *free-typed input*;
  pool texts are authored to compose with each template directly, and `pools.test.ts` enforces
  exactly those authoring rules (`EN_WHY_CONNECTIVE`, `RU_WITH_PREPOSITION`,
  `RU_ENDING_MIN_WORDS`). `game.test.ts` re-derives SRC's own predicates and asserts no shipped
  text would trigger one, so the removal is a checked claim rather than an assumption.
- **Capitalisation is language-neutral** (T-2.3, carried over from T-1.5). SRC only polished
  Russian, so its English reveal opened lowercase. `polishProse(language, prose)` gives every
  language the opening capital, terminal period and space collapse; Russian additionally gets
  its clause commas via the copied `polishRussianProse`.
- es-419 / es-es are distinct pool text files (may start identical; regional review flagged).

## 10. Premium / entitlement (final phase — D-4, FM-TIER-2..4)

- **Polar** (merchant of record) sells the subscription and issues license keys; no card data
  or checkout in our code. Checkout link lives on the marketing surface (HUB later, README) —
  never in the client (FM-TIER-4).
- **Worker `POST /entitlement`** `{licenseKey}` → validate against Polar's license API →
  `200 {token}` where token = JWT `{sub: keyHash, tier:'premium', exp: now+24h}` signed
  HMAC-SHA256 with new secret `ENTITLEMENT_SECRET` (shared Worker↔server env var, distinct
  from `WORKER_SECRET`). Invalid/expired/refunded key → 403.
- **Client**: "I have a key" field on the Home screen (behind a small ⭐ affordance), stores
  the JWT in localStorage, sends it in `room:create` payload (new optional field
  `entitlementToken`). Key-redemption UI only — no prices, no buy language (CMP-5).
- **Server**: verifies JWT signature/expiry at room creation; a premium room sets
  `room.premium = true` → picture generation for that room bypasses the daily free cap and
  instead debits the **monthly fair-use counter**: Worker KV key `fu:<yyyy-mm>:<keyHash>`,
  incremented on actual generations only (cache hits free), ceiling 300/month (FM-TIER-2);
  at ceiling the room falls back to the free-tier cap behavior with a distinct message.
- Free-tier flow (daily cap + CAP_REACHED UX) is completely independent and ships phases
  earlier; premium only adds a bypass.

## 11. Environment variables

| Var | Where | Notes |
|---|---|---|
| `CLOUDFLARE_WORKER_URL` / `CLOUDFLARE_WORKER_SECRET` | server | as SRC |
| `WORKER_SECRET` | Worker | as SRC |
| `MAX_IMAGES_PER_DAY` (25) / `MAX_ROOMS` (500) / `ROUND_DURATION_MS` (60000) | server | as SRC |
| `DEPLOYER_DONATE_URL` | server | operator donate button, as SRC |
| `ENTITLEMENT_SECRET` | server + Worker | premium phase (§10) |
| `POLAR_ACCESS_TOKEN` | Worker | premium phase; license validation |

R2 bucket (`IMAGES`) and KV (`STATS_KV`) are wrangler.toml bindings, not env vars.

## 12. Store wrappers AND37/IOS37 (post-v1 sketch — FM-APP-*)

TWA (Bubblewrap) over the deployed origin for Android; Capacitor shell bundling the client
for iOS with the socket pointed at the production server. Both online-only; both reuse the
web PWA unmodified (FM-APP-4 keeps the client wrapper-safe). Detailed design deferred to the
post-v1 phase; nothing in v1 may preclude it.

## 13. Testing strategy

- **Unit (Vitest)**: rotation (first test in repo); pool validation suite (§4.2); room lifecycle
  (codes, capacity, nickname bounds, lobby-splice vs. in-game-botify — new here, SRC had no
  dedicated `rooms.ts` suite); rate-limiter refill arithmetic against an injected clock,
  including the across-the-boundary 2× case a fixed window would allow (§6, new code so no
  inherited coverage); prompt determinism (same ids → same string; snapshot the skeleton; length
  bound); cap semantics incl. cache-hit refund (§7.3); grammar.ts RU polish (SRC tests copied);
  i18n coverage (SRC `i18n/index.test.ts` pattern extended to pools).
  *Prompt determinism landed stronger than planned (T-4.2): the assembled prompt is pinned in
  full, all 10 000 visual combinations are walked for collisions and non-ASCII, and a prose slot
  is asserted **not** to change the prompt — the only guard on DD-3's ×22 cache factor. The
  length bound is checked against the pools rather than enforced by truncation.*
- **Server integration**: SRC `game.test.ts` family adapted to option ids — full 3–7 player
  simulated games asserting rotation placement, bot fills, INVALID_OPTION rejection,
  reveal payloads carrying resolved texts + PictureRef. Lobby events are driven over a real
  Socket.IO connection on an ephemeral port rather than by calling handlers directly, since the
  ack-vs-`error` split and broadcast fan-out are exactly what a direct call would not cover.
- **Client**: `i18n/catalogs.test.ts` (T-3.1) holds the UI catalogues to one key set, matching
  `{{interpolations}}` and full `ErrorCode` coverage, because i18next falls back to English
  without complaint and a missed key surfaces as one English button in a Russian game. The
  error-code half is a compile-time `Record<ErrorCode, true>`, so a code added to the socket
  contract fails `npm run typecheck` until both catalogues explain it.
  *Component tests were **ruled out at T-3.1 and ruled back in at T-3.2*** *— the earlier
  position was that the screens are copies and a render harness would be new machinery guarding
  copied markup. What changed is that the screens stopped being copies. Every client-side
  divergence from SRC is a consequence of a server decision taken in Phase 1 or 2 — the content-
  language picker narrowed to `AUTHORED_LANGUAGES` (T-2.3), `game:start` losing its payload
  (T-1.6), a rejected `room:create` reporting by `error` event and never acking (T-2.2) — and
  each is invisible in the markup, silent at runtime, and only observable by rendering the
  screen and driving it. Those are exactly the assertions that pay, and the same reasoning
  Gate 2 applied when it replaced its manual 3-tab run. Scope stays deliberately narrow:
  behaviour that encodes a cross-boundary contract, not markup or styling. Screens carried
  unchanged from SRC still get no suite of their own.*
- **Worker**: `cloudflare/worker.test.js` (T-4.1) drives `fetch(request, env)` against fakes for
  the three bindings — no miniflare, since the Worker's whole environment is those three objects.
  What it holds is the part that cannot be checked by looking at a picture: the cache key is
  pinned to a sha256 vector (a shifted key orphans every image ever generated), `cached` is
  asserted on both the hit and the hit-after-miss race that §7.3 refunds on, the daily counter is
  asserted **not** to move on a hit, and `steps` is pinned at 4 (spec §18 — the one edit here that
  costs money without failing anything).
- **Manual gates** (per SRC build-order discipline): dead-Worker error path;
  `MAX_IMAGES_PER_DAY=1` cap path; cache-hit path (same picks twice → second reveal instant,
  counter unchanged); phone PWA install; RU full game (declined texts read grammatically); RTL
  sanity for `he`.
  *The two-tab lobby test and the 3-tab full game are **no longer manual** (Gate 2, resolved
  2026-08-13): `index.test.ts` and `game.socket.test.ts` drive real Socket.IO clients against a
  real server, so both run in CI on every build. A manual run needed a stub client no task
  created, and would have been performed once; the automated one regression-guards the same
  behaviour permanently. Checks that genuinely need eyes — combobox layout, timer-bar
  animation, phone install — remain manual at Gate 3 and later.*
- **Acceptance** (Phase 8): SRC spec §19 checklist adapted to combobox + URL images, run on
  real Android + iOS phones.

## 14. Design decision log

| # | Decision | Why |
|---|---|---|
| DD-1 | Wire format is option **ids**, texts resolved server-side | Server-authoritative validation (FM-ANS-2); reveal/gallery stay wire-compatible with SRC screens; ids are language-neutral so the room language can differ from UI language |
| DD-2 | Client renders pools from the shared package instead of receiving options over the socket | Zero protocol growth; client+server deploy as one unit so versions cannot skew; shuffle stays client-local |
| DD-3 | Slot 3 out of the image prompt | Cache effectiveness: 9⁴–12⁴ combos instead of ×25 more; aligns with ONE-10's four visual slots |
| DD-4 | One English prompt fragment per option concept, shared by all 15 languages | One R2 cache for the whole world; adding a language costs translations only (FM-POOL-2) |
| DD-5 | Worker-served `/i/<hash>` URLs instead of base64 or public R2 bucket | MUL-2 socket-size mandate; CORS + immutable caching control; unguessable content-hash keys need no auth |
| DD-6 | Cache-exists check + reservation refund instead of reserve-always | Cache hits must not consume the daily cap (FM-TIER-1) while keeping SRC's no-overshoot guarantee |
| DD-7 | Combobox = tap-card radio list, no dropdown, no search | Phone-first tap targets; typing anywhere would reintroduce a free-text affordance |
| DD-8 | Filter/translate stack deleted rather than disabled | Dead code invites re-enabling half of it; FM-CPL-4 guards the future instead |
| DD-9 | Lottie recording engine dropped, `wobbleEngine` field removed from protocol | ARC-3 locks the stack (no Lottie); removing the field is the honest protocol |
| DD-10 | Premium as cap-bypass on the existing free path, not a parallel pipeline | Free tier ships and is testable phases earlier; premium risk isolated to the last phase (D-4) |
