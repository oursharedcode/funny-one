// SPDX-License-Identifier: AGPL-3.0-only

// T-FO-5.1a — which language the UI boots in, and remembering the player's
// pick. Funny One has one picker for both UI and story content (see
// index.ts), so this also decides the Home screen's pre-selected content
// language.
//
// Precedence: a remembered pick (localStorage) → the device's preferred
// languages (navigator.languages) → English. The matching lives in
// @funny/shared since Step 88, when Funny Multi began starting in the device's
// language too; it remembers no pick, and a link's `?lang=` wins there.

import { pickInitialLanguage, type Language } from '@funny/shared';

const STORAGE_KEY = 'funny-one.language';

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
