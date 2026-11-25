// SPDX-License-Identifier: AGPL-3.0-only

// Step 124 (B-29): the owner's admin page — its lists and lookup, computed
// from the receipt log, and its routes behind PACK_ADMIN_SECRET (D1 A).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { REFUND_POLICY_VERSION } from '@funny/shared';
import {
  OWNER_DELIVERED,
  adminView,
  codeRows,
  lookup,
  renderAdminPage,
  span,
  stateOf,
} from './admin.js';
import { buildServer, type BuildServerOptions, type BuiltServer } from './index.js';
import { WRONG_CODES_PER_HOUR } from './rateLimit.js';
import type { ReceiptRecord } from './receipts.js';
import { __resetRoomsForTest } from './rooms.js';

const HOUR = 60 * 60 * 1000;
const NOW = Date.parse('2026-12-10T12:00:00Z');
const ago = (ms: number): string => new Date(NOW - ms).toISOString();

function issue(
  code: string,
  at: string,
  pending = true,
  rail: 'payid' | 'owner' = 'payid',
): ReceiptRecord {
  return {
    type: 'issue',
    at,
    code,
    pack: 'chr26',
    rail,
    ref: '',
    amount: rail === 'payid' ? 'A$2.60' : '',
    delivered: 'pay page',
    policy: REFUND_POLICY_VERSION,
    state: pending ? 'pending' : 'received',
  };
}

const LOG: ReceiptRecord[] = [
  // Claimed 10 h ago: 38 h left.
  issue('XMAS26-AAAA-1111', ago(11 * HOUR)),
  { type: 'claim', at: ago(10 * HOUR), code: 'XMAS26-AAAA-1111' },
  // Claimed 50 h ago: lapsed.
  issue('XMAS26-BBBB-2222', ago(51 * HOUR)),
  { type: 'claim', at: ago(50 * HOUR), code: 'XMAS26-BBBB-2222' },
  // Claimed 40 h ago: 8 h left, so first.
  issue('XMAS26-CCCC-3333', ago(41 * HOUR)),
  { type: 'claim', at: ago(40 * HOUR), code: 'XMAS26-CCCC-3333' },
  // Never claimed, 2 days old; and one 8 days old, past the list.
  issue('XMAS26-DDDD-4444', ago(48 * HOUR)),
  issue('XMAS26-EEEE-5555', ago(8 * 24 * HOUR)),
  // Claimed and received: good, on neither list.
  issue('XMAS26-FFFF-6666', ago(30 * HOUR)),
  { type: 'claim', at: ago(29 * HOUR), code: 'XMAS26-FFFF-6666' },
  { type: 'received', at: ago(20 * HOUR), code: 'XMAS26-FFFF-6666' },
  {
    type: 'room',
    at: ago(19 * HOUR),
    code: 'XMAS26-FFFF-6666',
    how: 'create',
    room: 'QWERTY',
    lang: 'en',
    players: 4,
    country: 'AU',
    browser: 'chrome',
  },
  {
    type: 'game',
    at: ago(18 * HOUR),
    code: 'XMAS26-FFFF-6666',
    room: 'QWERTY',
    players: 4,
    rounds: 7,
    picks: 3,
    cartoons: 4,
    downloads: 1,
    shares: 0,
  },
  // Unclaimed, then blocked.
  issue('XMAS26-GGGG-7777', ago(5 * HOUR)),
  { type: 'block', at: ago(4 * HOUR), code: 'XMAS26-GGGG-7777', reason: 'asked' },
  // The owner's gift.
  issue('XMAS26-HHHH-8888', ago(2 * HOUR), false, 'owner'),
];

describe('the lists', () => {
  const rows = codeRows(LOG);
  const byCode = new Map(rows.map((r) => [r.code, r]));

  it('reads each code’s state from the log', () => {
    expect(rows.map((r) => [r.code.slice(7, 11), stateOf(r, NOW)])).toEqual([
      ['AAAA', 'claimed'],
      ['BBBB', 'lapsed'],
      ['CCCC', 'claimed'],
      ['DDDD', 'unclaimed'],
      ['EEEE', 'unclaimed'],
      ['FFFF', 'good'],
      ['GGGG', 'blocked'],
      ['HHHH', 'good'],
    ]);
    const used = byCode.get('XMAS26-FFFF-6666')!;
    expect(used).toMatchObject({ rooms: 1, roomCodes: ['QWERTY'], countries: ['AU'], games: 1 });
  });

  it('lists the claimed codes, least time left first and lapsed ones too', () => {
    expect(adminView(rows, NOW).claimed.map((r) => r.code)).toEqual([
      'XMAS26-BBBB-2222',
      'XMAS26-CCCC-3333',
      'XMAS26-AAAA-1111',
    ]);
  });

  it('lists the unclaimed PayID codes of the last 7 days (D3 A)', () => {
    expect(adminView(rows, NOW).unclaimed.map((r) => r.code)).toEqual(['XMAS26-DDDD-4444']);
  });

  it('finds a code by any part of it, a room code, or its day', () => {
    expect(lookup(rows, 'ffff').map((r) => r.code)).toEqual(['XMAS26-FFFF-6666']);
    expect(lookup(rows, 'xmas26 ffff-66').map((r) => r.code)).toEqual(['XMAS26-FFFF-6666']);
    expect(lookup(rows, 'qwerty').map((r) => r.code)).toEqual(['XMAS26-FFFF-6666']);
    expect(lookup(rows, ago(8 * 24 * HOUR).slice(0, 10)).map((r) => r.code)).toEqual([
      'XMAS26-EEEE-5555',
    ]);
    // Too short to mean anything.
    expect(lookup(rows, 'A-')).toEqual([]);
  });

  it('writes a span of time short', () => {
    expect(span(38 * HOUR)).toBe('1 d 14 h');
    expect(span(8 * HOUR + 5 * 60_000)).toBe('8 h 5 min');
    expect(span(-5)).toBe('0 min');
  });

  it('renders the page with a Received for every code to match, escaping what it shows', () => {
    const html = renderAdminPage({
      path: '/admin/k',
      gameUrl: 'https://game.example/',
      rows,
      now: NOW,
      query: '<b>',
      done: null,
      doneCode: null,
    });
    expect(html.match(/value="received"/gu)).toHaveLength(4);
    expect(html).toContain('8 h 0 min left');
    expect(html).toContain('&#60;b&#62;');
    expect(html).not.toContain('<b>"');
    expect(html).toContain('noindex');
  });
});

// ---- the routes -------------------------------------------------------------

const CODE_SECRET = 'a-test-secret-of-some-length';
const ADMIN_SECRET = 'an-admin-secret-of-length';
let built: BuiltServer | null = null;

beforeEach(() => {
  vi.stubEnv('PACK_ROOMS', 'on');
  vi.stubEnv('DEPLOYER_PAYID', 'payid-rail@example.com');
  vi.stubEnv('DEPLOYER_PAYID_NAME', 'EXAMPLE ACCOUNT NAME');
});

afterEach(async () => {
  vi.unstubAllEnvs();
  if (built) {
    await built.io.close();
    await built.fastify.close();
    built = null;
  }
  __resetRoomsForTest();
});

async function boot(options: BuildServerOptions = {}): Promise<BuiltServer> {
  built = await buildServer({
    logger: false,
    receiptsFile: null,
    packCodeSecret: CODE_SECRET,
    packAdminSecret: ADMIN_SECRET,
    ...options,
  });
  return built;
}

const page = (key = ADMIN_SECRET, query = '', ip = '192.0.2.5') =>
  built!.fastify.inject({
    method: 'GET',
    url: `/admin/${key}${query}`,
    headers: { 'x-forwarded-for': ip },
  });

const act = (form: Record<string, string>, key = ADMIN_SECRET) =>
  built!.fastify.inject({
    method: 'POST',
    url: `/admin/${key}`,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'x-forwarded-for': '192.0.2.5',
    },
    payload: new URLSearchParams(form).toString(),
  });

describe('the admin routes', () => {
  it('serves the page, uncached and unindexed, at the secret address only', async () => {
    await boot();
    const res = await page();
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['x-robots-tag']).toBe('noindex, nofollow');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
    expect(res.body).toContain('Christmas codes');
    expect((await page('not-the-admin-secret')).statusCode).toBe(404);
  });

  it('has no page without a secret of 16 characters', async () => {
    await boot({ packAdminSecret: 'short' });
    expect((await page('short')).statusCode).toBe(404);
  });

  it(`stops an address after ${WRONG_CODES_PER_HOUR} wrong keys, the right one included`, async () => {
    await boot();
    for (let i = 0; i < WRONG_CODES_PER_HOUR; i++) {
      expect((await page(`wrong-key-number-${i}`)).statusCode).toBe(404);
    }
    expect((await page()).statusCode).toBe(404);
    expect((await page(ADMIN_SECRET, '', '192.0.2.6')).statusCode).toBe(200);
  });

  it('marks a claimed code received, and refuses to twice', async () => {
    const server = await boot();
    const code = server.codes.issue({
      pack: 'chr26',
      rail: 'payid',
      ref: '',
      amount: 'A$2.60',
      delivered: 'pay page',
      policy: REFUND_POLICY_VERSION,
      pending: true,
    });
    server.codes.claim(code);
    expect((await page()).body).toContain(code);
    const res = await act({ action: 'received', code });
    expect(res.statusCode).toBe(303);
    expect(res.headers.location).toBe(`/admin/${ADMIN_SECRET}?done=received&code=${code}`);
    expect(server.receipts.records().at(-1)).toMatchObject({ type: 'received', code });
    expect((await act({ action: 'received', code })).headers.location).toBe(
      `/admin/${ADMIN_SECRET}?done=failed`,
    );
  });

  it('blocks a code for one of the four reasons only', async () => {
    const server = await boot();
    const code = server.codes.issue({
      pack: 'chr26',
      rail: 'payid',
      ref: '',
      amount: 'A$2.60',
      delivered: 'pay page',
      policy: REFUND_POLICY_VERSION,
      pending: true,
    });
    expect((await act({ action: 'block', code, reason: 'because' })).headers.location).toContain(
      'done=failed',
    );
    expect((await act({ action: 'block', code, reason: 'refund' })).headers.location).toContain(
      'done=blocked',
    );
    expect(server.codes.check(code)).toEqual({ ok: false, error: 'CODE_BLOCKED' });
  });

  it('makes a new code, logged as the owner’s with the code it replaces, and shows its link', async () => {
    const server = await boot();
    const old = server.codes.issue({
      pack: 'chr26',
      rail: 'payid',
      ref: '',
      amount: 'A$2.60',
      delivered: 'pay page',
      policy: REFUND_POLICY_VERSION,
      pending: false,
    });
    const res = await act({ action: 'new', replaces: old.toLowerCase() });
    const made = new URL(res.headers.location as string, 'http://x').searchParams.get('code')!;
    expect(made).toMatch(/^XMAS26-/u);
    expect(server.codes.check(made).ok).toBe(true);
    expect(server.receipts.records().at(-1)).toMatchObject({
      type: 'issue',
      code: made,
      rail: 'owner',
      ref: old,
      delivered: OWNER_DELIVERED,
      state: 'received',
    });
    const shown = await page(ADMIN_SECRET, `?done=new&code=${made}`);
    expect(shown.body).toContain(`?code=${made}`);
  });

  it('refuses an action with a wrong key and changes nothing', async () => {
    const server = await boot();
    expect((await act({ action: 'new' }, 'not-the-admin-secret')).statusCode).toBe(404);
    expect(server.receipts.records()).toEqual([]);
  });
});
