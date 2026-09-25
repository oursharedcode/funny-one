// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import { matchLanguageTag, pickInitialLanguage } from './uiLanguage';

describe('matchLanguageTag (T-FO-5.1a)', () => {
  it('matches registry codes exactly, case-insensitively', () => {
    expect(matchLanguageTag('ru')).toBe('ru');
    expect(matchLanguageTag('pt-BR')).toBe('pt-br');
    expect(matchLanguageTag('es-419')).toBe('es-419');
    expect(matchLanguageTag('ES-es')).toBe('es-es');
  });

  it('falls back to the primary subtag', () => {
    expect(matchLanguageTag('en-US')).toBe('en');
    expect(matchLanguageTag('fr-CA')).toBe('fr');
    expect(matchLanguageTag('zh-Hant-TW')).toBe('zh');
    expect(matchLanguageTag('ta-IN')).toBe('ta');
  });

  it('routes Spanish and Portuguese regions to the shipped variants', () => {
    expect(matchLanguageTag('es')).toBe('es-es');
    expect(matchLanguageTag('es-MX')).toBe('es-419');
    expect(matchLanguageTag('es-AR')).toBe('es-419');
    expect(matchLanguageTag('pt')).toBe('pt-br');
    expect(matchLanguageTag('pt-PT')).toBe('pt-br');
  });

  it("accepts Hebrew's legacy iw code", () => {
    expect(matchLanguageTag('iw-IL')).toBe('he');
  });

  it('returns undefined for languages not shipped', () => {
    expect(matchLanguageTag('nl-NL')).toBeUndefined();
    expect(matchLanguageTag('')).toBeUndefined();
  });
});

describe('pickInitialLanguage (T-FO-5.1a)', () => {
  it('a remembered pick wins over the device locale', () => {
    expect(pickInitialLanguage('uk', ['de-DE'])).toBe('uk');
  });

  it('ignores a remembered value that is no longer a registry code', () => {
    expect(pickInitialLanguage('xx', ['de-DE'])).toBe('de');
  });

  it('takes the first preferred language we ship', () => {
    expect(pickInitialLanguage(null, ['nl-NL', 'ko-KR', 'en-GB'])).toBe('ko');
  });

  it('falls back to English', () => {
    expect(pickInitialLanguage(null, ['nl-NL', 'sv-SE'])).toBe('en');
    expect(pickInitialLanguage(null, [])).toBe('en');
  });
});
