// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: the language picker is a <details> and works without this; here it
// closes the way a menu does (a click elsewhere, Escape), and a language
// picked anywhere on the page — the picker or the footer list — is
// remembered, so the next visit to `/` opens in it (render/headScript.ts).

import { LANG_KEY } from '../keys.ts';

export function initLanguageMenu(doc: Document): void {
  const win = doc.defaultView;
  const picker = doc.querySelector<HTMLDetailsElement>('details.lang');

  if (picker) {
    doc.addEventListener('click', (event) => {
      if (picker.open && event.target instanceof Node && !picker.contains(event.target)) {
        picker.open = false;
      }
    });
    doc.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !picker.open) return;
      picker.open = false;
      picker.querySelector('summary')?.focus();
    });
  }

  doc.addEventListener('click', (event) => {
    const link =
      event.target instanceof Element ? event.target.closest<HTMLElement>('a[data-lang]') : null;
    const code = link?.dataset.lang;
    if (!code) return;
    try {
      win?.localStorage.setItem(LANG_KEY, code);
    } catch {
      // Blocked storage: the browser's own language decides next time.
    }
  });
}
