// SPDX-License-Identifier: AGPL-3.0-only

// The Christmas 2026 edition's display texts, keyed by language then option id.
//
// en and ru only, both drafts (Step 103). B-29 offers the pack in 20 languages;
// the other 18 are machine drafts still owed, on B-3's pile, with the same
// brief. As with T-1.3's first `AuthoredLanguage`, the key type is the drafted
// subset: widening it to every language of CHR26_LANGUAGES is what makes
// TypeScript demand the rest.

import type { AuthoredLanguage, PoolTextMap } from '../../../pools/schema.js';
import { en } from './en.js';
import { ru } from './ru.js';

export type Chr26DraftedLanguage = Extract<AuthoredLanguage, 'en' | 'ru'>;

export const CHR26_TEXTS: Readonly<Record<Chr26DraftedLanguage, PoolTextMap>> = { en, ru };
