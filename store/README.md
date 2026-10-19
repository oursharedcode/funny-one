# Google Play listings — Funny One and Funny Multi

Step 87 (S-3c for Funny One, B-1e for Funny Multi). Everything the owner enters in Play Console
for the two Android apps: the texts in 22 languages, the graphics, and the answers to the App
content forms.

| Path | What | Tracked |
| --- | --- | --- |
| `<game>/listing/<locale>/title.txt`, `short_description.txt`, `full_description.txt` | the listing texts | yes |
| `<game>/answers.md` | Store settings and App content answers, drafted for the owner | yes |
| `<game>/listing/en-GB/images/icon.png` | the store icon | no — regenerate |
| `<game>/listing/<en-GB, ru-RU>/images/featureGraphic.png`, `phoneScreenshots/` | the graphics | no — regenerate |
| `paste-sheet.html` | every text with a Copy button, for pasting into Play Console | no — regenerate |

`<game>` is `funny-one` or `funny-multi`.

## Regenerate

From the repository's root:

```sh
node scripts/funny-one-icons.mjs                 # Funny One's PNG icons, only after editing icon.svg
node scripts/store-graphics.mjs                  # store icons and feature graphics
npm run build && node scripts/store-screens.mjs  # phone screenshots, a few minutes
node scripts/store-listings.mjs                  # checks texts and images, writes paste-sheet.html
```

`store-screens.mjs` runs Funny Multi's production server on port 3000 (the Docker app must not be
running) and a picture stand-in on 5185; both are in the machine's port register. Funny One runs
in-process. Names on the screenshots are made up; the room codes are random.

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

- **en-GB and ru-RU** were written for the store. They have their own feature graphic and
  screenshots.
- **The other 20 are machine drafts** awaiting a native reader (B-3), uploaded all the same
  (owner decision 2026-10-19: the games already ship these languages as drafts). They show the
  default's graphics. Known points for the reader: Persian and Bengali use their own digits; the
  Ukrainian Funny One title reads awkwardly.
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

1. **Main store listing**, default language English (United Kingdom): app name, short and full
   description; the app icon, the feature graphic, phone screenshots 1–5 in their numbered order.
2. **Translations:** Manage translations → Add your own translations → the 21 other languages;
   paste each one's three texts. Russian also gets its own feature graphic and screenshots.
3. **Store settings and App content:** `answers.md` of that game.
4. **Release:** the one rebuild of the app (`deploy/android*/README.md`, *Build*); for Funny One,
   deploy the site first (`deploy/ship-funny-one.sh`), because Bubblewrap's `update` downloads the
   icons from it. Then Google's app-signing fingerprint into the app's `assetlinks.json`, and
   uninstall the copy installed by hand before installing from Play.
