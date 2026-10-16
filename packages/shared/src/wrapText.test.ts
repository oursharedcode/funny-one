// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import { wrapText, type TextMeasurer } from './wrapText.js';

// Every character 10 wide, a space included.
const ctx: TextMeasurer = { measureText: (text) => ({ width: [...text].length * 10 }) };

describe('wrapText', () => {
  it('wraps spaced text at spaces, as before', () => {
    expect(wrapText(ctx, 'aa bb cc', 50)).toEqual(['aa bb', 'cc']);
    expect(wrapText(ctx, '  aa   bb  ', 100)).toEqual(['aa bb']);
  });

  it('breaks Chinese and Japanese between characters', () => {
    expect(wrapText(ctx, '一二三四五', 30)).toEqual(['一二三', '四五']);
    expect(wrapText(ctx, 'あいうえお', 30)).toEqual(['あいう', 'えお']);
  });

  it('never starts a line with closing punctuation or small kana', () => {
    expect(wrapText(ctx, '一二，三四', 20)).toEqual(['一', '二，', '三四']);
    expect(wrapText(ctx, 'ちょっと', 20)).toEqual(['ちょっ', 'と']);
  });

  it('never ends a line on an opening bracket', () => {
    expect(wrapText(ctx, '一二「三」', 30)).toEqual(['一二', '「三」']);
  });

  it('keeps spaces between mixed scripts and adds none where there were none', () => {
    expect(wrapText(ctx, 'GitHub 上嘅原始碼', 200)).toEqual(['GitHub 上嘅原始碼']);
    expect(wrapText(ctx, 'AI圖片', 200)).toEqual(['AI圖片']);
    expect(wrapText(ctx, 'AI圖片', 30)).toEqual(['AI圖', '片']);
  });

  it('keeps a supplementary-plane Han character whole', () => {
    expect(wrapText(ctx, '部𨋢入面', 20)).toEqual(['部𨋢', '入面']);
  });

  it('gives an over-wide word a line of its own', () => {
    expect(wrapText(ctx, 'a abcdefgh b', 50)).toEqual(['a', 'abcdefgh', 'b']);
  });

  it('returns no lines for empty or blank text', () => {
    expect(wrapText(ctx, '', 50)).toEqual([]);
    expect(wrapText(ctx, '   ', 50)).toEqual([]);
  });
});
