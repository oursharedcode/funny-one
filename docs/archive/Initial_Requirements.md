# Funny Family — Requirements

Version: 0.1 draft · Date: 2026-08-11 · Status: for review Umbrella brand: **Funny Family** (RU draft: «Семейная Чепуха» — ⚑ needs approval) Binding sources, in order: this document → FUNNY\_STORIES\_SPEC → DESIGN\_SYSTEM → MODERATION.md. Requirement levels: **MUST** / **SHOULD** / **MAY**. Open items are collected in §12.

---

## 1\. Product family

| ID | Offering | EN name | RU name (exact, binding) | Form |
| :---- | :---- | :---- | :---- | :---- |
| HUB | Landing site | Funny Family | ⚑ «Семейная Чепуха» | Static site on the product domain |
| ONE | Single-device | Funny One | «Одна Чепуха» | Browser PWA, offline after first load |
| MUL | Multi-device | Funny Multi | «Чепуха 37» | Web client \+ Socket.IO server (existing spec) |
| AND | Android app | Funny One | «Одна Чепуха» | Google Play (packaging: see OD-1) |
| IOS | iPhone app | Funny One | «Одна Чепуха» | App Store (packaging: see OD-1) |

Naming notes:

- «Одна Чепуха» — double meaning: *one* device, and the idiom "одна чепуха" (all the same nonsense). Keep both readings in store copy.  
- «Чепуха 37» — the "37" encodes the player range **3–7**. Store copy must explain it once.

---

## 2\. Shared foundation (ARC)

- **ARC-1 (MUST)** Single monorepo, npm workspaces: `apps/hub`, `apps/funny-one`, `apps/funny-multi-client`, `apps/funny-multi-server`, `packages/shared`.  
- **ARC-2 (MUST)** `packages/shared` contains: rotation formula (+ its unit tests, written before any UI, per build order), fixed answer pools, rig SVG assets, i18n resources, mascot components. Both games consume the same rotation code.  
- **ARC-3 (MUST)** Tech stack per FUNNY\_STORIES\_SPEC §2, locked. Graphics: SVG \+ CSS \+ Framer Motion only. No Lottie, no Rive, no video, no WebGL, no sound in v1.  
- **ARC-4 (MUST)** Motion and look are governed by DESIGN\_SYSTEM (goofy spring presets, idle/reaction animations on waiting, timer last-10 s, submit, reveal, end screens).  
- **ARC-5 (MUST)** i18n: react-i18next only; `en` and `ru` ship day one. Missing RU strings are drafted and flagged ⚑, never skipped. RU prose respects Russian word order.  
- **ARC-6 (MUST)** Character art is a **layered SVG rig** (head / torso / arm / leg / props / backgrounds). Existing PNGs (`head.png` 156², `torso.png` 140×190, `arm.png` 36×144, `leg.png` 44×156, `monkey_preview.png`) are prototypes to be vectorized. Colors via CSS variables so palette variants cost zero assets.  
- **ARC-7 (MUST)** Toolchain: Vitest, ESLint strict (@typescript-eslint), Prettier (100 chars), npm, one GitHub Actions workflow (typecheck \+ lint \+ test). No deploy automation in v1.

---

## 3\. Hub site (HUB)

- **HUB-1 (MUST)** One product domain (name: OD-5). Routes: `/` chooser, `/one`, `/multi`, language toggle en/ru.  
- **HUB-2 (MUST)** The chooser presents exactly two cards — Funny One ("play now on this phone, works offline") and Funny Multi ("3–7 phones, live room") — plus store badges once AND/IOS ship.  
- **HUB-3 (MUST)** Static hosting on Cloudflare Pages (free tier, unlimited egress).  
- **HUB-4 (SHOULD)** OpenGraph preview images in the house rig style for link sharing.  
- **HUB-5 (MUST)** No analytics beyond Cloudflare's built-in aggregate stats. No cookies.

---

## 4\. Funny One — «Одна Чепуха» (ONE)

### 4.1 Concept

- **ONE-1 (MUST)** Pass-and-play story game on a single device in the browser. Kid-safe by construction: every answer is chosen from fixed preloaded pools; free text does not exist anywhere in this product.

### 4.2 Players

- **ONE-2 (MUST)** Participants: 3–7 total, of which humans 1–7 and virtual players 0–6, at least 1 human (mix rule default, see OD-6).  
- **ONE-3 (MUST)** Quick start: one tap creates "me \+ 2 virtual players" (covers the solo case from the product brief with zero setup).  
- **ONE-4 (MUST)** Virtual player behavior: uniform random pick from the slot's pool, excluding answers already taken in this round; resolved instantly, displayed with a 0.8–1.5 s "thinking" mascot animation for comedy.  
- **ONE-5 (MUST)** Virtual players have mascot identities (rig variants) and names from a fixed bilingual list in `packages/shared`.

### 4.3 Flow

- **ONE-6 (SHOULD)** Handoff mode default: **per-player block** — each human answers all questions in one sitting, then passes the device (N−1 handoffs total). Alternative per-question round-robin: OD-7.  
- **ONE-7 (MUST)** Handoff interstitial: "Pass to {name}" full-screen with mascot animation; nothing from previous turns is visible; next player taps "I'm {name} — go".  
- **ONE-8 (SHOULD)** Timer off by default; optional per game.  
- **ONE-9 (MUST)** Reveal: stories assembled by the shared rotation formula; each story's picture appears with the spring-assembly animation (ONE-15).

### 4.4 Content

- **ONE-10 (MUST)** Question set: the classic 7 slots. Four are **visual** (who, with whom, where, doing what) and drive the picture; three are text-only (when, why, how it ended).  
- **ONE-11 (MUST)** Visual-slot pool sizes 9–12 each; text-only slots 20–30 each.  
- **ONE-12 (MUST)** Russian answers are authored **pre-declined for their slot's case** (с кем → instrumental, где → prepositional, etc.). This is the decisive advantage of fixed pools in Russian and is non-negotiable; the RU prose template is built around it, not ported slot-for-slot from English.

### 4.5 Pictures

- **ONE-13 (MUST)** Zero live generation and zero network image operations. Scenes are composed on device from the layered rig: background × character × co-character × prop.  
- **ONE-14 (MUST)** Visual combination space ≥ 50 000 with total rig assets ≤ 2 MB (reference target: 24 heads × 10 bodies × 20 backgrounds × 15 props \= 72 000).  
- **ONE-15 (MUST)** Reveal animation: parts fly in and settle with the goofy spring preset; idle sway/blink afterwards. Transform/opacity only, 60 fps on mid-range Android Chrome.  
- **ONE-16 (MUST)** In-round dedup: no two stories in the same round may render the identical full visual combo.

### 4.6 Offline and data

- **ONE-17 (MUST)** PWA with service-worker precache of the entire app; fully playable with zero network after first load; no runtime network calls during gameplay.  
- **ONE-18 (MUST)** No accounts, no analytics, no third-party requests, self-hosted fonts. The store listing and privacy statement say plainly: **nothing leaves the device**. This is the product's strongest parent-facing claim and collapses the COPPA/GDPR-K surface.  
- **ONE-19 (MUST)** No server component exists for this product. Game state is in-memory; resume-after-close is a MAY for post-v1.

### 4.7 Performance

- **ONE-20 (MUST)** First-load bundle ≤ 5 MB total (assets ≤ 2 MB); interactive ≤ 3 s on 4G mid-range Android; all targets verified on Android Chrome and iOS Safari.

---

## 5\. Funny Multi — «Чепуха 37» (MUL)

- **MUL-1 (MUST)** Core game \= FUNNY\_STORIES\_SPEC unchanged and locked: 3–7 humans, one device each, room code \+ QR, Socket.IO rooms, free-text answers, in-memory state only, **disconnect \= bot, no reconnect**.  
- **MUL-2 (MUST)** Image delivery change: the Worker stores generated PNGs in R2 keyed by prompt hash; sockets carry the image **URL \+ dimensions, never base64**. Cuts peak socket traffic from \~1.35 MB to \~250 B per reveal (\~30 KB per game total on the socket); repeated prompts cost zero neurons forever.  
- **MUL-3 (MUST)** Free tier: existing per-room daily cap (`CAP_REACHED` flow stays). Premium tier: marketed "unlimited", enforced as a fair-use ceiling of 300 cartoons / month (worst-case cost ≈ $1.50 at \~$0.005/image).  
- **MUL-4 (MUST)** Player answers pass to the prompt verbatim — never translated, never rewritten. Safety per MODERATION.md.  
- **MUL-5 (MUST)** Audience positioning 12+; web-first product; never appears inside the kids store listings.

---

## 6\. Android app (AND)

- **AND-1 (SHOULD)** The Play listing ships **Funny One only** (kids-safe, offline, Families-compliant, Teacher Approved candidate). Funny Multi stays web-first — its viral loop is the shareable room link. Revisit post-launch (OD-2).  
- **AND-2 (MUST)** Packaging default: **TWA** (Bubblewrap) over the same PWA — one codebase, offline via the same service worker, updates without store review. The brief says "native app"; literal Kotlin would violate the locked stack and triple the client codebases → interpretation flagged as OD-1.  
- **AND-3 (MUST)** Billing: Play Billing via Digital Goods API \+ Payment Request API (Chrome 101+ inside TWA). SKUs per §8. Server-side verification is impossible (ONE has no server) → entitlements via `listPurchases()` on device; see MON-5 honesty note.  
- **AND-4 (MUST)** Play Families compliance: parental gate before any purchase entry point; purchases live outside the child gameplay flow; no urgency/scarcity copy; IAP declared in the listing; **no ads** (MON-1).  
- **AND-5 (MUST)** Production gate: new personal developer accounts (created after 2023-11-13) need a closed test with **12 opted-in testers for 14 consecutive days** before applying for production (review ≤ \~7 days). Mitigations, start immediately: (a) open the closed test on an early build — TWA content updates don't reset the clock; (b) or register an organization account (ABN is same-day and free in AU, D-U-N-S free, \~1 month) which is exempt entirely.  
- **AND-6 (MUST)** Target API 36 (Android 16\) — Play deadline for new apps 2026-08-31; set in the wrapper's `build.gradle` from day one.

---

## 7\. iPhone app (IOS)

- **IOS-1 (MUST)** No TWA on iOS → **Capacitor shell with all assets bundled inside the app** (true offline; also the strongest position against App Review Guideline 4.2 "minimum functionality" — this is a self-contained game, not a website wrapper).  
- **IOS-2 (MUST)** Purchases through StoreKit (Capacitor IAP plugin), same SKU set as Android. No external purchase links or "buy on the web" language anywhere in the app.  
- **IOS-3 (MUST)** If listed in the Kids category: no third-party analytics/ads SDKs — satisfied by construction (ONE-18).  
- **IOS-4 (SHOULD)** Same parental-gate pattern as AND-4.

---

## 8\. Monetization (MON)

- **MON-1 (DECIDED — MUST)** **No advertising anywhere, ever, in any SKU.** Rationale in §11 item 5 (\~$30–60/mo at 1 000 DAU vs losing Teacher Approved, parent ratings, the share loop, and zero ad revenue from RU; MARKETING\_ANALYSIS §8 already bans it).  
    
- **MON-2 (MUST)** Rails by platform:


| Platform | Product | Rail |
| :---- | :---- | :---- |
| Android (TWA) | ONE packs/unlock | Play Billing (Digital Goods API) |
| iOS | ONE packs/unlock | StoreKit IAP |
| Web | MUL premium | Merchant-of-record license key (Polar) |
| Web | ONE | Free (packs are store-app only in v1) |
| Russia | everything | Free in v1 (OD-8) |


- **MON-3 (MUST)** SKUs:  
    
  - Theme packs $1.99 (pirates, space, dinosaurs, New Year): each pack \= new rig parts \+ new answer entries in `packages/shared`.  
  - "Full unlock" one-time non-consumable: all base content open.  
  - Funny Multi premium (web): default subscription $2.99/mo or $19.99/yr as Family Pass; one-time alternative under OD-3.  
  - Live-AI-cartoon add-on stays a Funny Multi premium feature — it sells something qualitatively different from the free tier, not "more of the same".


- **MON-4 (MUST)** All purchase UI sits behind a parental gate, on screens a child never reaches mid-game, with no urgency copy.  
    
- **MON-5 (MUST, honesty)** The repo is AGPL and all content ships in the open; store purchases are **convenience and support, not DRM**. Documented plainly in README. No secrets in clients; no Play Integrity theater for ONE.  
    
- **MON-6 (MUST)** Funny Multi entitlement: one Worker endpoint `/entitlement` accepting a Polar license key (v1) and returning a 24 h signed JWT. Entitlement state lives at the MoR; only the monthly fair-use counter touches KV (exception request: OD-4).  
    
- **MON-7 (MUST)** No hardcoded donation/payment/sponsor URLs in any built client. Author support \= GitHub Sponsors in README.md only.

---

## 9\. Compliance and distribution (CMP)

- **CMP-1 (MUST)** License AGPL-3.0; the repo is the product. Rig art lives in-repo under the same license.  
- **CMP-2 (MUST)** Play: Families policy self-certification, content rating "Everyone", IAP declared, data-safety form \= "no data collected" for ONE.  
- **CMP-3 (MUST)** Start the Play closed test (or the org-account registration) **before** feature work continues — it is the only non-compressible 14-day item on the critical path (AND-5).  
- **CMP-4 (MUST)** Russia: Google Play billing has been unavailable to RU users since 2022 and seller payouts since 2024; AdSense is gone since 2024\. RU users get the web products free in v1; RuStore is a post-launch investigation.  
- **CMP-5 (MUST)** External-purchase links: permitted in-app only where Play's external offer programs apply (US/UK/EEA); in AU and most markets the app may show a "I have a key" field only — no price, no buy button, no purchase language.  
- **CMP-6 (MUST)** Privacy statements: ONE — zero collection; MUL — transient in-memory processing only, nothing stored after the room dies.

---

## 10\. Non-goals for v1

No sound. No Lottie/Rive/video/WebGL. No reconnect (disconnect \= bot). No database, ORM, Redis, or persistence layer (sole candidate exception: OD-4 KV counter). No accounts. No ads. No auto-translation of player answers. No Turnstile/fingerprinting/quota layers (free-tier-abuse work is deferred post-launch). No deploy automation. No flat 7 000-image pre-generated library (superseded by the rig — archived in §11 item 6, revivable if OD-9 reopens).

---

## 11\. Decision record — summary of the source chat (2026-08-11)

1. **Payments to Cloudflare are structurally impossible** — CF has no end-user billing; you sell access to your Worker. Five models compared: Play Billing subscription (TWA \+ Digital Goods API), two separate apps, BYO Cloudflare account, consumable packs, MoR license key. Cost basis: Flux Schnell ≈ 300–600 neurons/image at $0.011/1 000 → **≈ $0.005 per cartoon**; \~5 subscribers cover all infra ($5 Workers Paid \+ $7 Render).  
2. **"Unlimited" must be a marketing word, not a code path** — fair-use ceiling 300/mo makes earnings risk-free.  
3. **Russia needs its own answer**: Play billing (2022), seller payouts (2024) and AdSense (2024) are all dead there → RU rail is web-key, RuStore, or free.  
4. **Play production gate**: 12 testers × 14 consecutive days for new personal accounts; org accounts exempt (AU route: ABN \+ D-U-N-S ≈ 1 month); target API 36 by 2026-08-31; TWA lets development continue while the 14-day clock runs.  
5. **Ads rejected** for the kids product: ≈ $30–60/mo at 1 000 DAU with COPPA-limited formats, vs losing Teacher Approved, parent ratings, the share loop, and any RU revenue; equals \~20 subscribers. MARKETING\_ANALYSIS §8 already forbids it.  
6. **User proposal — 7 000 pre-generated images, zero live gen**: viable (9⁴ \= 6 561 combos ≤ 7 000; \~350 MB WebP; R2 free with zero egress; ≈ $50 generation \+ ≈ 8 h mandatory human review; birthday-paradox repeats from \~95 images). Verdict: right instinct for the kids SKU, wrong for the main game.  
7. **Layered rig beats the flat library** on every measured axis: ≥ 72 000 combos, ≈ 2 MB assets, \~1 h review (70 parts, not 7 000 scenes), pack extension \= \+10 files, and — decisive under the "maximum funny" mandate — it animates with spring physics. Part prototypes already exist in the repo.  
8. **"Offline" clarified**: the multi-device game can never be offline (server-held state); pre-composed images only cut traffic 1.4 MB → 30 KB/game. **True offline exists only in a single-device mode with no server at all** — zero infra cost, zero data leaves the phone, COPPA surface collapses. That insight became **Funny One**.  
9. **This document** splits the product into: hub \+ Funny One («Одна Чепуха», single device, rig, offline, kids) \+ Funny Multi («Чепуха 37», 3–7 phones, live AI images, existing spec) \+ Android and iPhone store apps carrying Funny One.

---

## 12\. Open decisions (defaults apply unless overridden)

| ID | Question | Default |
| :---- | :---- | :---- |
| OD-1 | "Native app" literal (Kotlin/Swift) or wrapper? | Wrapper: TWA (Android), Capacitor (iOS) — one codebase, locked stack respected |
| OD-2 | Store apps carry Funny One only, or Multi too? | Funny One only in v1 |
| OD-3 | Multi premium: subscription or one-time? | Subscription $2.99/mo / $19.99/yr (5–8× LTV; adds RTDN webhooks) |
| OD-4 | KV exception for the fair-use counter? | Grant, scoped to the billing Worker only |
| OD-5 | Product domain name | — (proposals wanted) |
| OD-6 | Player-mix rule | 3 ≤ humans+virtual ≤ 7, humans ≥ 1, virtual ≤ 6 |
| OD-7 | Handoff mode | Per-player block (N−1 handoffs) |
| OD-8 | RU monetization | Free in v1; RuStore billing post-launch |
| OD-9 | Flat 7 000-image library fully dropped? | Yes — rig only; idea archived in §11.6 |
| OD-10 | Umbrella RU brand «Семейная Чепуха» | ⚑ Drafted, needs approval |

