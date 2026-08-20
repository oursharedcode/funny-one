# Funny Multi «Чепуха 37» — Requirements (steering)

| | |
|---|---|
| **Document** | `steering/requirements.md` |
| **Version** | 1.0 draft |
| **Date** | 2026-08-12 |
| **Status** | for review |

**Binding order** (highest wins):
1. Product-owner decisions of 2026-08-12 (recorded in §2)
2. This document
3. `docs/archive/Additional_requirements_strong.md` and `docs/archive/Initial_Requirements.md`
4. Source project spec: `docs/source_project/monkeybus/docs/FUNNY_STORIES_SPEC_v4.md` (v4.34.1)
5. `docs/source_project/monkeybus/docs/DESIGN_SYSTEM.md`
6. `docs/source_project/monkeybus/docs/MODERATION.md`

Requirement levels: **MUST** / **SHOULD** / **MAY**. Open items collected in §12.

The source project (`docs/source_project/monkeybus`, "Funny Stories") is a complete, working
implementation of the free-text version of this game. It is **read-only reference material**:
its files are never modified. Its code, spec, and assets are reused into this repository
wherever they fit (see `design.md` for the reuse map).

---

## 1. Product identity

- **FM-ID-1 (MUST)** The product is **MUL — Funny Multi**, RU name (exact, binding) **«Чепуха 37»**:
  a browser-based party game for **3–7 humans, one phone each**, in a live room
  (room code + QR), with a Socket.IO server. "37" encodes the player range 3–7; store/marketing
  copy must explain this once.
- **FM-ID-2 (MUST)** Audience positioning **12+**, web-first. Never appears inside kids store
  listings (source: MUL-5). See OD-F4 for a possible post-v1 revisit now that all content is curated.
- **FM-ID-3 (MUST)** Core loop: each player answers 7 silly questions about a story they cannot
  see; stories rotate every round; at the end every player sees their assembled story as prose
  and an AI-generated goofy cartoon of it.

## 2. Scope decisions (product owner, 2026-08-12)

These four decisions were taken explicitly and govern the rest of this document:

| # | Decision |
|---|---|
| D-1 | **Scope**: steering docs plan **Funny Multi only**, but inside the family monorepo layout (ARC-1) — `apps/funny-multi-client`, `apps/funny-multi-server`, `packages/shared` — so Funny One and the HUB site can be added later without rework. |
| D-2 | **Languages**: **all 15 source-project languages** ship in v1 (en, fr, de, ru, id, it, zh, ja, ko, pt-br, es-419, es-es, uk, he, ta). Answer pools are authored for every one of them (en + ru are the hand-authored references; the other 13 are machine-drafted and flagged for native review, mirroring the source project's `needs-<code>-review` convention). Note: the source registry contains 15 languages, not 16. |
| D-3 | **Store apps AND37/IOS37**: specified now (§10), **built post-v1**. Resolves the conflict between `Additional_requirements_strong.md` (must-have, packaging "??") and Initial_Requirements AND-1/OD-2 (web-first) in favor of web-first for v1. |
| D-4 | **Premium tier**: **in scope for v1, as the final build phase** — started only after the core game is playable end-to-end on real phones. |

## 3. The defining change: no free text in answers

- **FM-ANS-1 (MUST)** Players answer every question by **selecting one option from a predefined
  combobox** (a single-select control listing predefined texts). **Free-text answer input does
  not exist anywhere in this product.** This deliberately overrides the source spec's
  textarea (spec §1, §17 "Answer textarea") and Initial_Requirements MUL-1's "free-text answers"
  / MUL-4's verbatim-free-text clause.
- **FM-ANS-2 (MUST)** Answer selection is **server-authoritative**: the client submits an option
  **identifier**, never text; the server validates the identifier against the slot's pool and
  rejects anything else. A hand-crafted socket message must not be able to inject text.
- **FM-ANS-3 (MUST)** Option order in the combobox is **shuffled per player per round**, so the
  room does not converge on the first list item.
- **FM-ANS-4 (MUST)** Submit is enabled only after a selection. Timer expiry auto-fills a random
  option (same mechanism as bots, FM-BOT-2). There is no empty answer.
- **FM-ANS-5 (MUST)** Humans may pick the same option as another player (picks are blind and
  simultaneous). Identical full stories therefore may occur and simply share the same cached
  cartoon; this is accepted behavior.

**Consequences — machinery of the source project that is removed** (rationale: with curated
pools there is no untrusted text anywhere in the content path):

| Removed from source | Replacement |
|---|---|
| Profanity filter stack (`server/src/filter/` — 15 language matchers, `standins.ts`) | None needed: pool texts are curated at authoring time |
| Answer→English translation layer (`server/src/translate.ts`) | Each pool option carries a pre-authored English prompt fragment (`design.md` §pools) |
| CSAM-pattern guard and hard-block list on prompts (`filter/csam.ts`, `filter/hardBlocks.ts`) | Prompts are assembled exclusively from curated fragments; server validates every pick (FM-ANS-2) |
| Bot stand-in phrase lists | Bots pick random pool options (FM-BOT-2) |
| Free-text answer UI (textarea, 70-char counter) | Combobox (FM-ANS-1) |
| Lottie share-video engine (`recordWobbleLottie.ts`, `wobbleEngine` protocol field) | CSS wobble engine only — ARC-3 locks the stack to SVG + CSS + Framer Motion, no Lottie |

**Free text that remains:** the player **nickname** (3–20 chars, trimmed, per spec §17). It is
shown only to the room, never enters prose or image prompts, and keeps the source rule of
no profanity filter on nicknames.

## 4. Shared foundation

- **FM-ARC-1 (MUST)** Single monorepo, npm workspaces, family-ready layout per ARC-1:
  `apps/funny-multi-client`, `apps/funny-multi-server`, `packages/shared`, plus the root
  `cloudflare/` Worker (deployed separately, not a workspace — source convention). `apps/hub`
  and `apps/funny-one` are reserved for later products and are not created in v1.
- **FM-ARC-2 (MUST)** `packages/shared` contains: the rotation formula **with its unit tests
  written before any UI** (build order, ARC-2), the fixed answer pools, the language registry,
  and the socket event contract. Future family products consume the same rotation code and pools.
- **FM-ARC-3 (MUST)** Tech stack inherited from the source project and locked (spec §2):
  TypeScript, React 18 + Vite + Tailwind + Framer Motion + socket.io-client (client);
  Node 20 + Fastify + Socket.IO (server); Cloudflare Worker + Workers AI Flux Schnell (images).
  Graphics: SVG + CSS + Framer Motion only — no Lottie, no Rive, no video, no WebGL, no sound.
- **FM-ARC-4 (MUST)** Motion and look are governed by the source `DESIGN_SYSTEM.md`
  (goofy spring presets, mascot library, idle/reaction animations, timer behavior, reveal
  flourish, end-screen mascots). The source client's `components/art/*` and `styles/motion.ts`
  are reused.
- **FM-ARC-5 (MUST)** Toolchain per ARC-7: Vitest, ESLint strict (@typescript-eslint), Prettier
  (100 chars), npm, one GitHub Actions workflow (typecheck + lint + test). No deploy automation.
- **FM-ARC-6 (MUST)** License **AGPL-3.0-only**; the repo is the product; no secrets in clients
  (MON-5, CMP-1).

## 5. Functional requirements — game

Everything in this section is inherited from the source spec v4 unless marked **(changed)**.

### Rooms and lobby
- **FM-CORE-1 (MUST)** Create room → 6-char code from the unambiguous 32-char alphabet,
  shareable link `/?room=<CODE>` + QR. Join by code or link with nickname. Host starts the game
  with ≥ 3 players; room capacity 7.
- **FM-CORE-2 (MUST)** Room state is **in-memory only** (`Map<code, Room>`) on one Node process.
  No database, no Redis, no persistence of room state (spec architecture; see FM-IMG-3 for the
  only durable artifacts).
- **FM-CORE-3 (MUST)** Disconnect handling per spec §7: a short connection-state-recovery grace
  window tolerates brief drops; beyond it, **disconnect = bot, no reconnect**. Host is notified
  (`player:lost`). Lobby-phase leavers are simply removed; host migration per spec.
- **FM-CORE-4 (MUST)** Rate limits and capacity per spec §17: `room:create` 5/IP/min,
  `room:join` 30/IP/min, max rooms per process 500 (`MAX_ROOMS` override), nickname 3–20 chars.
  *Note (T-2.2): the source project specifies these limits and ships the `RATE_LIMITED` error
  code and its 15 translations, but never implemented the limiter — this is net-new code here,
  not inherited. Per-IP bucketing depends on `x-forwarded-for`; see OD-F9.*

### Rounds and rotation
- **FM-CORE-5 (MUST)** 7 questions in the source order (Who? / And who else? / Where? / When? /
  What did they do? / What for? / What happened in the end?), localized per room language.
- **FM-CORE-6 (MUST)** Story rotation formula `storyIndex(P, R, N) = (P − R + N) mod N`,
  identical to the source implementation, covered by unit tests before UI work starts.
- **FM-CORE-7 (MUST)** 60-second round timer (env-tunable `ROUND_DURATION_MS`), timer bar UI,
  round advances when all submitted or the timer expires.
- **FM-CORE-8 (MUST, changed)** The round screen presents the question and the slot's
  **combobox** (FM-ANS-1..4) instead of a textarea.

### Bots
- **FM-BOT-1 (MUST)** Bot slots (disconnected players) are auto-filled at round start; a
  mid-game disconnect auto-fills the current round after the grace window.
- **FM-BOT-2 (MUST, changed)** Bot/timeout auto-fill = **uniform random pick from the slot's
  pool**, excluding options already used for the same slot by other stories in this room this
  round when pool size allows (mirrors ONE-4's exclusion rule).

### Reveal, pictures, gallery, end
- **FM-CORE-9 (MUST)** Reveal: each player receives their own assembled story as localized
  prose (per-language prose templates from the source, Russian offline punctuation polish kept),
  with their 7 answers highlighted inline.
- **FM-IMG-1 (MUST)** Each story gets a goofy AI cartoon: Flux Schnell via the Cloudflare
  Worker, 4 steps, locked style suffix (spec §22 — never modified without a major version bump).
  Generation is auto-triggered on reveal; bot-owned stories are generated server-side so the
  gallery has no gaps.
- **FM-IMG-2 (MUST, changed)** Image prompts are **deterministic**: assembled from the picked
  options' pre-authored **English prompt fragments** (visual slots) in a fixed English skeleton +
  style suffix. No translation step, no prompt-time moderation. Identical picks in any room, in
  any language, produce the identical prompt.
- **FM-IMG-3 (MUST, changed — MUL-2)** The Worker stores generated PNGs in **R2 keyed by prompt
  hash**; sockets carry the image **URL + dimensions, never base64**. A repeated prompt is served
  from R2 with **no AI call and no cap slot consumed** — repeated prompts cost zero neurons
  forever. (Cuts peak socket traffic from ~1.35 MB to ~250 B per reveal, ~30 KB per game.)
- **FM-IMG-4 (MUST)** Because prompts derive only from curated pool fragments, stored images
  contain **no user-generated content**. This is what makes durable R2 storage compatible with
  the privacy posture (FM-CPL-2).
- **FM-CORE-10 (MUST)** Room gallery per spec §24: host shares all stories + pictures to every
  player; self-heals as late pictures arrive; per-story download; share flow (Web Share API)
  with the **CSS** wobble recording engine only (FM-ANS consequences table).
- **FM-CORE-11 (MUST)** End screen per spec: host gets "One more game" (requires all non-bot
  players ready and ≥ 3 non-bots) and "Finish game" (pre-bundled finale image). Restart drops
  bots and reuses the room.
- **FM-CORE-12 (MUST)** Home-screen server stats (open rooms, images generated today / limit)
  per spec §13/§26, including the live `stats:update` broadcast.

## 6. Content — answer pools

- **FM-POOL-1 (MUST)** 7 pools, one per question slot. Slot types:
  - **Visual slots** — 0 (who), 1 (who else), 2 (where), 4 (what did they do): **9–12 options
    each**; each option carries an English image-prompt fragment.
  - **Prose-only slots** — 3 (when), 5 (what for), 6 (how it ended): **20–30 options each**;
    no prompt fragment. *(Deliberate deviation from the source prompt template, which included
    slot 3 in the picture — dropping it aligns with ONE-10's four visual slots and keeps the
    visual combination space small enough for the R2 cache to be highly effective:
    9⁴–12⁴ ≈ 6.5k–20k distinct pictures.)*
- **FM-POOL-2 (MUST)** Options are **concept-aligned across languages**: one canonical option id
  → one English prompt fragment → 15 localized display texts. Adding a language = translating
  display texts only; the image prompt (and thus the R2 cache) is shared by all languages.
- **FM-POOL-3 (MUST)** Russian display texts are authored **pre-declined for their slot's
  grammatical case** (с кем → instrumental, где → prepositional, etc.) so the assembled prose is
  grammatical without runtime morphology (ONE-12; non-negotiable). The RU prose template is built
  around this, not ported word-for-word from English. Other inflected languages follow the same
  authored-for-the-slot principle.
- **FM-POOL-4 (MUST)** Every option's display text ≤ 70 characters in every language (keeps the
  source prose/display invariants). Validation tests enforce: full 15-language coverage of every
  id, uniqueness of ids and of texts within a slot+language, length cap, prompt-fragment
  presence for visual slots.
- **FM-POOL-5 (MUST)** en and ru pools are hand-authored references. The other 13 languages ship
  machine-drafted with a `needs-<code>-review` marker awaiting native-speaker review — drafted,
  flagged, never skipped (ARC-5 discipline applied to pools).
- **FM-POOL-6 (SHOULD)** Pool content is family-friendly and absurd-funny in the spirit of the
  source game; no option may name real people or brands.

## 7. Tiers and monetization

- **FM-TIER-1 (MUST)** **Free tier**: playable by anyone; AI generation limited by the existing
  operator-tunable daily cap (`MAX_IMAGES_PER_DAY`, default 25, UTC reset, reserve-before-await,
  KV-backed recovery after server restarts). Cap-reached UX (`CAP_REACHED` "cartoon oven is
  full" flow) is kept as-is. R2 **cache hits bypass the cap** — a capped room can still receive
  already-cached cartoons.
- **FM-TIER-2 (MUST)** **Premium tier** (v1, final phase — D-4): marketed "unlimited cartoons",
  enforced as a fair-use ceiling of **300 generated cartoons / month** per license
  (cache hits don't count). Default pricing $2.99/mo or $19.99/yr "Family Pass" (OD-3 default).
- **FM-TIER-3 (MUST)** Entitlement per MON-6: one Worker endpoint `/entitlement` accepting a
  **Polar license key** and returning a **24 h signed JWT**; the game server honors the JWT by
  lifting the daily cap for that room. Entitlement state lives at the merchant of record (Polar);
  only the monthly fair-use counter touches Cloudflare KV (OD-4 exception, scoped to the Worker).
- **FM-TIER-4 (MUST)** In-app purchase UI is **key-redemption only** ("I have a key" field) —
  no prices, no buy buttons, no purchase language in the client (CMP-5 posture for all markets).
  No hardcoded donation/payment/sponsor URLs in any built client (MON-7); author support =
  GitHub Sponsors in README only. The deployer-controlled `DEPLOYER_DONATE_URL` end-screen
  button (a source-project *operator* feature, not an author link) is kept.
- **FM-TIER-5 (MUST)** No advertising anywhere, ever (MON-1). Russia: web product free in v1
  (OD-8, CMP-4).
- **FM-TIER-6 (MUST)** Purchases are convenience and support, **not DRM** (MON-5): the repo is
  AGPL and self-hosters get everything; documented plainly in README.

## 8. Non-functional requirements

- **FM-NFR-1 (MUST)** Mobile-first UI per spec §8; phones are the target device; works in
  Android Chrome and iOS Safari; PWA installable (manifest + service worker + stale-cache
  reload strategy per spec §13).
- **FM-NFR-2 (MUST)** Socket payloads for reveals carry URLs, not image bytes (FM-IMG-3 target:
  ~250 B per reveal, ~30 KB per game on the socket).
- **FM-NFR-3 (MUST)** Server: single Render web service (starter plan) serving both the Socket.IO
  API and the built client statics; single Cloudflare Worker + R2 bucket + KV namespace.
  Docker (single-stage node:20-alpine) as the self-hosting alternative. Free-tier self-hosting
  stays possible (README deploy buttons pattern from the source).
- **FM-NFR-4 (MUST)** Animations use transform/opacity only, 60 fps on mid-range Android Chrome
  (design-system constraint); reduced-motion preference honored.
- **FM-NFR-5 (SHOULD)** Image generation p50 within ~10 s on a warm Worker; R2 cache hit
  delivers in < 1 s. Worker call timeout 15 s with 2 retries (source values).

## 9. Privacy, compliance, moderation

- **FM-CPL-1 (MUST)** License AGPL-3.0 for all code and pool content in this repo (CMP-1).
- **FM-CPL-2 (MUST)** Privacy statement (CMP-6, strengthened by the combobox change): room
  state is transient in-memory processing only and dies with the room; **no user-generated text
  ever reaches storage, AI models, or other rooms**. The only durable artifacts are AI images
  derived entirely from pre-authored pool content (FM-IMG-4) and anonymous usage counters.
  No accounts, no analytics, no third-party requests from the client, self-hosted fonts.
- **FM-CPL-3 (MUST)** Moderation posture (replaces most of source `MODERATION.md`): safety is
  achieved **by construction** — curated pools, server-validated picks (FM-ANS-2), locked style
  suffix steering output away from photorealism. The operator-responsibility model and the
  in-game source footer (spec §27) are kept; the known "hallucinated signature squiggle"
  artefact remains a documented, accepted artefact.
- **FM-CPL-4 (MUST)** The removal of input moderation must be re-evaluated if free text is ever
  reintroduced anywhere (this is a standing guard for future changes).

## 10. Store apps AND37 / IOS37 (specified now, built post-v1 — D-3)

- **FM-APP-1 (MUST, post-v1)** AND37: Google Play listing for Funny Multi. Proposed packaging:
  **TWA (Bubblewrap)** over the deployed web app — same codebase, updates without store review.
  Target API level per current Play deadline at build time. Content rating 12+; never in the
  Families/kids program (FM-ID-2).
- **FM-APP-2 (MUST, post-v1)** IOS37: App Store listing. Proposed packaging: **Capacitor shell**
  with the client bundle inside the app. The game is **online-only** (server-held rooms) — the
  shell must present as a genuine game to pass App Review Guideline 4.2 ("minimum functionality");
  this risk is accepted and revisited at build time.
- **FM-APP-3 (MUST, post-v1)** Store-app purchases, if any, follow MON-2 rails (Play Billing /
  StoreKit) with the same key-only web fallback rules (CMP-5). Not designed further in v1.
- **FM-APP-4 (MUST)** v1 web client must not depend on anything that would block wrapping later
  (no popup-only flows; share/download features degrade gracefully inside webviews).

## 11. Non-goals for v1

No free-text answers (defining change). No accounts, auth, database, ORM, Redis, or job queue.
No reconnect (disconnect = bot). No sound. No Lottie/Rive/video/WebGL. No ads. No analytics.
No translation at runtime (neither answers nor prompts). No deploy automation. No Turnstile /
fingerprinting / quota layers beyond the caps in §7. No RuStore (post-launch investigation).
No Funny One, no HUB site, no store apps in the v1 build (D-1, D-3). No pre-generated flat
image library (the R2 cache fills organically; OD-9 stays closed).

## 12. Open decisions

| ID | Question | Default until decided |
|---|---|---|
| OD-F1 | Product domain name (docs OD-5) | Placeholder `<domain>`; deploy on Render subdomain |
| OD-F2 | Final AND37/IOS37 packaging (docs "??") | TWA + Capacitor as proposed in §10 |
| OD-F3 | Daily-cap granularity: docs MUL-3 says "per-room daily cap", source implements process-global | Keep process-global (matches the account-wide Neuron budget); revisit with premium telemetry |
| OD-F4 | Revisit 12+ positioning now that all content is curated (affects AND37/IOS37 rating) | Stay 12+ (MUL-5) |
| OD-F5 | Native-speaker review completion for 13 machine-drafted pool languages | Ship flagged `needs-<code>-review`; review post-launch |
| OD-F6 | Premium one-time purchase alternative (docs OD-3) | Subscription $2.99/mo / $19.99/yr |
| OD-F7 | Umbrella RU brand «Семейная Чепуха» approval (docs OD-10) | Not needed for MUL v1; HUB concern |
| OD-F8 | ESLint 8.57.1 is end-of-life; ESLint 9 requires a flat-config migration that discards the `.eslintrc.json` copied from SRC (T-0.2) | Stay on ESLint 8 (no advisories against it); revisit before v1 ships |
| OD-F9 | FM-CORE-4's per-IP buckets key on `x-forwarded-for`'s **first** hop (spec §17). That header is client-settable, so a caller can choose — and rotate — its own bucket key and evade the limit. Correct trust depends on the deployed proxy chain, which is not fixed until T-8.1 (T-2.2) | Ship spec §17 behavior rather than diverge silently; make the trusted-hop count configurable and count from the proxy-appended end at T-8.1, and correct DEPLOYMENT.md, which inherits SRC's claim that this already works |

## 13. Traceability

| This doc | Source |
|---|---|
| FM-ID-* | Initial_Requirements §1, MUL-5; Additional_requirements_strong §1 |
| FM-ANS-* | Product-owner brief 2026-08-12 (combobox override of MUL-1/MUL-4); ONE-1 analogue |
| FM-ARC-* | ARC-1..7; spec §2, §3 |
| FM-CORE-* | spec §1, §4, §5, §7, §13, §17, §24, §26 |
| FM-BOT-* | spec §7, §17; ONE-4 |
| FM-IMG-* | MUL-2; spec §10, §11, §15, §22 |
| FM-POOL-* | ONE-10..12 adapted to MUL; ARC-2, ARC-5 |
| FM-TIER-* | MUL-3; MON-1..7; OD-3, OD-4, OD-8; spec §11, §17 |
| FM-NFR-* | spec §8, §13, §14; MUL-2; DESIGN_SYSTEM |
| FM-CPL-* | CMP-1, CMP-5, CMP-6; MODERATION.md; spec §27 |
| FM-APP-* | Additional_requirements_strong (AND37/IOS37); AND-2/AND-3, IOS-1/IOS-2 as packaging precedent |
