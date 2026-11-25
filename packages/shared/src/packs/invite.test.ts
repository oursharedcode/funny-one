// SPDX-License-Identifier: AGPL-3.0-only

// Step 126: the Christmas invitation's table. The client holds each title to
// its catalogue's `home.title` (catalogs.test.ts); this holds the table to the
// languages and to rule 5A.

import { describe, expect, it } from 'vitest';
import { LANGUAGES } from '../languages.js';
import { PACK_INVITES, inviteText } from './invite.js';

describe('the Christmas invitation (Step 126)', () => {
  it('speaks every language the games ship', () => {
    expect(Object.keys(PACK_INVITES).sort()).toEqual(LANGUAGES.map((l) => l.code).sort());
  });

  it('ends each title with its exclamation, and leaves no half blank', () => {
    for (const [code, { title, line }] of Object.entries(PACK_INVITES)) {
      expect(title, code).toMatch(/[!！]$/u);
      expect(title, code).toBe(title.trim());
      expect(line.trim(), code).toBe(line);
      expect(line, code).not.toBe('');
    }
  });

  it('carries no price and no code (rule 5A): no currency sign, no digit but «Чепуха 37»', () => {
    for (const [code, { title, line }] of Object.entries(PACK_INVITES)) {
      const text = `${title} ${line}`.replace('«Чепуха 37»', '');
      expect(text, code).not.toMatch(/[\p{Nd}\p{Sc}]/u);
      expect(text, code).not.toMatch(/XMAS|x26|http/i);
    }
  });

  it('joins the halves with a space, or straight on after a full-width "！"', () => {
    expect(inviteText('en')).toBe(
      'Join my Christmas game of Funny Multi! We make up silly Christmas stories together, and each one becomes a cartoon 🎄',
    );
    expect(inviteText('ru')).toBe(
      'Заходи в мою новогоднюю игру «Чепуха 37»! Вместе сочиняем смешные новогодние истории, и каждая становится мультиком 🎄',
    );
    expect(inviteText('ja')).toBe(`${PACK_INVITES.ja.title}${PACK_INVITES.ja.line}`);
    expect(inviteText('ja')).not.toMatch(/！ /u);
    expect(inviteText('fr')).toContain('Drôles ! On invente');
  });
});
