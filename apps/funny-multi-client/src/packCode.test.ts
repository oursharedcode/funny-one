// SPDX-License-Identifier: AGPL-3.0-only

// Step 122 (B-29): the paid code on this phone — taken off a pay link, kept,
// removed, and offered only to a room it could open. Never in the Android app.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setUrl } from './testutils/socketMock';
import {
  __resetPackCodeForTest,
  canUnlockRoom,
  capturePackCodeFromUrl,
  forgetPackCode,
  linkCodeRefused,
  readPackCode,
  rememberPackCode,
} from './packCode';
import type { RoomPack } from '@funny/shared';

const KEY = 'funny37.packCode';
const CODE = 'XMAS26-K7QM-3FPA';

// chr26's free part ends at noon UTC on 2 July 2027, its paid part a month later.
const DECEMBER = Date.parse('2026-12-20T09:00:00Z');
const JULY = Date.parse('2027-07-15T09:00:00Z');
const AUTUMN = Date.parse('2027-08-03T09:00:00Z');

const FREE_ROOM: RoomPack = { id: 'chr26', on: true, paid: false };

function blockStorage(): void {
  for (const method of ['getItem', 'setItem', 'removeItem'] as const) {
    vi.spyOn(Storage.prototype, method).mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
  }
}

beforeEach(() => {
  __resetPackCodeForTest();
  localStorage.clear();
  sessionStorage.clear();
  setUrl('');
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('capturePackCodeFromUrl', () => {
  it("keeps a pay link's code and takes it off the address, leaving the rest", () => {
    setUrl('?room=ABCD&code=xmas26-k7qm-3fpa&lang=en#top');
    capturePackCodeFromUrl();
    expect(window.location.search).toBe('?room=ABCD&lang=en');
    expect(window.location.hash).toBe('#top');
    expect(localStorage.getItem(KEY)).toBe(CODE);
    expect(readPackCode()).toEqual({ pack: 'chr26', body: 'K7QM3FPA', code: CODE });
    expect(linkCodeRefused()).toBe(false);
  });

  it('reads a code as a person might copy it', () => {
    setUrl('?code=k7qm%203fpa');
    capturePackCodeFromUrl();
    expect(readPackCode()?.code).toBe(CODE);
    setUrl('?code=XMAS26.K7QM.3FPA');
    capturePackCodeFromUrl();
    expect(readPackCode()?.code).toBe(CODE);
  });

  it('says so when the link carries something that is not a code, and keeps none', () => {
    setUrl('?code=XMAS26-K7QM-3FP');
    capturePackCodeFromUrl();
    expect(window.location.search).toBe('');
    expect(linkCodeRefused()).toBe(true);
    expect(readPackCode()).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('replaces a code kept before with the new link’s', () => {
    rememberPackCode('XMAS26-0000-0000');
    setUrl(`?code=${CODE}`);
    capturePackCodeFromUrl();
    expect(readPackCode()?.code).toBe(CODE);
  });

  it('leaves an address without a code alone', () => {
    setUrl('?room=ABCD&lang=en');
    capturePackCodeFromUrl();
    expect(window.location.search).toBe('?room=ABCD&lang=en');
    expect(linkCodeRefused()).toBe(false);
    expect(readPackCode()).toBeNull();
  });
});

describe('the Android app', () => {
  it('neither keeps a code from a link nor says anything about it', () => {
    setUrl(`?shell=android&code=${CODE}`);
    capturePackCodeFromUrl();
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(linkCodeRefused()).toBe(false);
    expect(readPackCode()).toBeNull();
  });

  it('never reads the code Chrome keeps from the website', () => {
    localStorage.setItem(KEY, CODE);
    setUrl('?shell=android');
    expect(readPackCode()).toBeNull();
    expect(canUnlockRoom(FREE_ROOM, 'en', DECEMBER)).toBe(false);
    // The app's later screens have lost the launch URL; the session remembers.
    setUrl('');
    expect(readPackCode()).toBeNull();
  });
});

describe('the code on this phone', () => {
  it('is remembered and removed', () => {
    rememberPackCode(CODE);
    expect(readPackCode()?.code).toBe(CODE);
    forgetPackCode();
    expect(readPackCode()).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('is read forgivingly, and not at all when it is not a code', () => {
    localStorage.setItem(KEY, 'xmas26k7qm3fpa');
    expect(readPackCode()?.code).toBe(CODE);
    localStorage.setItem(KEY, 'hello');
    expect(readPackCode()).toBeNull();
  });

  it('lasts the page load where storage is blocked', () => {
    blockStorage();
    setUrl(`?code=${CODE}`);
    capturePackCodeFromUrl();
    expect(readPackCode()?.code).toBe(CODE);
    forgetPackCode();
    expect(readPackCode()).toBeNull();
  });
});

describe('canUnlockRoom', () => {
  it('is false without a code', () => {
    expect(canUnlockRoom(FREE_ROOM, 'en', DECEMBER)).toBe(false);
  });

  it('offers the code to a free room of its pack, the Christmas switch on or off', () => {
    rememberPackCode(CODE);
    expect(canUnlockRoom(FREE_ROOM, 'en', DECEMBER)).toBe(true);
    expect(canUnlockRoom({ ...FREE_ROOM, on: false }, 'ru', DECEMBER)).toBe(true);
  });

  it('keeps away from a room already paid for', () => {
    rememberPackCode(CODE);
    expect(canUnlockRoom({ ...FREE_ROOM, paid: true }, 'en', DECEMBER)).toBe(false);
  });

  it('keeps away from a room whose language the pack lacks', () => {
    rememberPackCode(CODE);
    expect(canUnlockRoom(null, 'he', DECEMBER)).toBe(false);
    expect(canUnlockRoom(null, 'he', JULY)).toBe(false);
  });

  it('keeps away from a room with no pack while the free part runs', () => {
    // A server that offers no packs (PACK_ROOMS=off) has none to open either.
    rememberPackCode(CODE);
    expect(canUnlockRoom(null, 'en', DECEMBER)).toBe(false);
  });

  it('opens a room once the free part has ended, until the paid part ends', () => {
    rememberPackCode(CODE);
    expect(canUnlockRoom(null, 'en', JULY)).toBe(true);
    expect(canUnlockRoom(null, 'en', AUTUMN)).toBe(false);
    expect(canUnlockRoom(FREE_ROOM, 'en', AUTUMN)).toBe(false);
  });
});
