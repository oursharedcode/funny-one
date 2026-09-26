// SPDX-License-Identifier: AGPL-3.0-only

import { afterAll, describe, expect, it } from 'vitest';
import { LANGUAGES } from '@funny/shared';
import i18n from './index';

describe('i18n boot', () => {
  afterAll(() => i18n.changeLanguage('en'));

  // Regression: i18next rewrote `pt-br`/`es-es` to `pt-BR`/`es-ES`, missed the
  // resource key and rendered English (found in Funny One by the T-FO-5.1b browser run).
  it.each(LANGUAGES.map((l) => l.code))('renders %s from its own catalog', async (code) => {
    await i18n.changeLanguage(code);
    const own = i18n.getResource(code, 'translation', 'home.subtitle') as string;
    expect(own).toBeTruthy();
    expect(i18n.t('home.subtitle')).toBe(own);
  });
});
