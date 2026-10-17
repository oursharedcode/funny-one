// SPDX-License-Identifier: AGPL-3.0-only
// @vitest-environment node

import { LANGUAGES } from '@funny/shared';
import type { Language } from '@funny/shared';
import { describe, expect, it } from 'vitest';
import { GAME_NAMES, STRINGS } from './strings.ts';
import { SUPPORT_STRINGS } from './supportStrings.ts';

const CODES = LANGUAGES.map((option) => option.code);

type Catalog = Record<string, unknown>;

// Every catalog of both games, keyed by its path from here.
const CATALOGS = {
  ...import.meta.glob<Catalog>('../../funny-multi-client/src/i18n/*.json', {
    eager: true,
    import: 'default',
  }),
  ...import.meta.glob<Catalog>('../../funny-one-client/src/i18n/*.json', {
    eager: true,
    import: 'default',
  }),
};

function catalog(app: 'funny-multi-client' | 'funny-one-client', code: Language): Catalog {
  const found = CATALOGS[`../../${app}/src/i18n/${code}.json`];
  if (!found) throw new Error(`no ${app} catalog for ${code}`);
  return found;
}

/** `home.title` → catalog.home.title. */
function entry(source: Catalog, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        typeof node === 'object' && node !== null ? (node as Catalog)[part] : undefined,
      source,
    );
}

describe('the landing page strings', () => {
  it('cover exactly the languages the games ship', () => {
    expect(Object.keys(STRINGS).sort()).toEqual([...CODES].sort());
    expect(Object.keys(GAME_NAMES).sort()).toEqual([...CODES].sort());
  });

  it.each(CODES)('%s has every string, none of them empty', (code) => {
    const keys = Object.keys(STRINGS.en).sort();
    expect(Object.keys(STRINGS[code]).sort()).toEqual(keys);
    for (const key of keys) {
      const value = STRINGS[code][key as keyof (typeof STRINGS)['en']];
      expect(value.trim(), `${code}.${key}`).not.toBe('');
      expect(value, `${code}.${key}`).toBe(value.trim());
    }
  });

  it.each(CODES)('%s puts the author’s link in the footer exactly once', (code) => {
    expect(STRINGS[code].footerMore.split('{link}')).toHaveLength(2);
    for (const [key, value] of Object.entries(STRINGS[code])) {
      if (key !== 'footerMore') expect(value, `${code}.${key}`).not.toMatch(/[{}]/);
    }
  });

  it('uses the binding Russian names', () => {
    expect(STRINGS.ru.brand).toBe('Семейная Чепуха');
    expect(GAME_NAMES.ru).toEqual({
      fm: 'Чепуха 37',
      fo: 'Одна Чепуха: по кругу',
      source: 'Исходный код на GitHub',
    });
  });
});

describe('the games’ names', () => {
  it.each(CODES)('%s matches what each game calls itself', (code) => {
    const fm = catalog('funny-multi-client', code);
    const fo = catalog('funny-one-client', code);
    expect(GAME_NAMES[code]).toEqual({
      fm: entry(fm, 'home.title'),
      fo: entry(fo, 'home.title'),
      source: entry(fm, 'footer.source'),
    });
  });
});

describe('the Support Author sheet', () => {
  it('covers exactly the languages the games ship', () => {
    expect(Object.keys(SUPPORT_STRINGS).sort()).toEqual([...CODES].sort());
  });

  it.each(CODES)('%s reads exactly like Funny Multi’s own sheet', (code) => {
    const fm = catalog('funny-multi-client', code);
    expect(Object.keys(SUPPORT_STRINGS[code])).toEqual(Object.keys(SUPPORT_STRINGS.en));
    for (const [key, value] of Object.entries(SUPPORT_STRINGS[code])) {
      expect(value, `${code}.${key}`).toBe(entry(fm, `support.${key}`));
    }
  });

  it.each(CODES)('%s names the bank account exactly once', (code) => {
    expect(SUPPORT_STRINGS[code].payIdBankNote.split('{{name}}')).toHaveLength(2);
  });
});
