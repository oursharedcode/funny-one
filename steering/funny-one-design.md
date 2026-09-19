# Funny One «Семейная Чепуха» — Design (steering)

| | |
|---|---|
| **Document** | `steering/funny-one-design.md` |
| **Status** | draft — companion to `steering/funny-one-requirements.md` (FO-\*), D-8 |

## 1. Architecture — no server, by decision (D-8)

```
┌─────────────────────────────────────────────────────────────────┐
│ apps/funny-one-client — React 18 + Vite + Tailwind + Framer      │
│   Motion PWA, fully static, deployable from any static host or  │
│   the same Oracle VM's Caddy at /funny1-game (D-5)               │
│                                                                   │
│   Local reducer:  seats (human/virtual) → round-robin turns →    │
│   rig compositor (background × character × co-character × prop) │
│   → gallery/end screen                                          │
│                                                                   │
│   Zero runtime network calls (FO-IMG-2). No Worker, no R2,       │
│   no Fastify, no Socket.IO, no secrets — nothing to leak.        │
└─────────────────────────────────────────────────────────────────┘
```

No server workspace exists for this product (FO-ARC-3). The only shared-infra touch point is
deploying the built static bundle under `/funny1-game` on the same domain D-5 already reserved
— that is a Caddy route addition, not a new process.

## 2. Reuse map (vs. `apps/funny-multi-client`)

| Source | Treatment | Note |
|---|---|---|
| `packages/shared` pools/i18n/`rotation.ts` | **copy, unmodified** | FO-ARC-1 — same content, same 15 languages |
| `apps/funny-multi-server/src/grammar.ts` + i18n prose rendering | **promote into `packages/shared`** | FO-ARC-2 — real refactor (T-FO-2.1), both apps import the shared version afterward |
| `styles/motion.ts` presets | **copy, unmodified** | reused for the rig reveal (FO-IMG-3) |
| `components/{TimerBar,ScrollBox,SourceFooter,LogoStamp,art/*}` | **copy, unmodified** | design-system parity between the two products |
| `RoundScreen`'s combobox | **adapt** | same control, no per-room-language "joiner" concept — just the next local seat |
| `RoomGallery` → `StoryGallery`, end screen | **adapt** | same layout, no multi-device fan-out to strip (there never was any beyond per-player) |
| `App.tsx` phase machine | **new, local** | Funny Multi's phases are driven by socket events; Funny One's are driven by local reducer actions — a rewrite of that one piece, not a copy |
| `HandoffScreen` | **new** | nothing in Funny Multi does this — players never share a device there |
| Rig compositor | **new** | no equivalent anywhere in the current codebase; the one genuinely new system this product needs |
| Virtual-seat "thinking" delay | **new** | Funny Multi's bots resolve server-side with no UI delay; Funny One needs a comedic pause to read as a "turn" (archive ONE-4) |

`apps/hub` stays out of scope (D-1, unaffected by this document).

## 3. Rig compositor (the one new system)

- Rig assets are layered images (background, character, co-character, prop), composed at
  render time into one scene — CSS/SVG layering, not a canvas render, so it stays cheap on
  low-end Android (FM-NFR-2's device-tier bar applies here too, even without an FM-\* id of its
  own).
- Reveal order and spring timing reuse `motion.ts`'s existing presets (`goofy`/`snappy`) rather
  than inventing a second animation vocabulary.
- Asset budget: archive's ambition was ≥ 50k combinations from ≤ 2 MB of art — a target to
  re-set once real rig art exists, not a hard v1 gate.
- Dedup (FO-IMG-4): track picks already used this session per slot, same exclusion rule the
  pool/bot logic already uses elsewhere (FO-BOT-1) — no new algorithm, same pattern.

## 4. PWA / deploy

- Full precache service worker: every asset gameplay needs (client bundle + entire rig asset
  set) is cached on install; the acceptance test (T-FO-7.1) is a real airplane-mode playthrough,
  not just a Lighthouse installability check.
- Deploy target: `/funny1-game` sub-path on the existing production domain (D-5), served as
  static files by the same Caddy instance already fronting Funny Multi — no new Docker
  container, no new secret, no new attack surface.

## 5. Store packaging (AND37/IOS37-style, for later — see `funny-one-tasks.md` Phase S-3)

Because Funny One is fully self-contained and network-independent (FO-IMG-2), it is in a
*stronger* position than Funny Multi for both a TWA (Android) and a Capacitor shell (iOS):
the App Store 4.2 "minimum functionality" risk that Funny Multi's shell accepts (FM-APP-2)
does not apply the same way to a game that plays identically with the network off. One new
requirement neither product has yet: a live `.well-known/assetlinks.json` under
`/funny1-game` for Android's Digital Asset Links verification — not yet set up anywhere in
`deploy/`.
