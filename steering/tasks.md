# Funny Multi «Чепуха 37» — Tasks (steering)

| | |
|---|---|
| **Document** | `steering/tasks.md` |
| **Version** | 1.0 draft |
| **Date** | 2026-08-15 |
| **Status** | for review |
| **Progress** | Phases 0–9 complete (Gate 9 closed 2026-10-03). Next: the Android store-app phase (B-1, pulled forward 2026-09-20; B-2, the iPhone app, was cancelled 2026-10-05 — an iPhone uses the web app, B-14; see `steering/funny-one-requirements.md`/`-design.md`/`-tasks.md` for Funny One). Closed task blocks live in `steering/tasks-done.md`. Current state and next step: the RESUME HERE note at the foot of `docs/IMPLEMENTATION_LOG.md`. |
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
  closes once that runs. *(2026-10-05: with B-2 cancelled the web app is the only way an iPhone
  plays, so the same borrowed-phone session also runs B-14's short device list.)*

## Phase 9 — Commercial: pre-generated library + support rails (CLOSED 2026-10-03, Gate 9)

*Closed task blocks and Gate 9 live in `steering/tasks-done.md`. The one clause left over —
T-9.4's "gated off in store-shell builds" — travels with whichever of B-1/B-2 lands first
(filed as **B-1c**, 2026-10-03).*

## Post-v1 backlog (not scheduled)

- **B-1** AND37: TWA (Bubblewrap) wrapper + Play listing (12+, not Families) — FM-APP-1.
  **Pulled forward 2026-09-20** — owner wants store apps for both products now rather than
  post-v1; see `steering/funny-one-tasks.md` Phase S for the sequencing (developer-account
  enrollment under the existing ABN, then Funny Multi's shells, then Funny One's once it exists).
  Whichever of B-1/B-2 lands first also adds the store-shell build flag that gates T-9.4's
  `SupportScreen` off per FM-APP-3 (deferred there 2026-09-29 — no flag can mean anything before
  a shell build exists to gate).
  **Started 2026-10-03 (Step 54)** — owner decisions and enrollment state are in that log entry;
  the work beyond this text is filed as B-1a–B-1e, to be done in that order (B-1e runs in
  parallel). Package id `com.oursharedcode.funny37` — permanent once published.
- **B-1a** — **closed 2026-10-04 (Step 55)**, block in `steering/tasks-done.md`. Funny Multi
  is live at `https://www.funny37.oursharedcode.com/`; the old `/funny37-game` path forwards.
- **B-1b** — **closed 2026-10-04 (Step 57)**, block in `steering/tasks-done.md`. Origin-root
  privacy policy and `/.well-known/assetlinks.json` live on `FM_HOST`, served by Caddy itself.
- **B-1c** — **closed 2026-10-04 (Step 58)**, block in `steering/tasks-done.md`. The Support
  screen is hidden inside the Android store app, on production; this closes T-9.4's FM-APP-3
  clause.
- **B-1d** — **closed 2026-10-05 (Step 59)**, block in `steering/tasks-done.md`. The Android TWA
  is built, signed, and installed on the owner's phone; every check passed, including B-8's.
- **B-1e (owner)** Play developer account — organization, under the ABN (owner decision
  2026-10-03). Stopped at the signup's "Payments profile" step: the D-U-N-S record's address is
  incomplete, fix requested from Equifax 2026-10-03. **Owner decided 2026-10-04: stay with the
  organization account** (not the personal one, so no 12-testers-for-14-days rule). An
  organization account shows its legal address on every listing (Step 54). **Owner decided
  2026-10-04: the listing address is the one already on the Equifax request.** Equifax had not
  replied as of 2026-10-04; nothing more here until it does. Then payments profile, contacts,
  fee; then the listing (assets, content rating 12+, Data Safety, release).
- **B-2** ~~IOS37: Capacitor shell + App Store listing; 4.2-risk mitigation review~~ —
  **cancelled 2026-10-05 (owner decision): too costly** (the Apple Developer Program alone is
  US $99 every year). No native iPhone app, for either game (Funny One's iOS half of Phase S-3
  goes with it). An iPhone plays the web app in Safari and can add it to the Home Screen
  (FM-NFR-1); what that relies on is checked under **B-14**. Apple enrollment was still waiting
  on the Individual-or-company question, which is now closed with nothing to enroll for.
  FM-APP-2 is cancelled to match; B-1 (Android) is unaffected.
  *For the record, the plan was:* pulled forward 2026-09-20 with B-1; Apple enrollment in
  parallel with B-1 (owner decision 2026-10-04), as an **Individual** — Apple does not take sole
  traders as organizations, shows the personal legal name as seller, needs no D-U-N-S, and moves
  the account to an Organization later on request. Findings in Step 58.
- **B-3** Native-speaker review of the 13 machine-drafted pool languages (OD-F5).
- **B-4** Per-option gloss in joiner's UI language on the combobox (design §8.1 deferral).
- **B-5** Theme packs as pool extensions (pirates/space/dinosaurs — MON-3 mechanism, shared
  with future Funny One).
- **B-6** RuStore investigation (CMP-4); OD-F3 cap-granularity revisit; OD-F4 12+ revisit.
- **B-7** Optional AI Gateway / output classifier if the audience broadens (MODERATION.md
  operator guidance).
- **B-8** Google Play Protect shows "Unsafe app blocked — built for an older version of
  Android" on install, requiring "Install anyway" (seen 2026-09-16, A2, on the plain PWA/WebAPK
  install). **Answered 2026-10-05 (Step 59): a TWA does sidestep it** — no warning on the
  Bubblewrap-built, signed install. Funny One's own app was built, installed and reported "tested ok"
  on 2026-10-06 (Step 66), but the owner did not itemize a Play Protect result — still open until
  they say, or until T-FO-7.1's pass records it. Still open for a direct PWA install.
- **B-9** Version 2 animated cartoon: animate the still client-side and export WebM via
  `MediaRecorder` (SRC's `VIDEO_GENERATION_ANALYSIS.md` option 2). Zero AI cost. Note DD-9
  dropped SRC's Lottie engine — reinstating it is a v2 decision, not a revert.
  *(2026-10-05: B-12 put that engine's monkey back into the share video as plain canvas
  drawing — no Lottie library, no engine choice — so DD-9 stands and this item is unchanged.)*
- **B-10** Further income options under D-6(e), each chargeback-free or platform-as-MoR:
  seasonal word packs (Christmas, Halloween, birthday) as free pre-generated content; Sponsors
  monthly tier → "Family Pass" badge (the only safe recurring rail); print-on-demand of a room's
  cartoon (POD platform is MoR); theme packs (B-5) unlocked by a one-time Sponsors tier; private
  branded instances for schools/venues by bank-transfer invoice; paid self-host setup/support;
  affiliate links in README/HUB only; the v2 animation export as the gift thank-you;
  grants/credits (Screen Australia games fund, Cloudflare/Oracle startup credits, Open
  Collective for language packs); ad network on «Чепуха 37» only — separate decision.
- **B-11** Hub site at `https://www.funny.oursharedcode.com/` — the common page for both games:
  history and links (owner decision 2026-10-03). Candidate host for the shared privacy policy
  (open: hub or each game's own root — B-1b).
- **B-12** The laughing monkey back in the 5-second share video (owner request 2026-10-05): it
  walks in, points and laughs ("ha-ha"), then falls on its back — SRC's act, here on the
  cartoon's top edge (design §8.3, amended). Plain canvas drawing of SRC's four sprites
  (`public/monkey/`, `videoMonkey.ts`) inside the one recorder, which also takes that SRC
  recorder's two Android fixes. No Lottie, no engine choice (DD-9 stands). **Code done
  2026-10-05**; checked on a real headless-Chromium recording, frames viewed.
  **Deployed 2026-10-05** (the four sprites answer 200 on the live host). *Open:* one recording
  on the owner's Android phone.
- **B-13** — **closed 2026-10-05 (Step 61)**, block in `steering/tasks-done.md`. Home leaves
  out the "Up to N cartoons per day" line where nothing new is generated; live on production.
  Reopens if the owner still sees the line in the Android app after closing and opening it.
- **B-14** iPhone = the web app (B-2 cancelled): compatibility check, 2026-10-05.
  **Found so far: nothing that stops play; three things to settle on a real iPhone.**
  - *Checked.* Every browser feature the two clients use, against Safari — the build's floor
    is iOS 16.4 (Vite's default target). Then both production builds played in Playwright's
    WebKit 26.6 at iPhone 14 size: Funny Multi, three players, start to shared gallery, cartoons
    served from another origin by the real `worker.js` (run locally), story picture downloaded;
    Funny One in English and Hebrew, online and again with its server gone, picture exported.
    No page error, console error or failed request in any run; no sideways scroll.
  - *Not checkable without a device.* That WebKit build is Safari's engine on Windows, not iOS:
    it has no video recorder, no share sheet, no Home Screen install, no lock screen. The
    A1 iPhone leg has still never been run (Gate 7).
  - *Risk 1 — the share video's file type.* The recorder asks for WebM first. Safari 18.4+
    can record WebM, so an up-to-date iPhone would save a `.webm`, which iOS Photos does not
    take; older ones (16.4–18.3) fall through to `.mp4`. Proposed: MP4 first on Apple devices.
  - *Risk 2 — where the video goes.* It is a download only: on an iPhone that means the Files
    app, not Photos, and the download link is released the instant it is clicked, which Safari
    is known to mishandle. Proposed: release it later; optionally a second "Share" tap after
    recording, so the clip can go to Photos or a chat (one tap cannot do both — Safari drops
    the tap's permission during the 5 s recording).
  - *Risk 3 — auto-lock.* A phone locked for more than about a minute is dropped from its room
    (server recovery window 60 s; an iPhone locks after 30 s idle by default). Android has the
    same rule. Proposed, optional: keep the screen awake during a game (Screen Wake Lock,
    Safari 16.4+).
  - *Small.* Screens use `min-h-screen`, a little taller than Safari's visible area with its
    toolbar showing (`min-h-dvh` fixes it). No install prompt on iOS — Share → Add to Home
    Screen by hand. The Support screen shows, as on any web visit.
  - *Found on the way, any browser:* in Funny One, after a bot's turn, the next person's answer
    list shows for an instant before the "pass the phone" screen (`App.tsx` resets the handoff
    one paint late). Nothing private is shown; proposed fix is small.
  - **Deferred 2026-10-05 (owner decision: "Defer on the three iPhone fixes and the Funny One
    flash fix").** Risks 1–3 and the Funny One answer-list flash stay as described; none of the
    proposed fixes is made. Take them up again when the owner asks, or after the
    borrowed-iPhone session below shows which of them a real device needs.
  - *Device list, for the borrowed-iPhone session (with A1):* note the iOS version; install to
    the Home Screen; play one Funny Multi game with two other devices and see the cartoon;
    download and share the story picture; make the 5 s video and note its file type, where it
    lands, whether it plays and whether Photos or a chat app takes it; lock the phone mid-round
    for 30 s, then for 90 s, and see whether it is still in the room; play Funny One in
    airplane mode and export its picture.
- **B-15** Multi-language room — Funny Multi only (owner request 2026-10-09). A "Multi-language
  room" checkbox on the host's create screen. In such a room each player reads the interface,
  each round's question and its options, and the stories at the end in their own language. Every
  story — on the reveal screen and in the gallery, in any Funny Multi room — gets a small
  story-language switch: it opens the start window's 15 flags and retells that story in the
  language picked, on that phone only. **Code done 2026-10-09 (Step 70)**; played in WebKit at
  iPhone size by three players in English, Russian and Hebrew. **Not deployed.**
  - *A player's language:* the host's is the flag picked on the create screen; a joiner's is the
    interface language on screen when they tap Join (the invite link's `&lang=`, or the flag they
    tapped). In an ordinary room it stays the room's language, so nothing changes there.
  - *How:* the server keeps one language per room and only records the box (`multiLanguage`,
    returned in the join reply). Answers already travel as language-free option ids (DD-1), so
    each phone retells a story in its own language from the shared pools and prose templates;
    reveal and gallery now send each story's ids too. Design §5, §8.1, §8.2 and §9 amended,
    DD-13 added; FM-CORE-5 noted.
  - *Owed:* the deploy (`deploy/ship.sh`, now also carrying Step 71's fixes below — owner
    decision 2026-10-13: one combined deploy); the checkbox's two new strings are machine drafts
    in 13 languages (with B-3); one real game on three phones in three languages.
  - *Seen on the way, older than B-15, fixed in Step 71:* the French prose template's literal
    "a/ont" (`packages/shared/src/i18n/fr.ts`, a machine draft — B-3; any player could reach it
    by switching a story to French); a downloaded or shared story picture's footer following the
    interface language instead of the story's own (also fixed in the 5 s video export, a sibling
    bug found while verifying this one); the Hebrew round screen's timer mascot over "Round 1 of
    7"; the exported still's Hebrew text rendering LTR instead of RTL. Still open, unrelated: the
    client bundle's over-500 kB build warning.

## Dependency notes

- Phases are strictly ordered 0→8; Phase 9 (commercial, D-6/D-7) requires only Gate 4
  technically and keeps the last slot that D-4 gave it, although D-4 itself is superseded.
- T-1.5 (en/ru pools) blocks Gate 1 but T-1.6 and Phase 2 tasks T-2.1/T-2.2 can proceed in
  parallel with it.
- T-6.3 (13 pool languages) is the largest content task; it can start any time after T-1.4
  freezes the id set.
