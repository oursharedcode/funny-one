// SPDX-License-Identifier: AGPL-3.0-only

// A pack's last paid day in words: Home's pack box (Step 122), and the pay
// card and the pay page (Step 123), which must all name the same day.

import { PACKS, type PackId } from '@funny/shared';

/**
 * Where a browser has no dates of a language's own — Chrome, and so the
 * Android app, lacks Cantonese and Yoruba — the nearest it has, before
 * British English: without a list, Chrome writes "2027 M08 1".
 */
const DATE_FALLBACKS: Partial<Record<string, string>> = { yue: 'zh-HK' };

/**
 * A pack's last paid day, as the interface language writes a date: British
 * English, as the game's English is, and the Gregorian calendar in every
 * language (Persian would otherwise default to its own).
 */
export function lastPaidDay(pack: PackId, language: string): string {
  const own = language === 'en' ? 'en-GB' : language;
  const locales = [own, DATE_FALLBACKS[language], 'en-GB'].filter((l): l is string => !!l);
  return new Intl.DateTimeFormat(
    locales.map((l) => `${l}-u-ca-gregory`),
    { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' },
  ).format(new Date(`${PACKS[pack].paidUntil}T00:00:00Z`));
}
