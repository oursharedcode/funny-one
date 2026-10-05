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
│   the owner's VM, on a host of its own (D-5, Step 60)           │
│                                                                   │
│   Local reducer:  seats (human/virtual) → round-robin turns →    │
│   rig compositor (background × character × co-character × prop  │
│   × when-badge × why-bubble × end-stamp) → gallery/end screen   │
│                                                                   │
│   No network needed (FO-IMG-2). No server of its own: no        │
│   Fastify, no Socket.IO, no secrets — nothing to leak. One      │
│   optional download: library pictures, if chosen (D-10).        │
└─────────────────────────────────────────────────────────────────┘
```

No server workspace exists for this product (FO-ARC-3). The only shared-infra touch point is
deploying the built static bundle under `/funny1-game` on the same domain D-5 already reserved
— that is a Caddy route addition, not a new process.

*Amended 2026-10-05:* the bundle is now served at the root of its own host,
`https://www.funny1.oursharedcode.com/` (Step 60, §4) — still a Caddy site block, not a new
process. A second touch point is optional and read-only: the picture library's public
`GET /i/<hash>.png` on Funny Multi's Worker (D-10, §6).

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
- **Amended 2026-10-05 (Step 60; D-5 as amended 2026-10-03):** the game is served at the root of
  its own host — `FO_HOST` (`www.funny1.oursharedcode.com`), with `FO_APEX` redirecting to it —
  by the same Caddy; the build uses `BASE_PATH=/`. Entry files (`index.html`, `sw.js`, the
  manifest) are `no-cache`; `/assets/*` is immutable. The former address keeps working: on the
  old host every `/funny1-game…` request is a 301 to the new host, except `/funny1-game/sw.js`.
  A browser that played at the old address holds the whole game in its cache and never asks the
  server for a page, so a redirect alone would not reach it. It does re-fetch its service
  worker, and that file is now a retiring worker (`deploy/origin-root/funny1-retired/sw.js`):
  it deletes the old caches, unregisters itself and reloads the page into the 301. Checked in
  Chromium against local copies of both layouts — the old game opened from its cache, and the
  browser was on the new host about 6 s later. Not checked in Safari or Firefox. A home-screen
  install made from the old address must be removed and installed again from the new one.

## 5. Store packaging (AND37/IOS37-style, for later — see `funny-one-tasks.md` Phase S-3)

Because Funny One is fully self-contained and network-independent (FO-IMG-2), it is in a
*stronger* position than Funny Multi for both a TWA (Android) and a Capacitor shell (iOS):
the App Store 4.2 "minimum functionality" risk that Funny Multi's shell accepts (FM-APP-2)
does not apply the same way to a game that plays identically with the network off. One new
requirement neither product has yet: a live `.well-known/assetlinks.json` under
`/funny1-game` for Android's Digital Asset Links verification — not yet set up anywhere in
`deploy/`.

**Amended 2026-10-05 (owner decision):** no iPhone app is built for either game — too costly
(`tasks.md` B-2). This section now describes the Android TWA alone, and the App Store 4.2
comparison above is history. On an iPhone Funny One is the web app in Safari, played from the
same service-worker cache; checked in the WebKit engine but not yet on a device (`tasks.md`
B-14).

**Amended 2026-10-05 (Step 60, S-3b):** the game has an origin of its own, so `assetlinks.json`
is at the origin root, where Android looks for it:
`deploy/origin-root/funny1/.well-known/assetlinks.json`, published together with the privacy
policy (`/privacy`) by `deploy/ship-funny-one.sh`. Package `com.oursharedcode.funny1`. The TWA
project is `deploy/android-funny1/` (Bubblewrap, as in `deploy/android/`). It is signed with the
same upload key as Funny Multi's app — the agent's choice, open to the owner
(`deploy/android-funny1/README.md`).

## 6. Pictures from the Internet (D-10)

- **The choice.** Home shows a two-option radio group, *Built in* / *From the Internet*
  (`screens/HomeScreen.tsx`), only when the build has `VITE_PICTURES_URL` (`pictureSource.ts`,
  `onlinePicturesAvailable()`). The pick is kept in `localStorage['funny-one.pictures']`; no
  stored pick means *Built in*.
- **The address.** `libraryPictureUrl(story)` is
  `<VITE_PICTURES_URL>/i/<sha256(buildPrompt(story))>.png`. `buildPrompt` moved from Funny
  Multi's server into `packages/shared` (`prompt.ts`), so both products compute one prompt, and
  so one key, from the same four visual answers; the server re-exports it. The library holds all
  10⁴ combinations (D-7, `steering/design.md` DD-11).
- **On screen.** `components/StoryPicture.tsx` draws a square frame with a pulsing placeholder
  and the `<img>`. On an error, after 12 s, with no address, or when `navigator.onLine` is
  false, it draws the rig instead, with the reveal the rig would have had — at once in the
  offline case.
- **Export.** `rigExport.ts` draws the library picture only for a story whose picture reached
  the screen (`StoryGallery` passes its address). The fetch has an 8 s limit, and any failure
  falls back to the rig export. The notice in the footer and on the export switches to
  `footer.contentNoticeOnline`, which names the AI-drawn library.
- **Service worker.** Unchanged: it precaches the game and does not store cross-origin
  pictures, so an offline game always shows the rig.
- **Deploy.** `deploy/ship-funny-one.sh` reads `CLOUDFLARE_WORKER_URL` from the VM's `.env` and
  passes it to the build as `VITE_PICTURES_URL`. That address is public — it is in every
  picture link Funny Multi shares. The Worker secret is never read by that script and never
  reaches the client.
- **Not done, on purpose:** no prefetch during play, no call to `/generate` (nothing is ever
  generated for Funny One), no stand-in generation for a missing picture, no storing of library
  pictures for offline use.
