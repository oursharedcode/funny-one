// SPDX-License-Identifier: AGPL-3.0-only

// T-3.1 — UI catalogue coverage.
//
// The catalogues are the one part of this bootstrap that can break silently.
// Everything else fails loudly: a bad import fails typecheck, a bad config
// fails the build. A key added to `en.json` and forgotten in `ru.json` fails
// nowhere — i18next quietly falls back to English, so a Russian player gets
// one English button and nobody notices until they are looking at it.
//
// The same argument covers the error catalogue specifically: `App.tsx` renders
// `t('errors.' + code)`, so a code the server can emit but the catalogue does
// not name reaches the player as the server's raw English `message`.
//
// This runs without a DOM: the catalogues are plain JSON, and the assertions
// are about their shape.

import { describe, expect, it } from 'vitest';
import { LANGUAGES, type ErrorCode } from '@funny/shared';
import en from './en.json';
import ru from './ru.json';
import de from './de.json';
import fr from './fr.json';
import id from './id.json';
import itCatalog from './it.json';
import zh from './zh.json';
import ja from './ja.json';
import ko from './ko.json';
import ptBr from './pt-br.json';
import es419 from './es-419.json';
import esEs from './es-es.json';
import uk from './uk.json';
import he from './he.json';
import ta from './ta.json';

type Catalog = Record<string, unknown>;
const CATALOGS: Record<string, Catalog> = {
  en,
  ru,
  de,
  fr,
  id,
  it: itCatalog,
  zh,
  ja,
  ko,
  'pt-br': ptBr,
  'es-419': es419,
  'es-es': esEs,
  uk,
  he,
  ta,
};

/**
 * Every leaf path in a nested catalogue, e.g. `home.title`, `questions.0`.
 * `_note` is metadata (the `needs-<code>-review` flag on machine-drafted
 * catalogues, languages.ts §top), not translated content — excluded so it
 * doesn't register as a key `en.json` is missing.
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
  it('ships a catalogue for every UI language', () => {
    // Keyed to the full `LANGUAGES` registry, not `AUTHORED_LANGUAGES` (T-6.1):
    // UI language and room content language are different axes. The room's
    // content language is still gated to `AUTHORED_LANGUAGES` until T-6.3
    // finishes the pool texts (rooms.ts, POOL_TEXTS) — but the interface
    // itself can be read in any of the 15 the moment a catalogue exists for
    // it, same as SRC shipped it. `i18n/index.ts` makes the same check at
    // boot; this makes it before the boot.
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
    // A translated string that drops `{{count}}` renders a sentence with a
    // hole in it; one that invents `{{total}}` where the caller passes
    // `{{count}}` renders the placeholder literally.
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

  it('asks the 7 questions of a round in every language', () => {
    for (const [code, catalog] of Object.entries(CATALOGS)) {
      expect((catalog.questions as string[]).length, `${code}.json`).toBe(7);
    }
  });

  it('names every error code the server can emit', () => {
    // Compile-time, not runtime: `ErrorCode` is a type, so a new code added to
    // the socket contract cannot be detected by inspecting the JSON. This
    // record must stay exhaustive over the union, which means `npm run
    // typecheck` fails on a code no catalogue explains — including
    // INVALID_OPTION, the one this product added (FM-ANS-2).
    const CODES: Record<ErrorCode, true> = {
      ROOM_NOT_FOUND: true,
      ROOM_LOCKED: true,
      ROOM_FULL: true,
      NOT_HOST: true,
      NOT_ENOUGH_PLAYERS: true,
      INVALID_NICKNAME: true,
      INVALID_OPTION: true,
      RATE_LIMITED: true,
      SERVER_BUSY: true,
    };
    for (const [code, catalog] of Object.entries(CATALOGS)) {
      const errors = catalog.errors as Record<string, string>;
      expect(Object.keys(errors).sort(), `${code}.json errors`).toEqual(Object.keys(CODES).sort());
    }
  });

  it('carries no leftover free-text affordance', () => {
    // FM-ANS-1: players pick, never type. SRC's catalogue had
    // `round.placeholder` ("Type your answer…") for its textarea; if that key
    // ever reappears, a textarea reappeared with it.
    for (const [code, catalog] of Object.entries(CATALOGS)) {
      const round = catalog.round as Record<string, string>;
      expect(round.placeholder, `${code}.json still has round.placeholder`).toBeUndefined();
      expect(round.pick, `${code}.json is missing the combobox prompt`).toBeTruthy();
    }
  });
});
