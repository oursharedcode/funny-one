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
  2026-10-03). **Owner decided 2026-10-04: stay with the organization account** (not the personal
  one, so no 12-testers-for-14-days rule). An organization account shows its legal address on
  every listing (Step 54). **Owner decided 2026-10-04: the listing address is the one already on
  the Equifax request.** **Account done 2026-10-18 (Step 80):** the organisation account MARK WEB
  TOOLS, created and paid 2026-10-17, has its identity, website and phone verified and can
  publish.
  - **Equifax refused the rename (10 Nov; read 2026-11-12, Step 108):** a sole
    trader's D-U-N-S legal entity name is always the registry's individual name; MARK WEB TOOLS
    stays the record's trading name, not its legal name. No "no longer verified" banner is
    coming; nothing to confirm in Payments Center. Never list the rename as owed again.
  - **Funny One is live on Play** (seen 2026-11-12; last published 3 Nov 2026) and its
    install-from-Play check passed 2026-11-13 (hand-installed copy removed, full screen, no URL
    bar). It counts no analytics, so no `/stats/` check applies to it — that check is Funny
    Multi's alone, after its own approval.
  - **D5 (Catalog Access) decided 2026-11-13 (owner): stays on**, the default — changeable at any
    time, so it never had to hold up *Submit*.
  - **Funny Multi submitted for review 2026-11-13** (33 changes; Publishing overview reads
    "Changes in review"; managed publishing off, so it goes live on approval).
  - **Funny Multi published: the owner reported it 2026-11-19 (Step 111).** Its listing, "Funny
    Multi: Party Story Game" (`com.oursharedcode.funny37`), answered HTTP 200 the same day —
    Google's decision on the 33 changes submitted at Step 108 is in, and it is live. The
    install-from-Play check **passed 2026-11-19** (hand-installed copy removed, the Play copy
    fills the screen with no address bar). The app-visit check is **seen 2026-11-19:**
    `/api/stats/summary?days=2` showed `fm_view||en|app|||: 2` in that day's bucket, after the
    owner reopened the Play-installed app. Funny Multi's review has ended, so the app-level
    Trader hold below is lifted.
  - **Trader status:** the Play Console notice (all developers declare by 1 February 2027 or be
    removed from Play globally) is answered at account level — **declared Trader 2026-11-13**
    (owner); the D-U-N-S number is now public under "About the provider", the Trader sentence
    shown to EEA/UK users only. Funny One's own app-level confirmation ("Yes, applies to this
    app", no Terms of Service URL — neither game has one) is saved and submitted, "Changes in
    review". Funny Multi's own app-level confirmation is the only piece **still owed**, now that
    its review has ended.
  - *Owed:* Funny Multi's own app-level trader confirmation (App content → trader status, "Yes,
    applies to this app", then send the one change for review), before 1 Feb 2027.
  - *Listing assets done 2026-10-19 (Step 87), for both apps:* under `store/`, the texts in 22
    languages (en and ru written, 20 machine drafts with B-3), graphics and screenshots
    (regenerated, not committed), and the answers for Store settings and App content
    (`store/<game>/answers.md`); `store/README.md` is the upload checklist. Ten more languages'
    graphics and screenshots made 2026-10-20 (Step 88, B-25); Funny Multi's wait for its entry.
  - *Keep generation off while the apps are on Play:* Play's AI-Generated Content policy asks
    apps that draw with AI from user prompts for an in-app way to report a picture; apps that
    only host such pictures are out of scope. Both games are out of scope today — every picture
    is pre-drawn (D-7) and the Worker's generation switch is off (`cloudflare/wrangler.toml`).
    Switching it on for Funny Multi needs an in-app "report this picture" first, a step of its
    own (`store/funny-multi/answers.md`, item 7).
  - Identifiers (ABN, D-U-N-S number, signup account) stay out of this repo (Step 54).
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
- **B-3** Native-speaker review of the 21 machine-drafted pool languages (OD-F5): T-6.3's 13,
  B-16's five and B-21's three; and B-29's chr26 texts in 18 languages (Step 118, 35 each).
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
  **The first seasonal pack is B-29, the Christmas 2026 edition (2026-11-01)** — a paid edition
  with a free slice, not free content as written above; the other lines stand.
- **B-11** The landing page «Семейная Чепуха» at `https://www.funny-family.oursharedcode.com/`
  (owner request 2026-10-14; the address replaces 2026-10-03's `www.funny.…`) — the common page
  for both games: what each one is, links to both and to the GitHub repository, and the trailer
  (`local_docs/tests/video_148514.mp4`), in the games' 15 languages. Two designs, split 50/50
  per tab (`?v=a` or `?v=b` forces one): A shows the trailer as a card that plays with sound, B
  runs it as a silent loop behind the top of the page. A public `/stats/` page shows the daily
  visits per design, language, referrer and device, and the funnel from the landing page to
  «Чепуха 37»'s gift screen, with a test of the two designs' click rates (DD-15). Static pages
  pre-rendered by `apps/funny-family-site`, served by Caddy (DD-14), shipped by
  `deploy/ship-funny-family.sh`; the counts are kept by Funny Multi's server. Same step, same
  request: the jumping words "Support Author" beside the heart on «Чепуха 37»'s home screen
  (under it, a long label wrapped and ran into the title). **Code done and deployed 2026-10-14
  (Step 72)**; `https://www.oursharedcode.com/` links to the page from a "Games" card.
  **The open-source card redesigned 2026-10-29 (Step 95, owner request):** the family
  (`local_docs/family_sil.jpg`) now stands beside the card, and it links both `funny-one` and the
  new `funny-stories` repository, as two tiles. **Each tile got a hopping external-link arrow
  2026-10-29 (Step 98, owner request); pushed the same day** — `3bc8cbe..dffa428`, CI run
  `40874552465` — and live, checked 2026-11-01 (Step 99).
  - *Owed:* the page's strings in 13 languages are machine drafts (with B-3); design B's loop on
    a real iPhone (Chrome plays it; on this PC Avast blocked Playwright's WebKit — Step 72's note
    of 2026-10-15).
  - *Resolved on the way, Step 95:* the GitHub link's 404 (the repository was private) — both
    `funny-one` and `funny-stories` answer 200 now; the repository was made public at some point
    since Step 72, outside this project's sessions.
  - *Seen on the way, older than B-11, not fixed:* Funny Multi's Tamil home title «வேடிக்கையான
    கதைகள்» is wider than a phone (≈ 440 px at 48 px; cut at 320–390 px) since 2026-08-16 — with
    B-3's review of the home titles, or a smaller size for a long title.
  - Still a candidate host for the shared privacy policy (open: hub or each game's own root —
    B-1b).
- **B-12** The laughing monkey back in the 5-second share video (owner request 2026-10-05): it
  walks in, points and laughs ("ha-ha"), then falls on its back — SRC's act, here on the
  cartoon's top edge (design §8.3, amended). Plain canvas drawing of SRC's four sprites
  (`public/monkey/`, `videoMonkey.ts` — `videoCharacter.ts` since 2026-11-26) inside the one
  recorder, which also takes that SRC recorder's two Android fixes. No Lottie, no engine choice
  (DD-9 stands). **Code done 2026-10-05**; checked on a real headless-Chromium recording, frames
  viewed.
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
  iPhone size by three players in English, Russian and Hebrew. **Deployed 2026-10-09**
  (`funny-multi:8036211`; not logged then, found on the VM 2026-10-14); Step 71's fixes went out
  with Step 72 on 2026-10-14.
  - *A player's language:* the host's is the flag picked on the create screen; a joiner's is the
    interface language on screen when they tap Join (the invite link's `&lang=`, or the flag they
    tapped). In an ordinary room it stays the room's language, so nothing changes there.
  - *How:* the server keeps one language per room and only records the box (`multiLanguage`,
    returned in the join reply). Answers already travel as language-free option ids (DD-1), so
    each phone retells a story in its own language from the shared pools and prose templates;
    reveal and gallery now send each story's ids too. Design §5, §8.1, §8.2 and §9 amended,
    DD-13 added; FM-CORE-5 noted.
  - *Owed:* the checkbox's two new strings are machine drafts in 13 languages (with B-3); one
    real game on three phones in three languages.
  - *Seen on the way, older than B-15, fixed in Step 71:* the French prose template's literal
    "a/ont" (`packages/shared/src/i18n/fr.ts`, a machine draft — B-3; any player could reach it
    by switching a story to French); a downloaded or shared story picture's footer following the
    interface language instead of the story's own (also fixed in the 5 s video export, a sibling
    bug found while verifying this one); the Hebrew round screen's timer mascot over "Round 1 of
    7"; the exported still's Hebrew text rendering LTR instead of RTL. Still open, unrelated: the
    client bundle's over-500 kB build warning.
- **B-16** Five more languages: Cantonese, Hindi, Telugu, Bengali and Persian (owner request
  2026-10-16), in both games, the landing page and both privacy policies, 20 in all. Cantonese
  (`yue`) is written Cantonese in Traditional characters under Hong Kong's flag; a browser set
  to `zh-HK` or `zh-MO` gets it, while `zh-TW` stays on Mandarin. Persian (`fa`, Iran) is right
  to left, like Hebrew. Hindi and Telugu share India's flag with Tamil, so the three are labelled
  with their language's letters, TA, HI and TE (Tamil's label was IN). Every other flag was
  checked distinct. The flag pictures are Twemoji's (CC-BY 4.0, credited in the README).
  `LANGUAGES.md` now says how to add a language. **Code done 2026-10-16 (Step 73), deployed that
  day to Funny Multi and the landing page and to Funny One on 2026-10-18.**
  - *Owed:* all text in the five new languages is machine-drafted and marked
    `needs-<code>-review`, so it goes to B-3.
  - *Seen on the way, older than B-16, fixed in Step 73:* exported story pictures broke lines
    only at spaces, so every Mandarin and Japanese still since T-5.2 was drawn as one cut-off
    line. One shared `wrapText` now also breaks between Han and kana characters. Funny One's
    still drew Hebrew left to right; Step 71 had fixed only Funny Multi's. In every export (both
    stills and the 5 s video) the footer's notice and label are in the story's language but
    were drawn left to right, which scrambled Hebrew and Persian. They now run right to left at
    the right edge, with the URL under them. The video's story text had no direction of its
    own; it now has the story's.
  - *Title fitting, Step 74 (owner decision 2026-10-16: its own commit after the languages):*
    both clients' home title now wraps onto centred, balanced lines, and a word wider than the
    column shrinks the font to fit (never below 24 px). Funny Multi's Tamil title had run off a
    phone. Also on Funny One's home in Tamil: the player row scrolled sideways at 320 px and the
    rules box cut a long word; both fixed.
- **B-17** Funny Multi's Support screen: two notes and two more rails (owner request 2026-10-17,
  with a marked-up screenshot). "In Australia" beside PayID's title, "Crypto Bitcoin" beside
  Lightning's, and under Lightning the author's Ko-fi and Buy Me a Coffee pages — the ones the
  books page links (`oursharedcode.github.io`, its D9) — as two buttons in the brands' colours
  with that page's cup icons and sheen (owner choice "brand buttons"). Two new deployer
  variables, `DEPLOYER_KOFI_URL` and `DEPLOYER_BMC_URL`; an unset one hides its button. D-6(a)
  amended: the owner accepts the card-dispute risk of these two pages, and the game still has no
  card checkout. The funnel counts the buttons as gift rails `kofi` and `bmc`, and the privacy
  policy names both in all 20 languages. **Code done and deployed 2026-10-17 (Step 75)**, with
  the two `.env` lines. The owner moved both pages to `ko-fi.com/markwebtools` and
  `buymeacoffee.com/markwebtools` on 2026-10-18; the VM's two lines followed that day (Step 83).
  - *Owed:* the four new strings are machine drafts in 18 languages (with B-3); check D6 of
    `docs/ACCEPTANCE.md` (the owner's, on the phone and the PC).
  - *Kept on purpose:* white on Ko-fi's red is 3.0:1, just under AA even for large text; it is
    the brand's own pairing, as on the books page, in bold 20 px.
- **B-18** The beating ♥ and the hopping words "Support Author" on the landing page (owner request
  2026-10-17, with a screenshot): in the header of both designs, between the «Семейная Чепуха»
  logo and the language picker, opening a support sheet of the landing page's own with the same
  rails as the game. The rails come at run time from Funny Multi's server, so the deployer's
  variables stay their one source; with no rail set there is no heart. **Code done and deployed
  2026-10-17 (Step 76).** Below 900 px the ♥ takes a centred row of its own under the name and
  the picker.
  On the way, long names now fit a phone: the family's name in the header and a game's name on
  its card shrink where a word is wider than its box (the name had run under the picker in
  German, Tamil and six more languages on narrow phones).
  - *Owed:* the privacy policy's new landing-page sentence is a machine draft in 18 languages
    (with B-3). WebKit (design B on an iPhone-size screen) was not checked: its executables are
    gone here.
  - *Kept on purpose:* no time limit on the page's request for the rails — a late answer still
    brings the ♥, which until then holds its place unseen.
- **B-19** QR codes on the landing page (owner request 2026-10-17, with three screenshots): a QR
  code of each game's address beside the Funny Multi and Funny One buttons at the top of design A
  and of design B, and beside each "Play now" button in the "Pick a game" cards, so a visitor at a
  computer can open a game on a phone. **Code done and deployed 2026-10-17 (Step 78):** drawn at
  build time, shown only on a wide screen with a mouse (from 900 px, `hover: hover`), Funny
  Multi's once per design so that a scan tells the game which design was seen.
  - *Owed:* the owner points a phone at the four codes on the PC, in both designs (`?v=a`,
    `?v=b`).
  - *Kept on purpose:* no caption and not a link; a scan counts as a visit from the landing page
    with no click, so `/stats/` can show more opened games than clicks (its funnel note says so).
- **B-19a** The games' QR codes on phones and tablets too (owner request 2026-10-18, after Step
  78's: "still like the QR codes on phones and tablets. make the QR as small as possible,
  location: just next to the button … Do not do two lines"): each code as small as a phone's
  camera still reads, on its button's row after it — to its left in Hebrew, Persian and Arabic —
  and never under it; a computer keeps Step 78's. **Code done and deployed 2026-10-18 (Step
  82):** 52 px on most phones, a button's height; larger where the screen has fewer pixels to
  the CSS pixel — 56 at 2×, 72 below 2×, Step 78's 104 below 1.5× — so each square of the code
  keeps about 2.5 of them. Where the row is short of room the button's words wrap first, then
  the code gives way, never below 52 px; below 360 px the buttons have less room inside.
  - *Owed:* the owner scans the codes with a real phone from a phone's and a tablet's screen, in
    both designs (`?v=a`, `?v=b`).
- **B-20** A map of where visitors come from, on `/stats/` (owner request 2026-10-17; modelled on
  `C:\Mark\Dev\promengi`'s; owner choice "own lookup + own map"). Funny Multi's server looks up
  each counted visit's address in DB-IP's free country database (CC BY 4.0) and keeps only the
  country, never the address; `/stats/` draws its own world map, shaded by visits, with a list
  of the top countries. Both privacy policies say so. **Code done and deployed 2026-10-18 (Step
  79):** the server downloads DB-IP's file itself once a month into the stats volume (`GEO_DIR`)
  and counts each visit's country in a tally of its own; `/stats/` shows "Visits by country", an
  Equal Earth map of Natural Earth's shapes and a table, from the day countries were first
  counted.
  - *Seen:* the first counted country on production's `/stats/`, Australia, with two
    landing-page visits (2026-10-18).
  - *Owed:* the privacy bullet is a machine draft outside en/ru (with B-3).
  - *Kept on purpose:* only visits are placed, never clicks or gifts, and a country is never
    joined to a label; Funny One's policy is unchanged — it counts nothing, and Funny Multi's
    covers the landing page.
- **B-21** Three African languages: Arabic, Swahili and Yoruba (owner request 2026-10-17, after
  that day's research), in both games, the landing page and both privacy policies, 23 in all.
  Arabic is Modern Standard Arabic (owner choice), labelled «العربية (المغرب)» under Morocco's
  flag and right to left; Swahili under Kenya's flag, Yoruba under Nigeria's. **Code done
  2026-10-18 (Step 81) and deployed that day to Funny Multi, the landing page and Funny One.** A
  browser set to any Arabic gets Arabic, and Tanzania's Swahili gets Swahili; Yoruba's headings
  take the system font and its stories Cambria or the platform's serif, since Fredoka and
  Georgia lack its letters; both games now set `<html lang>`.
  - *Owed:* a native reviewer for each of the three (with B-3); what Safari draws Yoruba in is
    unseen (no WebKit here).
- **B-22** The ♥ and "Support Author" on `https://www.oursharedcode.com/` (owner request
  2026-10-17; owner choice "own sheet there"): top right, opening a sheet on that site with PayID,
  Sponsors, Lightning, Ko-fi and Buy Me a Coffee. It lives in that site's own repository
  (`oursharedcode.github.io`), where a push deploys, so it waits for the owner's go-ahead; the
  site's "fifteen languages" is out of date and is fixed with it. **Code done and live 2026-10-19
  (Step 84; site commit `6917802`, CI run `39138417241`):** the home page has the ♥ and "Support Author" and a sheet of
  five rails (PayID, GitHub Sponsors, Lightning, Ko-fi, Buy Me a Coffee), "twenty-three languages",
  a Sponsors bullet on the privacy page, and a guard in `build.mjs` against the hand-written page
  drifting from `content.mjs`.
  - *Owed:* a read of the privacy
    page's Sponsors bullet (the agent's wording); whether the site's PayID
    (`markwebtools@oursharedcode.com`) and the games' (`funny@oursharedcode.com`) are both
    registered; Safari, unseen (no WebKit here).
  - *Not built, the plan's decision 6a:* counting presses of the sheet. The collector Worker has
    no `sponsors` rail and stores no page, so it needs a rail, a page column, a D1 migration and
    a deploy first — a task of its own if the owner asks.
- **B-23** App parity: the two Android apps (TWAs) brought level with the web games, gifts
  excepted (owner request 2026-10-19). Both apps load the live site, so the web's changes since
  Steps 59 and 66 already reach them; what differed was the app's own. Owner decisions
  2026-10-19: (1) a privacy-policy link at the foot of Home in both games, on the web and so in
  the app — Google Play asks for one inside every app; (2) English app names, «Funny Multi» and
  «Funny One», with a name for each phone language — «Чепуха 37» and «Одна Чепуха» in Russian,
  the game's Home title in the 21 others (machine drafts, with B-3); (3) Funny Multi's app
  counts its visits as a source of its own, "Android app" on `/stats/`, and only visits (no
  gifts in the app); its privacy policy says so in all 23 languages; Funny One stays uncounted;
  (4) no signed rebuild now: the APKs are rebuilt once, at listing time, with Funny One's real
  icons and Google's app-signing fingerprint. **Code done 2026-10-19 (Step 85).**
  - *Owed at listing time (B-1e, S-3c):* the rebuild with `scripts/android-labels.mjs` between
    `update` and `build` (both READMEs); Data safety — Funny Multi declares the visit counts,
    Funny One collects nothing; Google's fingerprint in both `assetlinks.json`; uninstall the
    copies installed by hand first. Funny One's part is done but the last two: its real icons
    drawn 2026-10-19 (Step 87) and live since 2026-10-20, its Data safety entered 2026-10-20,
    and its rebuild run 2026-10-20 — the owner's signed AAB, version 1 (Step 88).
  - *Owed:* the privacy changes and the names outside en/ru are machine drafts (with B-3); some
    names are too long to show whole under an icon (Step 85 lists them).
- **B-25** Play pictures in ten more languages, and two faults they showed up (owner request
  2026-10-20, before Funny One's first release). Step 87 gave only en and ru their own feature
  graphic and screenshots. Owner decisions 2026-10-20: (c) ten more, in both games — fr-FR,
  it-IT, hi-IN, ta-IN, te-IN, zh-CN, zh-HK, bn-BD, ko-KR and fa; the other ten listings keep the
  default's; (1a) Korean broke its lines in the middle of a word in both games — one `keep-all`
  rule per game, then the Korean pictures retaken; (2a) the images go up through the Play
  Developer API, from a service account the owner sets up once, limited to store listings, and
  the owner ticks the AI label on the ten new feature graphics; (3a) Funny Multi opened in
  English on every device, its Android app included — it now starts in the device's language,
  as Funny One does. **Code done 2026-10-20 (Step 88); Funny One's release submitted
  2026-10-24 (Step 90); Funny Multi's entry begun 2026-10-25 (Step 92).**
  - *Decided on the way:* Funny Multi remembers no pick (its privacy policy keeps nothing on the
    device); a link's `?lang=` still wins, an invite's included; the create screen's flag starts
    on the interface's language.
  - *Owed:* ~~the deploy of both games~~ done 2026-10-20 (Step 88); ~~the service account, the
    upload of Funny One's 60 images, the AI labels, Google's fingerprint, the first release~~
    done and submitted 2026-10-21 → 24 (Step 90) — still owed: Google's decision, then the copy
    installed by hand swapped for Play's and the full-screen check; Funny Multi's entry — ~~the
    app, App content, Store settings, its pictures retaken~~ done 2026-10-25 (Step 92); ~~its
    listing, translations, release, 66 pictures, AI labels, fingerprint~~ done 2026-10-26
    (Step 93) — still owed: D5 (Catalog Access, decide before Submit) and Submit itself, both
    held back until Google decides on Funny One; after approval, the copy installed by hand
    swapped for Play's and the full-screen check, visits counted as "Android app" on `/stats/`;
    the ten taglines are machine drafts (with B-3); a real Korean or Persian
    phone, unseen; in Tamil's
    reveal shot the Continue button covers the story's last two lines (accepted).
  - *Seen on the way, older than B-25, fixed in Step 91:* since Step 88 either game can start in
    a language low in the 23-flag list, with the pressed flag below the fold and no sign it was
    picked — `ScrollBox.tsx` (both clients) now centres it into view once, when the list opens.
    The landing page's Korean (Step 88 changed only the games) now has the same `keep-all` rule.
- **B-26** — **closed 2026-10-27 (Step 94)**, block in `steering/tasks-done.md`. A new version
  no longer reloads a game in progress, in either game.
- **B-27** Keep Funny Multi's rooms alive across a deploy (agent finding 2026-10-27, Step 94;
  filed at the owner's request). Rooms live only in the game server's memory, and
  `deploy/ship.sh` replaces the server's container, so every deploy of Funny Multi ends every room
  in progress. The players' sockets reconnect to a server that has never heard of their room —
  Socket.IO's connection-state recovery was held in the old process. What a player sees then is
  unchecked. Not scheduled; until it lands, deploy Funny Multi at a quiet hour, read from the
  server's log first (Step 94 found an hour with no game connections).
  - *Options to weigh when it is taken up:* (a) drain — the server reports its live rooms and
    `ship.sh` waits, up to a limit, until none is left: the cheapest, keeps nothing; (b) a notice
    — on shutdown the server tells every room it is restarting, so the screens say so instead of
    going dead: small, pairs with (a); (c) snapshot and rejoin — rooms written to the
    `funny_stats_data` volume on shutdown and read back on start, plus a rejoin path, which needs
    each player's seat remembered on the device, so the privacy policy changes too (B-25: Funny
    Multi keeps nothing on the device); (d) two containers side by side, new rooms on the new one
    while the old drains — Caddy and sticky sockets, the most work. The agent's lean: (a) with
    (b) first, (c) only if players still lose games.
- **B-28** Funny Multi's downloaded picture and 5 s video QR code now leads to the landing page
  instead of the source repository (owner request 2026-10-29). The in-game "Source on GitHub"
  footer link is unchanged — that one meets the AGPL's source-offer duty; an exported file isn't
  the running program, so its code is free to invite people to play instead. The bold label beside
  the QR, "Source on GitHub", would have been wrong pointed at the landing page, so it now shows
  the landing page's own name (`footer.family`, one new string, copied from
  `apps/funny-family-site/src/strings.ts`'s existing `brand` in all 23 languages — no new
  translation owed). New `landingUrl.ts` holds the address; `downloadStory.ts`, `videoFooter.ts`
  and `recordWobble.ts` read it. **Code done 2026-10-29 (Step 96)**, checked by rendering the real
  picture (en/ru/he) and video in Chromium and decoding each QR — all four read
  `https://www.funny-family.oursharedcode.com/`. **Pushed and deployed 2026-10-29 (Step 97)** —
  `0dc503f..114012b`, CI green, live bundle `index-zVXzSouG.js` inside image
  `funny-multi:114012b`. `funny-one`'s GitHub About box (owner's wording) now carries a
  description and a website link to the landing page — also Step 97.
  - *Owed, the owner's:* one live check — download a picture from `https://funny37…` and scan
    the code with a phone, any language. Close the task once confirmed.
- **B-29** The Christmas 2026 edition — Funny Multi's first paid pack (owner decisions
  2026-11-01, chosen from seven payment strategies compared in Step 99's log entry; B-10's
  "seasonal packs" line taken up). **Ahead of B-27** (owner decision 2026-11-01: Christmas is
  dated, B-27 is not). Funny Multi only; nothing for the children's product.
  - *Product:* one price, **A$2.60**, unlimited rooms, **never expires** — nothing that runs out
    or stops, so nothing to dispute. *(Superseded 2026-11-21: a code works until 1 August 2027 —
    see* Decisions 2026-11-21 *below.)* English name "Christmas 2026 edition"; Russian
    **«Новый год 2027»**, covering three days — католическое Рождество 25 декабря 2026, Новый
    год, православное Рождество 7 января 2027. The pack is a room property the host sets.
  - *Languages (20):* en, de, fr, it, es-es, es-419, pt-br, uk, ko, yue, id, sw, yo (Christmas
    is the main winter festival); ja, zh, hi, ta, te, bn (secular, or a large minority — worth
    the machine draft); ru, written by the owner. **Out:** ar, he (Hanukkah, 4–12 Dec 2026),
    fa (Yalda, 20/21 Dec) — a winter edition of their own later, if ever.
  - *Funnel:* a landing variant (`?pack=x26`, as `?v=` picks a design today) with two big
    "Christmas pack — try it free" buttons, hopping letters, one at the top and one at the foot;
    shown 29 November (Advent Sunday) to 7 January. **The free trial is a slice, not a count:**
    every room gets a share of the Christmas pack, forever; the pack unlocks the rest. No
    fingerprint, nothing to game, the trial is the demo. The pay prompt appears between games,
    after the first free cartoon, never mid-story. *(Superseded 2026-11-05: the slice was "a
    quarter of the Christmas words and pictures", the prompt the host's alone and the funnel
    three steps — see* Decisions 2026-11-05 *below. And 2026-11-21: "forever" — the free share
    ends 1 July 2027, see* Decisions 2026-11-21 *below. And 2026-11-21, fifth set: no
    variant — every visitor sees the buttons, from the deploy to 1 July 2027, and in the free
    half they say "Christmas stories — play free".)*
  - *Code:* signed, `XMAS26-XXXX-XXXX`, verified by the server with a secret and no database;
    the host puts it in a bookmarkable create-room link, so the app stores nothing (B-25's
    promise holds). A leaked code costs nothing to serve; a small blocklist revokes one. The
    code field is **web-only** — the Android shell shows the free slice and never a price, so
    Play's payments policy and the Data Safety form are untouched (as `storeShell.ts` hides
    Support, B-1c).
  - *Rails and posture:* **Australia — PayID**, the pending code is the payment reference and
    the owner activates it on receipt (a manual match per sale); **anywhere — Lightning**, an
    invoice service with a webhook, automatic; **abroad — a GitHub Sponsors one-time tier**,
    the code in the tier's welcome message plus a webhook: GitHub is the merchant of record,
    so EU/UK VAT and India's OIDAR GST (due from the first sale for a foreign seller) are
    GitHub's. Abroad the pack is a **thank-you for a sponsorship, not a sale**. Ko-fi stays a
    gift link and issues no code (the one rail with chargebacks). Price shown in the host's
    currency as an approximation; the payment labelled `FUNNY XMAS26 <code>`.
  - *Refunds:* policy shown before paying, consumer-law-safe wording ("no refunds for change of
    mind; a pack that doesn't work is fixed or refunded"); the code appears on the page the
    moment payment lands, email the backup copy; a "lost code" lookup by payment reference.
  - *Receipt log (owner decision 2026-11-01):* **paid rooms only**, an append-only file on the
    `funny_stats_data` volume (survives a deploy, like the visit counts): the code's issue (time,
    rail, the rail's reference, amount, where delivered), the policy version shown, every room
    created with it (time, room code, language, players, IP country, browser family — no full
    IP, no fingerprint), every game (rounds, picks, cartoons delivered, downloads, shares). Kept
    18 months. Free players stay as today: visit counts only. One privacy-policy paragraph in
    23 languages (machine drafts, B-3).
  - *Content — the long pole:* one concept set, one picture batch (5 options per visual slot
    = 625 pictures; the paid Workers AI plan comes back for a day, then off again — Play's
    AI-content policy, B-1e); a few Southern-Hemisphere options (beach, barbecue) for Australia
    and Brazil. 20 word lists as **local glosses, not translations** — the local gift-bringer
    (Reyes for Spain, Befana for Italy, Святий Миколай for Ukraine and never Дід Мороз, Дед
    Мороз, мандарины and оливье for Russian): en and ru by the owner, 18 machine drafts with
    that brief, on B-3's pile.
  - *Rejected on the way:* device fingerprinting (breaks the privacy promise, adds no dispute
    evidence, locks out shared Wi-Fi); counted rounds (the refund magnet); Play Billing
    (chargebacks passed to developers since 2026-08-03, Google's 15% cut); a direct sale abroad
    (tax registration from the first sale).
  - *Owed before building:* the Sponsors tier and webhook; the Lightning service; the Workers
    AI day for the batch; the owner's en/ru word lists. The PayID match stays the owner's op,
    one per sale.
  - *Decisions 2026-11-05 (owner, from the options compared in session 2026-11-01 to 11-05):*
    - **Free and paid.** A free room keeps today's words and pictures for who, with whom, where
      and what they did, and gets the Christmas words for when, why and the ending (the ending
      shown as a text card). **One golden story per free game**, picked at random and revealed
      last, is fully Christmas — its words, its scene and its ending picture. A paid room is
      Christmas in every slot of every story; it has no golden story. Replaces "a quarter".
      *(Superseded 2026-11-21: two golden stories — see* Decisions 2026-11-21 *below.)*
    - **Pictures: 650.** Scenes from the four picture slots, 5⁴ = 625; endings drawn as an
      **aftermath** — the place and the objects, no characters, so nothing can fail to match the
      scene — where × ending = 5² = 25. "When" and "why" are never drawn (DD-3's reason). The
      scene characters get distinctive costumes (one colour, one prop, one shape). WebP, not
      GIF and not the library's ≈ 730 KB JPEG. 650 pictures fit ≈ 13 days of the free allowance
      (≈ 52 a day) if the word lists are frozen by about 14 November; otherwise the paid day.
      First test: 5 aftermath endings, ≈ 1 cent, each must read as a punchline on its own.
    - **Video.** Made on the phone, as today's 5 s video: the scene, then the ending (the
      ending picture in a paid room or the golden story, a text card otherwise). A short sound
      file (sleigh bells) plays to the speaker **and** into the recording.
    - **Funnel, four of ten options:** (#1) the golden story above; (#4) **unlock the room
      you're in** — a code unlocks the current room for its next game, nobody leaves or
      rejoins, and any player's payment does it, the code then being that player's own;
      (#5) **PayID unlocks at once, provisionally** — "I've paid" makes the code work, and it
      switches itself off after 48 h unless the owner has marked that payment received (same
      op per sale, moved after the unlock); (#10) **seven funnel steps on `/stats/`**, per
      language (DD-15), not three: landing view → free room → first free cartoon → pay card
      shown → pay pressed → payment landed or claimed → paid room. Next in line, not taken:
      (#3) a before/after pay card. Rejected: locked Christmas options in the picker (#2) —
      seen mid-story.
    - **Screens.** Lobby, every player: "🔔 This game has one Christmas story". End of a free
      game, every player (web only): "You just saw one Christmas story. Unlock all of them:
      A$2.60, every game, forever". Downloads (picture and video) in a free room: the golden
      story's carry "Unlock all Christmas 2026 stories: A$2.60, every game, forever" and a short
      payment address (e.g. `…/x26`), which replaces the landing link and the QR's target;
      ordinary stories keep today's footer. In a paid room every download carries "Your
      Christmas 2026 stories: every game, enjoy your party :))". Russian uses «Новый год 2027».
      *(Superseded 2026-11-21: "one" becomes "two" and "forever" becomes "until 1 August 2027" —
      see* Decisions 2026-11-21 *below.)*
    - **Never on any download:** the code or the link that holds it (a shared video would
      leak it) — a test checks this. **The Android app** shows no price, no button and no
      payment address, its downloads saying only "Christmas 2026 edition" (Play's payments
      policy, as B-1c hides Support).
    - **The website remembers the code on that phone** (owner decision 2026-11-05, replacing
      "the app stores nothing" for the web): next week the same phone opens a Christmas room
      with nothing to type; the bookmarkable link stays as the way to another phone. Web
      only, never the Android app. One sentence more in the privacy policy, 23 languages.
    - **The blocklist** is the owner's, by hand, case by case: (1) a refund; (2) a payment
      taken back (a recalled PayID payment, a sponsorship GitHub refunds); (3) a code leaked in
      public — the receipt log shows its rooms in many countries at once — and the buyer gets
      a new code free; (4) the buyer asks (a link sent to the wrong group), with a new code.
      An unpaid PayID claim is not listed: it switches itself off after 48 h. A leaked
      signing secret is not a blocklist case: a new secret and new codes for every buyer.
    - **The payment is the receipt:** every rail leaves the code where the buyer keeps it
      anyway — PayID in the bank's history (the reference is the code), **Lightning in the
      wallet's history (the invoice description carries the code)**, Sponsors in GitHub's
      welcome email, the optional email backup. Last resort: the buyer writes in, the owner
      finds the code in the receipt log. **Support rule (owner decision 2026-11-05): when in
      doubt, issue a new code** — a code costs nothing to serve, an argument over A$2.60
      costs more.
    - **To check before building:** how long a PayID reference a banking app accepts (a limit
      of 18 characters is reported, unconfirmed; `FUNNY XMAS26 K7QM-3FPA` is 22) — one real
      transfer from one or two Australian banks. *(Settled 2026-11-05 by D4 below: no transfer
      needed.)*
  - *Decisions 2026-11-05, second set (owner, on Step 103's plan):*
    - **D1 — the agent drafts the en and ru word lists, the owner edits them.** Replaces "en and
      ru by the owner" under *Content* above.
    - **D2 — ids and English fragments first, texts after.** The ids and fragments are frozen
      before any text, being the wire format and part of every picture's cache key (DD-1,
      DD-4); the texts stay free to edit.
    - **D3 — the test pictures through `wrangler dev --remote`** on the owner's Cloudflare
      account: real Flux Schnell output, nothing deployed, production's `[ai]` binding stays
      off, so Play's AI-content policy and B-1e are untouched.
    - **D4 — the PayID reference is the bare code**, `XMAS26-K7QM-3FPA`: 16 characters, inside
      the reported 18-character limit with room, so no test transfer is needed.
    - **D5 — the Southern-Hemisphere options become an edition of their own, B-29a** (the same
      evening, after the owner's ru edit had replaced the beach and the barbecue). Replaces "a
      few Southern-Hemisphere options (beach, barbecue) for Australia and Brazil" under
      *Content* above. The Russian edition is the New Year one, «Новый год 2027», as *Product*
      has it.
  - **Data model and concept set done 2026-11-05 (Step 103):** `packages/shared/src/packs/`
    (DD-16, FM-PACK-1..5, design §4.4) — `PackConfig`, `StoryContent`, `optionsFor`;
    `buildAftermathPrompt` beside `buildPrompt`; chr26's 35 ids frozen with 20 costumed picture
    fragments and 5 aftermath fragments (worst-case scene prompt 481 of 500, 19 of headroom;
    worst-case aftermath 263); en and ru texts drafted for the owner's edit. **Three concepts come
    from the owner's ru edit the same day, so they changed in every language** (one picture per
    option): the present on legs → a sleeping Snow Maiden («со спящей Снегурочкой»), the sunny
    beach → a film studio shooting a holiday movie («на киностудии во время съёмок новогоднего
    кино», the owner's «где …» clause made comma-free for the template), the barbecue → watching a
    holiday film on a TV covered in cobwebs. The beach and the barbecue were *Content*'s
    Southern-Hemisphere options above; they go to an edition of their own (D5, B-29a). **Next,
    Step 104:** the ≈ 1-cent test — 5 aftermaths, place *i* with ending *i*, so each place and
    each ending is drawn once; each must read as a punchline on its own. Still owed after it: the
    other 18 languages' drafts, packs in rooms, the code, the rails, the batch.
  - **D3 test run 2026-11-17 (Step 109): blocked on auth, not on the content.** All 5 aftermath
    prompts built correctly (240–262 characters). All 5 draws failed the same way: wrangler's
    remote AI binding needs an interactive OAuth session or a `CLOUDFLARE_API_TOKEN`; the
    throwaway script deliberately strips that variable (it names a different project) and the
    saved login (25 August) could not authenticate a non-interactive child process. The attempt
    settled three of the open mechanical decisions in the doing: the images went to a local-disk
    R2 simulation (`--persist-to`, a bucket name that does not exist in the real account), not
    the production bucket or a new real one; the `[ai]` switch lived in a throwaway
    `wrangler.d3.toml` kept outside the repo, the committed `wrangler.toml` untouched; wrangler
    ran as the pinned one-off `wrangler@4.160.1`, not a devDependency. **Still owed:** a fresh,
    interactive `wrangler login` from the owner (the saved session cannot authenticate a
    script), then the same throwaway script re-run.
  - **Cultural-safety check, 2026-11-19 (Step 109, owner decision), ahead of the 25 drawn
    options' freeze.** A CLIP zero-shot scan of the base library's ≈ 10,000 pictures (Step 68)
    across 11 culturally-sensitive categories — cow, meat, pig, dog, owl, monkey, elephant,
    snake, rat, turtle, religious imagery — scored against the library's own cast and food as
    the negative set, top matches per category on a contact sheet for a by-eye check.
    **Verdict: every top match is a CLIP false positive** — the base library is unchanged. A
    direct text read of chr26's own fragments (no picture exists yet, so no scan applies) found
    two real issues, fixed the same day, safely past Step 103's freeze since nothing has been
    drawn from it yet: the festive table's "laid for a feast" risked an AI-drawn ham or roast,
    which Jewish, Muslim and Hindu dietary rules forbid, renamed to name the food itself ("laid
    with cakes, fruit and sweets"); the gnome's teal hat recoloured orange (green reads as a
    cuckold's sign in Chinese, and teal can draw as green). Worst case moved from 481/500 (19 of
    headroom) to 495/500 (5); `prompt.test.ts`'s pinned constant updated to match.
  - *Decisions 2026-11-20 (owner, on Step 112's three open questions and Step 113's one):*
    - **1A — the free half ships 29 November** (the Christmas words, the golden story, the
      `?pack=x26` landing variant, no price shown anywhere); the paid code and the rails switch
      on by about 10 December. Replaces the all-at-once 29 November target.
    - **2B — a scoped Cloudflare API token in a file on this PC** (location in the agent's
      memory), so D3 and the batch run unattended: Workers AI Edit + Read, Workers Scripts Edit,
      Account Settings Read, expiring 18 February 2027. The batch adds Workers R2 Storage Edit if
      it writes the real bucket. Replaces Step 109's "interactive `wrangler login`".
    - **3B — D3 widened by five scenes** that draw each of the 20 scene fragments once, and the
      25 drawn options frozen right after the owner approves the pictures.
    - **4A — Haiku 5.5 stays** in `docs/MODEL_PLAYBOOK.md` (Step 113's open cell).
  - **D3 done 2026-11-20 (Step 114); the 25 drawn options frozen for good.** 28 pictures through
    a local `wrangler dev` of the real Worker, real Flux Schnell, R2 simulated on disk, nothing
    deployed. Of the first ten (five aftermaths, five scenes), seven passed: the two subjects
    never merged, the gnome's hat drew orange, the feast table showed no meat. Three fixes,
    re-drawn until they held: **tangled lights** (hung on purpose, not tangled, twice) → "a giant
    tangled heap of fairy lights dumped on the ground, wires sprawling everywhere", 3 of 3 strong;
    **empty sack** (drawn full, beside an unreadable note, twice) → "an empty, crumpled gift sack
    lying flat on the ground with a small sealed envelope on it", the envelope standing for the
    polite note without lettering; **the snowman and the Snow Maiden** together drew close to a
    famous film's snowman and ice princess → "a snowman with a bucket on its head…" and "a
    sleeping snow maiden in a blue fur coat and fur hat" (owner pick A of fur hat, crown or
    kokoshnik: the crown still echoed the film, the kokoshnik reads as Russian to Ukrainian
    buyers and cost a character of headroom). Worst case unchanged, 495/500. Display texts
    unchanged (they still fit). **Known artefacts, for the batch's own review:** a fake signature
    or watermark in about 1 picture in 4, and small passers-by behind 2 of 4 snowy-square
    endings — flag and redraw, which needs a way past the prompt-hash cache, settled in the
    batch script. **Next:** the 650-picture batch (the paid Workers AI day), the other 18
    languages' drafts, packs in rooms, the landing variant, deployed before 29 November at a
    quiet hour; the code and the rails by about 10 December.
  - *Decisions 2026-11-21 (owner, on the agent's options for a second golden story and an end
    date; built in the step that brings packs into rooms):*
    - **1C — two golden stories in every free game**, at every room size, both picked at random
      and revealed last. Chosen over the agent's pick (one for 3–5 players, two for 6–7) knowing
      that a room of 3 then sees 2 of its 3 stories fully Christmas, a room of 4 half, a room of
      7 two in seven. No extra picture cost: both come from the 650. Lobby: "🔔 This game has two
      Christmas stories"; end of a free game: "You just saw two Christmas stories. Unlock all of
      them: A$2.60, every game, until 1 August 2027"; both golden stories' downloads carry the
      unlock line. FM-PACK-4 and design §4.4 say two; `schema.ts`'s comments follow in the build.
      *(Superseded 2026-11-25: one golden story — see* Decisions 2026-11-25 *below.)*
    - **The free Christmas part ends 1 July 2027** — the slice and the golden stories: from then
      a free room, and the Android app, plays the base pools only. On the agent's condition:
      `/x26` and the QR on every shared golden-story download keep leading to a working page,
      which then says the edition has ended.
    - **B — a paid code works until 1 August 2027**, not "forever": a month past the free part,
      for Australia's Christmas-in-July parties. One date on the pack, checked by the server; no
      date inside the code, so `XMAS26-XXXX-XXXX` and D4's 16-character reference stand. The date
      is shown before paying — the pay card, the pay page, the Sponsors tier, the refund policy —
      where "forever" becomes "until 1 August 2027" (ru «до 1 августа 2027»). A code the website
      remembers then says the edition has ended rather than quietly opening a free room.
    - **The agent's two proposals, confirmed by the owner the same day:** each date is the last
      day, honoured through the whole of it anywhere on Earth — the free part of "Christmas
      2026" until 1 July 2027, the paid pack until 1 August 2027 (the server's cut-offs: 2 July
      and 2 August 2027, 12:00 UTC); **sales stop with the free part, 1 July 2027**, so every
      buyer gets at least a month — the pay card only ever appears in a free Christmas game; then
      `/x26` says the edition is no longer on sale, and **the agent retires chr26's Sponsors
      tier** that day — that tier only, Sponsors staying a support rail (D-6). GitHub's API has
      the call (`retireSponsorsTier`); how it runs on the day is settled with the rails.
      FM-PACK-6 holds the dates.
  - *Decisions 2026-11-21, second set (owner, on the agent's plan for the free half's five
    steps — 116 the batch, 117 packs in rooms, 118 the other 18 languages, 119 the landing
    variant and `/x26`, 120 the deploy):*
    - **1A — the batch writes the real bucket with the same token**: Workers R2 Storage Edit
      added to it for the batch, removed again after it.
    - **2A — the agent reviews all 650 pictures** — a grid per character pair and the bottom
      strips at full size, where fake signatures sit — and redraws every visible fake signature
      or watermark, every passer-by in an aftermath, every merged pair and every lost costume,
      up to three tries a picture; the owner approves one summary sheet.
    - **3A — every new room in the edition's 20 languages is a Christmas room**, with a host
      switch in the lobby to play without it.
    - **4A — the room's language decides whether the pack is on.** A player whose own language
      has no Christmas texts (ar, he, fa) reads the pack's words in English. Settles design
      §4.4's open point on a mixed-language room.
    - **5A — the free half shows no price** (none until about 10 December): a golden story's
      download carries "Christmas 2026 edition" and a QR to `/x26`, which leads to the
      Christmas landing until the paid half; no end-of-game unlock line until then.
    - **A — the pictures still failing after three redraws (52 of 650)** get up to three more
      draws each; a picture still signed after those has its bottom tenth cut away (half as
      much from each side, scaled back to size: the feet go, the scene stays); anything else
      left the owner keeps or not on the summary sheet. Flux Schnell signs about one picture
      in two, and a fresh draw is no less likely to be signed, so a few always remain.
    - **A, the four left after those draws** (A02, A04, S229, S604, none clean in seven): up to
      five more draws each, the first clean one kept, else the least flawed draw.
  - **Batch done 2026-11-21 (Step 116): all 650 pictures in the real bucket**, the summary sheet
    approved by the owner. 1,345 draws (650, then redraw rounds of 307, 172, 88, 52, 35, 26 and
    15), ≈ US$2.82 of Workers AI. 630 are stored as last drawn, 30 of them with a minor flaw let
    through (a snowman in a top hat the commonest); 19 still signed after their redraws are cut,
    5 of those from an earlier draw whose only fault was the signature; A02 (the tangled lights)
    keeps its 9th draw of 12 as it was — one tiny passer-by at a shop window — as no draw came
    out empty. Of the last four, A04 came out clean and S229 and S604 signed, then cut.
    **Known artefacts, for the next pack's prompts:** a cocoa mug "watching TV" melts into the TV
    in most draws; town-square aftermaths draw passers-by, steeples and crosses; a snow maiden
    can come out old. The same day the owner took R2 Edit off the token again (checked: R2
    answers 403, Workers AI still works) and cancelled Workers Paid, which runs out on
    3 December 2026. **Next:** Step 117, packs in rooms.
  - *Decisions 2026-11-21, third set (owner, on Step 117's plan):*
    - **D1 A — the share video shows the scene, then the ending**: a golden story's aftermath
      picture, a text card for every other Christmas story. No sound; sleigh bells come with the
      paid half.
    - **D2 A — the Christmas funnel counts from Step 117**: a game in a room offered the
      stories (switch on or off) and a golden story's cartoon seen, per language; landing views
      with Step 119; the payment steps with the paid half.
    - **D3 A — Christmas rooms are on from the deploy** (Step 120, a quiet hour before
      29 November); no server-checked start date. `PACK_ROOMS=off` in the VM's .env is the lever.
  - **Packs in rooms done 2026-11-21 (Step 117)** — design §4.4 "In rooms" and "On the client",
    §5's amendment. Every new room in a chr26 language that has the pack's texts is offered
    chr26, on — en and ru today, the other 18 once Step 118 drafts theirs; the host's lobby
    switch; two golden stories per game, at random, last in the gallery, their aftermath drawn
    after the scene (a card if it cannot be had); the slice in every other story. Reveal and
    gallery show the ending under the scene; a golden story's still and 5 s video carry it, with
    "Christmas 2026 edition" (ru «Новый год 2027») and a QR to `/x26` on the website — the
    landing page in the Android app. No price, no code in any download (tested). `xm_game` and
    `xm_gold` counted, a `/stats/` section per language, the privacy page in 23 languages.
    The 6 new interface lines: en and ru the agent's, the other 21 machine drafts on B-3's pile.
    **Next:** Step 118, the other 18 languages' pack texts.
  - *Decisions 2026-11-21, fourth set (owner, on Step 118's plan):*
    - **D1 A — the German ending card is the template's last sentence**, "Am Ende endete es mit
      …", since a German ending is a dative phrase; every other language's card is the ending
      as written.
    - **D2 A — the Ukrainian snow maiden is «Сніжинка»** ('зі сплячою Сніжинкою').
  - **The other 18 languages done 2026-11-21 (Step 118)** — design §4.4 "Languages and texts".
    chr26's texts in de, fr, it, es-es, es-419, pt-br, uk, ko, ja, zh, yue, id, sw, yo, hi, ta,
    te and bn: 630 machine drafts, local glosses written to each base template (Reyes, Befana,
    Святий Миколай, サンタさん, 圣诞老人, Baba Krismasi, Bàbá Kérésìmesì, …), each file
    `needs-<code>-review` and on B-3's pile. A room in any of the 20 languages is now offered
    the pack; ar, he and fa rooms are not, and their players in a mixed room read English.
    Tests: every language present, NFC, no punctuation of its own, each language's slot shapes.
    **Next:** Step 119, the `?pack=x26` landing variant and `/x26`.
  - *Decisions 2026-11-21, fifth set (owner, on Step 119's plan):*
    - **D1 C — every visitor to a page in the 20 languages sees the two Christmas buttons**,
      from the deploy until the free part's last day, 1 July 2027. No `?pack=x26` variant.
    - **D2 — the buttons say "Christmas stories — play free"** from the deploy, which happens as
      soon as possible, before 29 November. The paid half swaps in its own line ("Christmas pack
      — try it free").
    - **D3 A — the nickname minimum drops to 2 characters for everyone** (decided 2026-11-21,
      after Step 119): two-character ja, zh and ko names (ゆい, 王芳, 민수) and short Latin ones
      (Jo, Li) are refused by the 3 today — the client's check, the server's `NICKNAME_MIN` and
      the FM requirement's "3–20 chars". Not B (2 for Han, kana and Hangul only: script
      detection in both, and Jo and Li still refused) and not C (keep 3). Built in Step 120.
    - **The address is `/x26`** (owner, 2026-11-21, after Step 119): the golden story's QR and
      printed URL, the forwarding page and the ship script's checks say `/x26`, not `/xmas`; the
      dropped variant's name in these notes reads `?pack=x26`. Internal labels — the `from=xmas`
      mark, the `xmas` referrer, CSS classes — are unchanged.
  - **The landing page's Christmas part done 2026-11-21 (Step 119)** — design §4.4 "On the
    landing page". Two red buttons on every page in the 20 languages, a ringing bell and hopping
    letters, to Funny Multi as its own link; `/x26/` forwards to the visitor's language with
    `?from=xmas`, counted as the `xmas` referrer; from the cut-off the head script hides the
    buttons and tells a visitor from `/x26` that the edition has ended. `/stats/`: the
    Christmas section's landing columns, the buttons among the clicks to Funny Multi. The 20
    lines: en and ru the agent's, 18 machine drafts on B-3's pile. The ship script checks
    `/x26` too. **Next:** Step 120 — D3 A's two-character nickname minimum (client, server, the
    FM requirement, tests), then the deploy of Steps 117–120 at a quiet hour before 29 November.
  - *Decision 2026-11-21, sixth set (owner, on Step 120's plan):*
    - **D1 A — the deploy of Steps 117–120 runs in Step 120's own session**, after its push and
      green CI, the server's log checked first for a game in progress (B-27); not a separate
      quiet-hour session (B), not held to 27 November (C).
  - **The two-character nickname minimum done 2026-11-21 (Step 120)** — FM-CORE-4 amended.
    `NICKNAME_MIN` (2) and `NICKNAME_MAX` (20) now live in `@funny/shared`; the server's
    `validateNickname` and the client's Create/Join buttons and field cap read the one pair. A
    character is a UTF-16 unit, as the field's `maxLength` counts — one emoji alone passes.
    Tests: Jo, ゆい, 王芳, 민수 and a padded Li taken, "a" and 王 refused, in-process and on the
    wire. **Next:** the deploy of Steps 117–120 (D1 A).
  - **Steps 117–120 deployed 2026-11-21 (Step 121)** — image `funny-multi:f707819` and the
    landing page; no game was in progress (the log's socket lines, B-27). Christmas rooms are
    on; `PACK_ROOMS=off` in the VM's .env is the lever. The ship scripts now discard curl
    bodies to `NUL` under Git Bash (`/dev/null` failed the `/x26` check). **Next:** the paid
    half by about 10 December — the paid code and the rails, the date on every pay screen,
    and how chr26's Sponsors tier retires on 1 July 2027.
  - *Decisions 2026-11-22 (owner, on Step 122's plan — the paid half):*
    - **D1 — one deploy of the whole paid half, as soon as it is ready**: right after the last
      paid step's push and green CI, the server's log checked first for a game in progress
      (B-27), as in Step 121. Not A (PayID around 3 December, Sponsors in a second deploy).
    - **D2 A — the owner's admin surface is a private phone page behind a secret link**: the
      pending PayID claims with their time left, Received, Block and New code, and the
      lost-code lookup — a 48 h claim cannot wait for a session. Built in Step 124.
    - **D3 A — no email copy of the code**: it is on screen, remembered by the phone, in the
      payment's history and found by the lost-code lookup; no address kept, no sending service.
      Drops "email the backup copy" (*Refunds*) and "the optional email backup".
    - **D4 A — Lightning is not a rail for the pack**: Australia pays by PayID, everyone else
      through Sponsors; Lightning stays a gift link. A code paid over Lightning would be a
      direct sale abroad (*Rejected on the way*: tax registration from the first sale), where
      Sponsors makes GitHub the merchant of record. Replaces "anywhere — Lightning" (*Rails and
      posture*) and the wallet's history (*The payment is the receipt*).
    - **D5 A — a new US$2 one-time Sponsors tier**, "Christmas 2026 edition", its text naming
      1 August 2027, with a webhook, retired on its own. The code comes back through the
      checkout link's `metadata_code=`, or the buyer's GitHub name if the webhook lacks it.
    - **D6 A — the agent retires the tier on 1 July 2027** in one call with the owner's `gh`
      login, from a reminder; until then the server issues no code for a late sponsorship and
      lists it on the admin page for a refund. No long-lived token anywhere.
    - **Five steps:** 122 the code end to end, no payment; 123 the pay card after a free game
      and `/x26` as the pay page; 124 PayID and the admin page; 125 Sponsors; 126 sleigh bells
      and the landing line "Christmas pack — try it free", then the deploy.
    - **Improvements taken (owner, the same day, from the agent's 17; the slots the agent's):**
      #11 a Sponsors guide on the pay page outside Australia ("3 steps, about 3 minutes", in the
      buyer's language) in Step 123; #2 a Christmas invitation (a lobby Share button with a
      festive line, and a join link's preview — a title and one of the 650 pictures) and #15 an
      uptime alarm (a scheduled GitHub check every 30 minutes of the server's health page,
      `/x26` and one Christmas picture, an email to the owner on a failure) in Step 126. After
      the deploy, in a second deploy by 23 December: #1 play alone with two bots (Step 130 since 2026-11-26, the deploy being 127; it
      changes the 3-player rule), #10 gift a pack (Australia's gift-card law checked first — a
      3-year expiry against 1 August 2027), #9 a festive room look (Step 133; snow, off under reduced
      motion; a festive ending card; a bell when a golden story is revealed), #7 the whole-game
      video. **#16, a rule from today: no deploys 24–26 December, 31 December–1 January or
      6–7 January** — until B-27 a deploy cuts off games in progress; `PACK_ROOMS=off` stays
      the emergency lever. Later, in this order: #17 the server disk's backup schedule, #13 free
      full Christmas on 25 December (only if live before the 24 December freeze), #14 a
      back-translation check of the 18 machine drafts.
  - **The paid code done 2026-11-22 (Step 122)** — end to end, no payment yet (design §4.4,
    §5, §11). `XMAS26-XXXX-XXXX` is signed with `PACK_CODE_SECRET` (the VM's `.env` only) and
    read by the shared `parseCode` (any case or separators, O for 0, I and L for 1); the
    server's `codes.ts` gives the verdict, `receipts.ts` keeps the receipt log (`RECEIPTS_FILE`
    in the stats volume, 18 months), and only a wrong code costs a token of the limiter. A room
    opens paid from `room:create`'s code or any player's `room:unlock`; its stories play the new
    `paid` content (`full`'s options and ending picture, none golden), and each game's start
    checks the code again. The website keeps a pay link's `?code=`: Home's card shows the code,
    its last paid day and Remove; "🔔 Use my Christmas pack here" in the lobby and on the end
    screen; a paid story's still and video lead to `/x26`. The Android app ignores codes. The
    privacy policy's receipt-log section is in all 23 languages; the 13 new texts and the
    policy: en and ru the agent's, 21 machine drafts on B-3's pile. Settled in the step: the
    host's switch stays in a paid room (3A of 2026-11-21) — off, an ordinary game with the code
    kept; a date is British English in en and Gregorian in every language (Persian would take
    its own calendar), and where Chrome has no dates in a language, the nearest it has (Hong
    Kong Chinese for yue, British English for yo); Home never breaks the code at a hyphen.
    Verified in phone-sized Chromium against a local server with a throwaway secret, 28 checks:
    a pay link in lower case, a paid room for a guest without a code (offered nothing, the code
    nowhere in the page), a 3-player paid game, a guest's code opening a free room for
    everyone, the Android shell, a broken code, Remove; and Home's card in he, fa, ar, ta, yo
    and yue at 320–390 px. The drafters' notes for B-3's reviewer: "receipt log" and "Home
    screen" are new words in most languages; the buttons are informal and the policy formal in
    fa and the Asian drafts, es-419's buttons say vos and its policy tú, de and it say du and tu
    throughout, fr and uk vous and ви; fr's "pack de Noël" is an anglicism; bn names the pack
    and the stories with two different words for Christmas; Tamil's footer line wraps on a
    phone. **Next:** Step 123 — the pay card after a free game and `/x26` as the pay page, with
    #11's Sponsors guide.
  - *Decisions 2026-11-24 (owner, on Step 123's plan — the pay card and the pay page):*
    - **D1 A — the pay page is a screen of Funny Multi's website**, where the code is kept and
      the rooms are made; the landing site's `/x26` forwards to it. Not a page of the landing
      site.
    - **D2 A — the server picks the way to pay by the buyer's country**: Australia PayID,
      everyone else GitHub Sponsors, with a small "In Australia?" / "Not in Australia?"
      switch on the page for a wrong guess.
    - **D3 A — outside Australia the price reads "US$2" exactly**, with "your bank converts
      it"; A$2.60 in Australia; no conversion anywhere.
    - **D4 A — ar, he and fa players read the card and the page in their own language**, with
      one more line: the pack plays in rooms in its own languages, not theirs.
    - **D5 A — the Sponsors guide is three numbered steps of text** in the buyer's language,
      no screenshots.
  - **The pay card and the pay page done 2026-11-24 (Step 123)** — nothing can be paid yet
    (design §4.4). `/config` says what is on sale and the rail this visitor is offered first
    (`pay`; null without `PACK_CODE_SECRET`, under `PACK_ROOMS=off` and after the free part).
    The end screen shows the pay card after a free Christmas game, on the website only. The
    pay page — opened by the card or by `?pay=x26`, where the landing site's `/x26/` now
    forwards — has the price, the last day, the Sponsors guide, the note for ar, he and fa,
    the refund policy's line with its version, the switch between the two ways to pay, "Play
    free" for a QR's visitor, "You already have this pack" for a phone with a code, and "no
    longer on sale" once the free part is over. Its pay button counts the press and says the
    payment cannot be started: Steps 124 and 125 fill the `startPayment` seam. Three new
    counts (`xm_card`, `xm_page`, `xm_pay`) and a second Christmas table on `/stats/`, "Paying
    for it"; the privacy policy names the counts in all 23 languages. 20 new texts in all 23
    catalogues: en and ru the agent's, 21 machine drafts on B-3's pile. Settled in the step:
    the card's price is the buyer's own — US$2 outside Australia, where the 2026-11-21
    wording had A$2.60 for everyone; D4's line lists the pack's languages by name (19 names,
    the two Spanishes as one) rather than counting them; the tier's name stays English in
    every language, as GitHub shows it, and is kept whole in a right-to-left line; ru and uk
    end a dated sentence «включительно» / «включно», since their dates end in a full stop of
    their own (ru's Step 122 hint too); the landing page keeps reading `?from=xmas` for the
    counts already made, though nothing arrives with it any more. Verified in phone-sized
    Chromium against the built server (a throwaway secret in the process environment only)
    and the built landing site, 426 checks, none failing: a 3-player English game at 360 px —
    the card on all three phones, US$2 on two and A$2.60 on the one given an Australian
    `/config`, Unlock, a press of pay, both ways to pay, Close back to the card; no card in a
    paid room, with the host's switch off, in an ar room or in the Android shell; a 320 px
    room with ar, he, fa, ta and de guests — the card and the page in each language, right to
    left in three, the note in three, nothing cut; the link kept through a reload and taken
    off on close; `/x26/` sending a German browser to `…/?pay=x26&lang=de`; a phone with a
    code; a server selling nothing; and the counts on `/stats/` equal to what the phones did
    (8 cards, 7 pages from the card, 10 from the link, 3 presses). The country lookup itself
    is covered by the server's tests, not by the browser. **Decided 2026-11-25 (owner, on
    the step's report): no price on a golden story's download.** The 2026-11-21 wording put
    the unlock line with A$2.60 on both golden stories' downloads once the paid half is
    live; they stay at "Christmas 2026 edition" over the QR, which now leads to the pay
    page — that shows the price for the viewer's country, which a download cannot know.
    The drafters' notes for B-3's reviewer: none in de, es-419,
    es-es, pt-br, uk, zh and ja; fr writes "jusqu'au 1 août" where French says "1er août"
    (Step 122's hint too); "By card on GitHub Sponsors. Your bank converts it." is loose or
    stiff in it, id, sw, fa, hi and bn; the refund line is loose in sw, fa, te and yue, and
    all formal passives in ar; the note on languages is casual or clunky in it, id, ko, ta and
    te; ko mixes its two polite endings and its button says "잠금 해제"; yo is the least
    certain — diacritics, the money words, "no monthly payment" for "no subscription"; he's
    card says "פותחים את כולם" and its refund line "שינוי דעה"; ar keeps to infinitives to
    avoid gender and its button "فتح" is terse; ta, hi and bn differ in register (polite
    imperatives, formal "आप", informal "তুমি"); the policy's new clause brings "offer",
    "payment page" and "pay button" (de "Bezahlknopf"; ar adds "للشراء"). **Next:** Step
    124 — PayID and the admin page.
  - *Decisions 2026-11-25 (owner, on the Step 124 plan):*
    - **D1 A — the admin page's key is a secret of its own**, `PACK_ADMIN_SECRET` (16
      characters at least; unset, no page), not one derived from `PACK_CODE_SECRET`: a new
      admin key only moves the page and voids no code.
    - **D2 A — no alert on a claim.** The bank's own PayID notice is the owner's cue to open
      the page; nothing is sent by email, push or chat.
    - **D3 A — payments that arrive without "I've paid"** are found on the admin page, which
      lists unclaimed PayID codes of the last 7 days. **And a warning on the pay page** (the
      owner's addition): above "I've paid" the panel tells the buyer to press it before
      closing, and closing with a waiting code asks "Already paid?" first.
    - **D4 A — one waiting code per phone** (kept on it until claimed or the offer ends) **and 3
      PayID codes per address per hour.**
    - **D5 A — the admin page is in English** only: the owner is its one reader.
    - **One Christmas story per free room, whatever the number of players** (the owner's
      request during the step). `GOLDEN_STORIES` goes from 2 to 1; the slice in the other
      stories stays. Lobby: "🔔 This game has one Christmas story"; the pay card: "You just saw
      one Christmas story. Unlock all of them: …". Supersedes 1C of 2026-11-21; FM-PACK-4 and
      design §4.4 say one.
  - **PayID and the admin page done 2026-11-25 (Step 124).** The server's `payid.ts`
    (`POST /pay/payid` issues a pending code, `POST /pay/claim` claims it) and `admin.ts`
    (`GET /admin/<key>`: claimed codes to match within 48 h, unclaimed PayID codes of the last
    7 days, a lookup, Received, Block, New code), as design §4.4 sets out; the pay page's
    transfer panel with Copy on each line, the D3 warning, "I've paid", the close guard and
    the thank-you; the waiting code kept on the phone; the admin page left out of the service
    worker's cache; one golden story; the privacy policy, in all 23 languages, names the
    waiting PayID code on the device and the per-address count of PayID codes. The owner owes
    `PACK_ADMIN_SECRET` in the VM's `.env` and its backups before the deploy. The drafters'
    notes for B-3's reviewer — **the pay texts:** de "Bezahlt", "Verwendungszweck", "Handy";
    fr "Payé", "appli"; it "Pagato", "Causale"; es-es "Pagado", "Concepto", «Pulsa»; es-419
    "Referencia", "Monto", «Presiona»; pt-br "Pago" is terse and «Obrigado» masculine; uk
    impersonal to avoid gendered verbs; ja "支払い済み" is a status, not a verb, and
    "リファレンス" a loanword; ko "결제했어요", "참조 메시지" may not be the banks' label; zh
    "付款参考" is coined ("转账备注" may be the banks' word); yue "㩒" and "閂" need a font that
    has them; id "Referensi" where banks may say "Berita" or "Keterangan"; sw "Rejea" is
    bookish; yo the least certain — tone marks, "Ìtọ́kasí", "Kò tíì — ti í", "ìṣàfilọ́lẹ̀
    báńkì"; ar "تم الدفع", "المرجع" may read as jargon (its "2 يومين" made "يومين" on review);
    he "שולם", "הפניה" rather than the banks' "אסמכתה"; fa "شرح پرداخت"; hi and bn
    transliterate "reference"; ta "குறிப்பு" (note) may be vague; te's button is the longest
    of all and "ఖాళీ" colloquial. **The one-story texts:** fr, it, es-es, es-419, pt-br, he,
    fa, ta, te and sw now name the stories in "unlock all", since a bare "them" lost its
    antecedent; bn keeps the counter "টি"; ja "1つ" where "ひとつ" is softer; ko "한 개"; yo
    "Ìtàn Kérésìmesì kan wà…". **The policy's two clauses:** de "gehortet"; es-es "se
    acaparen"; uk "назбирати" is colloquial; fa "احتکار" also means profiteering; ja's clause
    order is awkward; ko's "…코드뿐이며" (only the pack code) now slightly contradicts the
    added PayID code; yo again the least certain. Verified in phone-sized Chromium against the
    built server (throwaway secrets in the process environment only), 158 checks, none
    failing: a free room of three gets exactly one full story and two slices; the pay card's
    words at US$2 and A$2.60; the PayID panel's rows, Copy, the warning above "I've paid", the
    close guard, the same code on reopening and on reload with no second issue, the claim
    reaching every player's lobby; the admin page at 390 px — its private headers, both lists,
    Received, Block, the lookup, a new code for a buyer and its link; the service worker
    caching nothing under /admin/; no pay page in the Android shell; ar, he, fa, ta and de at
    320 px; the fourth PayID code from one address refused. A wrong admin key gets the game's
    own page (the SPA fallback), as any unknown address does; design §4.4 says so. The socket
    test's room helper now waits for the host's first lobby update, a race seen under load.
    **Next:** Step 125 — paying by GitHub Sponsors.
  - *Decisions 2026-11-25, second set (owner, on the Step 125 plan):*
    - **D1 A — the pay page asks for the buyer's GitHub user name**, and the webhook matches the
      sponsorship by it (a `metadata.code`, if GitHub ever sends one, first): GitHub's
      documentation does not say the checkout link's metadata reaches the webhook.
    - **D2 A — a Sponsors code works only once GitHub's webhook arrives or the owner presses
      Received.** No 48 h claim on the buyer's word, no "I've paid".
    - **D3 A — the GitHub name is kept in the receipt log for 18 months** with the rest, and the
      privacy policy names it.
    - **D4 A — the live check:** after the deploy a family member's GitHub account makes one
      real US$2 sponsorship of the tier, and the owner refunds or keeps it.
  - **Sponsors done 2026-11-25 (Step 125).** The server's `sponsors.ts` (`POST /pay/sponsors`
    issues a code waiting for a GitHub name and answers with the tier's checkout link,
    `POST /pay/sponsors/hook` checks GitHub's signature and switches the code on, `POST
    /pay/status` tells the page), as design §4.4 sets out; a Sponsors code is never claimed;
    the raw body kept for the hook's signature by the server's one JSON parser; the admin page's
    two Sponsors lists and "Make a code for this sponsorship"; `parseGitHubLogin` in shared;
    the pay page's GitHub-name field, the checkout panel, "Waiting for GitHub…", Change, and the
    page asking every 5 s for 15 minutes and on return to the tab; the privacy policy, in all
    23 languages, names the GitHub name on the device and in the receipt log, the sponsorship
    GitHub reports, and the per-address count of Sponsors codes. Before the deploy the owner
    owes the tier, the webhook and the two env values in the VM's `.env` and its backups (the
    step's log entry lists them). Seen working 2026-11-25 in a headless phone-sized browser
    against a local server with throwaway secrets and signed stand-in webhooks: 83 checks
    (the whole flow, refusals and a duplicate delivery, the owner's Received, a sponsorship
    with no code and "Make a code", Change, ar, he, fa, ta and de at 320 px, the fourth code
    from one address refused, none in the Android shell); the real US$2 sponsorship is D4's,
    after the deploy. The drafters' notes for B-3's reviewer — **the Sponsors
    texts** (en and ru the agent's; the other 21 machine drafts): the game's texts keep each
    catalogue's own address (fr «Ton», uk «Твоє», id "-mu", bn «তোমার»), the policy's clause
    its page's (fr «vous», uk «ви», id "Anda", bn «আপনি»); "user name" differs between the two
    in te ("యూజర్‌నేమ్" / "యూజర్ పేరు"), ta ("பயனர்பெயர்" / "பயனர் பெயர்") and yo ("oníṣe" /
    "olùmúlò", the least certain); "Benutzername", "nom d'utilisateur", "nombre de
    usuario", "nome de usuário", "ユーザー名", "사용자 이름", "用户名" are unchecked against
    GitHub's own localised pages; "sponsorship" is coined in sw ("udhamini") and yo ("ìgbọ̀wọ́"), a
    loanword in hi, ta, te and bn; he keeps the plural address, ar the masculine singular of
    the rest of its policy. **Next:** Step 126 — sleigh bells.
  - *Decisions 2026-11-25, third set (owner, on the Step 126 plan):*
    - **D1 A — the bells are a CC0 recording**, 5 s of "Sleigh bells.wav" by The Midnite Wolf
      on Wikimedia Commons, credited in the README.
    - **D2 A — bells only in a golden story's and a paid game's videos**; an ordinary story's
      clip stays silent.
    - **D3 A — the join link's preview has one fixed picture**: the agent proposes 3 of the 650
      that avoid the known flaws, the owner picks one, and it ships as a 1200 × 630 JPEG from
      the game's own address. The uptime alarm checks the same picture.
    - Following from these, the deploy is Step 127 and #1 (play alone with two bots) moves to
      Step 128 (130 since 2026-11-26, when Steps 128–129 took the Christmas characters and dressing).
  - **Bells, the landing line, the invitation and the alarm done 2026-11-25 (Step 126)** — not
    live until Step 127's deploy. `sleighBells.ts` (`clipSound.ts` since 2026-11-26) and
    `public/sounds/sleigh-bells.mp3` (the clip's audio track, best-effort); `xmasStrings.ts`'s 20 `play` lines; `PACK_INVITES` and
    `inviteText` in shared (23 languages) and the lobby's `lobby.invite` button (share sheet,
    copy fallback); `invitePreview.ts` (the dressed join page) and `public/og-christmas.jpg`
    (provisional: S006, until the owner picks); `.github/workflows/uptime.yml`, which reads a
    Worker picture's address from the repository variable `CHRISTMAS_PICTURE_URL`, the
    owner's to set. Seen working 2026-11-25 in phone-sized Chromium: 45 checks — golden and
    paid clips carry an opus track peaking at −2.7 dB and an ordinary one none; de, ta and en
    landing buttons fit 320 px; the share sheet gets the line and the ordinary link, the copy
    fallback says "Скопировано!" in ru at 320 px, no button in an ordinary (ar) room; a
    Christmas room's link carries the tags and a 1200 × 630 JPEG, an ordinary room's and the
    plain home none, and the dressed link opens the join screen. The drafters' notes for B-3's
    reviewer — **the invitation and the landing line** (en and ru the agent's; the other 21
    invitations and 18 landing lines machine drafts): each invitation names the game with
    its catalogue's `home.title`, quoted as that script quotes ("…", «…», „…“, 「…」), and
    keeps the catalogue's address (fr «Rejoins», de «Spiel mit», uk «Заходь», bn «এসো»; te,
    hi and he the plural or polite form, as their lobbies do); "cartoon" is «dessin animé»,
    «cartone animato», «caricatura» (es-419), «漫画» (ja, zh, yue — a comic as much as a
    cartoon, the least certain of the CJK), «만화», «kartun»/«katuni»; ar «بنسخة عيد الميلاد»
    turns "Christmas game" into "the Christmas edition of"; yo «Darapọ̀ mọ́» and «àwòrán
    eré» (cartoon) are coined; the landing line's "pack" reuses each catalogue's
    `home.packCode` word, and yo «gbìyànjú rẹ̀» (try it) is the least certain of the 18.
    **Next:** Step 127 — the deploy.
  - *Decisions 2026-11-25, fourth set (owner, on the Step 127 plan — the deploy):*
    - **D1 A — the Sponsors setup before the deploy**: the tier, the webhook and all four
      values in the VM's `.env`, then one deploy and one restart. Not PayID first.
    - **D2 B — the agent makes the tier** with GitHub's GraphQL `createSponsorsTier`, after the
      owner grants the `gh` login the `user` scope once (the same login retires it under D6 of
      2026-11-22); the dashboard by hand if the API refuses. The webhook stays the owner's, on
      the dashboard.
    - **D3 A — the agent's script makes the secrets** on this PC (files in a location kept in
      the agent's memory, never in the repo or the chat): the owner pastes the webhook secret
      into GitHub and bookmarks the admin link; the script writes all four into the VM's `.env`
      after a `.env.bak-step127`. One command per secret for the owner if auto mode refuses.
    - **D4 A — the live PayID check moves no money**: a code issued on the pay page, "I've
      paid", Received on the admin page, one paid room, then Block.
  - **The paid half deployed 2026-11-25 (Step 127)** — image `funny-multi:395a65a` and the
    landing site. Before it: the three secrets made by the agent's script and appended to the
    VM's `.env` (backup `.env.bak-step127`), the US$2 one-time tier made through the API
    (checkout number 687176, in the `.env` as `SPONSORS_TIER_ID`), the owner's webhook. After
    it: no start-up warning about the four values, the webhook's ping redelivered with 204, the
    uptime alarm enabled and green. On the owner's phone: PayID with no money (issue, "I've
    paid", Received, a paid room, Block), the invitation's preview with the reindeer and the
    cat, "one Christmas story" in a free lobby, bells in a golden video. **Owed:** D4 of
    Step 125, the real US$2 sponsorship. **Next:** Step 130 — #1 play alone with two bots.
  - *Agent finding 2026-11-25 (Step 127), for the owner to place:* **a lone host's room can
    close while the invitation is sent.** The 65 s grace (`DISCONNECT_GRACE_MS`) counts from the
    socket's close, and a phone hides the game while the share sheet and the messenger are open;
    the owner's first try lost its room that way, so the messenger's preview was the plain one,
    and guests opening the link would have found no room. Not new to Step 126, but the Invite
    button makes it common. Options when taken up: a longer grace for a host alone in the lobby
    (minutes, not seconds), or the room kept until its host's own tab is closed. **Taken up as
    Step 132, 2026-11-27** — the lobby's window is 10 min (below, after the itch.io decisions).
  - **A reindeer and a Santa in the Christmas video, saying "ho-ho-ho"** (owner request
    2026-11-26; design §8.3, amended that day). In the 5 s clip of a golden story and of a paid
    game's story the monkey gives way to a reindeer in half of the clips and a funny Santa in
    the other half — body parts prepared as the monkey's are, the same movements — and the
    silent "ha-ha" becomes "ho-ho-ho" in the owner's own voice, altered so it cannot be taken
    for his. The agent's readings, the owner's to overturn: only the clips that already ring
    (golden, paid) change; the two take turns clip by clip, the first by chance; the balloon
    says "ho-ho-ho" in Latin letters in every language.
    - **Code done 2026-11-26, committed in Step 128, deployed the same day.** `videoCharacter.ts` (was
      `videoMonkey.ts`: one act, three rigs, `nextCharacter`), `clipSound.ts` (was
      `sleighBells.ts`: the voice at 3 s, the bells turned down under it, the voice optional),
      `recordWobble.ts`, sprites in `public/reindeer/` and `public/santa/`. Seen working in
      real headless-Chromium recordings: reindeer, then Santa, then an ordinary clip's monkey;
      with a stand-in voice file it starts at 3.0 s and the bells are 10.5 dB lower under it;
      with no voice file the clip rings with the bells alone.
    - **Owner decisions 2026-11-26.** D1 **D**: of the five Santas drawn (A jolly classic,
      B cool shades, C googly goof, D the moustache, E winking grandpa) the moustache — its
      sprites are the ones in `public/santa/`. D2 **A**: the altered voice lives in the public
      repo under a credit line in the README, not on the deployment alone.
    - **The voice added 2026-11-26.** From the owner's recording, which stays outside the repo
      with the settings: 1.6 s, 13 KB, mono, no tags of the recording — lower and
      larger-throated than the owner, with a second, differently moved copy under the first.
      The README credits it. Seen in real recordings with the file as shipped: the three "ho"
      at 3.0, 3.5 and 4.0 s (the third as the fall begins), the voice over by 4.6 s, the bells
      down under it and back before the clip ends, no clipping (peak −2.7 dB).
    - **A voice each, 2026-11-26 (owner: "A stays for the Santa, for the reindeer make 5
      options of higher, a cartoon voice").** The low voice above is the Santa's for good:
      `public/sounds/ho-ho-ho-santa.mp3`. The reindeer has its own file,
      `public/sounds/ho-ho-ho-reindeer.mp3`; `CharacterRig.voice` names each, the monkey has
      none, and `openClipSound` takes the path. Five higher alterations of the same recording
      were made for the owner's ear, outside the repo: 1 the young reindeer, 2 the chipmunk,
      3 the bleat, 4 the nose, 5 the two squeaks. He heard each on a clip of the reindeer
      alone on white and chose **3, the bleat** (2026-11-26) — higher, with a kid goat's
      wobble; 1.5 s, 13 KB. Nothing is owed on the voices.
    - **The landing buttons ring and explain, 2026-11-26 (owner: "mouse hover, add 'bells'
      sound, add tooltip … please improve the tooltip text").** Both "Christmas pack — try it
      free" buttons (top and foot) sit in a `.xmas-wrap` with a `role="tooltip"` the button's
      `aria-describedby` names; the text is the new `XmasStrings.hint`, in the game's own words,
      not "golden": en "Create a new room: one of its stories will be a Christmas story. Free,
      no sign-up.", ru "Создайте новую комнату — одна из её историй будет новогодней. Бесплатно
      и без регистрации."; the other 18 are machine drafts. Shown on hover and keyboard focus,
      below the top button and above the foot one; Escape hides it (WCAG 1.4.13).
      `client/xmasButtons.ts` (new) rings the game's own CC0 bells, copied to
      `public/media/sleigh-bells.mp3`, at half strength when a mouse comes over either button
      and fades them out in 0.4 s when it leaves; fetched on the first mouse move. Browsers
      keep a page silent until the visitor has clicked or typed on it, so a first hover before
      that rings nothing. **A touch screen (owner's pick "1 + jingle", the same day, of two):**
      no hover, so the same line is a caption under each button, always shown; a tap rings the
      bells (a tap may sound) and the game opens 0.4 s later. A mouse click, a key or a
      new-tab click goes at once. Seen in Chromium: desktop en hover, Escape and focus; phone
      en 360, ru and de 320, caption under both buttons, no sideways scroll, the tap's bells
      and the game after them.
    - **Funny Multi's create screen wears Christmas, 2026-11-26 (owner: "make 2 and 4, and
      page with slow falling big snow cristalls", of four suggested).** While a new room in
      the picked language gets the free pack (`packForRoom`: its 20 languages, until the free
      part ends), `components/art/ChristmasDressing.tsx` (new) adds: a string of red, green
      and gold bulbs along the top edge, twinkling (2); under the subtitle a gold-on-green
      line, new key `home.christmasLine` (en "🔔 One Christmas story in every new room"), with
      the video's reindeer peeking up from behind it and a bubble, `home.christmasPeek` (en
      "Christmas pack — free!"); a tap on either rings the clips' bells at half strength and
      shakes the reindeer (4); and 14 big six-armed snow crystals falling slowly behind the
      page, swaying and turning. Not on the join screen; ar, he and fa have the two keys
      (every catalogue has every key) but never show them. en and ru are written; the other 21
      are machine drafts. Under prefers-reduced-motion nothing moves and the snow lies
      scattered. Seen in Chromium: desktop en 1280; phone en 360, ru, ta and de 320, no
      sideways scroll, the title clear of the lights, the tap's bells; ar bare.
    - **Committed 2026-11-26 as Step 128** (the characters, the voices, the landing bells and
      the home dressing); pushed (CI run 45758195541 green) and deployed the same day (image
      `funny-multi:772446e`, the landing site).
    - **The reindeer holds two bells, 2026-11-26 (owner: "make the reindeer with two pows,
      holding a bell in each of two pows").** On the create screen the peeking reindeer raises
      both arms (the video's `arm.png` sleeves, turned up and out past the ears) with a gold
      handbell hanging from each hoof; the bells rock gently, and a tap swings them as the
      bells ring and the reindeer shakes. Still under reduced motion. The video's reindeer is
      unchanged. Seen in Chromium: phone en 360, ru, ta and de 320, desktop 1280 — clear of the
      bubble and the line. Committed as Step 129, pushed (CI run 45760488756 green) and deployed the same day
      (image `funny-multi:01cd07a`); the owner's look on the phone is owed.
  - **#1 play alone with bots — Step 130, 2026-11-26** (owner decisions "A, A, A, B"): D1 A, any
    room under 3 humans is filled to 3 seats with bots at Start and at Restart (FM-ID-1 now 1–7
    humans, FM-BOT-3 new; design §6); D2 A, "Bot 1" / "Bot 2" in each player's language; D3 A,
    #1 deploys on its own; D4 B, the lone host's grace is its own step next (Step 132). The
    label reads "Start with N bots", a joiner means one bot fewer, the only human leaving
    deletes the room; `xm_bots` and a `/stats/` column count Christmas games with bots; the
    privacy page says so. en and ru the agent's, 21 machine drafts on B-3's pile. Seen in
    Chromium (52 checks: alone, two humans, joiners, the Android shell, ar/he/ta/de at 320 px,
    the counts). Pushed as `f06fe59`, CI green, deployed 2026-11-26; a game with bots seen on the
    owner's phone 2026-11-28.
  - *Decisions 2026-11-27 (owner, on the agent's itch.io plan; D-6 amended the same day):* a
    visitor outside Australia can also buy the pack on **itch.io at US$1.00**, Payouts mode only
    (itch.io the merchant of record), its share set to 0% (about US$0.67 kept a sale; the first
    payout after 8–13 sales: US$5 minimum, the US$3 tax interview once); itch.io pays out to the
    owner's PayPal, which only receives. **The Sponsors tier stays abroad at US$2.00**, as it
    is; Australia stays PayID. Delivery: an itch.io sub-product whose redeem URL lands on this
    site with itch.io's signed token; the server checks it, takes each `purchase_id` once and
    makes the code work. Its own step after the lone host's grace (Step 132), numbered when it
    runs (#9 took Step 133); which rail the page opens on abroad, and the texts, are settled on
    that step's plan. **Owed by the owner first, one op at a time:**
    the itch.io account in Payouts mode with the tax interview and the PayPal address; a look
    that "Sub-products & DLC" shows on it (if not, the step stops); the US$1.00 sub-product
    with the redeem URL the agent gives; the project's secret token as a file on this PC.
    Unsettled until then: whether US$1 is allowed for a sub-product, whether a buyer can claim
    again after closing the tab, Australia's withholding rate. The counters showed 2 of 96 game
    visits from abroad in the 30 days to 2026-11-26.
  - *The itch.io step's plan, owner decisions 2026-11-27 ("A, A, A, A, A, A — go ahead"):* D1 A, the
    owner's four itch.io ops first, the build after them (if "Sub-products & DLC" is missing or
    the tax interview stalls, #9 the festive room look is built meanwhile); D2 A, the pay page
    abroad opens on itch.io, Sponsors second; D3 A, the price line reads "US$1 + local tax where
    it applies"; D4 A, if itch.io refuses US$1 for a sub-product, the lowest price it allows, up
    to US$2; D5 A, the itch.io page unlisted for now (public once a sale has worked end to end);
    D6 A, deployed on its own right after the step. The agent's readings, the owner's to
    overturn: the code is made before the purchase, as with Sponsors, and travels in the
    purchase link's signed metadata; a buyer who lost it writes to the owner with itch.io's
    receipt, matched on the admin page or replaced with "New code".
  - *The owner's itch.io ops, 2026-11-27/28:* account `funny-family`, Payouts mode, tax interview
    signed and waiting for itch.io's check (W-8BEN; 5% on US-source income, 0% otherwise). The
    PayPal address is asked for only at the first payout request (US$5+). The project page
    `funny-family.itch.io/christmas-pack` exists as a Draft, "$0 or donate", AI disclosure
    Graphics, Text & Dialog and Code. **It has no "Sub-products & DLC" page.** itch.io's
    changelog of 23 Oct 2019 marks sub-products "admin only", enabled by the site admins on
    request, and forum moderators called them shelved in 2021. The owner sent the email on
    2026-11-28 (drafted by the agent). External keys are no stand-in:
    a page "cannot be listed as selling only a Steam Key or other external key"
    (`/docs/creators/download-keys`). *Owner decision 2026-11-28 ("A"):* the owner emails
    support@itch.io from the account's address, asking to switch on sub-products for the page
    and whether US$1 is allowed. #9 the festive room look is built meanwhile, and Sponsors stays
    the rail abroad. If itch.io switches sub-products on by 14 Dec, the itch.io step goes ahead
    as planned (D2–D6 above stand). If not, itch.io waits for a later pack (B-10), and D-6(e)'s
    US$1 abroad is not in effect this Christmas.
  - *#9 the festive room look — Step 133's plan, owner decisions 2026-11-28 ("A, A, A, A"):*
    D1 A, Home's snow crystals fall behind every room screen (lobby, writing, waiting, reveal,
    end) while the room's pack is on, going and coming back on every phone with the host's
    switch; D2 A, the agent draws three festive ending cards (holly, candy cane, snowy green)
    and the owner picks one from a phone picture; D3 A, only a golden story's reveal rings —
    each phone reveals its own story, so one phone a free game — and a paid story's reveal
    stays quiet, its clip ringing already; D4 A, deployed on its own right after the step, when
    no visitor is connected. The agent's readings, the owner's to overturn: under reduced motion
    the crystals lie still, as on Home (the list's "off" read as "no movement"); the snow
    carries on from Home into the room without starting over; the video's card takes the screen
    card's look; the bell is the first 2.5 s of the clips' sleigh bells, soft and fading, as
    the reveal screen opens beside "🔔 A Christmas story" — under 3 s, so no stop control
    (WCAG 1.4.2) — and silent, with no error, where the phone refuses sound. No new words.
    Added while building, also the owner's to overturn: the golden phone's sound is kept
    running, silent, from its last round until its bell rings, since started again only as the
    reveal opens it came 0.2–1.3 s late in Chromium; every other phone's idles after its first tap.
    D2's pick: card 1, "Holly" (owner, 2026-11-28) — a green frame, a holly sprig on the
    top-left and bottom-right corners, the gold bell with a red bow. Added while building it, the
    owner's to overturn: when a video ends on the card, the deployer's logo stamp fades out with
    the scene — the stamp marks pictures, the screen's card has none, and it would sit over the
    bottom-right sprig. Pushed as `5438de9`, CI green, deployed 2026-11-28; seen on the owner's
    phone the same day.
  - *#10 gift a pack — Step 134, owner decisions 2026-11-28 ("A, A, A, A — go ahead"):* D1 A,
    "Give as a gift" on the pay page makes a code of its own and ends with a link to share (no
    picture card or QR); D2 A, the gift ends 1 August 2027 as every code does, relying on the
    limited-period exemption from the three-year gift-card rule (Competition and Consumer
    Regulations 2010 reg 89C(1)(a), read in compilation 100 on 2026-11-28; not legal advice),
    the date shown to buyer and friend; D3 A, PayID only; D4 A, deployed on its own right after
    the step, when no visitor is connected. Design §4.4. The agent's readings, the owner's to
    overturn: no friend's name or address is asked; a gift costs a pack's price; the buyer's
    phone lists its gifts; a gift link never replaces another working pack; the Android app
    shows none of it. The privacy policy changed in all 23 languages (what the phone and the
    receipt log keep, the gift button's count). en and ru the agent's, 21 machine drafts on
    B-3's pile. Then, same day ("A, then commit and push"): Home's pack card links to giving it,
    and the pay page gives a pack owner placed abroad the "In Australia?" switch.
  - **The lone host's grace — Step 132, 2026-11-27** (owner decisions "A, A, B, A, A" on the
    Step 127 finding above): D1 A, Socket.IO's recovery lengthened; D2 A, the window is the
    phase's — 10 min in the lobby, 65 s in a game as before (B14 stands) — and at Start anyone
    still away is dropped, bots filling the seats up to three; D3 B, 10 min; D4 A, a page back
    too late goes Home and says "You were away too long — the room went on without you."; D5 A,
    deployed on its own right after the step. FM-CORE-3 amended; design §5, §6, §8.4, DD-17.
    The agent's readings, the owner's to overturn: recovery is kept 12 min (the window, plus room
    for the once-a-minute `recovery:mark` that keeps a quiet page recoverable); a lobby page that
    is really going (`pagehide` not kept for Back: closed, reloaded, navigated away) gives its
    seat up at once; a reveal or end screen stays where it is. en and ru the agent's, 21 machine
    drafts on B-3's pile. Known gaps, not fixed here: the lobby's "Start with N bots" counts an
    away player, so more bots can sit down than it says; a reveal or end page whose seat went
    stays put, and its "ready" finds no room; a tab that Android discards and reloads has lost
    its connection's id, so its host cannot get back in (a follow-up could keep the id in the
    page); after a deploy or a restart every seated page shows the same line. Seen in Chromium
    (71 checks): a host alone away 147 s kept the room and came back to a friend in
    it; one away at Start became a bot and, back, got Home with the line; a mid-game seat still
    went to a bot at 65 s; a reloaded, navigated or closed lobby page gave its seat up at once; a
    restart sent ar, he, ta and de pages Home with the line at 320 px. iOS's `pagehide` not seen.
    Pushed as `1b853fa`, CI green, deployed 2026-11-27; seen on the owner's phone the same day.
- **B-29a** A Southern-Hemisphere summer edition for Australia and Brazil (owner decision
  2026-11-05, D5 under B-29): Christmas in summer — the beach and the barbecue that chr26 had
  until the owner's ru edit of 2026-11-05 are its seed. An edition of its own beside chr26, not
  options inside it: its own pack id, concept set and picture batch (650 at 5 options per slot,
  DD-16). Not scheduled. Open when it is taken up: its languages (en for Australia, pt-br for
  Brazil), its dates, and whether chr26's code unlocks it too.
- **B-30** — **closed 2026-11-09 (Step 106)**, block in `steering/tasks-done.md`. CI, the server
  image and `engines` are on Node 22; production runs 22.23.4 since the 2026-11-09 deploy.
- **B-31** Google Play badges on the landing page (owner decision 2026-11-19, alongside the Play
  publish): the official "Get it on Google Play" badge under each game's Play row, a second
  route to the same Android app besides the existing Play button and QR code. **Code done and
  verified 2026-11-19 (Step 110):** `apps/funny-family-site/src/render/playBadge.ts` (new) draws
  the badge from Google's own artwork, trimmed and re-served locally
  (`public/media/google-play/<language>.png`, 23 languages) at the Play button's height (52px,
  Google's quarter-height clear space); hidden on an iPhone or iPad, which the head script now
  marks `<html data-ios>` (`render/headScript.ts`, UA sniffing plus iPadOS's Mac-disguise via
  `maxTouchPoints`) since neither has the app; a `foot-legal` trademark line, pinned
  `lang="en" dir="ltr"` even on an RTL page. Counted as a new `fm-gp`/`fo-gp` hub-click target
  (`client/track.ts`, `analytics.ts`, `stats/view.ts`). Verified with a 13-language Playwright
  pass plus two click-throughs to the real Play listings, both firing the right `hub_click`
  beacon; the only failures were the pre-existing `/api/config` 502 of a backend-less preview,
  unrelated to badges. **Live since 2026-11-20 (Step 112):** `deploy/ship-funny-family.sh`, its
  eight checks green, and the badges confirmed on the live page — markup on `/` and `/he/`, six
  badge files byte-identical to the repo's, the game's container untouched.
  - *Owed:* the owner's own eyes on the live badge, in a language or two of their choice.
  - *Kept on purpose:* no badge on iOS, which has no app to send a tap to; six languages (ar, bn,
    fa, he, ta, te) keep Google's pre-2022 Play logo, since that is what Google's own badge page
    hands out for them and the owner chose not to override it with the English artwork; Yoruba
    shows the English badge, Google having none of its own.

## Dependency notes

- Phases are strictly ordered 0→8; Phase 9 (commercial, D-6/D-7) requires only Gate 4
  technically and keeps the last slot that D-4 gave it, although D-4 itself is superseded.
- T-1.5 (en/ru pools) blocks Gate 1 but T-1.6 and Phase 2 tasks T-2.1/T-2.2 can proceed in
  parallel with it.
- T-6.3 (13 pool languages) is the largest content task; it can start any time after T-1.4
  freezes the id set.
