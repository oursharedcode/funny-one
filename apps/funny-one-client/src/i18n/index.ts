// SPDX-License-Identifier: AGPL-3.0-only

// Adapted from apps/funny-multi-client/src/i18n/index.ts. The auto-discovery,
// RTL direction sync and boot-time completeness check carry over unmodified
// (FO-ARC-1: pools/i18n/rotation from @funny/shared are reused unmodified).
//
// Unlike Funny Multi, Funny One has no room/content-language gate — there is
// no AUTHORED_LANGUAGES vs. UI-language split to preserve, since gameplay
// text comes from the same pools regardless of a "room". Every catalog here
// covers both UI strings and in-game copy for its language.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { LANGUAGES, isLanguage } from '@funny/shared';
import { initialLanguage } from './uiLanguage';

const modules = import.meta.glob<Record<string, unknown>>('./*.json', {
  eager: true,
  import: 'default',
});

const resources: Record<string, { translation: Record<string, unknown> }> = {};
for (const [path, content] of Object.entries(modules)) {
  const code = path.match(/\.\/(.+)\.json$/)?.[1];
  if (code && isLanguage(code)) {
    resources[code] = { translation: content };
  }
}

const missing = LANGUAGES.map((l) => l.code).filter((code) => !resources[code]);
if (missing.length > 0) {
  // eslint-disable-next-line no-console
  console.error(`[i18n] Missing src/i18n/<code>.json for: ${missing.join(', ')}`);
}

void i18n.use(initReactI18next).init({
  resources,
  // Remembered pick, else the device locale, else English (uiLanguage.ts).
  lng: initialLanguage(),
  fallbackLng: 'en',
  // Our codes are lowercase (`pt-br`, `es-es`). Without this, i18next
  // rewrites them to `pt-BR`/`es-ES`, misses the resource key and silently
  // falls back to English; `es-419` only escaped because a numeric region
  // has no case.
  lowerCaseLng: true,
  interpolation: { escapeValue: false },
});

const RTL_LANGUAGES: ReadonlySet<string> = new Set(['he', 'fa', 'ar']);

/** Text direction of a language; the exported still draws its story by it (Step 73). */
export function textDirection(lng: string): 'rtl' | 'ltr' {
  return RTL_LANGUAGES.has(lng) ? 'rtl' : 'ltr';
}

/**
 * The font family a story is drawn in. Georgia, the stories' serif, has none
 * of Yoruba's ẹ, ọ, ṣ or ǹ: Chromium took the first three from another font a
 * letter at a time and set ǹ as an n with its accent beside it — «nǹkan» came
 * out "nn`kan" (Step 81). Yoruba takes Cambria, which has them all on Windows,
 * or the platform's serif. For the exported still (rigExport.ts);
 * styles/index.css says the same for the page.
 */
export function proseFontFamily(lng: string): string {
  return lng === 'yo' ? 'Cambria, serif' : 'Georgia, serif';
}

// The document's direction and, since Step 81, its language: index.html says
// "en" for every language; `lang` gives screen readers the right voice, CJK
// text its own glyphs, and styles/index.css the hook for Yoruba's headings.
function applyToDocument(lng: string): void {
  document.documentElement.dir = textDirection(lng);
  document.documentElement.lang = lng;
}
i18n.on('languageChanged', applyToDocument);
applyToDocument(i18n.language);

export default i18n;
