// SPDX-License-Identifier: AGPL-3.0-only

// Adapted from SRC/client/src/i18n/index.ts. The auto-discovery, the RTL
// direction sync and the boot-time completeness check are carried as-is.
//
// SRC checked every catalog against all 15 `LANGUAGES`, and so does this
// (T-6.1): the UI catalogue is a different axis from the room's *content*
// language, which stays gated to `AUTHORED_LANGUAGES` (rooms.ts, POOL_TEXTS)
// until T-6.3 finishes the pool texts. i18next falling back to English for an
// unrendered UI string is the correct degrade for a language nobody has
// reviewed yet — see catalogs.test.ts for the coverage test this mirrors.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { LANGUAGES, isLanguage } from '@funny/shared';

// Auto-discovery via Vite's `import.meta.glob`: every `<code>.json` next to
// this file is registered as an i18next resource. Eager mode bundles all of
// them into the main client chunk. Step 81 measured 23 catalogues at 134 kB
// minified (English 4 kB, Tamil 10 kB) and kept it: the PWA precaches every
// chunk for offline play (vite.config.ts), so loading a catalogue on language
// selection would spare only the parsing of the others.
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

// Sanity check at module load: every registered language must have a
// catalogue. A missing entry means an incomplete language addition — say so
// at boot rather than silently falling back to English in the middle of a
// game.
const missing = LANGUAGES.map((l) => l.code).filter((code) => !resources[code]);
if (missing.length > 0) {
  // eslint-disable-next-line no-console
  console.error(`[i18n] Missing src/i18n/<code>.json for: ${missing.join(', ')}`);
}

void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  // Our codes are lowercase (`pt-br`, `es-es`). Without this, i18next
  // rewrites them to `pt-BR`/`es-ES`, misses the resource key and silently
  // falls back to English; `es-419` only escaped because a numeric region
  // has no case.
  lowerCaseLng: true,
  interpolation: { escapeValue: false },
});

// Keep the document's direction and language in sync with the active UI
// language. Hebrew, Persian (Step 73) and Arabic (Step 81) are the RTL
// languages shipped; flipping `dir` at the root lets the flex/grid layouts
// mirror automatically. `lang` (Step 81; index.html said "en" for every
// language) gives screen readers the right voice, CJK text its own glyphs, and
// styles/index.css the hook for Yoruba's headings. Registered after init so it
// also fires for the initial language.
const RTL_LANGUAGES: ReadonlySet<string> = new Set(['he', 'fa', 'ar']);

/**
 * Text direction of a language. Exported for B-15: a story shown in a
 * language other than the interface's gets its own `dir`, so a Hebrew story
 * reads right-to-left on an English screen and the other way round.
 */
export function textDirection(lng: string): 'rtl' | 'ltr' {
  return RTL_LANGUAGES.has(lng) ? 'rtl' : 'ltr';
}

/**
 * The font family a story is drawn in. Georgia, the stories' serif, has none
 * of Yoruba's ẹ, ọ, ṣ or ǹ: Chromium took the first three from another font a
 * letter at a time and set ǹ as an n with its accent beside it — «nǹkan» came
 * out "nn`kan" (Step 81). Yoruba takes Cambria, which has them all on Windows,
 * or the platform's serif. For the canvas exports (downloadStory.ts,
 * videoFooter.ts); styles/index.css says the same for the page.
 */
export function proseFontFamily(lng: string): string {
  return lng === 'yo' ? 'Cambria, serif' : 'Georgia, serif';
}

function applyToDocument(lng: string): void {
  document.documentElement.dir = textDirection(lng);
  document.documentElement.lang = lng;
}
i18n.on('languageChanged', applyToDocument);
applyToDocument(i18n.language);

export default i18n;
