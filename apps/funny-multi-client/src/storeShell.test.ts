// SPDX-License-Identifier: AGPL-3.0-only

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setUrl } from './testutils/socketMock';
import { isStoreShell } from './storeShell';

function setReferrer(referrer: string): void {
  Object.defineProperty(document, 'referrer', { configurable: true, get: () => referrer });
}

describe('isStoreShell (B-1c)', () => {
  beforeEach(() => {
    setUrl('');
    setReferrer('');
    sessionStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    // Drop the own-property override so jsdom's own getter shows through again.
    delete (document as { referrer?: string }).referrer;
  });

  it('is false on a plain web visit, invitation link included', () => {
    expect(isStoreShell()).toBe(false);
    setUrl('?room=ABCD&lang=en');
    expect(isStoreShell()).toBe(false);
  });

  it('is true on the launch URL, and stays true once the query is gone', () => {
    setUrl('?shell=android');
    expect(isStoreShell()).toBe(true);
    // "New room" and "start over" both leave the bare home URL behind.
    setUrl('');
    expect(isStoreShell()).toBe(true);
  });

  it('is true for an invitation the app opened, and stays true', () => {
    setUrl('?room=ABCD&lang=en');
    setReferrer('android-app://com.oursharedcode.funny37/');
    expect(isStoreShell()).toBe(true);
    setUrl('');
    setReferrer('http://localhost:3000/');
    expect(isStoreShell()).toBe(true);
  });

  it('accepts the referrer with or without a trailing slash', () => {
    setReferrer('android-app://com.oursharedcode.funny37');
    expect(isStoreShell()).toBe(true);
  });

  it('ignores other shell values and other apps', () => {
    setUrl('?shell=ios');
    expect(isStoreShell()).toBe(false);
    setUrl('?shell=');
    expect(isStoreShell()).toBe(false);
    setUrl('');
    // The Google app hands links to Chrome with its own android-app:// referrer.
    setReferrer('android-app://com.google.android.googlequicksearchbox/');
    expect(isStoreShell()).toBe(false);
    // A package that merely starts with ours is not ours.
    setReferrer('android-app://com.oursharedcode.funny37x/');
    expect(isStoreShell()).toBe(false);
    expect(sessionStorage.length).toBe(0);
  });

  it('still reads the launch URL when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    setUrl('?shell=android');
    expect(isStoreShell()).toBe(true);
    setUrl('');
    expect(isStoreShell()).toBe(false);
  });
});
