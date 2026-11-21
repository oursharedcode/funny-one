// SPDX-License-Identifier: AGPL-3.0-only

// The Christmas 2026 edition's display texts, keyed by language then option id.
//
// All 20 languages B-29 offers the pack in: en and ru drafted in Step 103, the
// other 18 machine-drafted in Step 118 with the same brief, each flagged
// `needs-<code>-review` in its file header and on B-3's pile. The key type is
// every AuthoredLanguage but ar, he and fa, where Christmas is not the winter
// festival — the same set as CHR26_LANGUAGES (packs.test.ts holds the two
// together), so TypeScript refuses a missing language here.

import type { AuthoredLanguage, PoolTextMap } from '../../../pools/schema.js';
import { bn } from './bn.js';
import { de } from './de.js';
import { en } from './en.js';
import { es419 } from './es-419.js';
import { esEs } from './es-es.js';
import { fr } from './fr.js';
import { hi } from './hi.js';
import { id } from './id.js';
import { it } from './it.js';
import { ja } from './ja.js';
import { ko } from './ko.js';
import { ptBr } from './pt-br.js';
import { ru } from './ru.js';
import { sw } from './sw.js';
import { ta } from './ta.js';
import { te } from './te.js';
import { uk } from './uk.js';
import { yo } from './yo.js';
import { yue } from './yue.js';
import { zh } from './zh.js';

export type Chr26DraftedLanguage = Exclude<AuthoredLanguage, 'ar' | 'he' | 'fa'>;

export const CHR26_TEXTS: Readonly<Record<Chr26DraftedLanguage, PoolTextMap>> = {
  en,
  de,
  fr,
  it,
  'es-es': esEs,
  'es-419': es419,
  'pt-br': ptBr,
  uk,
  ko,
  yue,
  id,
  sw,
  yo,
  ja,
  zh,
  hi,
  ta,
  te,
  bn,
  ru,
};
