// SPDX-License-Identifier: AGPL-3.0-only

// T-FO-5.1a — the language a game's interface starts in, from the device's
// preferred languages. Written for Funny One (its i18n/uiLanguage.ts) and moved
// here in Step 88, when Funny Multi began starting in the device's language
// too. Each game reads `navigator` itself: this package also runs on the
// server. The landing page's root redirect makes the same match in an inline
// script (apps/funny-family-site/src/render/headScript.ts).

import { isLanguage, type Language } from './languages.js';

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

/**
 * A remembered pick if it is still a registry code, else the first of the
 * device's preferred languages we ship, else English. Funny Multi remembers no
 * pick and passes `null`.
 */
export function pickInitialLanguage(stored: string | null, preferred: readonly string[]): Language {
  if (isLanguage(stored)) return stored;
  for (const tag of preferred) {
    const match = matchLanguageTag(tag);
    if (match) return match;
  }
  return 'en';
}
