// SPDX-License-Identifier: AGPL-3.0-only

// Step 88 — the language the interface starts in: the first of the device's
// preferred languages the game ships, else English. Until then it was English
// on every device, the Android app's included (its start URL carries no
// `?lang=`). Funny One's i18n/uiLanguage.ts, minus the remembered pick: this
// game's privacy policy says it keeps nothing on the device but its own program
// files. A link's `?lang=` still wins (HomeScreen).

import { pickInitialLanguage, type Language } from '@funny/shared';

export function initialLanguage(): Language {
  const preferred =
    typeof navigator === 'undefined'
      ? []
      : navigator.languages?.length
        ? navigator.languages
        : [navigator.language];
  return pickInitialLanguage(null, preferred);
}
