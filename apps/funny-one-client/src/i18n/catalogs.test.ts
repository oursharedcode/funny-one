// SPDX-License-Identifier: AGPL-3.0-only

// T-FO-5.1b — UI catalogue coverage. Ported from
// apps/funny-multi-client/src/i18n/catalogs.test.ts.
//
// The catalogues can break silently: a key added to `en.json` and forgotten in
// `ru.json` fails nowhere — i18next quietly falls back to English, so a Russian
// player gets one English button and nobody notices until they are looking at
// it.
//
// Funny Multi's `questions`, `errors` and `round.placeholder` assertions are
// dropped: Funny One has no server-driven questions array, no `ErrorCode`
// union and no socket errors to name.
//
// This runs without a DOM: the catalogues are plain JSON, and the assertions
// are about their shape.

import { describe, expect, it } from 'vitest';
import { LANGUAGES } from '@funny/shared';
import en from './en.json';
import ru from './ru.json';
import de from './de.json';
import fr from './fr.json';
import id from './id.json';
import itCatalog from './it.json';
import zh from './zh.json';
import yue from './yue.json';
import ja from './ja.json';
import ko from './ko.json';
import ptBr from './pt-br.json';
import es419 from './es-419.json';
import esEs from './es-es.json';
import uk from './uk.json';
import he from './he.json';
import fa from './fa.json';
import ta from './ta.json';
import hi from './hi.json';
import te from './te.json';
import bn from './bn.json';
import ar from './ar.json';
import sw from './sw.json';
import yo from './yo.json';

type Catalog = Record<string, unknown>;
const CATALOGS: Record<string, Catalog> = {
  en,
  ru,
  de,
  fr,
  id,
  it: itCatalog,
  zh,
  yue,
  ja,
  ko,
  'pt-br': ptBr,
  'es-419': es419,
  'es-es': esEs,
  uk,
  he,
  fa,
  ta,
  hi,
  te,
  bn,
  ar,
  sw,
  yo,
};

/**
 * Every leaf path in a nested catalogue, e.g. `home.title`. `_note` is
 * metadata (the `needs-<code>-review` flag on machine-drafted catalogues), not
 * translated content — excluded so it doesn't register as a key `en.json` is
 * missing.
 */
function leafPaths(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((v, i) => leafPaths(v, `${prefix}${i}.`));
  }
  if (value !== null && typeof value === 'object') {
    return Object.entries(value)
      .filter(([k]) => prefix !== '' || k !== '_note')
      .flatMap(([k, v]) => leafPaths(v, `${prefix}${k}.`));
  }
  return [prefix.slice(0, -1)];
}

/** The `{{name}}` interpolations in a string, sorted. */
function placeholders(text: string): string[] {
  return [...text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]!).sort();
}

function leaf(catalog: Catalog, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (node, key) => (node as Record<string, unknown> | undefined)?.[key],
      catalog as unknown,
    );
}

describe('catalogue coverage', () => {
  it('ships a catalogue for every language', () => {
    // `i18n/index.ts` makes the same check at boot; this makes it before the
    // boot.
    expect(Object.keys(CATALOGS).sort()).toEqual(LANGUAGES.map((l) => l.code).sort());
  });

  it('translates exactly the same keys in every language', () => {
    const reference = leafPaths(en).sort();
    for (const [code, catalog] of Object.entries(CATALOGS)) {
      expect(leafPaths(catalog).sort(), `${code}.json key set differs from en.json`).toEqual(
        reference,
      );
    }
  });

  it('has no blank translation', () => {
    for (const [code, catalog] of Object.entries(CATALOGS)) {
      for (const path of leafPaths(catalog)) {
        const value = leaf(catalog, path);
        expect(typeof value, `${code}.json ${path} is not a string`).toBe('string');
        expect((value as string).trim(), `${code}.json ${path} is blank`).not.toBe('');
      }
    }
  });

  it('uses the same interpolations in every language', () => {
    // A translated string that drops `{{name}}` renders a sentence with a
    // hole in it; one that invents `{{nickname}}` where the caller passes
    // `{{name}}` renders the placeholder literally.
    for (const path of leafPaths(en)) {
      const reference = placeholders(leaf(en, path) as string);
      for (const [code, catalog] of Object.entries(CATALOGS)) {
        expect(
          placeholders(leaf(catalog, path) as string),
          `${code}.json ${path} interpolations differ from en.json`,
        ).toEqual(reference);
      }
    }
  });

  it('keeps the D-9 Russian product name', () => {
    expect(ru.home.title).toBe('Одна Чепуха: по кругу');
  });
});
