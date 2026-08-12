// SPDX-License-Identifier: AGPL-3.0-only

// Display-text registry, keyed by language then option id.
//
// Typed against `AuthoredLanguage` rather than `Language`, so the record is
// exhaustive over exactly the languages whose texts exist. T-6.3 widens
// `AuthoredLanguage` to the full `Language` union and TypeScript then refuses
// to compile until all 15 files are registered here (D-2, FM-POOL-2/5).

import type { AuthoredLanguage, PoolTextMap } from '../schema.js';
import { en } from './en.js';
import { ru } from './ru.js';

export const POOL_TEXTS: Readonly<Record<AuthoredLanguage, PoolTextMap>> = { en, ru };

export { en, ru };
