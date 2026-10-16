// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: how each of the games' language codes is spelled where the web
// expects a standard tag — <html lang>, hreflang, og:locale.

import { LANGUAGES } from '@funny/shared';
import type { Language } from '@funny/shared';

/**
 * The BCP 47 tag of <html lang> and hreflang. `zh` is Simplified Chinese.
 * Cantonese is `zh-HK`, not `yue`: hreflang wants an ISO 639-1 language, and
 * `zh-HK` is also what makes fonts pick Hong Kong glyphs and speech pick a
 * Cantonese voice.
 */
export const HTML_LANG: Record<Language, string> = {
  en: 'en',
  fr: 'fr',
  de: 'de',
  ru: 'ru',
  id: 'id',
  it: 'it',
  zh: 'zh-Hans',
  yue: 'zh-HK',
  ja: 'ja',
  ko: 'ko',
  'pt-br': 'pt-BR',
  'es-419': 'es-419',
  'es-es': 'es-ES',
  uk: 'uk',
  he: 'he',
  fa: 'fa',
  ta: 'ta',
  hi: 'hi',
  te: 'te',
  bn: 'bn',
};

/** Open Graph's locale (language_TERRITORY); es_LA is Facebook's Latin American Spanish. */
export const OG_LOCALE: Record<Language, string> = {
  en: 'en_GB',
  fr: 'fr_FR',
  de: 'de_DE',
  ru: 'ru_RU',
  id: 'id_ID',
  it: 'it_IT',
  zh: 'zh_CN',
  yue: 'zh_HK',
  ja: 'ja_JP',
  ko: 'ko_KR',
  'pt-br': 'pt_BR',
  'es-419': 'es_LA',
  'es-es': 'es_ES',
  uk: 'uk_UA',
  he: 'he_IL',
  fa: 'fa_IR',
  ta: 'ta_IN',
  hi: 'hi_IN',
  te: 'te_IN',
  bn: 'bn_BD',
};

export const LANGUAGE_CODES: readonly Language[] = LANGUAGES.map((option) => option.code);

export function isRtl(code: Language): boolean {
  return code === 'he' || code === 'fa';
}

/** A language's name as the games' pickers show it: "Deutsch (Deutschland)". */
export function languageName(code: Language): string {
  return LANGUAGES.find((option) => option.code === code)?.name ?? code;
}

/**
 * The name without its region, for the closed picker: "Deutsch". The two
 * Spanish entries both read "Español" there; their flags tell them apart, and
 * the open list and the picker's accessible name carry the full names.
 */
export function shortLanguageName(code: Language): string {
  const name = languageName(code);
  const cut = name.indexOf(' (');
  return cut > 0 ? name.slice(0, cut) : name;
}
