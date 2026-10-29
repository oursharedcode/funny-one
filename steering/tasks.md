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
  - *Owed:* the Equifax D-U-N-S rename to MARK WEB TOOLS, submitted 2026-10-18, due about
    2026-11-17; when it lands, the owner confirms the new name in Payments Center → Review updates,
    before its deadline. Then the listing (assets, content rating 12+, Data Safety, release).
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
  B-16's five and B-21's three.
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
  new `funny-stories` repository, as two tiles. **Code done, not yet pushed or deployed.**
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
  `https://www.funny-family.oursharedcode.com/`.
  - *Owed:* deploy, then one more live check (download a picture from `https://funny37…` and scan
    the code with a phone, any language).
  - *Not done, owner to decide:* `funny-one`'s GitHub repository has no description (About box),
    unlike `funny-stories`; a one-line `gh repo edit` fix, public-facing, left for the owner's
    wording and go-ahead.

## Dependency notes

- Phases are strictly ordered 0→8; Phase 9 (commercial, D-6/D-7) requires only Gate 4
  technically and keeps the last slot that D-4 gave it, although D-4 itself is superseded.
- T-1.5 (en/ru pools) blocks Gate 1 but T-1.6 and Phase 2 tasks T-2.1/T-2.2 can proceed in
  parallel with it.
- T-6.3 (13 pool languages) is the largest content task; it can start any time after T-1.4
  freezes the id set.
