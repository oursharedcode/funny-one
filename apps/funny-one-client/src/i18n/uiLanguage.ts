// SPDX-License-Identifier: AGPL-3.0-only

// T-FO-5.1a — which language the UI boots in, and remembering the player's
// pick. Funny One has one picker for both UI and story content (see
// index.ts), so this also decides the Home screen's pre-selected content
// language.
//
// Precedence: a remembered pick (localStorage) → the device's preferred
// languages (navigator.languages) → English. Funny Multi has no equivalent:
// it takes `?lang=` from an invite link, which an installed pass-and-play PWA
// never has.

import { isLanguage, type Language } from '@funny/shared';

const STORAGE_KEY = 'funny-one.language';

/**
 * Map one BCP 47 tag (e.g. `pt-BR`, `es-MX`, `zh-Hant-TW`) onto a registry
 * code, or `undefined` if we ship nothing close. The registry mixes bare
 * codes (`fr`) with region variants (`pt-br`, `es-419`, `es-es`), so an exact
 * match is tried first, then the primary subtag with the variant rules below.
 */
export function matchLanguageTag(tag: string): Language | undefined {
  const lower = tag.toLowerCase();
  if (isLanguage(lower)) return lower;
  const primary = lower.split('-')[0]!;
  // Spain's Spanish is `es-es`; every other region (and 419 itself) is
  // Latin-American. A bare `es` carries no region — Spain's variant is the
  // conventional default.
  if (primary === 'es') return lower === 'es' ? 'es-es' : 'es-419';
  // Brazilian is the only Portuguese variant shipped.
  if (primary === 'pt') return 'pt-br';
  // `iw` is the pre-1989 code for Hebrew that some older Android builds
  // still report.
  if (primary === 'iw') return 'he';
  // A Hong Kong or Macau phone (`zh-HK`, `zh-Hant-MO`) reads Cantonese;
  // every other Chinese — Taiwan's included — stays on Mandarin.
  if (primary === 'zh' && /-(hk|mo)$/.test(lower)) return 'yue';
  return isLanguage(primary) ? primary : undefined;
}

/** The first of the device's preferred languages we ship, else English. */
export function pickInitialLanguage(stored: string | null, preferred: readonly string[]): Language {
  if (isLanguage(stored)) return stored;
  for (const tag of preferred) {
    const match = matchLanguageTag(tag);
    if (match) return match;
  }
  return 'en';
}

// Storage can throw (private browsing, blocked site data) — a lost preference
// is fine, a crash at boot is not.
export function loadStoredLanguage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeLanguage(code: Language): void {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // See loadStoredLanguage.
  }
}

export function initialLanguage(): Language {
  const preferred =
    typeof navigator === 'undefined'
      ? []
      : navigator.languages?.length
        ? navigator.languages
        : [navigator.language];
  return pickInitialLanguage(loadStoredLanguage(), preferred);
}
