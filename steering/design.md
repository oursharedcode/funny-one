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
├── cloudflare/
│   ├── worker.js                 # rewritten — §7.2 (SRC worker.js as starting point)
│   └── wrangler.toml             # + R2 bucket binding, KV binding
├── docs/                         # existing requirement docs + read-only source_project
└── steering/                     # this document set
```

`apps/hub` and `apps/funny-one` are added by later products; workspace globs (`apps/*`,
`packages/*`) already cover them.

## 3. Reuse map (SRC → this repo)

Legend: **copy** = as-is (path/import fixes only) · **adapt** = meaningful edits · **drop** = not carried.

| SRC path | Action | Notes |
|---|---|---|
| `shared/languages.ts` | copy | 15-language registry, exhaustiveness sentinel |
| `shared/events.ts` | adapt | payload deltas in §5 |
| `server/src/index.ts` | adapt | socket wiring kept; remove filter imports; option validation |
| `server/src/rooms.ts` | copy | room lifecycle, codes, rate limits |
| `server/src/game.ts` | adapt | rotation kept (extracted to shared); submit/auto-fill/prompt paths change (§6) |
| `server/src/game*.test.ts` | adapt | rewrite answer fixtures to option ids |
| `server/src/image.ts` | adapt | Worker returns JSON `{url,width,height,cached}`; cap skips cache hits (§7.3) |
| `server/src/prompt.ts` | adapt | deterministic builder (§7.1); STYLE_SUFFIX kept verbatim (spec §22 lock) |
| `server/src/stats.ts` | copy | live stats broadcast |
| `server/src/grammar.ts` (+test) | copy | RU prose punctuation polish still applies |
| `server/src/i18n/*` | adapt | QUESTIONS + prose templates kept; stand-in lists removed |
| `server/src/translate.ts` | **drop** | replaced by pre-authored prompt fragments |
| `server/src/filter/**` | **drop** | FM-ANS consequences table; no untrusted text remains |
| `server/src/env.ts` | adapt | new env vars (§11) |
| `client/src/App.tsx`, `socket.ts`, `i18n/*` (15 catalogs), `swReload.ts`, `version.ts`, `sourceUrl.ts` | copy | phase routing, UI catalogs, PWA reload |
| `client/src/screens/HomeScreen/LobbyScreen/WaitingScreen/EndScreen` | copy | unchanged flows |
| `client/src/screens/RoundScreen.tsx` | adapt | textarea → combobox (§8.1) |
| `client/src/screens/RevealScreen.tsx` | adapt | image by URL + dimensions (§8.2) |
| `client/src/components/**` (TimerBar, PlayerList, QRCode, ProseText, RoomGallery, ShareButton, ScrollBox, SourceFooter, LogoStamp, art/*) | copy | design-system implementation (FM-ARC-4) |
| `client/src/styles/*` | copy | tokens + motion presets |
| `client/src/prose.ts`, `downloadStory.ts`, `share.ts` | adapt | fetch image URL → blob (CORS) instead of base64 (§8.3) |
| `client/src/recordWobble.ts` | copy | CSS engine only |
| `client/src/recordWobbleLottie.ts` | **drop** | ARC-3: no Lottie |
| `client/src/capReset.ts`, `videoFooter.ts` | copy | cap UX helpers, share footer |
| `client/src/screens/Test*` | drop v1 | dev-only harnesses; re-add on demand |
| `cloudflare/worker.js` | adapt | R2 cache + serve routes (§7.2) |
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

`index.ts`: same socket wiring minus filter imports; nickname rules, rate limits, room caps,
grace-window botification all per SRC (FM-CORE-3/4).

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

### 7.2 Cloudflare Worker — `cloudflare/worker.js` (FM-IMG-3)

Bindings: `AI`, `STATS_KV` (existing), **new** `IMAGES` (R2 bucket). All routes except
`/i/*` require `X-Secret`.

- `GET /generate?prompt=…` → `hash = hex(sha256(prompt))`; `IMAGES.head('i/'+hash+'.png')`:
  - **hit** → `200 {url, width, height, cached:true}` — no AI call, no KV bump.
  - **miss** → Flux Schnell (4 steps, never raise), decode, `IMAGES.put` with
    `contentType: image/png`, bump daily KV counter (best-effort, as SRC), return
    `{url, width, height, cached:false}`. Flux output is 1024×768 by default; dimensions are
    read from the request parameters we send (fixed), not parsed from bytes.
  - `url` = `https://<worker-host>/i/<hash>.png` (Worker-served; R2 egress is free, and the
    Worker route lets us set headers without a public bucket).
- `GET /i/<hash>.png` → stream from R2 with `Cache-Control: public, max-age=31536000, immutable`,
  `Access-Control-Allow-Origin: *` (needed by canvas download/share, §8.3). No secret — URLs
  are unguessable (content-hash keyed) and images contain no user data (FM-IMG-4).
- `GET /stats` → unchanged from SRC.
- `POST /entitlement` → premium phase, §10.

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
- Server i18n: `QUESTIONS` and prose templates copied for all 15; stand-in arrays deleted.
- Room (content) language: any of the 15 — pools guarantee coverage by test (§4.2).
- Prose rendering stays server-side and identical to SRC (`renderProse` + RU polish); the RU
  «и» slot-1 prefix rule carries over; pool texts are authored to compose with each
  language's template (e.g. RU slot-1 options all start with «с/со» so no synthetic prefix
  is needed — this authoring rule is enforced by a regex in the pool tests).
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

- **Unit (Vitest)**: rotation (first test in repo); pool validation suite (§4.2); prompt
  determinism (same ids → same string; snapshot the skeleton; length bound); cap semantics
  incl. cache-hit refund (§7.3); grammar.ts RU polish (SRC tests copied); i18n coverage
  (SRC `i18n/index.test.ts` pattern extended to pools).
- **Server integration**: SRC `game.test.ts` family adapted to option ids — full 3–7 player
  simulated games asserting rotation placement, bot fills, INVALID_OPTION rejection,
  reveal payloads carrying resolved texts + PictureRef.
- **Manual gates** (per SRC build-order discipline): two-tab lobby test; 3-tab full game;
  dead-Worker error path; `MAX_IMAGES_PER_DAY=1` cap path; cache-hit path (same picks twice →
  second reveal instant, counter unchanged); phone PWA install; RU full game (declined texts
  read grammatically); RTL sanity for `he`.
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
