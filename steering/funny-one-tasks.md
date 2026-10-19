# Funny One «Семейная Чепуха» — Tasks (steering)

| | |
|---|---|
| **Document** | `steering/funny-one-tasks.md` |
| **Status** | Phases FO-0–FO-5 closed. Full local game playable end to end in all 15 languages, all 106 rig assets drawn and composited with a spring reveal, StoryGallery/end screen wired, rig-to-PNG export + native share. Phase FO-6 (PWA + deploy) closed 2026-09-26. Open: Phase FO-7 (T-FO-7.1, the phone pass that closes Gate FO). Done ahead of Gate FO by owner re-order 2026-10-05: Phase FO-8 (pictures from the Internet, D-10), S-3a (the game on its own host, live) and S-3b (Android app: signed, installed and tested OK on the owner's phone; its Play listing is S-3c). |

Execution plan for `steering/funny-one-requirements.md` (FO-\*) per
`steering/funny-one-design.md`. Same discipline as Funny Multi: phases in order, verify each
gate before moving on. Numbered FO-0.. / S-.. to avoid colliding with Funny Multi's Phase 0–9 in
`steering/tasks.md`.

Sizing: (S) ≤ half a day · (M) about a day · (L) multiple days (or, for owner-only steps with
external wait time, elapsed time rather than effort).

---

## Phase FO-0 — decide the fork (CLOSED 2026-09-20, D-8)

- [x] **T-FO-0.1 (S)** Resolved: on-device rig (not the AI pipeline), round-robin turn-passing.
      Recorded as D-8 in `funny-one-requirements.md` §2.

## Phase FO-1 — repo scaffold (CLOSED 2026-09-20)

- [x] **T-FO-1.1 (S)** `apps/funny-one-client` workspace: package.json, tsconfig, Vite/Tailwind/
      PWA config copied from `funny-multi-client` and adapted (`BASE_PATH` read via
      `normalizeBasePath`, same as Funny Multi — `/funny1-game` is the intended deploy value per
      D-5, set at build time, not hardcoded); full-precache PWA strategy (FO-IMG-2) instead of
      Funny Multi's NetworkFirst shell; `qrcode`/`socket.io-client` deliberately omitted
      (FO-ARC-3). Placeholder `App.tsx` (wordmark + subtitle, no game logic) and one smoke test.
      CI wiring needs no change (existing `apps/*` workspace glob already covers it). All six
      gates verified for the new workspace (typecheck, lint, format, test, build, audit).

## Phase FO-2 — local game engine

- [x] **T-FO-2.1 (M)** Promote `renderProse`/`polishProse`/`polishRussianProse` from
      `apps/funny-multi-server` into `packages/shared`; re-point Funny Multi's server at the
      shared version; unit tests before either client consumes it. → FO-ARC-2
      *Step 20 (2026-09-20): scope widened to the whole i18n module (owner call), not just the
      three named functions — `renderProse` needs the prose templates it fills. JSON catalogs
      converted to TS modules (owner call), mirroring `pools/text/index.ts`. See
      `docs/IMPLEMENTATION_LOG.md` Step 20 for the full record.*
- [x] **T-FO-2.2 (M)** Local round-robin state machine: seat list (human/virtual), per-question
      rotation via the unmodified `storyIndex`, virtual-seat auto-fill with the "thinking" delay.
      Pure reducer logic, unit-tested before any screen exists. **Confirm OQ-3 (min player
      floor) before starting.** → FO-CORE-1/2, FO-BOT-1
      *Step 21 (2026-09-20): `apps/funny-one-client/src/game/roundRobin.ts` — the "thinking"
      delay itself is deferred to T-FO-3.3 (no screen exists yet); this step only exposes which
      seat is up and its kind. See `docs/IMPLEMENTATION_LOG.md` Step 21.*

## Phase FO-3 — core screens (CLOSED 2026-09-20)

- [x] **T-FO-3.1 (M)** Home/setup screen (seat count, human/virtual mix, language picker gated
      to `AUTHORED_LANGUAGES`).
      *Step 22 (2026-09-20): `apps/funny-one-client/src/screens/HomeScreen.tsx`, adapted from
      Funny Multi's create-mode `HomeScreen` (two-column rules+language layout, `ScrollBox`,
      flag artwork copied under `public/flags/`). `GameState` gained a `language` field so the
      picked content language survives into `App.tsx`'s (still-placeholder) playing view. See
      `docs/IMPLEMENTATION_LOG.md` Step 22.*
- [x] **T-FO-3.2 (M)** `HandoffScreen` + adapted `RoundScreen` combobox.
      *Step 23 (2026-09-20): `apps/funny-one-client/src/screens/HandoffScreen.tsx` (new,
      FO-CORE-3) and `RoundScreen.tsx` (adapted from Funny Multi's, no `TimerBar`, owner call).
      `App.tsx` rewritten as a local phase machine: setup → (handoff → round)× → done. A virtual
      seat's turn resolves immediately with no screen (owner call) — the "thinking" pause lands at
      T-FO-3.3. See `docs/IMPLEMENTATION_LOG.md` Step 23.*
- [x] **T-FO-3.3 (S)** Virtual-seat "thinking" mascot delay (archive ONE-4, 0.8–1.5 s).
      *Step 24 (2026-09-20): `apps/funny-one-client/src/game/thinkingDelay.ts` (FO-BOT-1,
      RNG-injected like `pickVirtualAnswer`) + `ThinkingScreen.tsx` (reuses Funny Multi's
      `WaitingMascot` unmodified, no button/affordance). `App.tsx`'s virtual-seat effect now
      schedules `submitAnswer` via `setTimeout` with a `clearTimeout` cleanup (functional
      `setGame` update, avoids stale closures under StrictMode's dev double-invoke) instead of
      resolving instantly. See `docs/IMPLEMENTATION_LOG.md` Step 24.*

## Phase FO-4 — rig art + reveal (CLOSED 2026-09-24)

- [x] **T-FO-4.1 (L)** Rig art: backgrounds, characters, co-characters, props — new content,
      matched to the existing mascot art style. Sizing is content-authoring time, not code.
      *OQ-4 resolved 2026-09-20 (owner): cross-device sharing wanted, via the OS native share
      sheet only — no upload/link, no network call. See `funny-one-requirements.md` §7.*
      *Step 25 (2026-09-22): all 40 assets (10 each of `where`/`who`/`with`/`did`) drawn under
      `apps/funny-one-client/src/components/art/rig/`, spec and full id→file mapping in
      `rig/RIG_ART.md`. No `rigIndex.ts` registry yet — that's T-FO-4.2. See
      `docs/IMPLEMENTATION_LOG.md` Step 25.*
- [x] **T-FO-4.2 (M)** Rig compositor: layered assembly, spring reveal, in-round dedup. →
      FO-IMG-1/3/4
      *Step 26 (2026-09-22): `art/rig/rigIndex.ts` (id→component registry, bijection-tested
      against `POOLS[0/1/2/4]`) + `components/RigScene.tsx` (the compositor: `where`→`who`→
      `with`→`did` z-order/positions per `RIG_ART.md`, spring reveal reusing `motion.ts`'s
      `goofy` preset unmodified, `reveal={false}` settled mode for T-FO-4.3's gallery). Owner
      decision (2026-09-22): FO-IMG-4 dedup stays bot-only (existing `usedOptionsThisQuestion`)
      — humans keep the full pool, a repeat needs a 4-way collision (~1/10⁴) and greying out a
      wanted answer is worse feel than a rare repeat. 400×300 (4:3) frame locked, not revisited.
      Not wired to any screen yet — that's T-FO-4.3. See `docs/IMPLEMENTATION_LOG.md` Step 26.*
      *Owner decision 2026-09-22: the three prose slots get art too (FO-IMG-1 amended) —
      badge / thought bubble / stamp, z-order continuing where→who→with→did→when→why→end.
      66 assets (22 per slot), split into three gated sub-steps:*
  - [x] **T-FO-4.2a (M)** `when` layer: 22 badge assets (`rig/when/`, shared `Plate.tsx`),
        compositor gains z-index 4 top-left, registry/tests extended to slot 3.
        *Step 27 (2026-09-22). See `docs/IMPLEMENTATION_LOG.md` Step 27.*
  - [x] **T-FO-4.2b (M)** `why` layer: 22 thought-bubble assets (`rig/why/`, shared
        `Bubble.tsx`), z-index 5 over `who`'s head, registry/tests extended to slot 5.
        *Step 28 (2026-09-22). See `docs/IMPLEMENTATION_LOG.md` Step 28.*
  - [x] **T-FO-4.2c (M)** `end` layer: 22 stamp assets (`rig/end/`, shared `Seal.tsx`),
        z-index 6 top-right with a settled tilt; registry/tests now cover all seven pools —
        106/106 rig assets drawn. *Step 29 (2026-09-23). See `docs/IMPLEMENTATION_LOG.md`
        Step 29.*
- [x] **T-FO-4.3 (M)** `StoryGallery` + end screen, adapted from Funny Multi's.
      *Owner decision 2026-09-23: split into two gated sub-steps mirroring T-FO-4.2a/b/c;
      reveal-once-per-story-on-first-view (not replay-every-time); end screen offers "Play
      again" (same seats/language, instant restart) + "Change players" (back to Home/setup).
      Owner then directed committing both sub-steps together rather than separately.*
  - [x] **T-FO-4.3a (M)** `StoryGallery` + `EndScreen`, adapted from Funny Multi's
        `RoomGallery`/`EndScreen` with sockets/lobby stripped. First consumer of T-FO-2.1's
        shared prose pipeline (new `game/resolveStory.ts`). Reveal-once via a `seen` index set
        + `RigScene` remounted per index, reusing framer-motion's mount-only `initial`
        semantics. *Step 30 (2026-09-23). See `docs/IMPLEMENTATION_LOG.md` Step 30.*
  - [x] **T-FO-4.3b (M)** Rig-to-PNG export + native share sheet (OQ-4: local canvas export
        only, no upload, no video). `components/art/rig/rigGeometry.ts` pulls `RIG_LAYERS`
        geometry out of `RigScene.tsx` so the same table drives the on-screen compositor and
        the new `rigExport.ts` exporter. `share.ts`/`ShareButton.tsx`/`testutils/canvasStub.ts`
        copied verbatim from Funny Multi. *Step 30 (2026-09-23). See
        `docs/IMPLEMENTATION_LOG.md` Step 30.*

## Phase FO-5 — i18n breadth (CLOSED 2026-09-25)

- [ ] **T-FO-5.1 (M)** All 15 languages wired for Funny One's UI catalog (pool texts already
      shared per D-2 — nothing new to author there).
      *Owner decision 2026-09-25: split into two gated sub-steps — nothing called
      `i18n.changeLanguage`, so catalogs alone would change nothing on screen. Product name
      localized per language (D-9, RU «Одна Чепуха: по кругу»).*
  - [x] **T-FO-5.1a (S)** UI-language wiring: the Home picker switches the UI too (one picker,
        no UI/content split) and remembers the pick in `localStorage`; first boot takes the
        device locale (`navigator.languages`), else English. `i18n/uiLanguage.ts`.
        *Step 32 (2026-09-25). See `docs/IMPLEMENTATION_LOG.md` Step 32.*
  - [x] **T-FO-5.1b (M)** The 14 missing catalogs: 13 keys lifted verbatim (or near-verbatim) per
        language from Funny Multi's catalogs, 26 drafted and flagged `needs-<code>-review`;
        ported `catalogs.test.ts`. In-browser check across all 15 languages found and fixed two
        real bugs (`pt-br`/`es-es` falling back to English, Hebrew's gallery arrows not
        mirroring) — same bugs still open in Funny Multi.
        *Step 33 (2026-09-25). See `docs/IMPLEMENTATION_LOG.md` Step 33.*

## Phase FO-6 — PWA + deploy (CLOSED 2026-09-26)

- [x] **T-FO-6.1 (M)** Full precache verification: zero runtime network calls, real airplane-mode
      playthrough. → FO-IMG-2. **Step 35 (2026-09-26):** scripted browser-level online+airplane
      playthrough done (2 languages, 0 errors, all cache) and four real precache/offline bugs
      found and fixed. **Step 38 (2026-09-26):** the real leg — owner's Samsung phone, installed
      from the live URL, airplane mode on, full Russian game to the end screen, story export
      worked. See `docs/IMPLEMENTATION_LOG.md` Steps 35, 38.
- [x] **T-FO-6.2 (S)** Deploy under `/funny1-game` on the existing Oracle VM's Caddy (static
      files, no new container). *Step 36 (2026-09-26):* Caddy `handle /funny1-game/*` block,
      read-only `./static` mount, `deploy/ship-funny-one.sh`; footer link and export QR now point
      at the game itself (`gameUrl.ts`, runtime-derived) instead of the private GitHub repo.
      Live at `https://www.staging-oursharedcode.com/funny1-game/`.
- [x] **T-FO-6.2a (S)** *Filed 2026-09-26 (scope beyond T-FO-6.2's text; owner decision in the
      Step 36 plan):* port Step 35's first-visit `swReload.ts` fix to Funny Multi. *Step 37.*

## Phase FO-7 — acceptance

- [ ] **T-FO-7.1 (M)** Device session (`docs/ACCEPTANCE.md`-style script), including a genuine
      offline (airplane-mode) full playthrough.
- **Gate FO**: a full game playable start-to-finish, airplane mode, on a real phone; all 15
  languages render; typecheck/lint/format/test/audit clean (six gates apply as usual).

## Phase FO-8 — pictures from the Internet (D-10; owner re-order 2026-10-05, ahead of Gate FO)

- [x] **T-FO-8.1 (M)** Start-screen choice *Built in* / *From the Internet* → D-10, FO-IMG-2 and
      FO-ID-1 as amended, design §6. `buildPrompt` moved to `packages/shared` (Funny Multi's
      server re-exports it); `pictureSource.ts`, `components/StoryPicture.tsx`, the Home radio
      group, the export's library picture, six new strings in all 15 catalogs (the non-English
      ones are machine drafts), the privacy policy's wording, acceptance Part E.
      *Step 64 (2026-10-05).* Checked in a phone-sized Chromium against the real `worker.js`
      run locally over the library's real 10⁴ keys (22 checks: default, From the Internet,
      remembered choice, library down, device offline). **Deployed 2026-10-05**; the production
      library answered 200 at three keys computed the client's way. *Open:* acceptance Part E
      on the owner's phone (now part of T-FO-7.1's sign-off); the FO-ID-1 decision before any
      Play listing — *taken 2026-10-06, see T-FO-8.2.*
- [x] **T-FO-8.2 (M)** *Filed 2026-10-06 (owner decision: review the whole library for a
      Families audience with free automated tools, rather than leave D-10's option out of the
      store app) — closes FO-ID-1.* `docs/PICTURE_REVIEW.md` (criteria from Play's Families
      policy and the content-rating questionnaire, method, results); `scripts/picture-review/`
      (manifest of the 10⁴ keys, fetch, CLIP + NSFW scoring, contact sheets — CPU only, free);
      `apps/funny-one-client/src/pictureBlocklist.ts` — the client draws the rig for a
      blocklisted key and never requests it, each entry held to its key by a unit test.
      *Step 68 (2026-10-07/08):* all 10,000 pictures fetched and scored, 1,245 looked at by the
      agent (every classifier's top of the list plus a random 398 with 0 fails); 10 borderline
      pictures (A–J) put to the owner on one sheet — the agent recommended blocking 3 (two red
      splashes that read as blood, one ambiguous emblem), **the owner blocked all 10**
      (2026-10-07: a Spain-like flag, a title-like gibberish caption, five knight props pointed
      at the partner, besides the three). Checked in a phone-sized Chromium against the real
      `worker.js` run locally: the blocked story draws the rig with no request, its neighbour
      shows the library picture. **Deployed 2026-10-18:** the agent ran
      `deploy/ship-funny-one.sh` at the owner's word (refused to it on 2026-10-07); the live
      script holds all ten hashes. No TWA rebuild needed: the app loads the site.
- [ ] **T-FO-8.3 (S)** *Filed 2026-10-07 (owner: "file it") — the same Families-audience
      review for Funny One's own art, the rig.* The rig is 109 hand-drawn SVG layers in
      `apps/funny-one-client/src/components/art/rig/` (`RIG_ART.md`), composited by fixed
      geometry — nothing a model drew, so no classifiers: a look by eye at (1) every layer
      alone on contact sheets and (2) a random sample of ~200 composited stories rendered
      through `rigExport.ts`, for accidental reads where a `did` prop or `why` bubble lands over
      a character. A grep already finds only the pirate's skull-and-crossbones hat badge and a
      fork-and-knife cutlery bubble. Recorded as a section of `docs/PICTURE_REVIEW.md` — the
      rig is the store app's default and offline picture, so it is part of the content-rating
      evidence. Any fix is an SVG edit, not a blocklist entry. Agent-only, free, one short
      session; waits on Step 68's commit (own scope, own step).

## Phase S — store apps AND37/IOS37 (both products; see `steering/tasks.md` B-1/B-2)

*Owner developer-account enrollment (Apple + Google, under the existing ABN) runs in parallel
with everything above — it has its own multi-week lead time and does not block phases FO-1..7.*

***Amended 2026-10-05 (owner decision): the iPhone apps are cancelled for both products — too
costly (`steering/tasks.md` B-2).** Phase S is Android only from here: S-2 is cancelled, S-3
covers the Android app alone, and no Apple enrollment is needed. On an iPhone both games are
the web app in Safari (`steering/tasks.md` B-14).*

- **Phase S-1/S-2**: Funny Multi's Android TWA / iOS Capacitor shell — tracked in
  `steering/tasks.md` backlog B-1/B-2, pulled forward from post-v1 per the owner's 2026-09-20
  direction. Not duplicated here.
- **Phase S-3 (Funny One replicate)**: **blocked on Phase FO-6** (a deployable client). Once
  unblocked, expect an *easier* pass than Funny Multi's — no App Store 4.2 online-only risk, and
  Google Play Families eligibility is a realistic target (FO-ID-1) — plus one new task neither
  product's deploy has yet: publish `.well-known/assetlinks.json` for Android Digital Asset
  Links verification. **Owner decisions 2026-10-03:** Funny One's origin becomes
  `https://www.funny1.oursharedcode.com/` and its package id `com.oursharedcode.funny1`
  (permanent once published); Funny Multi's B-1b builds the origin-root `.well-known` handling
  this task then reuses.
  - [x] **S-3a (M)** Funny One on its own host, with the origin-root files. *Step 60
        (2026-10-05):* Caddy site blocks for `FO_HOST`/`FO_APEX`; `/privacy` and
        `/.well-known/assetlinks.json` from `deploy/origin-root/funny1/`; the former
        `/funny1-game` address forwards (301) and its `sw.js` retires the old install
        (design §4); two DNS records and the VM's two `.env` names added;
        `deploy/ship-funny-one.sh` rewritten, and `deploy/ship.sh` now requires all six host
        names. **Live 2026-10-05** at `https://www.funny1.oursharedcode.com/`; Google's Digital
        Asset Links API returns the statement for `com.oursharedcode.funny1`. *Open:* the move
        from the old address is checked in Chromium only, against local copies; a home-screen
        install made from the old address (the owner's phone, Step 38) must be removed and
        installed again from the new one.
  - [x] **S-3b (M)** Android TWA for Funny One. *Step 65 (2026-10-05):*
        `deploy/android-funny1/` (`twa-manifest.json`, README); the Gradle project generated by
        Bubblewrap 1.25.0 from the live site and compiled unsigned (1.9 MB). A start at the
        launch URL `/?shell=android` with the network off is answered from the service worker
        (checked locally). *Step 66 (2026-10-05/06):* the owner ran the signed build (key
        password typed by the owner); the bundle's signer is the fingerprint in the live
        `assetlinks.json`; the owner installed the signed APK on the phone and reported it
        tested OK. *Not itemized by the owner:* URL bar, Play Protect warning (B-8),
        airplane-mode start — recorded when T-FO-7.1's pass runs, or when the owner says.
  - [ ] **S-3c (M)** Funny One's Play listing. The Play account can publish (B-1e, Step 80; its
        Equifax rename is pending, not blocking). ~~Real icons~~ and the listing's assets done 2026-10-19 (Step 87): the icon
        (`apps/funny-one-client/public/icon.svg`, chosen by the owner from ten creatures), and
        under `store/` the texts in 22 languages (en and ru written, 20 machine drafts with B-3),
        graphics, screenshots and the App content answers (`store/funny-one/answers.md`). Owed:
        the deploy that puts the icons live, then the entry in Play Console. ~~The FO-ID-1
        decision~~ taken 2026-10-06: the library was reviewed for a Families audience
        (T-FO-8.2, `docs/PICTURE_REVIEW.md`), so the store app keeps D-10's Internet pictures.
        Then the store assets, content rating (the review is the evidence behind the
        questionnaire's violence/blood/fear answers), Data
        Safety form and release, as B-1e does for Funny Multi. With Play App Signing on, add
        Google's fingerprint to `deploy/origin-root/funny1/.well-known/assetlinks.json` and
        uninstall the sideloaded copy before the Play one replaces it (Step 59).

## Dependency notes

- FO-1 → FO-2 → FO-3 → FO-4 → FO-5 → FO-6 → FO-7, strictly in order, same discipline as Funny
  Multi's phases.
- T-FO-4.1 (rig art) is the largest single unknown — it is content authoring, not engineering,
  and its size is genuinely open until real art exists.
- Phase S-3 cannot start before Gate FO closes. ***Amended 2026-10-05 (owner re-order):** the
  owner asked for S-3a (`Step 60 from this morning (Funny One to its own host): do it.`), S-3b
  (`Make Andoid native  Funny One app  as a *.apk file.`) and Phase FO-8 while Gate FO was
  still open, so all three ran ahead of it. Gate FO itself is unchanged and still open;
  T-FO-7.1's phone pass now runs at the new address and includes acceptance Part E.*
