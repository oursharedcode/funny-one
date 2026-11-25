// SPDX-License-Identifier: AGPL-3.0-only

// Step 124 (B-29): paying by PayID — the pending code a buyer is given, the
// "I've paid" that makes it work for 48 hours, and the limits (D4 A).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PACKS, REFUND_POLICY_VERSION } from '@funny/shared';
import { buildServer, type BuildServerOptions, type BuiltServer } from './index.js';
import { PAYID_DELIVERED } from './payid.js';
import { PAYID_CODES_PER_HOUR, WRONG_CODES_PER_HOUR } from './rateLimit.js';
import { __resetRoomsForTest } from './rooms.js';

const SECRET = 'a-test-secret-of-some-length';
const PAYID = 'payid-rail@example.com';
const PAYID_NAME = 'EXAMPLE ACCOUNT NAME';

let built: BuiltServer | null = null;

beforeEach(() => {
  vi.stubEnv('PACK_ROOMS', 'on');
  vi.stubEnv('DEPLOYER_PAYID', PAYID);
  vi.stubEnv('DEPLOYER_PAYID_NAME', PAYID_NAME);
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
    packCodeSecret: SECRET,
    ...options,
  });
  return built;
}

async function post(path: string, payload: unknown, ip = '203.0.113.9') {
  const res = await built!.fastify.inject({
    method: 'POST',
    url: path,
    headers: { 'x-forwarded-for': ip },
    payload: payload as Record<string, unknown>,
  });
  expect(res.headers['cache-control']).toBe('no-store');
  return { status: res.statusCode, body: res.json<Record<string, unknown>>() };
}

describe('POST /pay/payid', () => {
  it('gives a pending code with the transfer to make, and logs its issue', async () => {
    const server = await boot();
    const res = await post('/pay/payid', { pack: 'chr26', policy: REFUND_POLICY_VERSION });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      code: expect.stringMatching(/^XMAS26-[0-9A-Z]{4}-[0-9A-Z]{4}$/u),
      payId: PAYID,
      payIdName: PAYID_NAME,
      amount: PACKS.chr26.prices.payid,
    });
    const code = res.body.code as string;
    // Pending: it does not work until claimed or received.
    expect(server.codes.check(code)).toEqual({ ok: false, error: 'CODE_PENDING' });
    expect(server.receipts.records()).toEqual([
      expect.objectContaining({
        type: 'issue',
        code,
        pack: 'chr26',
        rail: 'payid',
        ref: '',
        amount: PACKS.chr26.prices.payid,
        delivered: PAYID_DELIVERED,
        policy: REFUND_POLICY_VERSION,
        state: 'pending',
      }),
    ]);
  });

  it('logs the refund policy the page showed, and the current one for anything else', async () => {
    const server = await boot();
    await post('/pay/payid', { pack: 'chr26', policy: '2026-01-02' });
    await post('/pay/payid', { pack: 'chr26', policy: '<script>' });
    expect(server.receipts.records().map((r) => (r.type === 'issue' ? r.policy : null))).toEqual([
      '2026-01-02',
      REFUND_POLICY_VERSION,
    ]);
  });

  it('sells nothing without a code secret, a PayID, or the pack asked for', async () => {
    await boot({ packCodeSecret: null });
    expect(await post('/pay/payid', { pack: 'chr26' })).toEqual({
      status: 409,
      body: { ok: false, error: 'NOT_ON_SALE' },
    });
    await built!.io.close();
    await built!.fastify.close();

    await boot();
    expect((await post('/pay/payid', { pack: 'other' })).body.error).toBe('NOT_ON_SALE');
    const text = await built!.fastify.inject({
      method: 'POST',
      url: '/pay/payid',
      headers: { 'content-type': 'text/plain' },
      payload: 'chr26',
    });
    expect(text.json()).toEqual({ ok: false, error: 'NOT_ON_SALE' });
    // A form post is the admin page's alone.
    const form = await built!.fastify.inject({
      method: 'POST',
      url: '/pay/payid',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      payload: 'pack=chr26',
    });
    expect(form.statusCode).toBe(415);
    await built!.io.close();
    await built!.fastify.close();

    vi.stubEnv('DEPLOYER_PAYID', '');
    await boot();
    expect((await post('/pay/payid', { pack: 'chr26' })).body.error).toBe('NOT_ON_SALE');
    expect(built!.receipts.records()).toEqual([]);
  });

  it('sells nothing with the Christmas rooms off', async () => {
    vi.stubEnv('PACK_ROOMS', 'off');
    await boot();
    expect((await post('/pay/payid', { pack: 'chr26' })).body.error).toBe('NOT_ON_SALE');
  });

  it(`gives an address ${PAYID_CODES_PER_HOUR} codes an hour (D4 A)`, async () => {
    await boot();
    for (let i = 0; i < PAYID_CODES_PER_HOUR; i++) {
      expect((await post('/pay/payid', { pack: 'chr26' })).status).toBe(200);
    }
    expect(await post('/pay/payid', { pack: 'chr26' })).toEqual({
      status: 429,
      body: { ok: false, error: 'RATE_LIMITED' },
    });
    // Another address is not held up.
    expect((await post('/pay/payid', { pack: 'chr26' }, '198.51.100.7')).status).toBe(200);
  });
});

describe('POST /pay/claim', () => {
  it('makes a pending code work at once, and logs the claim once', async () => {
    const server = await boot();
    const code = (await post('/pay/payid', { pack: 'chr26' })).body.code as string;
    expect(await post('/pay/claim', { code })).toEqual({ status: 200, body: { ok: true } });
    expect(server.codes.check(code)).toEqual({ ok: true, pack: 'chr26', code });
    // A second press changes nothing.
    expect(await post('/pay/claim', { code: code.toLowerCase() })).toEqual({
      status: 200,
      body: { ok: true },
    });
    expect(server.receipts.records().filter((r) => r.type === 'claim')).toHaveLength(1);
  });

  it('answers ok for a code the owner matched before the buyer pressed', async () => {
    const server = await boot();
    const code = (await post('/pay/payid', { pack: 'chr26' })).body.code as string;
    expect(server.codes.receive(code)).toBe(true);
    expect((await post('/pay/claim', { code })).body).toEqual({ ok: true });
    expect(server.receipts.records().filter((r) => r.type === 'claim')).toHaveLength(0);
  });

  it('refuses a blocked code with its verdict', async () => {
    const server = await boot();
    const code = (await post('/pay/payid', { pack: 'chr26' })).body.code as string;
    server.codes.block(code, 'reversed');
    expect(await post('/pay/claim', { code })).toEqual({
      status: 409,
      body: { ok: false, error: 'CODE_BLOCKED' },
    });
  });

  it(`stops an address after ${WRONG_CODES_PER_HOUR} claims on what is not a code`, async () => {
    await boot();
    for (let i = 0; i < WRONG_CODES_PER_HOUR; i++) {
      expect((await post('/pay/claim', { code: 'XMAS26-AAAA-AAAA' })).body.error).toBe(
        'CODE_INVALID',
      );
    }
    expect((await post('/pay/claim', { code: 'XMAS26-AAAA-AAAA' })).body.error).toBe(
      'RATE_LIMITED',
    );
    // A real code from another address still goes through.
    const code = (await post('/pay/payid', { pack: 'chr26' }, '198.51.100.7')).body.code;
    expect((await post('/pay/claim', { code }, '198.51.100.7')).body).toEqual({ ok: true });
  });
});
