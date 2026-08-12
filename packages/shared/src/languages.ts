// SPDX-License-Identifier: AGPL-3.0-only

// Single source of truth for every language the game offers. Lives in
// packages/shared so both the client (language picker, ?lang= validation) and
// the server (i18n loaders, prose templates) derive from the same list.
//
// Adding a language: append one row to LANGUAGES, drop matching JSONs in
// apps/funny-multi-client/src/i18n/ and apps/funny-multi-server/src/i18n/, plus
// a pool display-text file in packages/shared/src/pools/text/<code>.ts. The
// `Language` union below derives from this array via `as const`, so a missed
// code in any consumer becomes a compile error — and pools.test.ts fails on a
// missing text file (FM-POOL-4). See docs/LANGUAGES.md (T-8.3) for the full
// checklist.
//
// Copied from SRC/shared/languages.ts (design.md §3 reuse map: "copy"). Code is
// byte-identical; only the path references in these comments are adapted — the
// SRC note about server/src/filter/standins.ts is gone with the filter stack
// (FM-ANS consequences table).

export interface LanguageOption {
  /** Two-letter code; sometimes with a region suffix for variant disambiguation. */
  code: string;
  /** Display label in the language itself (e.g. "Deutsch (Deutschland)"). */
  name: string;
  /** Unicode flag emoji. Renders on iOS/Android phones the game targets. */
  flag: string;
  /**
   * Short two-letter label shown next to the flag image in the picker
   * (e.g. "GB", "FR"). Not always an ISO country code — "LA" stands in for
   * Latin-American Spanish, which has no single country flag.
   */
  country: string;
}

// `as const` is load-bearing: it preserves the literal codes so `Language`
// below derives a string-literal union instead of `string`. The
// `LANGUAGES_EXHAUSTIVE` sentinel at the bottom of this file refuses to
// compile if the union silently widens (e.g. someone strips `as const`).
// Ordering follows the standard native-script + region pattern used by
// Google/Apple/Netflix language pickers. English is the upstream default
// (#1); Russian sits at #4 as the second first-class shipped language.
// Slots 2-3 and 5-14 are stubs: registry + i18n JSON + pool display texts ship
// in each language at machine-translation quality with a `needs-<code>-review`
// header in every file, awaiting native-speaker review (FM-POOL-5, OD-F5).
export const LANGUAGES = [
  { code: 'en', name: 'English (United Kingdom)', flag: '🇬🇧', country: 'GB' },
  { code: 'fr', name: 'Français (France)', flag: '🇫🇷', country: 'FR' },
  { code: 'de', name: 'Deutsch (Deutschland)', flag: '🇩🇪', country: 'DE' },
  { code: 'ru', name: 'Русский (Россия)', flag: '🇷🇺', country: 'RU' },
  { code: 'id', name: 'Indonesia (Indonesia)', flag: '🇮🇩', country: 'ID' },
  { code: 'it', name: 'Italiano (Italia)', flag: '🇮🇹', country: 'IT' },
  { code: 'zh', name: '中文 (普通话)', flag: '🇨🇳', country: 'CN' },
  { code: 'ja', name: '日本語 (日本)', flag: '🇯🇵', country: 'JP' },
  { code: 'ko', name: '한국어 (대한민국)', flag: '🇰🇷', country: 'KR' },
  { code: 'pt-br', name: 'Português (Brasil)', flag: '🇧🇷', country: 'BR' },
  { code: 'es-419', name: 'Español (Latinoamérica)', flag: '🌎', country: 'LA' },
  { code: 'es-es', name: 'Español (España)', flag: '🇪🇸', country: 'ES' },
  { code: 'uk', name: 'Українська (Україна)', flag: '🇺🇦', country: 'UA' },
  { code: 'he', name: 'עברית (ישראל)', flag: '🇮🇱', country: 'IL' },
  { code: 'ta', name: 'தமிழ் (இந்தியா)', flag: '🇮🇳', country: 'IN' },
] as const satisfies readonly LanguageOption[];

export type Language = (typeof LANGUAGES)[number]['code'];

export function isLanguage(value: string | null | undefined): value is Language {
  if (!value) return false;
  return LANGUAGES.some((opt) => opt.code === value);
}

// Exhaustiveness sentinel — see the `as const` comment above. If `Language`
// ever widens to `string`, this record can no longer be exhaustive over the
// union and TypeScript will error here, surfacing the widening at the source
// instead of at every Record<Language, …> consumer site.
const LANGUAGES_EXHAUSTIVE: Record<Language, true> = LANGUAGES.reduce(
  (acc, opt) => ({ ...acc, [opt.code]: true }),
  {} as Record<Language, true>,
);
void LANGUAGES_EXHAUSTIVE;
