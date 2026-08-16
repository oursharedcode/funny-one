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
// them into the main client chunk — adequate up to ~20 languages (each is
// ~3 KB minified). If the count grows past that, switch to non-eager and
// load on language selection.
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
  interpolation: { escapeValue: false },
});

// Keep the document direction in sync with the active UI language. Hebrew is
// the only RTL language shipped; flipping `dir` at the root lets the
// flex/grid layouts mirror automatically. Registered after init so it also
// fires for the initial language.
const RTL_LANGUAGES: ReadonlySet<string> = new Set(['he']);
function applyDirection(lng: string): void {
  document.documentElement.dir = RTL_LANGUAGES.has(lng) ? 'rtl' : 'ltr';
}
i18n.on('languageChanged', applyDirection);
applyDirection(i18n.language);

export default i18n;
