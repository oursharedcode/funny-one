// SPDX-License-Identifier: AGPL-3.0-only

// Server-side i18n: the 7 questions and the prose template per room language
// (design §9). Adapted from SRC/server/src/i18n/index.ts.
//
// Three changes from SRC:
//
//  1. **`imagePrompt` is gone from the JSON.** SRC kept a per-language image
//     prompt template; DD-4 replaces all 15 with one English skeleton built
//     from pool fragments in `prompt.ts` (T-4.2), so every language shares one
//     R2 cache. A per-language template here would be dead weight that later
//     drifts from the real builder.
//
//  2. **Exhaustiveness is checked over `AUTHORED_LANGUAGES`, not `LANGUAGES`.**
//     SRC threw at boot unless all 15 files existed. Only en and ru are
//     authored until T-6.2, so the check is keyed to the same
//     `AuthoredLanguage` union that `POOL_TEXTS` uses (T-1.3). That keeps the
//     boot-time guarantee — a language the server offers is a language it can
//     fully render — while T-6.2 widens the union in one place and this check
//     follows automatically.
//
//  3. The prose special-cases SRC applied at render time are gone; see
//     `renderProse` below.

import { createRequire } from 'node:module';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { AUTHORED_LANGUAGES, type AuthoredLanguage } from '@funny/shared';

// createRequire works under both tsx (dev) and compiled Node (prod, once the
// build script copies the .json files into dist/i18n — see scripts/copy-i18n.mjs).
const require = createRequire(import.meta.url);
type ServerI18n = { questions: string[]; prose: string };

function isAuthored(code: string): code is AuthoredLanguage {
  return (AUTHORED_LANGUAGES as readonly string[]).includes(code);
}

// Auto-discover every `<code>.json` next to this module. Adding a language
// stays a drop-in — no edit to this bootstrap.
const i18nDir = dirname(fileURLToPath(import.meta.url));
const data = {} as Record<AuthoredLanguage, ServerI18n>;
for (const file of readdirSync(i18nDir)) {
  if (!file.endsWith('.json')) continue;
  const code = file.slice(0, -5);
  if (!isAuthored(code)) continue;
  data[code] = require(`./${file}`) as ServerI18n;
}

// Throws on boot rather than 500-ing mid-game when a player picks the broken
// language.
const missing = AUTHORED_LANGUAGES.filter((code) => !data[code]);
if (missing.length > 0) {
  throw new Error(`[i18n] Missing src/i18n/<code>.json for: ${missing.join(', ')}`);
}

function project<V>(pick: (d: ServerI18n) => V): Record<AuthoredLanguage, V> {
  const out = {} as Record<AuthoredLanguage, V>;
  for (const [code, d] of Object.entries(data) as Array<[AuthoredLanguage, ServerI18n]>) {
    out[code] = pick(d);
  }
  return out;
}

export const QUESTIONS: Record<AuthoredLanguage, readonly string[]> = project((d) => d.questions);
export const PROSE_TEMPLATES: Record<AuthoredLanguage, string> = project((d) => d.prose);

/**
 * Narrows a `Room.language` to a language this server can render.
 *
 * `Room.language` is typed `Language` (all 15) because that is the protocol's
 * eventual shape, while `QUESTIONS`, `PROSE_TEMPLATES` and `POOL_TEXTS` are all
 * keyed by `AuthoredLanguage` until Phase 6. `rooms.isValidLanguage` already
 * rejects the rest at room creation, so this can only fire if that gate is
 * bypassed — in which case throwing here beats indexing into `undefined` and
 * emitting a story of "undefined and undefined were undefined".
 */
export function requireAuthoredLanguage(language: string): AuthoredLanguage {
  if (!isAuthored(language)) {
    throw new Error(`[i18n] Room language "${language}" has no authored texts yet (T-6.2/T-6.3)`);
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
 * unreachable; `game.test.ts` asserts the transforms would in fact never fire
 * across the whole pool, so this is a checked claim rather than an assumption.
 */
export function renderProse(language: AuthoredLanguage, answers: readonly string[]): string {
  return PROSE_TEMPLATES[language].replace(
    /\{([0-6])\}/g,
    (_, digit: string) => answers[Number(digit)] ?? '',
  );
}
