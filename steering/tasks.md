# Funny Multi «Чепуха 37» — Tasks (steering)

| | |
|---|---|
| **Document** | `steering/tasks.md` |
| **Version** | 1.0 draft |
| **Date** | 2026-08-15 |
| **Status** | for review |
| **Progress** | Phases 0–8 complete; Phase 9 (commercial rails) **in progress** — paused 2026-09-20 by owner direction while two new fronts were planned (see `steering/funny-one-requirements.md`/`-design.md`/`-tasks.md` for the new product and this file's B-1/B-2 for the store apps, pulled forward), resumed 2026-09-27; owner decision 2026-09-29: finish Phase 9 before the store-app phases. Closed task blocks live in `steering/tasks-done.md`. Current state and next step: the RESUME HERE note at the foot of `docs/IMPLEMENTATION_LOG.md`. |
| **Build state** | Tracked per step in `docs/IMPLEMENTATION_LOG.md`. |

Execution plan for `steering/requirements.md` (FM-*) per `steering/design.md` (§, DD-*).
Discipline inherited from the source spec §16: **do phases in order, verify each phase's
gate before moving on**. SRC = `docs/source_project/monkeybus` (read-only; copy, never edit).

Sizing: (S) ≤ half a day · (M) about a day · (L) multiple days.

---

*Phases 0–6 (closed) live in `steering/tasks-done.md`.*

## Phase 7 — PWA + polish

- [ ] **T-7.1 (S)** PWA: manifest, icons, service worker, stale-cache reload strategy
      (`swReload.ts`); install test on a real iPhone and Android. → FM-NFR-1
      *Partly landed at T-3.1, which had to: a PWA will not install without a manifest and an
      icon, so `vite.config.ts` already carries the manifest, the NetworkFirst navigation
      strategy and the un-precached `index.html`, and `swReload.ts` is copied.
      **Icon work landed 2026-08-20:** `public/icon.svg` rewritten as a paths-only vector (no
      `<text>`/webfont dependency, which silently falls back to a system font when rasterized
      outside a page context); 180/192/512 PNGs pre-rendered once via a temporary local `sharp`
      install (never added to `package.json`) and committed as static files, since iOS ignores
      SVG for `apple-touch-icon` — `index.html` now points it at `icon-180.png`.
      *(Superseded 2026-08-20, Step 7: manifest `icons[]` briefly carried the SVG plus the PNG
      fallbacks; Chrome will not load an SVG manifest icon, so `icons[]` is now the 192/512 PNGs
      only, with `any` and `maskable` split onto separate entries, and `icon.svg` serves as the
      favicon via a new `rel="icon"` link.)* Real commissioned artwork deferred
      to Phase 8 polish (owner decision 2026-08-20); this hand-authored "37"-on-brand-cream mark
      is the placeholder until then.
      **Artwork landed early (2026-08-21, Steps 9–10):** the 180/192/512 PNGs are now SRC's
      commissioned mascot (owner decision 2026-08-20), and `index.html`'s favicon follows them
      (`icon-192.png`; SRC has no SVG of the mascot). `icon.svg` has no runtime consumer left —
      it survives only as the source for `deployer-logo.png` (the LogoStamp watermark, still the
      "37" mark). **Open flag:** the mascot's ears and hair sit outside the maskable safe zone,
      so Android's circular mask may clip them — owner decision 2026-09-14: judge on the real
      Android install rather than pad a `maskable`-only variant pre-emptively.
      **Android install run 2026-09-16 (device session, A2–A3):** installed and opened standalone
      at `/funny37-game/` on a real Android phone; the mascot's ears/hair clear the squircle mask
      cleanly. Getting there needed a real fix — the full-bleed art sat too close to the frame
      edge for the owner's comfort, so a dedicated `icon-512-maskable.png` (art shrunk to 80%,
      padded with its own background pink so the shrink reads as headroom, not a mismatched box)
      now backs the manifest's `maskable` entry; `icon-512.png` stays full-bleed for `any`. Also
      surfaced: Google Play Protect blocks the install as "Unsafe app" until "Install anyway" —
      logged as **B-8**, not fixed here.
      **Remaining for T-7.1:** the iPhone install leg — still needs a borrowed phone; stays open
      until then.*
- **Gate 7**: Chrome DevTools Application → Manifest → Installability panel passes (Lighthouse
  dropped its dedicated PWA audit category in v12, so this is its successor check); install
  confirmed on a real iPhone and Android; animation jank check passed on a real device.
  *Stays open across the Phase 7→8 boundary by owner decision 2026-08-20 — its three
  device-dependent legs (T-7.1 install test, T-7.3 jank check, this gate's own jank check) are
  folded into T-8.1's device session rather than blocking Phase 8's start.*
  **Installability leg passed 2026-08-20 (Step 7)** against
  https://funny-multi.onrender.com/: the Manifest panel is clean apart from the two optional
  "richer PWA install UI" screenshot notices, and Chrome offers the install affordance. Getting
  there needed a real fix — Chrome's manifest loader rejects `/icon.svg` outright (error
  survived a redeploy adding `width`/`height`, a warm hard reload, and Clear-site-data with the
  SW unregistered), so the manifest is PNG-only now and the SVG is the favicon.
  **Installability leg re-run 2026-09-15 (Step 13)** against
  https://www.staging-oursharedcode.com/funny37-game/ — D-5's new origin **and** sub-path
  scope: same clean result (only the two optional screenshot notices) and Chrome shows the
  install icon in the omnibox. The Render sign-off is superseded; the Render service is gone.
  **Android install + maskable-icon + jank legs passed 2026-09-16** (device session, A2–A4;
  `docs/ACCEPTANCE.md`) — see T-7.1/T-7.3 notes above for detail.
  **Still open:** the iPhone install leg (A1), deferred for lack of a phone this session; Gate 7
  closes once that runs.

## Phase 9 — Commercial: pre-generated library + support rails (final phase, D-6/D-7)

*Rewritten 2026-09-16; the Polar premium tasks that stood here were never started.*

- [ ] **T-9.4 (M)** Client: `SupportScreen` (Home ♥ + end screen), tap-to-copy with "Copied!",
      PayID registered-name line, Sponsors "choose one-time" hint, `lightning:` link + canvas
      QR, "voluntary gift, nothing owed" copy in 15 locales; hidden when no rail is set; gated
      off in store-shell builds. Tests: rows follow config, copy button, no rail → no ♥. → FM-TIER-4
      *Landed Step 44 (2026-09-29), everything above except "gated off in store-shell builds."
      QR via the existing `QRCode` component, not a new vendored canvas encoder (owner decision
      2026-09-29, reuse over vendoring — design §10.2 corrected). **Remaining:** the store-shell
      gate itself — no flag exists because no store shell exists yet; deferred to whichever of
      B-1/B-2 lands first (noted there).*
- **Gate 9**: library complete (`pregenerate --dry-run` reports 10⁴ in R2, 0 missing; a full
  game on production adds no Workers AI usage on the Cloudflare dashboard — reworded
  2026-10-02: production's `/stats` reads 0 always, `STATS_KV` being unbound, so "leaves
  `/stats` unchanged" could not fail); Support screen on desktop + Android: a real $1 PayID transfer arrives
  under the displayed name, a $1 one-time Sponsors payment arrives, a Lightning invoice paid
  from a second wallet arrives. The device pass is scripted in `docs/ACCEPTANCE.md` Part D.
  **Part D run 2026-10-01 (Step 49):** D1–D3 pass; D4 (Sponsors arrival) and D5(a) (QR
  payment from a second wallet) deferred — still owed before Gate 9 closes.
  **Library run 2026-10-02 (Step 50):** `--dry-run` reports 10,000 in R2, 0 missing; the
  full-game check against the dashboard is still owed.

## Post-v1 backlog (not scheduled)

- **B-1** AND37: TWA (Bubblewrap) wrapper + Play listing (12+, not Families) — FM-APP-1.
  **Pulled forward 2026-09-20** — owner wants store apps for both products now rather than
  post-v1; see `steering/funny-one-tasks.md` Phase S for the sequencing (developer-account
  enrollment under the existing ABN, then Funny Multi's shells, then Funny One's once it exists).
  Whichever of B-1/B-2 lands first also adds the store-shell build flag that gates T-9.4's
  `SupportScreen` off per FM-APP-3 (deferred there 2026-09-29 — no flag can mean anything before
  a shell build exists to gate).
- **B-2** IOS37: Capacitor shell + App Store listing; 4.2-risk mitigation review — FM-APP-2.
  **Pulled forward 2026-09-20**, same note as B-1.
- **B-3** Native-speaker review of the 13 machine-drafted pool languages (OD-F5).
- **B-4** Per-option gloss in joiner's UI language on the combobox (design §8.1 deferral).
- **B-5** Theme packs as pool extensions (pirates/space/dinosaurs — MON-3 mechanism, shared
  with future Funny One).
- **B-6** RuStore investigation (CMP-4); OD-F3 cap-granularity revisit; OD-F4 12+ revisit.
- **B-7** Optional AI Gateway / output classifier if the audience broadens (MODERATION.md
  operator guidance).
- **B-8** Google Play Protect shows "Unsafe app blocked — built for an older version of
  Android" on install, requiring "Install anyway" (seen 2026-09-16, A2). Likely the WebAPK's
  minified/unsigned nature reading as unrecognized rather than a real manifest defect —
  investigate `targetSdkVersion`-equivalent metadata and whether a TWA (B-1) sidesteps it.
- **B-9** Version 2 animated cartoon: animate the still client-side and export WebM via
  `MediaRecorder` (SRC's `VIDEO_GENERATION_ANALYSIS.md` option 2). Zero AI cost. Note DD-9
  dropped SRC's Lottie engine — reinstating it is a v2 decision, not a revert.
- **B-10** Further income options under D-6(e), each chargeback-free or platform-as-MoR:
  seasonal word packs (Christmas, Halloween, birthday) as free pre-generated content; Sponsors
  monthly tier → "Family Pass" badge (the only safe recurring rail); print-on-demand of a room's
  cartoon (POD platform is MoR); theme packs (B-5) unlocked by a one-time Sponsors tier; private
  branded instances for schools/venues by bank-transfer invoice; paid self-host setup/support;
  affiliate links in README/HUB only; the v2 animation export as the gift thank-you;
  grants/credits (Screen Australia games fund, Cloudflare/Oracle startup credits, Open
  Collective for language packs); ad network on «Чепуха 37» only — separate decision.

## Dependency notes

- Phases are strictly ordered 0→8; Phase 9 (commercial, D-6/D-7) requires only Gate 4
  technically and keeps the last slot that D-4 gave it, although D-4 itself is superseded.
- T-1.5 (en/ru pools) blocks Gate 1 but T-1.6 and Phase 2 tasks T-2.1/T-2.2 can proceed in
  parallel with it.
- T-6.3 (13 pool languages) is the largest content task; it can start any time after T-1.4
  freezes the id set.
