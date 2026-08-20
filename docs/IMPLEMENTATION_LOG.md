# Implementation log — Funny Multi «Чепуха 37»

Session journal. The end-of-session ritual appends one entry per closed task
(`## Step N — title (date)`, **Shipped:** / **Owed:**); the RESUME HERE note at the foot
names the next step. Task blocks: `steering/tasks.md` (active) ·
`steering/tasks-done.md` (closed).

## Backfill — Phases 0–6 (2026-08-12 → 2026-08-16)

Logged retroactively at phase granularity when this log was created (2026-08-20).
Per-task closure notes are in `steering/tasks-done.md`; commit-level detail in git history.
Step numbering starts at Step 1 with the first entry after this backfill.

- **Phase 0 — repo bootstrap** (Gate 0, 2026-08-12). Monorepo skeleton, npm workspaces, CI;
  `npm install` clean, CI green on the empty skeleton.
- **Phase 1 — packages/shared** (Gate 1, 2026-08-12). Rotation formula, answer-pool schema,
  canonical option ids and prompt fragments, hand-authored en/ru pools, socket contract
  adapted to option ids + URL pictures.
- **Phase 2 — server core** (Gate 2, 2026-08-13). Rooms/lobby, round flow with option-id
  answers and reveal prose, disconnect rules (grace window, botification, host migration);
  Gate 2 automated as a full 7-round game over real sockets; i18n coverage tests (T-2.5).
- **Phase 3 — client core** (Gate 3, 2026-08-13, device session logged 2026-08-15).
  Vite/Tailwind/PWA bootstrap with phase routing, Home + Lobby, RoundScreen combobox,
  WaitingScreen + §17 transition lock.
- **Phase 4 — image pipeline** (Gate 4, 2026-08-13→15). R2-cached image Worker,
  deterministic prompt builder, reserve/refund + reveal wiring; device-session results logged.
- **Phase 5 — gallery, end, share** (Gate 5, 2026-08-16). Server stats broadcast, room
  gallery + EndScreen, download/share adapted to URL images; Gate 5 run on two real phones.
- **Phase 6 — 15-language breadth** (Gate 6, 2026-08-16). All 15 languages authored and
  wired (T-6.1–T-6.3); spot-checks (T-6.4) scripted a real RU/zh/he game each through the
  actual render pipeline — RU declined grammar and he RTL structure both read correctly, and
  the check itself caught and fixed two bugs (a zh/ja double-terminal-punctuation bug in
  `ensureTerminalPeriod`, and `he` RTL combobox mirroring never having been
  logical-property-safe).
- **Build state at backfill**: typecheck / lint / format / `npm test` all green locally —
  614 tests across 4 workspaces (82 shared + 307 server + 186 client + 39 worker);
  `npm audit` 0 vulnerabilities; Phase 6 push (`676fd45`) CI green (run 31933503352,
  2026-08-16).

---

~~**RESUME HERE (2026-08-20).** Next: **T-7.1 (S)** — PWA install. Manifest, service worker
and `swReload.ts` already landed at T-3.1; remaining per the task block: replace the
placeholder `public/icon.svg` with real artwork, decide whether to ship raster 192/512
icons alongside it, and run the real-device install test on iPhone + Android (the part
that was never automatable). Gate 7 = Lighthouse PWA installable + animation jank check
on a real device. No blockers; CI is green through the Phase 6 push.~~ *(carried — see
Step 1 below.)*

## Step 1 — T-7.1 PWA icons: paths-only SVG + pre-rendered rasters (2026-08-20)

**Shipped:** Hand-authored `public/icon.svg` as a paths-only vector — the previous
placeholder relied on `<text font-family="Fredoka">`, which silently falls back to a
system font when rasterized outside a page context, so anything derived from it would
have carried that bug forward. Pre-rendered 180/192/512 PNGs from the new SVG via a
temporary local `sharp` install (never added to `package.json`/lock; removed after use)
and committed them as static files under `public/`. Wired `index.html`'s
`apple-touch-icon` to `icon-180.png` (iOS ignores SVG there) and the PWA manifest's
`icons[]` to the SVG plus 192/512 PNG fallbacks, all `any maskable`. Updated Gate 7's
wording in `steering/tasks.md`: Lighthouse dropped its dedicated PWA audit category in
v12, so Gate 7 now names the Chrome DevTools Application → Manifest → Installability
panel as the successor automated check. Verified with a production build that
`manifest.webmanifest` and all icon files land correctly in `dist/`.
Owner decisions this session: hand-authored placeholder art now, real commissioned
artwork deferred to a Phase 8 polish item; PNGs pre-rendered once and committed rather
than adding a rasterizer to the client build; Gate 7's automated leg is the DevTools
Installability panel; the real-device install test is deferred to T-8.1's Render deploy
rather than standing up a throwaway HTTPS tunnel, since both service-worker registration
and PWA install require a secure context that the LAN setup used for Gates 3–5 doesn't
have.
**Owed:** T-7.1 stays open — the real-device install test on iPhone + Android (DevTools
Installability panel + both real installs) against the production URL once T-8.1 deploys.

---

~~**RESUME HERE (2026-08-20).** Next: **T-7.2 (M)** — design-system pass: motion presets on
all transitions (forward-only), mascot triggers (waiting/timer/submit/reveal
flourish/end/error), reduced-motion, wordmark, SourceFooter + LogoStamp
(FM-ARC-4, FM-CPL-3). T-7.1's remaining piece (real-device install test) is parked on
T-8.1's deploy per Step 1 above and doesn't block T-7.2. No other blockers; CI is green
through the Phase 6 push (`676fd45`) — this session's Step 1 has not been pushed yet.~~
*(carried — see Step 2 below.)*

## Step 2 — T-7.2 design-system pass: LogoStamp, motion/mascot audit (2026-08-20)

**Shipped:** Audited the four T-7.2 legs against the actual client. Three were already
correctly landed during Phases 3–6 and needed no code change: motion presets (`snappy`/
`goofy`/`panic`/`screenSlide`) are applied everywhere framer-motion is used except one
deliberate exception; all six mascot triggers (waiting, timer, submit, reveal flourish,
end, error) render at their correct screens; `Wordmark` and `SourceFooter` both exist and
are wired. Documented `PictureFlourish`'s one non-preset tween (a fixed duration/ease,
copied verbatim from SRC) as the intentional exception the "do not invent a fourth
[preset]" note in `motion.ts` allows for — a spring's overshoot is wrong for a one-shot
outward particle burst.
The one real gap was `LogoStamp`: didn't exist yet. Ported from
`SRC/client/src/components/LogoStamp.tsx` (a 25×25 absolutely-positioned branding overlay,
display-only, not baked into picture pixels) and wired into `RevealScreen` and
`RoomGallery`, both of which already had the `position: relative` picture wrapper it
needs. Its bundled `/deployer-logo.png` didn't exist in this repo either — rasterized a
placeholder from `public/icon.svg` at 25×25 via the same temporary local `sharp` install
pattern as the T-7.1 icons (never added to `package.json`; removed after use). Updated
`recordWobble.ts`'s stale comment: its T-5.1 best-effort stamp-fetch logic now has a real
asset to find instead of always 404ing. Added RTL coverage in `RevealScreen.test.tsx` and
`RoomGallery.test.tsx` asserting the stamp's presence when a picture exists and absence
when it doesn't.
Owner decisions this session: SRC read for `LogoStamp.tsx` confirmed in scope (design.md
classes it "copy"); the stamp is an in-app overlay only — `downloadStory.ts`'s exported
PNG keeps its existing QR-only branding unchanged, no stamp added to the download/share
path.
**Owed:** none — T-7.2 closed in full; its task block moved to `steering/tasks-done.md`.
*Full suite: typecheck, lint, `prettier --check` clean; 616/616 tests (client 188 [+2],
server 307, shared 82, cloudflare 39), run directly outside the sandbox; `npm audit` 0
vulnerabilities. No regressions.*

---

**RESUME HERE (2026-08-20).** Next: **T-7.3 (S)** — perf check on mid-range Android: 60 fps
animations and reveal payload sizes (URL-only) verified in DevTools (FM-NFR-2/4). The
payload-size leg can run from DevTools alone; the 60 fps animation leg needs a real
mid-range Android device, same real-device constraint as T-7.1's install test and Gate 7's
jank check — worth deciding together whether to fold it into the T-8.1 deploy's
device-session pass rather than a separate one. T-7.1 still has its real-device install
test open, parked on T-8.1 per Step 1. No other blockers; CI is green through the Phase 6
push (`676fd45`) — Steps 1–2 (this session and last) have not been pushed yet.
