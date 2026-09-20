// SPDX-License-Identifier: AGPL-3.0-only

// Cross-product i18n: the 7 round questions and the locked prose template per
// authored language (design §9). Promoted from
// `apps/funny-multi-server/src/i18n/index.ts` (T-FO-2.1, FO-ARC-2) so Funny
// One — which has no server — can render prose too.
//
// Two changes from the server-only version it replaces:
//
//  1. **Static imports, not `readdirSync`/`createRequire`.** The old loader
//     was Node-only (`node:fs`, `node:module`, `node:url`), which this
//     package cannot be — both Funny Multi's client and Funny One import it
//     into the browser. Every `<code>.ts` catalog is imported directly, the
//     same pattern `pools/text/index.ts` already uses for `POOL_TEXTS`.
//
//  2. **Exhaustiveness is a compile-time property, not a boot-time throw.**
//     `CATALOGS`'s `Record<AuthoredLanguage, ServerI18n>` annotation means
//     TypeScript refuses to compile if a language is missing or misspelled —
//     the old `readdirSync` loop's runtime check is now redundant.

import { AUTHORED_LANGUAGES, type AuthoredLanguage } from '../pools/schema.js';
import type { ServerI18n } from './types.js';
import { en } from './en.js';
import { fr } from './fr.js';
import { de } from './de.js';
import { ru } from './ru.js';
import { id } from './id.js';
import { it } from './it.js';
import { zh } from './zh.js';
import { ja } from './ja.js';
import { ko } from './ko.js';
import { ptBr } from './pt-br.js';
import { es419 } from './es-419.js';
import { esEs } from './es-es.js';
import { uk } from './uk.js';
import { he } from './he.js';
import { ta } from './ta.js';

const CATALOGS: Readonly<Record<AuthoredLanguage, ServerI18n>> = {
  en,
  fr,
  de,
  ru,
  id,
  it,
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

function project<V>(pick: (d: ServerI18n) => V): Record<AuthoredLanguage, V> {
  const out = {} as Record<AuthoredLanguage, V>;
  for (const [code, d] of Object.entries(CATALOGS) as Array<[AuthoredLanguage, ServerI18n]>) {
    out[code] = pick(d);
  }
  return out;
}

export const QUESTIONS: Record<AuthoredLanguage, readonly string[]> = project((d) => d.questions);
export const PROSE_TEMPLATES: Record<AuthoredLanguage, string> = project((d) => d.prose);

function isAuthored(code: string): code is AuthoredLanguage {
  return (AUTHORED_LANGUAGES as readonly string[]).includes(code);
}

/**
 * Narrows a `Room.language` (Funny Multi) or a picked `Language` (Funny One)
 * to a language this catalog can render.
 *
 * Both products type their language choice as the full 15-code `Language`
 * union, while `QUESTIONS`/`PROSE_TEMPLATES`/`POOL_TEXTS` are all keyed by
 * `AuthoredLanguage` until Phase 6 widens it. Funny Multi's `rooms.isValidLanguage`
 * already rejects the rest at room creation, so this can only fire if that gate
 * is bypassed — in which case throwing here beats indexing into `undefined` and
 * emitting a story of "undefined and undefined were undefined".
 */
export function requireAuthoredLanguage(language: string): AuthoredLanguage {
  if (!isAuthored(language)) {
    throw new Error(`[i18n] Language "${language}" has no authored texts yet (T-6.2/T-6.3)`);
  }
  return language;
}

/**
 * Fills the locked prose template (spec §9) with a story's 7 resolved display
 * texts. Slot `{n}` maps to `answers[n]`; the Russian template reorders slots
 * but uses the same indices, so one substitution pass serves both.
 *
 * **SRC's three render-time repair transforms are deliberately not carried.**
 * SRC prepended "for " to an English slot 5 that lacked a connective, prepended
 * "и " to a Russian slot 1 that lacked «с/со», and prepended «это закончилось»
 * to a bare-noun Russian slot 6. All three existed to repair *free-typed player
 * input*, which no longer reaches this function: answers are pool texts, and
 * T-1.5 authored them to compose with each template directly — invariants that
 * `pools.test.ts` enforces via `EN_WHY_CONNECTIVE`, `RU_WITH_PREPOSITION` and
 * `RU_ENDING_MIN_WORDS`. Keeping the transforms would mean every pool text
 * silently depending on a repair pass that its own authoring rule already makes
 * unreachable; Funny Multi's `game.test.ts` asserts the transforms would in
 * fact never fire across the whole pool, so this is a checked claim rather
 * than an assumption.
 */
export function renderProse(language: AuthoredLanguage, answers: readonly string[]): string {
  return PROSE_TEMPLATES[language].replace(
    /\{([0-6])\}/g,
    (_, digit: string) => answers[Number(digit)] ?? '',
  );
}
