# Google Play listings — Funny One and Funny Multi

Step 87 (S-3c for Funny One, B-1e for Funny Multi). Everything the owner enters in Play Console
for the two Android apps: the texts in 22 languages, the graphics, and the answers to the App
content forms.

| Path | What | Tracked |
| --- | --- | --- |
| `<game>/listing/<locale>/title.txt`, `short_description.txt`, `full_description.txt` | the listing texts | yes |
| `<game>/answers.md` | Store settings and App content answers, drafted for the owner | yes |
| `<game>/listing/en-GB/images/icon.png` | the store icon | no — regenerate |
| `<game>/listing/<locale>/images/featureGraphic.png`, `phoneScreenshots/`, for the 12 locales below | the graphics | no — regenerate |
| `paste-sheet.html` | every text with a Copy button, for pasting into Play Console | no — regenerate |
| `<game>/translations.json` | the 21 translations in one file, for Play Console's import | no — regenerate |

`<game>` is `funny-one` or `funny-multi`.

## Regenerate

From the repository's root:

```sh
node scripts/funny-one-icons.mjs                 # Funny One's PNG icons, only after editing icon.svg
node scripts/store-graphics.mjs                  # store icons and feature graphics
npm run build && node scripts/store-screens.mjs  # phone screenshots, several minutes
node scripts/store-listings.mjs                  # checks texts and images, writes paste-sheet.html
                                                 # and <game>/translations.json
```

`store-screens.mjs` runs Funny Multi's production server on port 3000 (the Docker app must not be
running) and a picture stand-in on 5185; both are in the machine's port register. Funny One runs
in-process. Names on the screenshots are made up; the room codes are random. To retake some only,
name the game, the Play locales or both: `node scripts/store-screens.mjs funny-one ko-KR`.

## Languages

Play locale → the games' catalog code (`apps/<client>/src/i18n/<code>.json`). The title of every
listing starts with the game's Home title in that language, as the game shows it.

| Play | Game | Play | Game | Play | Game |
| --- | --- | --- | --- | --- | --- |
| en-GB (default) | en | id | id | ja-JP | ja |
| ru-RU | ru | uk | uk | ko-KR | ko |
| fr-FR | fr | iw-IL | he | hi-IN | hi |
| de-DE | de | fa | fa | ta-IN | ta |
| it-IT | it | ar | ar | te-IN | te |
| es-ES | es-es | zh-CN | zh | bn-BD | bn |
| es-419 | es-419 | zh-HK | yue | sw | sw |
| pt-BR | pt-br | | | | |

- **en-GB and ru-RU** were written for the store.
- **The other 20 are machine drafts** awaiting a native reader (B-3), uploaded all the same
  (owner decision 2026-10-19: the games already ship these languages as drafts). Known points for
  the reader: Persian and Bengali use their own digits; the Ukrainian Funny One title reads
  awkwardly.
- **Graphics:** en-GB, ru-RU and ten more have their own feature graphic and screenshots — fr-FR,
  it-IT, hi-IN, ta-IN, te-IN, zh-CN, zh-HK, bn-BD, ko-KR and fa, the owner's pick of 2026-10-20
  (Step 88); the ten taglines are machine drafts too. The other ten listings show the default's.
- **Yoruba** has no Play locale, so a Yoruba phone sees the default, English.

## Play's rules

From Play Console Help, *Add preview assets to showcase your app* (answer 9866151, read
2026-10-19), and the console's own counters for the texts. `store-listings.mjs` checks all of it.

- **App icon:** 512 × 512, 32-bit PNG with alpha, at most 1024 KB.
- **Feature graphic:** 1024 × 500, JPEG or 24-bit PNG (no alpha).
- **Phone screenshots:** 2–8, JPEG or 24-bit PNG, each side 320–3840 px, the long side at most
  twice the short; 9:16 at 1080 × 1920 or more qualifies for Play's recommendation formats. Ours:
  five per language at 1080 × 1920.
- **Texts:** app name 30 characters, short description 80, full description 4000 (counted in
  code points here).

## Upload, per game

The owner's, one op at a time, after the commit. Open `paste-sheet.html` in a browser for the
texts.

1. **Default store listing** (*Store presence → Store listings*), English (United Kingdom): app
   name, short and full description; the app icon, the feature graphic, phone screenshots 1–5 in
   their numbered order. Save it through **Next** → Review → *Save*: *Save as draft* leaves it in
   Draft, and the release then fails with "Add a full description to save" (Step 93).
2. **Translations:** on the default listing, *Import a file* (Play's "Import translations with
   AI") and upload `<game>/translations.json`: the 21 other languages, each text verbatim under
   Play's code and name. Play's AI only sorts the file into languages; before importing, open one
   language's *Review* and compare it with the file (Funny One's zh-HK matched character for
   character, 2026-10-20).
3. **The other languages' pictures:** the eleven locales after en-GB in *Languages* (Graphics)
   each get their own feature graphic and screenshots 1–5, in order. Through the Play Developer
   API (B-25: `scripts/store-upload.mjs`, the agent's, with the owner's service account — store
   presence plus, while the app is a draft, *Edit and delete draft apps*; it works only once the
   app's first AAB is in Play Console; `--allow-review` is needed while the app is a draft, since
   Play then refuses to hold the changes back, and once a release is saved it sends the whole app
   for review — *Remove changes* in Publishing overview takes it back (Step 93); Funny Multi's
   Russian goes up the same way), or by hand as Funny One's Russian was: pick the language, *Add assets* → *Upload*, then
   drag into order. Then the AI labels, which **the API cannot
   set** and which an API re-run **drops**: *Default store listing* → *Edit default listing* →
   **Next** to the Review page → *Label AI-generated assets*, tick each feature graphic, *Label
   assets and submit*, then *Save* unless it is grey (owner decision (b), 2026-10-20: the icon and the feature graphics
   carry the label, screenshots of the running game do not; Funny Multi's reveal and gallery
   screenshots show Flux cartoons, so they carry it too). The Asset library has no such control.
4. **Store settings and App content:** `answers.md` of that game.
5. **Release:** the one rebuild of the app (`deploy/android*/README.md`, *Build*); for Funny One,
   deploy the site first (`deploy/ship-funny-one.sh`), because Bubblewrap's `update` downloads the
   icons from it. The first AAB goes in by hand: Test and release → Production → Create new
   release. Before it saves: *Play automatic protection* off (it wants minSdk 24, a Bubblewrap app
   has 21), the bundle uploaded before the first *Save* (an empty first release does not keep),
   and App content's **Advertising ID** answered No. Then Google's app-signing fingerprint into
   the app's `assetlinks.json` (the App signing page, or the Developer API's `generatedApks` of
   the version, its `certificateSha256Hash` — Step 93), and uninstall the copy installed by hand before installing from
   Play.
