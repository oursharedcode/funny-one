// SPDX-License-Identifier: AGPL-3.0-only

// Step 123 (B-29): the pay link's parameter, and the payment seam. Step 124:
// PayID — the waiting code the phone keeps, and "I've paid". Step 125:
// Sponsors — the GitHub name, the checkout kept, and the question whether
// its code works yet.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setUrl } from './testutils/socketMock';
import {
  __resetPayForTest,
  checkPayStatus,
  claimPayId,
  clearPayLink,
  forgetPendingPayId,
  forgetPendingSponsors,
  giftLink,
  keepGift,
  payLinkPack,
  readGifts,
  readPendingPayId,
  readPendingSponsors,
  startPayment,
} from './pay';

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  __resetPayForTest();
  setUrl('');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const TRANSFER = {
  code: 'XMAS26-K7QM-3FPA',
  payId: 'payid-rail@example.com',
  payIdName: 'EXAMPLE ACCOUNT NAME',
  amount: 'A$2.60',
};

/** A fetch that answers each call with the next body, and records the calls. */
function stubFetch(...answers: unknown[]): ReturnType<typeof vi.fn> {
  const fetch = vi.fn(async () => ({ json: async () => answers.shift() }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

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
  const request = { pack: 'chr26', policy: '2026-11-24' } as const;

  it('asks the server for a PayID code, and keeps it on the phone', async () => {
    const fetch = stubFetch({ ok: true, ...TRANSFER });
    const started = await startPayment({ ...request, rail: 'payid' });
    expect(started).toEqual({ ok: true, transfer: { pack: 'chr26', ...TRANSFER } });
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/pay/payid',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ pack: 'chr26', policy: '2026-11-24' }),
      }),
    );
    expect(readPendingPayId('chr26')).toEqual({ pack: 'chr26', ...TRANSFER });
  });

  it('shows the kept code again and never asks for another (D4 A)', async () => {
    stubFetch({ ok: true, ...TRANSFER });
    await startPayment({ ...request, rail: 'payid' });
    __resetPayForTest();
    const fetch = stubFetch({ ok: true, ...TRANSFER, code: 'XMAS26-AAAA-BBBB' });
    expect((await startPayment({ ...request, rail: 'payid' })).transfer?.code).toBe(TRANSFER.code);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('is not started when the server refuses, answers nonsense, or cannot be reached', async () => {
    stubFetch({ ok: false, error: 'RATE_LIMITED' }, { ok: true, code: 'nope' });
    expect(await startPayment({ ...request, rail: 'payid' })).toEqual({ ok: false });
    expect(await startPayment({ ...request, rail: 'payid' })).toEqual({ ok: false });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('offline'))),
    );
    expect(await startPayment({ ...request, rail: 'payid' })).toEqual({ ok: false });
    expect(readPendingPayId('chr26')).toBeNull();
  });

  it('is never started inside the Android store app', async () => {
    setUrl('?shell=android');
    const fetch = stubFetch({ ok: true, ...TRANSFER });
    expect(await startPayment({ ...request, rail: 'payid' })).toEqual({ ok: false });
    expect(fetch).not.toHaveBeenCalled();
  });
});

const CHECKOUT = {
  code: 'XMAS26-K7QM-3FPA',
  url: 'https://github.com/sponsors/example/sponsorships?tier_id=1&metadata_code=XMAS26-K7QM-3FPA',
  amount: 'US$2',
  login: 'mona-lisa',
};

describe('starting a Sponsors payment', () => {
  const request = { pack: 'chr26', policy: '2026-11-24', rail: 'sponsors' } as const;

  it('asks the server for a code waiting for the GitHub name, and keeps it', async () => {
    const fetch = stubFetch({ ok: true, ...CHECKOUT });
    const started = await startPayment({ ...request, login: ' @Mona-Lisa ' });
    expect(started).toEqual({ ok: true, checkout: { pack: 'chr26', ...CHECKOUT } });
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/pay/sponsors',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ pack: 'chr26', policy: '2026-11-24', login: 'mona-lisa' }),
      }),
    );
    expect(readPendingSponsors('chr26')).toEqual({ pack: 'chr26', ...CHECKOUT });
  });

  it('keeps the same code for the same name, and asks again for another', async () => {
    stubFetch({ ok: true, ...CHECKOUT });
    await startPayment({ ...request, login: 'mona-lisa' });
    __resetPayForTest();
    let fetch = stubFetch();
    expect((await startPayment({ ...request, login: 'MONA-LISA' })).checkout?.code).toBe(
      CHECKOUT.code,
    );
    expect(fetch).not.toHaveBeenCalled();
    fetch = stubFetch({ ok: true, ...CHECKOUT, code: 'XMAS26-AAAA-BBBB', login: 'jo' });
    expect((await startPayment({ ...request, login: 'jo' })).checkout?.code).toBe(
      'XMAS26-AAAA-BBBB',
    );
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('refuses a name GitHub could not have without asking the server', async () => {
    const fetch = stubFetch();
    for (const login of ['', 'mo_na', 'мона', undefined]) {
      expect(await startPayment({ ...request, login })).toEqual({
        ok: false,
        error: 'LOGIN_INVALID',
      });
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it("passes on the server's refusal, and keeps nothing that is not a GitHub checkout", async () => {
    stubFetch(
      { ok: false, error: 'RATE_LIMITED' },
      { ok: true, ...CHECKOUT, url: 'https://evil.example/' },
    );
    expect(await startPayment({ ...request, login: 'mona' })).toEqual({
      ok: false,
      error: 'RATE_LIMITED',
    });
    expect(await startPayment({ ...request, login: 'mona' })).toEqual({ ok: false });
    expect(readPendingSponsors('chr26')).toBeNull();
  });

  it('forgets the waiting code on request', async () => {
    stubFetch({ ok: true, ...CHECKOUT });
    await startPayment({ ...request, login: 'mona-lisa' });
    forgetPendingSponsors();
    expect(readPendingSponsors('chr26')).toBeNull();
    expect(localStorage.getItem('funny37.pendingSponsors')).toBeNull();
  });
});

describe('whether a Sponsors code works yet', () => {
  it("passes on the server's verdict, and a lost connection as NETWORK", async () => {
    const fetch = stubFetch({ ok: false, error: 'CODE_PENDING' }, { ok: true });
    expect(await checkPayStatus(CHECKOUT.code)).toEqual({ ok: false, error: 'CODE_PENDING' });
    expect(await checkPayStatus(CHECKOUT.code)).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/pay/status',
      expect.objectContaining({ body: JSON.stringify({ code: CHECKOUT.code }) }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('offline'))),
    );
    expect(await checkPayStatus(CHECKOUT.code)).toEqual({ ok: false, error: 'NETWORK' });
  });
});

describe('the waiting PayID code', () => {
  it('is forgotten on request, and read only for its own pack while its codes work', async () => {
    stubFetch({ ok: true, ...TRANSFER });
    await startPayment({ pack: 'chr26', policy: '2026-11-24', rail: 'payid' });
    expect(readPendingPayId('chr26', false, Date.parse('2027-08-03T00:00:00Z'))).toBeNull();
    forgetPendingPayId();
    expect(readPendingPayId('chr26')).toBeNull();
    expect(localStorage.getItem('funny37.pendingPayId')).toBeNull();
  });

  it('does not read what is not a transfer', () => {
    localStorage.setItem('funny37.pendingPayId', '{"pack":"chr26","code":"XMAS26-K7QM-3FPA"}');
    expect(readPendingPayId('chr26')).toBeNull();
    localStorage.setItem('funny37.pendingPayId', 'not json');
    expect(readPendingPayId('chr26')).toBeNull();
  });
});

describe("I've paid", () => {
  it('passes on the server’s verdict, and a lost connection as NETWORK', async () => {
    const fetch = stubFetch({ ok: true }, { ok: false, error: 'CODE_BLOCKED' });
    expect(await claimPayId(TRANSFER.code)).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/pay/claim',
      expect.objectContaining({ body: JSON.stringify({ code: TRANSFER.code }) }),
    );
    expect(await claimPayId(TRANSFER.code)).toEqual({ ok: false, error: 'CODE_BLOCKED' });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('offline'))),
    );
    expect(await claimPayId(TRANSFER.code)).toEqual({ ok: false, error: 'NETWORK' });
  });
});

describe('a pack bought as a gift (Step 134)', () => {
  const request = { pack: 'chr26', policy: '2026-11-24', rail: 'payid' } as const;
  const OTHER = { ...TRANSFER, code: 'XMAS26-AAAA-BBBB' };

  it('is a code of its own, asked for as a gift and kept apart from the buyer’s', async () => {
    stubFetch({ ok: true, ...TRANSFER });
    await startPayment(request);
    const fetch = stubFetch({ ok: true, ...OTHER });
    const started = await startPayment({ ...request, gift: true });
    expect(started.transfer?.code).toBe(OTHER.code);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/pay/payid',
      expect.objectContaining({
        body: JSON.stringify({ pack: 'chr26', policy: '2026-11-24', gift: true }),
      }),
    );
    expect(readPendingPayId('chr26')?.code).toBe(TRANSFER.code);
    expect(readPendingPayId('chr26', true)?.code).toBe(OTHER.code);
    forgetPendingPayId(true);
    expect(readPendingPayId('chr26', true)).toBeNull();
    expect(readPendingPayId('chr26')?.code).toBe(TRANSFER.code);
  });

  it('lists the gifts bought, oldest first, each once, and none in the app', () => {
    keepGift('chr26', TRANSFER.code);
    keepGift('chr26', OTHER.code);
    keepGift('chr26', TRANSFER.code);
    __resetPayForTest();
    expect(readGifts('chr26')).toEqual([OTHER.code, TRANSFER.code]);
    expect(readGifts('chr26', Date.parse('2027-08-03T00:00:00Z'))).toEqual([]);
    setUrl('?shell=android');
    expect(readGifts('chr26')).toEqual([]);
  });

  it('does not read what is not a list of codes', () => {
    localStorage.setItem('funny37.gifts', '{"code":1}');
    expect(readGifts('chr26')).toEqual([]);
    localStorage.setItem('funny37.gifts', '["nope", 3, "XMAS26-K7QM-3FPA"]');
    expect(readGifts('chr26')).toEqual([TRANSFER.code]);
  });

  it('links to the game with the code, marked as a gift', () => {
    expect(giftLink(TRANSFER.code)).toMatch(/^https?:\/\/.+\?code=XMAS26-K7QM-3FPA&gift=1$/);
  });
});
