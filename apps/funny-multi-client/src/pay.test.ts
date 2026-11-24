// SPDX-License-Identifier: AGPL-3.0-only

// Step 123 (B-29): the pay link's parameter, and the payment seam before any
// rail is wired.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setUrl } from './testutils/socketMock';
import { clearPayLink, payLinkPack, startPayment } from './pay';

beforeEach(() => {
  sessionStorage.clear();
  setUrl('');
});

describe('the pay link', () => {
  it("names the Christmas 2026 edition by the landing site's short name", () => {
    setUrl('?pay=x26&lang=de');
    expect(payLinkPack()).toBe('chr26');
  });

  it('is nothing without the parameter, or with a name no pack has', () => {
    expect(payLinkPack()).toBeNull();
    setUrl('?pay=');
    expect(payLinkPack()).toBeNull();
    setUrl('?pay=chr26');
    expect(payLinkPack()).toBeNull();
    setUrl('?pay=constructor');
    expect(payLinkPack()).toBeNull();
  });

  it('is never read inside the Android store app', () => {
    setUrl('?pay=x26&shell=android');
    expect(payLinkPack()).toBeNull();
    // The app's flag outlives the address that set it.
    setUrl('?pay=x26');
    expect(payLinkPack()).toBeNull();
  });

  it('comes off the address bar when the page is closed, and nothing else does', () => {
    setUrl('?pay=x26&lang=de#top');
    clearPayLink();
    expect(window.location.search).toBe('?lang=de');
    expect(window.location.hash).toBe('#top');
  });

  it('leaves an address without it untouched', () => {
    setUrl('?room=ABCDEF');
    const replace = vi.spyOn(window.history, 'replaceState');
    clearPayLink();
    expect(replace).not.toHaveBeenCalled();
    replace.mockRestore();
  });
});

describe('starting a payment', () => {
  it('cannot be started on either rail yet: Steps 124 and 125 wire them', async () => {
    const request = { pack: 'chr26', policy: '2026-11-24' } as const;
    expect(await startPayment({ ...request, rail: 'payid' })).toEqual({ ok: false });
    expect(await startPayment({ ...request, rail: 'sponsors' })).toEqual({ ok: false });
  });
});
