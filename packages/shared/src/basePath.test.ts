// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import { normalizeBasePath } from './basePath.js';

describe('normalizeBasePath', () => {
  it('treats unset, empty, root and whitespace as the root', () => {
    for (const raw of [undefined, '', '/', '  ', ' / ', '//']) {
      expect(normalizeBasePath(raw)).toBe('/');
    }
  });

  it('accepts every spelling of a sub-path and returns the slash-wrapped form', () => {
    for (const raw of ['funny37-game', '/funny37-game', 'funny37-game/', '/funny37-game/']) {
      expect(normalizeBasePath(raw)).toBe('/funny37-game/');
    }
  });

  it('keeps nested segments and collapses doubled slashes', () => {
    expect(normalizeBasePath('//games//funny37-game//')).toBe('/games/funny37-game/');
  });

  it('is idempotent, so a value can pass through more than one layer', () => {
    const once = normalizeBasePath('funny37-game');
    expect(normalizeBasePath(once)).toBe(once);
  });
});
