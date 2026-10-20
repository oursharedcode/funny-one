// SPDX-License-Identifier: AGPL-3.0-only

// Step 88. The matching itself is @funny/shared's (uiLanguage.test.ts there);
// this checks which of the browser's languages are read.

import { describe, expect, it, vi } from 'vitest';
import { initialLanguage } from './uiLanguage';

describe('initialLanguage (Step 88)', () => {
  it("takes the first of the device's languages the game ships", () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['nl-NL', 'ko-KR', 'en-GB']);
    expect(initialLanguage()).toBe('ko');
  });

  it('reads navigator.language when the list is empty', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue([]);
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('zh-HK');
    expect(initialLanguage()).toBe('yue');
  });

  it('falls back to English', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['nl-NL', 'sv-SE']);
    expect(initialLanguage()).toBe('en');
  });
});
