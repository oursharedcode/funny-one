// SPDX-License-Identifier: AGPL-3.0-only

// Display-text registry, keyed by language then option id.
//
// T-1.5 shipped en + ru hand-authored. T-6.3 widens `AuthoredLanguage` to the
// full `Language` union and adds the remaining 13 as machine-drafted stubs
// (each flagged `needs-<code>-review` in its file header, FM-POOL-2/5) — so
// this record is exhaustive over all 23 registry languages and TypeScript
// refuses to compile if one is ever missing.

import type { AuthoredLanguage, PoolTextMap } from '../schema.js';
import { en } from './en.js';
import { fr } from './fr.js';
import { de } from './de.js';
import { ru } from './ru.js';
import { id } from './id.js';
import { it } from './it.js';
import { zh } from './zh.js';
import { yue } from './yue.js';
import { ja } from './ja.js';
import { ko } from './ko.js';
import { ptBr } from './pt-br.js';
import { es419 } from './es-419.js';
import { esEs } from './es-es.js';
import { uk } from './uk.js';
import { he } from './he.js';
import { fa } from './fa.js';
import { ta } from './ta.js';
import { hi } from './hi.js';
import { te } from './te.js';
import { bn } from './bn.js';
import { ar } from './ar.js';
import { sw } from './sw.js';
import { yo } from './yo.js';

export const POOL_TEXTS: Readonly<Record<AuthoredLanguage, PoolTextMap>> = {
  en,
  fr,
  de,
  ru,
  id,
  it,
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

export {
  en,
  fr,
  de,
  ru,
  id,
  it,
  zh,
  yue,
  ja,
  ko,
  ptBr,
  es419,
  esEs,
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
