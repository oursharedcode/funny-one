# Languages

The game ships 15 languages (`packages/shared/src/languages.ts`). Two — English and Russian
— are hand-authored and native-speaker reviewed. The other 13 are machine-drafted at the pool
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

1. Append one row to `LANGUAGES` in `packages/shared/src/languages.ts`. The `code` becomes the
   `Language` union member everywhere via `as const` — every consumer below is now a compile
   error until it's filled in.
2. Add `apps/funny-multi-client/src/i18n/<code>.json` and
   `apps/funny-multi-server/src/i18n/<code>.json` (UI catalog). Copy an existing file's keys
   as the template; `catalogs.test.ts` (client) and `index.test.ts` (server) check every
   registry language has a matching, key-complete catalog.
3. Add `packages/shared/src/pools/text/<code>.ts` (pool display text) and register it in
   `packages/shared/src/pools/text/index.ts`. Author against the language's own prose
   template in `packages/shared/src/prompt.ts` — the per-slot grammar rules are documented at
   the top of `en.ts` (English template) and `ru.ts` (the other hand-authored reference,
   which additionally documents the Russian-specific case/gender agreement rules).
4. `packages/shared/src/pools/pools.test.ts` (FM-POOL-4) is the gate: it fails on a missing
   text file, on any slot under its minimum option count, and on several per-language grammar
   invariants (the `EN_WHY_CONNECTIVE`/`RU_ENDING_MIN_WORDS`/`RU_WITH_PREPOSITION` checks in
   `schema.ts`). Run it red-to-green while authoring rather than writing the whole file blind.
5. `promptEn` fragments in `packages/shared/src/pools/options.ts` are **not** per-language —
   the AI image prompt is built once in English and shared across all 15 languages' rooms
   (FM-POOL-2), so the same generated cartoon is reused regardless of which language the room
   played in. Only the prose display text is per-language.
6. Add the language to the privacy policy, `deploy/origin-root/funny37/privacy.html`: a
   `<section id="privacy-<code>" lang="<code>">` translated from the English one (plus
   `dir="rtl"` for a right-to-left script) and a link to it in the language list at the top.
   `originRoot.test.ts` (server) checks every registry language has both.

## What review means

A "machine-drafted, needs review" language is playable today — `pools.test.ts` enforces the
same structural and grammar rules regardless of authoring method — but hasn't had a native
speaker confirm the pool sentences read naturally and the UI copy isn't stilted. To pick up
B-3 (post-v1 backlog): remove the `needs-<code>-review` header comment from every file for
that language once reviewed, and fix anything a native speaker flags. The privacy policy is
outside that rule: English is its master text and all 14 other sections, Russian included, are
machine translations that say the English version applies.

es-419 and es-es are deliberately separate files (Latin-American vs. Iberian Spanish) — they
may read identically today but are flagged for independent regional review, not merged.
