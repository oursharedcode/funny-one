# Languages

The game ships 23 languages (`packages/shared/src/languages.ts`). Two — English and Russian
— are hand-authored and native-speaker reviewed. The other 21 are machine-drafted at the pool
and UI text layer and marked with a `needs-<code>-review` header wherever review is still
outstanding (FM-POOL-5, B-3 in the backlog).

Two independent, un-overlapping things carry the word "language" in this repo, and adding one
means touching both:

1. **UI catalog** — the interface chrome: buttons, lobby copy, error messages. One JSON file
   per language in each app.
2. **Pool display text** — the curated, family-safe sentence fragments that get assembled into
   each round's story prose (`packages/shared/src/pools/text/`). This is the content the
   answer-pool system exists to constrain (design §4) — it is never free text.

## Adding a language

1. Append one row to `LANGUAGES` in `packages/shared/src/languages.ts` and the code to
   `AUTHORED_LANGUAGES` in `packages/shared/src/pools/schema.ts`. The `code` becomes the
   `Language` union member everywhere via `as const` — every `Record<Language, …>` below is
   now a compile error until it's filled in. The row's `country` is the two letters beside the
   flag; when two languages share a country's flag (Tamil, Hindi and Telugu all show India's),
   use the language's letters instead (TA, HI, TE) so no two rows look alike.
2. Add the flag picture as `public/flags/<code>.png` in all three apps
   (`apps/funny-multi-client`, `apps/funny-one-client`, `apps/funny-family-site`) — the 72×72
   Twemoji PNG of the flag (CC-BY 4.0, credited in the README).
3. Add the round questions and prose template, `packages/shared/src/i18n/<code>.ts`, and
   register it in `packages/shared/src/i18n/index.ts`.
4. Add the UI catalogs `apps/funny-multi-client/src/i18n/<code>.json` and
   `apps/funny-one-client/src/i18n/<code>.json`. Copy an existing file's keys as the template;
   each client's `catalogs.test.ts` checks every registry language has a key-complete catalog.
5. Add `packages/shared/src/pools/text/<code>.ts` (pool display text) and register it in
   `packages/shared/src/pools/text/index.ts`. Author against the language's own prose
   template — the per-slot grammar rules are documented at the top of each text file (`en.ts`,
   `ru.ts` for case agreement, `ta.ts` for a verb-final language, `zh.ts` for one without
   spaces).
6. `packages/shared/src/pools/pools.test.ts` (FM-POOL-4) is the gate: it fails on a missing
   text file, on any slot under its minimum option count, and on several per-language grammar
   invariants (the `EN_WHY_CONNECTIVE`/`RU_ENDING_MIN_WORDS`/`RU_WITH_PREPOSITION` checks in
   `schema.ts`). Run it red-to-green while authoring rather than writing the whole file blind.
7. `promptEn` fragments in `packages/shared/src/pools/options.ts` are **not** per-language —
   the AI image prompt is built once in English and shared across every language's rooms
   (FM-POOL-2), so the same generated cartoon is reused regardless of which language the room
   played in. Only the prose display text is per-language.
8. Add the language to both privacy policies, `deploy/origin-root/funny37/privacy.html` and
   `deploy/origin-root/funny1/privacy.html`: a `<section id="privacy-<code>" lang="<code>">`
   translated from the English one (plus `dir="rtl"` for a right-to-left script) and a link to
   it in the language list at the top. A right-to-left language also joins `RTL_LANGUAGES` in
   both clients' `src/i18n/index.ts` and `isRtl` in the landing page's `render/locale.ts`.
   `originRoot.test.ts` (Funny Multi's server and Funny
   One's client) checks every registry language has both; Funny One's also checks the section
   names the two picture options by the catalog's own labels.
9. The landing page: `GAME_NAMES` and `STRINGS` in `apps/funny-family-site/src/strings.ts`
   (its `fm`/`fo` names are the two catalogs' `home.title`s), and `HTML_LANG`/`OG_LOCALE` in
   `apps/funny-family-site/src/render/locale.ts`. Every description that says how many
   languages the games have says the new number, in every language.
10. If browsers report the language under a tag the primary-subtag rule misses, map it in
    Funny One's `matchLanguageTag` (`src/i18n/uiLanguage.ts`) and the same rule in the landing
    page's `render/headScript.ts` — e.g. `zh-HK`/`zh-MO` go to Cantonese (`yue`), while
    `zh-TW` stays on Mandarin.

## What review means

A "machine-drafted, needs review" language is playable today — `pools.test.ts` enforces the
same structural and grammar rules regardless of authoring method — but hasn't had a native
speaker confirm the pool sentences read naturally and the UI copy isn't stilted. To pick up
B-3 (post-v1 backlog): remove the `needs-<code>-review` header comment from every file for
that language once reviewed, and fix anything a native speaker flags. The privacy policy is
outside that rule: English is its master text and all 22 other sections, Russian included, are
machine translations that say the English version applies.

Cantonese (`yue`) is written Cantonese in Traditional characters (Hong Kong), not standard
written Chinese; Mandarin (`zh`) is Simplified. Bengali (`bn`) is listed under Bangladesh.
Persian (`fa`) is written right to left, like Hebrew.

Arabic (`ar`) is Modern Standard Arabic, not a dialect, written right to left and listed under
Morocco's flag. Swahili (`sw`) is standard Swahili, listed under Kenya. Yoruba (`yo`) is listed
under Nigeria and written with its full tone marks and dot-below letters (ẹ, ọ, ṣ), in NFC.

es-419 and es-es are deliberately separate files (Latin-American vs. Iberian Spanish) — they
may read identically today but are flagged for independent regional review, not merged.
