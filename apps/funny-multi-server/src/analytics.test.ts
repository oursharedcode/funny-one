// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: the visit and funnel counts — the allowlists, the bot filter, the
// per-day store and its file, and the two routes over fastify.inject.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  RETENTION_DAYS,
  createStatsStore,
  isBotAgent,
  statKey,
  summaryDays,
  type StatsStore,
} from './analytics.js';
import { buildServer, type BuiltServer } from './index.js';

const PHONE_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';

describe('statKey', () => {
  it('keys a hub view by all four of its labels', () => {
    expect(statKey({ e: 'hub_view', v: 'b', l: 'ru', r: 'search', d: 'm' })).toBe(
      'hub_view|b|ru|||search|m',
    );
  });

  it('keys a hub click by its target', () => {
    expect(statKey({ e: 'hub_click', v: 'a', l: 'he', t: 'fm' })).toBe('hub_click|a|he||fm||');
  });

  it("keys the hub's ♥ and the rails on its own gift sheet as hub clicks", () => {
    // Step 76: the landing page's Support Author ♥ opens a sheet of its own.
    expect(statKey({ e: 'hub_click', v: 'b', l: 'fa', t: 'support' })).toBe(
      'hub_click|b|fa||support||',
    );
    for (const rail of ['payid', 'sponsors', 'lightning', 'kofi', 'bmc', 'donate']) {
      expect(statKey({ e: 'hub_click', v: 'a', l: 'en', t: rail })).toBe(
        `hub_click|a|en||${rail}||`,
      );
    }
    // ...but the ♥ is no gift rail on Funny Multi's own sheet.
    expect(statKey({ e: 'fm_gift', s: 'direct', l: 'en', t: 'support' })).toBeNull();
  });

  it('takes a variant on a game event only when it came through the hub', () => {
    expect(statKey({ e: 'fm_view', s: 'hub', v: 'a', l: 'en' })).toBe('fm_view|a|en|hub|||');
    expect(statKey({ e: 'fm_view', s: 'direct', l: 'en' })).toBe('fm_view||en|direct|||');
    // From the hub without a variant, or direct with one: both refused.
    expect(statKey({ e: 'fm_view', s: 'hub', l: 'en' })).toBeNull();
    expect(statKey({ e: 'fm_view', s: 'direct', v: 'a', l: 'en' })).toBeNull();
  });

  it('keys a visit from the Android app, and nothing else from it (Step 85)', () => {
    expect(statKey({ e: 'fm_view', s: 'app', l: 'ru' })).toBe('fm_view||ru|app|||');
    expect(statKey({ e: 'fm_view', s: 'app', v: 'a', l: 'ru' })).toBeNull();
    // The app offers no gifts.
    expect(statKey({ e: 'fm_support', s: 'app', l: 'ru' })).toBeNull();
    expect(statKey({ e: 'fm_gift', s: 'app', l: 'ru', t: 'payid' })).toBeNull();
  });

  it('keys a gift by its rail', () => {
    expect(statKey({ e: 'fm_gift', s: 'direct', l: 'ta', t: 'lightning' })).toBe(
      'fm_gift||ta|direct|lightning||',
    );
    // Step 75: the two brand buttons under Lightning.
    expect(statKey({ e: 'fm_gift', s: 'hub', v: 'b', l: 'en', t: 'kofi' })).toBe(
      'fm_gift|b|en|hub|kofi||',
    );
    expect(statKey({ e: 'fm_gift', s: 'direct', l: 'de', t: 'bmc' })).toBe(
      'fm_gift||de|direct|bmc||',
    );
    expect(statKey({ e: 'fm_gift', s: 'direct', l: 'ta', t: 'fm' })).toBeNull();
  });

  it.each([
    ['an unknown event', { e: 'page_view', v: 'a', l: 'en', r: 'direct', d: 'm' }],
    ['an unknown field', { e: 'hub_view', v: 'a', l: 'en', r: 'direct', d: 'm', x: '1' }],
    [
      'a label the event does not take',
      { e: 'hub_view', v: 'a', l: 'en', r: 'direct', d: 'm', t: 'fm' },
    ],
    ['a value outside its allowlist', { e: 'hub_view', v: 'c', l: 'en', r: 'direct', d: 'm' }],
    ['a language the game does not have', { e: 'hub_view', v: 'a', l: 'pl', r: 'direct', d: 'm' }],
    ['a missing label', { e: 'hub_view', v: 'a', l: 'en', r: 'direct' }],
    ['a value that is not a string', { e: 'hub_view', v: 'a', l: 'en', r: 'direct', d: 1 }],
    ['free text', { e: 'hub_click', v: 'a', l: 'en', t: 'https://example.com/' }],
    ['an array', ['hub_view']],
    ['a string', 'hub_view'],
    ['null', null],
  ])('refuses %s', (_label, input) => {
    expect(statKey(input)).toBeNull();
  });
});

describe('isBotAgent', () => {
  it.each([
    ['no user agent', undefined],
    ['Googlebot', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'],
    [
      'headless Chrome',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/129.0.0.0 Safari/537.36',
    ],
    ['a link preview', 'WhatsApp/2.23.20.0'],
    ['curl', 'curl/8.4.0'],
  ])('drops %s', (_label, ua) => {
    expect(isBotAgent(ua)).toBe(true);
  });

  it.each([
    ['a phone', PHONE_UA],
    [
      'a CUBOT phone',
      'Mozilla/5.0 (Linux; Android 10; CUBOT X30) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
    ],
    [
      "Telegram's in-app browser",
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36 Telegram-Android/11.2.1',
    ],
  ])('keeps %s', (_label, ua) => {
    expect(isBotAgent(ua)).toBe(false);
  });
});

describe('summaryDays', () => {
  it('defaults to 30 and keeps to 1..RETENTION_DAYS', () => {
    expect(summaryDays(undefined)).toBe(30);
    expect(summaryDays('7')).toBe(7);
    expect(summaryDays('0')).toBe(1);
    expect(summaryDays('100000')).toBe(RETENTION_DAYS);
    expect(summaryDays('-3')).toBe(30);
    expect(summaryDays('7.5')).toBe(30);
  });
});

describe('createStatsStore', () => {
  let dir: string;
  let clock: Date;
  const stores: StatsStore[] = [];
  const now = (): Date => clock;
  const view = { e: 'hub_view', v: 'a', l: 'en', r: 'direct', d: 'm' };

  function store(file: string | null): StatsStore {
    const s = createStatsStore({ file, now });
    stores.push(s);
    return s;
  }

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'funny-stats-'));
    clock = new Date('2026-10-14T23:59:00Z');
  });

  afterEach(() => {
    for (const s of stores.splice(0)) s.stop();
    rmSync(dir, { recursive: true, force: true });
  });

  it('counts per UTC day and refuses what statKey refuses', () => {
    const s = store(null);
    expect(s.record(view)).toBe(true);
    expect(s.record(view)).toBe(true);
    expect(s.record({ ...view, v: 'z' })).toBe(false);
    clock = new Date('2026-10-15T00:01:00Z');
    expect(s.record(view)).toBe(true);
    expect(s.summary(30)).toEqual({
      from: '2026-09-16',
      to: '2026-10-15',
      fields: ['v', 'l', 's', 't', 'r', 'd'],
      days: {
        '2026-10-14': { 'hub_view|a|en|||direct|m': 2 },
        '2026-10-15': { 'hub_view|a|en|||direct|m': 1 },
      },
      countries: {},
      countriesSince: null,
    });
    expect(Object.keys(s.summary(1).days)).toEqual(['2026-10-15']);
  });

  it('tallies the country of a visit apart from its labels', () => {
    const s = store(null);
    const gameVisit = { e: 'fm_view', s: 'direct', l: 'ru' };
    expect(s.record(view, 'AU')).toBe(true);
    s.record(view, 'AU');
    s.record(gameVisit, 'RU');
    // Not known, and not a country: both count as ZZ.
    s.record(view, null);
    s.record(view, 'au');
    // No lookup: no country counted.
    s.record(view);
    // Not a visit: its country is not counted.
    s.record({ e: 'hub_click', v: 'a', l: 'en', t: 'fm' }, 'AU');
    s.record({ e: 'fm_gift', s: 'direct', l: 'ru', t: 'payid' }, 'RU');
    // Refused: nothing at all is counted.
    expect(s.record({ ...view, v: 'z' }, 'AU')).toBe(false);

    const summary = s.summary(30);
    expect(summary.countries).toEqual({ hub_view: { AU: 2, ZZ: 2 }, fm_view: { RU: 1 } });
    expect(summary.countriesSince).toBe('2026-10-14');
    expect(summary.days['2026-10-14']['hub_view|a|en|||direct|m']).toBe(5);

    // The next day: summed over the span, and since stays at the first day.
    clock = new Date('2026-10-15T08:00:00Z');
    s.record(view, 'NZ');
    expect(s.summary(30).countries).toEqual({
      hub_view: { AU: 2, ZZ: 2, NZ: 1 },
      fm_view: { RU: 1 },
    });
    expect(s.summary(1)).toMatchObject({
      countries: { hub_view: { NZ: 1 } },
      countriesSince: '2026-10-14',
    });
  });

  it('keeps the countries in the file and drops their old days', () => {
    const file = join(dir, 'stats.json');
    writeFileSync(
      file,
      JSON.stringify({
        version: 1,
        days: { '2026-10-13': { 'hub_view|a|en|||direct|m': 4 } },
        countries: {
          '2025-01-01': { 'hub_view|AU': 5 },
          '2026-10-13': { 'hub_view|AU': 3, 'fm_view|ZZ': 1, 'hub_view|<b>': 1, 'bad|key|x': 2 },
        },
      }),
    );
    const first = store(file);
    expect(first.summary(RETENTION_DAYS)).toMatchObject({
      countries: { hub_view: { AU: 3 }, fm_view: { ZZ: 1 } },
      countriesSince: '2026-10-13',
    });
    first.record(view, 'JP');
    first.flush();
    expect(JSON.parse(readFileSync(file, 'utf8')).countries).toEqual({
      '2026-10-13': { 'hub_view|AU': 3, 'fm_view|ZZ': 1 },
      '2026-10-14': { 'hub_view|JP': 1 },
    });

    // A file from before Step 79 has no countries: none are counted yet.
    writeFileSync(file, JSON.stringify({ version: 1, days: {} }));
    expect(store(file).summary(30)).toMatchObject({ countries: {}, countriesSince: null });
  });

  it('writes the file only when something changed, and reads it back', () => {
    const file = join(dir, 'nested', 'stats.json');
    const first = store(file);
    first.flush();
    expect(existsSync(file)).toBe(false);
    first.record(view);
    first.flush();
    expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({
      version: 1,
      days: { '2026-10-14': { 'hub_view|a|en|||direct|m': 1 } },
      countries: {},
    });
    expect(existsSync(`${file}.tmp`)).toBe(false);

    const second = store(file);
    second.record(view);
    expect(second.summary(1).days['2026-10-14']['hub_view|a|en|||direct|m']).toBe(2);
  });

  it('writes what is pending when stopped', () => {
    const file = join(dir, 'stats.json');
    const s = createStatsStore({ file, now });
    s.record(view);
    s.stop();
    expect(existsSync(file)).toBe(true);
  });

  it('drops days past the retention window', () => {
    const file = join(dir, 'stats.json');
    writeFileSync(
      file,
      JSON.stringify({
        version: 1,
        days: {
          '2025-01-01': { 'hub_view|a|en|||direct|m': 5 },
          '2026-10-13': { 'hub_view|a|en|||direct|m': 3, 'bad|key': -1 },
        },
      }),
    );
    const s = store(file);
    expect(s.summary(RETENTION_DAYS).days).toEqual({
      '2026-10-13': { 'hub_view|a|en|||direct|m': 3 },
    });
  });

  it('sets an unreadable file aside instead of overwriting it', () => {
    const file = join(dir, 'stats.json');
    writeFileSync(file, '{not json');
    const errors: unknown[] = [];
    const s = createStatsStore({ file, now, onError: (err) => errors.push(err) });
    stores.push(s);
    expect(errors).toHaveLength(1);
    expect(readFileSync(`${file}.corrupt`, 'utf8')).toBe('{not json');
    s.record(view);
    s.flush();
    expect(JSON.parse(readFileSync(file, 'utf8')).days['2026-10-14']).toBeDefined();
  });
});

describe('POST /api/stats and GET /api/stats/summary', () => {
  let built: BuiltServer | null = null;

  afterEach(async () => {
    if (built) {
      await built.io.close();
      await built.fastify.close();
      built = null;
    }
  });

  async function boot(
    basePath = '/',
    countryOf?: (ip: string) => string | null,
  ): Promise<BuiltServer> {
    built = await buildServer({ logger: false, basePath, statsFile: null, countryOf });
    return built;
  }

  function beacon(
    server: BuiltServer,
    body: unknown,
    ua = PHONE_UA,
    url = '/api/stats',
    ip = '198.51.100.7',
  ) {
    // sendBeacon's own content type for a string body; the address as the
    // proxy in front passes it on.
    return server.fastify.inject({
      method: 'POST',
      url,
      headers: {
        'content-type': 'text/plain;charset=UTF-8',
        'user-agent': ua,
        'x-forwarded-for': ip,
      },
      payload: typeof body === 'string' ? body : JSON.stringify(body),
    });
  }

  async function today(server: BuiltServer, url = '/api/stats/summary?days=1') {
    const res = await server.fastify.inject({ method: 'GET', url });
    const body = res.json() as { days: Record<string, Record<string, number>> };
    return Object.values(body.days)[0] ?? {};
  }

  it('counts a beacon and reports it in the summary', async () => {
    const server = await boot();
    const res = await beacon(server, { e: 'hub_click', v: 'b', l: 'uk', t: 'fo' });
    expect(res.statusCode).toBe(204);
    expect(await today(server)).toEqual({ 'hub_click|b|uk||fo||': 1 });
  });

  it('takes a JSON body too', async () => {
    const server = await boot();
    const res = await server.fastify.inject({
      method: 'POST',
      url: '/api/stats',
      headers: { 'user-agent': PHONE_UA },
      payload: { e: 'fm_view', s: 'direct', l: 'ko' },
    });
    expect(res.statusCode).toBe(204);
    expect(await today(server)).toEqual({ 'fm_view||ko|direct|||': 1 });
  });

  it('refuses an event outside the allowlists and a body that is not JSON', async () => {
    const server = await boot();
    expect((await beacon(server, { e: 'hub_click', v: 'b', l: 'uk', t: 'x' })).statusCode).toBe(
      400,
    );
    expect((await beacon(server, '{"e":')).statusCode).toBe(400);
    expect(await today(server)).toEqual({});
  });

  it('refuses a body over the limit', async () => {
    const server = await boot();
    const res = await beacon(server, { e: 'hub_view', pad: 'x'.repeat(2000) });
    expect(res.statusCode).toBe(413);
  });

  it("drops a crawler's beacon without counting it", async () => {
    const server = await boot();
    const res = await beacon(server, { e: 'fm_view', s: 'direct', l: 'en' }, 'Googlebot/2.1');
    expect(res.statusCode).toBe(204);
    expect(await today(server)).toEqual({});
  });

  it('limits one address to 60 events a minute', async () => {
    const server = await boot();
    const event = { e: 'fm_view', s: 'direct', l: 'en' };
    for (let i = 0; i < 60; i += 1) {
      expect((await beacon(server, event)).statusCode).toBe(204);
    }
    expect((await beacon(server, event)).statusCode).toBe(429);
    expect(await today(server)).toEqual({ 'fm_view||en|direct|||': 60 });
  });

  it("counts a visit's country, looked up from its address, and shows no address", async () => {
    const places: Record<string, string> = { '1.0.0.1': 'AU', '77.88.8.8': 'RU' };
    const server = await boot('/', (ip) => places[ip] ?? null);
    const hubVisit = { e: 'hub_view', v: 'b', l: 'en', r: 'search', d: 'd' };
    const gameVisit = { e: 'fm_view', s: 'hub', v: 'b', l: 'ru' };
    const send = (body: object, ip: string) => beacon(server, body, PHONE_UA, '/api/stats', ip);
    expect((await send(hubVisit, '1.0.0.1')).statusCode).toBe(204);
    await send(hubVisit, '1.0.0.1');
    await send(gameVisit, '77.88.8.8');
    await send(gameVisit, '203.0.113.50');
    await send({ e: 'hub_click', v: 'b', l: 'en', t: 'fm' }, '1.0.0.1');

    const res = await server.fastify.inject({ method: 'GET', url: '/api/stats/summary?days=1' });
    expect(res.json()).toMatchObject({
      countries: { hub_view: { AU: 2 }, fm_view: { RU: 1, ZZ: 1 } },
      countriesSince: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    });
    expect(res.body).not.toMatch(/1\.0\.0\.1|77\.88|203\.0/);
  });

  it('counts no country without a lookup', async () => {
    const server = await boot();
    await beacon(server, { e: 'fm_view', s: 'direct', l: 'en' });
    const res = await server.fastify.inject({ method: 'GET', url: '/api/stats/summary?days=1' });
    expect(res.json()).toMatchObject({ countries: {}, countriesSince: null });
  });

  it('marks the summary uncacheable and unindexed', async () => {
    const server = await boot();
    const res = await server.fastify.inject({ method: 'GET', url: '/api/stats/summary' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['x-robots-tag']).toBe('noindex');
    expect(res.json()).toMatchObject({ fields: ['v', 'l', 's', 't', 'r', 'd'], days: {} });
  });

  it('mounts both routes under the base path', async () => {
    const server = await boot('/funny37-game/');
    const event = { e: 'fm_support', s: 'direct', l: 'it' };
    expect((await beacon(server, event, PHONE_UA, '/funny37-game/api/stats')).statusCode).toBe(204);
    expect(await today(server, '/funny37-game/api/stats/summary?days=1')).toEqual({
      'fm_support||it|direct|||': 1,
    });
    expect((await beacon(server, event)).statusCode).toBe(404);
  });
});
