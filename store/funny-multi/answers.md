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
