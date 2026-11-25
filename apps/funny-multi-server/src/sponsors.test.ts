// SPDX-License-Identifier: AGPL-3.0-only

// Step 125 (B-29): paying through GitHub Sponsors — the waiting code a buyer
// is given for their GitHub name (D1 A), the webhook that switches it on, and
// nothing else that does (D2 A).

import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PACKS, REFUND_POLICY_VERSION } from '@funny/shared';
import { buildServer, type BuildServerOptions, type BuiltServer } from './index.js';
import { SPONSORS_CODES_PER_HOUR } from './rateLimit.js';
import { __resetRoomsForTest } from './rooms.js';
import {
  SPONSORS_DELIVERED,
  checkoutUrl,
  readSponsorship,
  signatureOk,
  sponsorsRail,
  usd,
  waitingSponsorsCodes,
} from './sponsors.js';

const SECRET = 'a-test-secret-of-some-length';
const HOOK_SECRET = 'a-webhook-secret';
const ACCOUNT = 'Example-Maker';
const TIER = '424242';
const SETTINGS = {
  sponsorsUrl: `https://github.com/sponsors/${ACCOUNT}`,
  tierId: TIER,
  webhookSecret: HOOK_SECRET,
};

let built: BuiltServer | null = null;

beforeEach(() => {
  vi.stubEnv('PACK_ROOMS', 'on');
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
    sponsors: SETTINGS,
    ...options,
  });
  return built;
}

async function stop(): Promise<void> {
  await built!.io.close();
  await built!.fastify.close();
  built = null;
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

async function codeFor(login: string, ip?: string): Promise<string> {
  const res = await post(
    '/pay/sponsors',
    { pack: 'chr26', policy: REFUND_POLICY_VERSION, login },
    ip,
  );
  expect(res.status).toBe(200);
  return res.body.code as string;
}

let nextId = 1;
function sponsorship(
  login: string,
  options: {
    cents?: number;
    oneTime?: boolean;
    account?: string;
    action?: string;
    id?: string;
    metadata?: Record<string, unknown>;
  } = {},
) {
  return {
    action: options.action ?? 'created',
    sponsorship: {
      node_id: options.id ?? `S_kwDO${nextId++}`,
      created_at: '2026-12-01T10:00:00Z',
      sponsorable: { login: options.account ?? ACCOUNT },
      sponsor: { login },
      privacy_level: 'private',
      tier: {
        node_id: 'ST_x',
        name: '$2 one time',
        monthly_price_in_cents: options.cents ?? 200,
        is_one_time: options.oneTime ?? true,
        is_custom_amount: false,
      },
      ...(options.metadata ? { metadata: options.metadata } : {}),
    },
    sender: { login },
  };
}

async function hook(
  payload: unknown,
  { event = 'sponsorship', secret = HOOK_SECRET, signature }: Record<string, string> = {},
) {
  const body = JSON.stringify(payload);
  const sign = signature ?? `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
  const res = await built!.fastify.inject({
    method: 'POST',
    url: '/pay/sponsors/hook',
    headers: {
      'content-type': 'application/json',
      'x-github-event': event,
      'x-hub-signature-256': sign,
    },
    payload: body,
  });
  return res.statusCode;
}

describe('the rail', () => {
  it('needs the Sponsors page, a tier id and the webhook secret', () => {
    expect(sponsorsRail(SETTINGS)).toEqual({
      account: 'example-maker',
      tierId: TIER,
      webhookSecret: HOOK_SECRET,
    });
    expect(sponsorsRail({ ...SETTINGS, sponsorsUrl: `${SETTINGS.sponsorsUrl}/` })).not.toBeNull();
    expect(sponsorsRail({ ...SETTINGS, sponsorsUrl: null })).toBeNull();
    expect(sponsorsRail({ ...SETTINGS, sponsorsUrl: 'https://example.com/sponsors/x' })).toBeNull();
    expect(sponsorsRail({ ...SETTINGS, tierId: '' })).toBeNull();
    expect(sponsorsRail({ ...SETTINGS, tierId: 'abc' })).toBeNull();
    expect(sponsorsRail({ ...SETTINGS, webhookSecret: '' })).toBeNull();
  });

  it("links to the tier's checkout, the code in its metadata", () => {
    const rail = sponsorsRail(SETTINGS)!;
    expect(checkoutUrl(rail, 'XMAS26-ABCD-EFGH')).toBe(
      `https://github.com/sponsors/example-maker/sponsorships?tier_id=${TIER}&metadata_code=XMAS26-ABCD-EFGH`,
    );
  });

  it("checks GitHub's signature over the body as sent", () => {
    const body = Buffer.from('{"a":1}');
    const good = `sha256=${createHmac('sha256', HOOK_SECRET).update(body).digest('hex')}`;
    expect(signatureOk(HOOK_SECRET, body, good)).toBe(true);
    expect(signatureOk('another', body, good)).toBe(false);
    expect(signatureOk(HOOK_SECRET, Buffer.from('{"a":2}'), good)).toBe(false);
    expect(signatureOk(HOOK_SECRET, body, good.replace('sha256=', 'sha1='))).toBe(false);
    expect(signatureOk(HOOK_SECRET, body, 'sha256=abc')).toBe(false);
    expect(signatureOk(HOOK_SECRET, body, undefined)).toBe(false);
  });

  it('writes amounts as the receipt log does', () => {
    expect(usd(200)).toBe('US$2');
    expect(usd(250)).toBe('US$2.50');
  });

  it('reads a created sponsorship, and nothing else', () => {
    expect(readSponsorship(sponsorship('Mona', { id: 'S_1' }))).toEqual({
      ref: 'S_1',
      login: 'mona',
      account: 'example-maker',
      cents: 200,
      oneTime: true,
      metadataCode: null,
    });
    expect(
      readSponsorship(sponsorship('mona', { metadata: { code: 'xmas26-abcd-efgh' } }))
        ?.metadataCode,
    ).toBe('XMAS26-ABCD-EFGH');
    expect(readSponsorship(sponsorship('mona', { action: 'cancelled' }))).toBeNull();
    expect(readSponsorship({ action: 'created' })).toBeNull();
    expect(readSponsorship(null)).toBeNull();
    expect(readSponsorship([])).toBeNull();
  });
});

describe('POST /pay/sponsors', () => {
  it("gives a waiting code for the buyer's GitHub name, with the checkout", async () => {
    const server = await boot();
    const res = await post('/pay/sponsors', {
      pack: 'chr26',
      policy: REFUND_POLICY_VERSION,
      login: ' @Mona-Lisa ',
    });
    expect(res.status).toBe(200);
    const code = res.body.code as string;
    expect(res.body).toEqual({
      ok: true,
      code: expect.stringMatching(/^XMAS26-[0-9A-Z]{4}-[0-9A-Z]{4}$/u),
      url: checkoutUrl(sponsorsRail(SETTINGS)!, code),
      amount: PACKS.chr26.prices.sponsors,
      login: 'mona-lisa',
    });
    expect(server.codes.check(code)).toEqual({ ok: false, error: 'CODE_PENDING' });
    expect(server.receipts.records()).toEqual([
      expect.objectContaining({
        type: 'issue',
        code,
        pack: 'chr26',
        rail: 'sponsors',
        ref: '',
        amount: PACKS.chr26.prices.sponsors,
        delivered: SPONSORS_DELIVERED,
        policy: REFUND_POLICY_VERSION,
        state: 'pending',
        login: 'mona-lisa',
      }),
    ]);
  });

  it("can never be claimed: only GitHub's word or the owner's switches it on (D2 A)", async () => {
    const server = await boot();
    const code = await codeFor('mona');
    expect(await post('/pay/claim', { code })).toEqual({
      status: 409,
      body: { ok: false, error: 'CODE_PENDING' },
    });
    expect(server.codes.check(code)).toEqual({ ok: false, error: 'CODE_PENDING' });
    expect(server.receipts.records().filter((r) => r.type === 'claim')).toHaveLength(0);
  });

  it('refuses a name GitHub could not have', async () => {
    const server = await boot();
    for (const login of ['', 'mo_na', '-mona', 'мона', 'a'.repeat(40), 42, null]) {
      expect(await post('/pay/sponsors', { pack: 'chr26', login })).toEqual({
        status: 400,
        body: { ok: false, error: 'LOGIN_INVALID' },
      });
    }
    expect(server.receipts.records()).toEqual([]);
  });

  it('sells nothing without the rail, a code secret, the Christmas rooms or the pack asked for', async () => {
    await boot({ sponsors: { tierId: null } });
    expect(await post('/pay/sponsors', { pack: 'chr26', login: 'mona' })).toEqual({
      status: 409,
      body: { ok: false, error: 'NOT_ON_SALE' },
    });
    // And there is no webhook to call.
    expect(await hook(sponsorship('mona'))).toBe(404);
    await stop();

    await boot({ packCodeSecret: null });
    expect((await post('/pay/sponsors', { pack: 'chr26', login: 'mona' })).body.error).toBe(
      'NOT_ON_SALE',
    );
    await stop();

    await boot();
    expect((await post('/pay/sponsors', { pack: 'other', login: 'mona' })).body.error).toBe(
      'NOT_ON_SALE',
    );
    await stop();

    vi.stubEnv('PACK_ROOMS', 'off');
    await boot();
    expect((await post('/pay/sponsors', { pack: 'chr26', login: 'mona' })).body.error).toBe(
      'NOT_ON_SALE',
    );
    expect(built!.receipts.records()).toEqual([]);
  });

  it(`gives an address ${SPONSORS_CODES_PER_HOUR} codes an hour`, async () => {
    await boot();
    for (let i = 0; i < SPONSORS_CODES_PER_HOUR; i++) await codeFor('mona');
    expect(await post('/pay/sponsors', { pack: 'chr26', login: 'mona' })).toEqual({
      status: 429,
      body: { ok: false, error: 'RATE_LIMITED' },
    });
    await codeFor('mona', '198.51.100.7');
  });
});

describe('POST /pay/sponsors/hook', () => {
  it("switches on the newest code waiting for the sponsor's name, once", async () => {
    const server = await boot();
    const older = await codeFor('mona');
    const newer = await codeFor('Mona');
    const other = await codeFor('octocat');
    const payload = sponsorship('MONA', { id: 'S_one' });
    expect(await hook(payload)).toBe(204);
    expect(server.codes.check(newer)).toEqual({ ok: true, pack: 'chr26', code: newer });
    expect(server.codes.check(older).ok).toBe(false);
    expect(server.codes.check(other).ok).toBe(false);
    expect(await post('/pay/status', { code: newer })).toEqual({
      status: 200,
      body: { ok: true },
    });
    // GitHub delivers again when unsure: the second changes nothing.
    expect(await hook(payload)).toBe(204);
    expect(server.codes.check(older).ok).toBe(false);
    const sponsorships = server.receipts.records().filter((r) => r.type === 'sponsorship');
    expect(sponsorships).toEqual([
      expect.objectContaining({
        code: newer,
        ref: 'S_one',
        login: 'mona',
        amount: 'US$2',
        outcome: 'matched',
      }),
    ]);
    // A second sponsorship of the same name takes the older code.
    expect(await hook(sponsorship('mona'))).toBe(204);
    expect(server.codes.check(older).ok).toBe(true);
  });

  it("takes the code in the sponsorship's metadata first, if GitHub sends it", async () => {
    const server = await boot();
    const first = await codeFor('mona');
    await codeFor('mona');
    expect(await hook(sponsorship('someone-else', { metadata: { code: first } }))).toBe(204);
    expect(server.codes.check(first).ok).toBe(true);
  });

  it('logs a sponsorship with no code waiting, for the admin page', async () => {
    const server = await boot();
    expect(await hook(sponsorship('nobody', { id: 'S_lost', cents: 500 }))).toBe(204);
    expect(server.receipts.records()).toEqual([
      expect.objectContaining({
        type: 'sponsorship',
        code: '',
        ref: 'S_lost',
        login: 'nobody',
        amount: 'US$5',
        outcome: 'no code',
      }),
    ]);
  });

  it('ignores a monthly sponsorship, a smaller one, and one of another account', async () => {
    const server = await boot();
    const code = await codeFor('mona');
    expect(await hook(sponsorship('mona', { oneTime: false }))).toBe(204);
    expect(await hook(sponsorship('mona', { cents: 100 }))).toBe(204);
    expect(await hook(sponsorship('mona', { account: 'someone' }))).toBe(204);
    expect(await hook(sponsorship('mona', { action: 'tier_changed' }))).toBe(204);
    expect(server.codes.check(code).ok).toBe(false);
    expect(server.receipts.records().filter((r) => r.type === 'sponsorship')).toEqual([]);
  });

  it('refuses a body without the right signature, and answers any other event', async () => {
    const server = await boot();
    const code = await codeFor('mona');
    expect(await hook(sponsorship('mona'), { secret: 'wrong' })).toBe(401);
    expect(await hook(sponsorship('mona'), { signature: '' })).toBe(401);
    expect(await hook({ zen: 'Keep it logically awesome.' }, { event: 'ping' })).toBe(204);
    expect(server.codes.check(code).ok).toBe(false);
    const torn = await built!.fastify.inject({
      method: 'POST',
      url: '/pay/sponsors/hook',
      headers: {
        'content-type': 'application/json',
        'x-github-event': 'sponsorship',
        'x-hub-signature-256': `sha256=${createHmac('sha256', HOOK_SECRET).update('{').digest('hex')}`,
      },
      payload: '{',
    });
    expect(torn.statusCode).toBe(400);
  });

  it('leaves the rest of the server reading JSON as before', async () => {
    await boot();
    expect((await post('/pay/sponsors', { pack: 'chr26', login: 'mona' })).status).toBe(200);
  });
});

describe('POST /pay/status', () => {
  it('tells a waiting code from a working one, and changes nothing', async () => {
    const server = await boot();
    const code = await codeFor('mona');
    expect(await post('/pay/status', { code })).toEqual({
      status: 200,
      body: { ok: false, error: 'CODE_PENDING' },
    });
    expect(server.codes.receive(code)).toBe(true);
    expect(await post('/pay/status', { code: code.toLowerCase() })).toEqual({
      status: 200,
      body: { ok: true },
    });
    server.codes.block(code, 'refund');
    expect((await post('/pay/status', { code })).body.error).toBe('CODE_BLOCKED');
  });

  it('stops an address that asks about what is not a code', async () => {
    await boot();
    for (let i = 0; i < 10; i++) {
      expect((await post('/pay/status', { code: 'XMAS26-AAAA-AAAA' })).body.error).toBe(
        'CODE_INVALID',
      );
    }
    expect((await post('/pay/status', { code: 'XMAS26-AAAA-AAAA' })).body.error).toBe(
      'RATE_LIMITED',
    );
    // Asking about a waiting code costs nothing.
    const code = await codeFor('mona', '198.51.100.7');
    for (let i = 0; i < 20; i++) {
      expect((await post('/pay/status', { code }, '198.51.100.7')).body.error).toBe('CODE_PENDING');
    }
  });
});

describe('the waiting codes', () => {
  it('are pending Sponsors codes with a name and nothing after them', () => {
    const at = '2026-12-01T00:00:00.000Z';
    const issue = (code: string, login?: string) => ({
      type: 'issue' as const,
      at,
      code,
      pack: 'chr26' as const,
      rail: 'sponsors' as const,
      ref: '',
      amount: 'US$2',
      delivered: SPONSORS_DELIVERED,
      policy: REFUND_POLICY_VERSION,
      state: 'pending' as const,
      ...(login ? { login } : {}),
    });
    expect(
      waitingSponsorsCodes([
        issue('A', 'mona'),
        issue('B', 'mona'),
        issue('C'),
        issue('D', 'jo'),
        { type: 'received', at, code: 'B' },
        { type: 'block', at, code: 'D', reason: 'asked' },
      ]).map((w) => w.code),
    ).toEqual(['A']);
  });

  it('are newest first, the later in the log first when issued in the same millisecond', () => {
    const issue = (code: string, at: string) => ({
      type: 'issue' as const,
      at,
      code,
      pack: 'chr26' as const,
      rail: 'sponsors' as const,
      ref: '',
      amount: 'US$2',
      delivered: SPONSORS_DELIVERED,
      policy: REFUND_POLICY_VERSION,
      state: 'pending' as const,
      login: 'mona',
    });
    expect(
      waitingSponsorsCodes([
        issue('A', '2026-12-01T00:00:00.000Z'),
        issue('B', '2026-12-01T00:00:00.000Z'),
        issue('C', '2026-12-01T00:00:00.001Z'),
        issue('D', '2026-12-01T00:00:00.001Z'),
      ]).map((w) => w.code),
    ).toEqual(['D', 'C', 'B', 'A']);
  });
});
