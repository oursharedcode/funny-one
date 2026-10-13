// SPDX-License-Identifier: AGPL-3.0-only

import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { initLanguageMenu } from './languageMenu.ts';
import { LANG_KEY } from '../keys.ts';

describe('initLanguageMenu', () => {
  beforeAll(() => {
    document.body.innerHTML = `
      <details class="lang"><summary>Language</summary>
        <ul><li><a href="#ru" data-lang="ru">Русский</a></li></ul>
      </details>
      <p class="elsewhere">text</p>
      <nav><a href="#de" data-lang="de"><span>Deutsch</span></a></nav>`;
    initLanguageMenu(document);
  });

  const picker = (): HTMLDetailsElement => document.querySelector('details.lang')!;

  beforeEach(() => {
    picker().open = true;
    localStorage.clear();
  });

  it('closes on a click outside it, not inside it', () => {
    picker().querySelector('summary')?.focus();
    picker()
      .querySelector('ul')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(picker().open).toBe(true);
    document.querySelector('.elsewhere')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(picker().open).toBe(false);
  });

  it('closes on Escape and gives the focus back to its button', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(picker().open).toBe(false);
    expect(document.activeElement).toBe(picker().querySelector('summary'));
  });

  it('remembers the language picked, from the picker or the footer', () => {
    document.querySelector<HTMLElement>('a[data-lang="ru"]')?.click();
    expect(localStorage.getItem(LANG_KEY)).toBe('ru');
    document.querySelector<HTMLElement>('a[data-lang="de"] span')?.click();
    expect(localStorage.getItem(LANG_KEY)).toBe('de');
  });
});
