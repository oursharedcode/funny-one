# Funny Multi — Play Console answers

Drafted by the agent in Step 87 (B-1e) for the owner to enter. The forms' own questions decide:
where one asks something this file does not answer, or reads differently, stop and ask the agent.
Positioning: 12+, never in the Families program (FM-ID-2, FM-APP-1).

## Store settings

- **App or game:** Game. **Category:** Word. **Tags:** none needed.
- **Contact details:** email `privacy@oursharedcode.com` (the address the privacy policy names);
  website `https://www.funny37.oursharedcode.com`; no phone.

## App content

1. **Privacy policy:** `https://www.funny37.oursharedcode.com/privacy`. The app links to it from
   Home (Step 85).
2. **App access:** all functionality is available without special access (no login). A game needs
   three players; a reviewer can open the room's link on two more devices or browser tabs.
3. **Ads:** No. (D-6 allows ads on this game in principle, never in this build.)
4. **Content rating** (the IARC questionnaire), category *Game*. As Funny One's
   `answers.md`, item 4, with these differences:
   - **Pictures:** Funny Multi still shows the ten library pictures that Funny One blocks
     (`docs/PICTURE_REVIEW.md`, A–J); two have a red puddle or splash that can read as blood.
     Recommended: still **No** to blood — no injury or wound is shown. A Yes only raises the
     rating, which the 12+ positioning allows.
   - **Users interact or exchange content:** **Yes.** Players type a nickname that the others in
     the room see. There is no chat; stories are built from pre-written answers.
   - **Shares the user's location:** No — no player learns where another is; the country totals
     are anonymous.
   - **Digital purchases:** No — the gifts are on the website only; the app has none.
5. **Target audience and content:** ages 13–15, 16–17 and 18 and over. Play has no 12+ group; 13
   matches the privacy policy ("not directed at children under 13"). If the form asks whether the
   listing could appeal to children unintentionally: **No** is recommended — the texts present a
   party game, with no mention of children — but the art is cartoon; Play may reject a listing
   whose marketing suggests children, and then the fix is in the graphics, not this answer.
6. **News app:** No. **Health, financial features, government app:** none.
7. **AI-generated content:** out of scope, as for Funny One — keep it so. Play's AI-Generated
   Content policy covers "content that is created by generative AI models based on user prompts"
   and requires "in-app user reporting or flagging features" for offensive content, without
   leaving the app; apps that "merely host AI-generated content and are unable to create content
   using AI" are out of scope (answers 13985936 and 14094294, read 2026-10-19). Every picture the
   game shows was drawn in advance (D-7), from pre-written phrases, and production cannot draw:
   the Worker's generation switch is off (`cloudflare/wrangler.toml`, `[ai]` commented out once
   all 10⁴ pictures were in the library), so a missing picture answers 503 and nothing new is
   drawn. **Switching generation back on brings the app into scope:** the game has no in-app way to report a picture, so that report
   (on the reveal and in the gallery) would have to come first — a step of its own.
8. **Data safety:**
   - Collects data: **Yes.** Shares data: **No** — players see each other's nicknames because
     they joined the same room, which Play does not count as sharing, and Oracle and Cloudflare
     process data for us as service providers.
   - Encrypted in transit: **Yes** (HTTPS everywhere). Accounts: the app has none. Deletion
     requests: **No** — nothing is kept that belongs to one person.
   - Data types:

     | Play data type | What it is here | Ephemeral | Required | Purpose |
     | --- | --- | --- | --- | --- |
     | Personal info → Name | the nickname, in the server's memory until the room closes | Yes | Yes | App functionality |
     | Location → Approximate location | the country looked up from the IP address, added to a daily total; the address is not kept | No | Yes | Analytics |
     | App activity → App interactions | "the game opened", counted per day with the interface language and "Android app" | No | Yes | Analytics |

     *Ephemeral No* for the counts, although no single visit is stored: the daily totals are kept
     about 13 months, and Play's "ephemeral" means kept in memory only for the request. *Required
     Yes*, although Do Not Track and Global Privacy Control stop the counts: that switch is in the
     browser, not the app. Both are the cautious answers.
   - Not declared: the server's error log may hold an IP address when a request fails, used only
     to fix the fault (privacy policy); an IP address alone is not one of Play's data types.

## Learned from Funny One's entry (2026-10-20)

- **App access** is called "Sign-in details", and Play counts "actions on another device" as
  access to describe: give item 2's three players there, with how a reviewer opens the room's
  link on a second and third device or tab.
- **Store presence:** no Expert Approved — that programme is for apps aimed at children, and
  Funny Multi is 13 and over (item 5).
- **Government apps:** No. **Financial features:** "My app doesn't provide any financial
  features" (the gifts are on the website only). **Health:** "My app doesn't have any health
  features".
- **AI asset declaration:** label the feature graphics (drawn by the agent, as Funny One's were —
  owner decision (b)) and the reveal and gallery screenshots, which show Flux cartoons. The
  monkey icon (from SRC) was drawn with AI (the owner, 2026-10-25): label it too.
- **Translations:** import `translations.json` from this folder, then add the pictures of the
  eleven locales that have their own (`store/README.md`, Upload).

## Owner decisions for the entry (2026-10-25, Step 92)

All as recommended in the session's plan: (1) prepare and enter everything now, and press
*Submit for review* only once Google has decided on Funny One; (2) and (3) the AI labels above —
icon, every feature graphic, the reveal and gallery screenshots; (4) content rating: **No** to
blood (item 4); (5) the release as Funny One's — Production, all 178 countries, full rollout, one
release note in English (UK); (6) *Play automatic protection* off for the release (minSdk 21 <
24), not a rebuild at minSdk 24, which would drop Android 5 and 6.

## Entered 2026-10-25

The owner is entering the above in Play Console, one op at a time (Step 92). What the console
asked beyond this file, or named differently:

- **Create app:** name "Funny Multi: Party Story Game", English (United Kingdom), Game, Free.
  The form now has two declarations, Developer Programme Policies and US export laws (Funny One's
  had three): both ticked. Its *automatic protection* box has a **Turn off** link (decision 6);
  that it was pressed is not yet seen — check it at the release.
- **Sign-in details** (item 2): "Is any part of your app restricted?" **Yes** — Play's list names
  "referral codes and/or QR codes" and "actions to be carried out on another device". One entry,
  "Three players", no user name or password, and in "Any other information": "No account or
  login. A game needs 3 players. Phone 1: open the app, type a name, tap Create room, then Copy
  link (or let others scan the QR code). Open that link on 2 more phones or browser tabs, type a
  name, tap Join room. Phone 1 taps Start Game." The first *Add* answered "Your changes couldn't
  be saved", with a field higher in the dialog marked; the second went through. The toggle that
  lets Google's test devices use the details was left on.
- **Ads:** No. The *Advertising ID* declaration is not on the Dashboard's list; it waits under
  *App content → Need attention*, before any bundle is uploaded: No.
- **Content rating:** No to every question but the first Miscellaneous one, "interact or exchange
  content with other users through … text": **Yes** — the nickname is free text, up to 20
  characters, unfiltered, seen by everyone in the room. Ratings given: PEGI 3, ESRB Everyone,
  IARC 3+, Australia G ("Online interactivity and chat"), Brazil L, South Korea All ages, Taiwan
  General public, Saudi Arabia 3, Russia 3+ — and **USK 16** in Germany ("Increased
  communication risks"), the one cost of the Yes: a German teen under 16 whose parents set an age
  limit cannot install. Every rating carries "Users interact". Kept as Yes (owner decision (a),
  2026-10-25): a No would understate what the app does, and Play may reject an app for
  misrepresenting its content.
- **Target audience:** 13–15, 16–17, 18 and over (item 5). With no group under 13, Play skipped
  its App details, Ads and Store presence pages and went straight to the summary — no question
  about appeal to children was asked.
- **Data safety:** as item 8. Account creation: "My app does not allow users to create an
  account", and no login with outside accounts. Deletion: plain No — not "No, but user data is
  automatically deleted within 90 days", which the 13-month totals would make false. No badges.
  Each data type has a dialog: collected (not shared), ephemeral, required, purpose. The preview
  shows no data shared; Location and App activity collected; encrypted in transit. The name is
  absent, as Play hides data processed ephemerally from the listing.
- **Advertising ID:** No. **Government apps:** No. **Financial features:** none. **Health:**
  none. App content then listed all ten declarations as actioned.
- **Store settings** are under *Grow users → Store presence → Store settings* (the tag icon is
  *Monetise with Play*, not this). Game › Word was already set at Create app; the email and
  website above, no phone; External marketing left on.
- **Screenshots:** the first en-GB set showed a made-up signature, "@Luinhapzzq", in the corner
  of its cartoon, legible in the gallery and half under the 37 badge on the reveal. Retaken (owner
  decision (b)): the new reveal's cartoon ends below the screen; the gallery's keeps an
  illegible white scribble, mostly under the badge — kept (owner, 2026-10-25).
