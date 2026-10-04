// SPDX-License-Identifier: AGPL-3.0-only

import { beforeEach, describe, expect, it } from 'vitest';
import type { SupportConfig } from '@funny/shared';
import { setUrl } from './testutils/socketMock';
import { hasAnyRail } from './support';

const NO_RAILS: SupportConfig = {
  payId: null,
  payIdName: null,
  sponsorsUrl: null,
  lightningAddress: null,
  donateUrl: null,
};

describe('hasAnyRail', () => {
  beforeEach(() => {
    setUrl('');
    sessionStorage.clear();
  });

  it('is false with no config, or a config with every rail unset', () => {
    expect(hasAnyRail(null)).toBe(false);
    expect(hasAnyRail(NO_RAILS)).toBe(false);
  });

  it('is true on the web once any one rail is set', () => {
    expect(hasAnyRail({ ...NO_RAILS, lightningAddress: 'me@wallet' })).toBe(true);
  });

  // B-1c (FM-APP-3): the store app offers no gifts, whatever the server says.
  it('is false inside the Android store app even with every rail set', () => {
    setUrl('?shell=android');
    expect(
      hasAnyRail({
        payId: 'me@bank',
        payIdName: 'Me',
        sponsorsUrl: 'https://github.com/sponsors/me',
        lightningAddress: 'me@wallet',
        donateUrl: 'https://example.com/give',
      }),
    ).toBe(false);
  });
});
