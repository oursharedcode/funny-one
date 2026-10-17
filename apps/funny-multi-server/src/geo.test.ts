// SPDX-License-Identifier: AGPL-3.0-only

// Step 79: the country lookup — DB-IP's CSV read into the table, the lookup,
// and the monthly file kept in GEO_DIR, downloaded through an injected fetch.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import {
  CHECK_MS,
  RETRY_MS,
  createGeo,
  dbipFileName,
  lookupCountry,
  parseCountryTable,
  type CountryTable,
  type Geo,
  type GeoOptions,
} from './geo.js';

const CSV = [
  '0.0.0.0,0.255.255.255,ZZ',
  '1.0.0.0,1.0.0.255,AU',
  '1.0.1.0,1.0.3.255,CN',
  '1.0.4.0,1.0.7.255,AU',
  // A gap: 1.0.8.0 to 8.8.7.255 is in no row.
  '8.8.8.0,8.8.8.255,US',
  '8.8.10.0,8.8.10.255,US',
  '2001:200::,2001:200:ffff:ffff:ffff:ffff:ffff:ffff,JP',
  '2a02:6b8::,2a02:6b8:ffff:ffff:ffff:ffff:ffff:ffff,RU',
  '',
].join('\n');

async function parse(text: string): Promise<CountryTable> {
  return parseCountryTable([Buffer.from(text)]);
}

describe('parseCountryTable and lookupCountry', () => {
  let table: CountryTable;

  beforeEach(async () => {
    table = await parse(CSV);
  });

  it('finds the country of an IPv4 and an IPv6 address', () => {
    expect(table.rows).toBe(8);
    expect(lookupCountry(table, '1.0.0.1')).toBe('AU');
    expect(lookupCountry(table, '1.0.2.3')).toBe('CN');
    expect(lookupCountry(table, '1.0.7.255')).toBe('AU');
    expect(lookupCountry(table, '8.8.8.8')).toBe('US');
    expect(lookupCountry(table, '2001:200::1')).toBe('JP');
    expect(lookupCountry(table, '2001:200:ffff:ffff:ffff:ffff:ffff:ffff')).toBe('JP');
    expect(lookupCountry(table, '2A02:6B8::FEED:FF')).toBe('RU');
  });

  it('knows no country for reserved space, a gap, or past the last range', () => {
    for (const ip of ['0.1.2.3', '1.0.8.0', '8.8.9.1', '255.255.255.255']) {
      expect(lookupCountry(table, ip)).toBeNull();
    }
    for (const ip of ['::1', '2001:1ff:ffff::', '2001:201::', 'ffff::']) {
      expect(lookupCountry(table, ip)).toBeNull();
    }
  });

  it('reads an IPv4-mapped address as IPv4 and drops a zone', () => {
    expect(lookupCountry(table, '::ffff:1.0.0.1')).toBe('AU');
    expect(lookupCountry(table, '::FFFF:0100:0001')).toBe('AU');
    expect(lookupCountry(table, '2001:200::1%eth0')).toBe('JP');
  });

  it.each([
    '',
    'unknown',
    '1.0.0',
    '1.0.0.256',
    '1.0.0.1.2',
    '1::2::3',
    '12345::',
    '1:2:3:4:5:6:7',
  ])('knows no country for %j', (ip) => {
    expect(lookupCountry(table, ip)).toBeNull();
  });

  it('reads a file however its bytes are split', async () => {
    const bytes = Buffer.from(CSV.replace(/\n/g, '\r\n'));
    const oneByOne = await parseCountryTable([...bytes].map((byte) => Uint8Array.of(byte)));
    expect(oneByOne).toEqual(table);
  });

  it('merges neighbours of one country and fills the gaps', async () => {
    // 0.0.0.0 (not known, ZZ), 1.0.0.0 AU, 1.0.1.0 CN, 1.0.4.0 AU, 1.0.8.0 (gap),
    // 8.8.8.0 US, 8.8.9.0 (gap), 8.8.10.0 US, 8.8.11.0 (past the last row).
    expect(table.v4.length).toBe(9);
    // ::, 2001:200:: JP, 2001:201:: (gap), 2a02:6b8:: RU, 2a02:6b9:: (past the last row).
    expect(table.v6Codes.length).toBe(5);
    const merged = await parse('1.0.0.0,1.0.0.255,AU\n1.0.1.0,1.0.1.255,AU\n');
    expect(Array.from(merged.v4)).toEqual([0, 0x01000000, 0x01000200]);
  });

  it.each([
    ['an overlap', '1.0.0.0,1.0.0.255,AU\n1.0.0.128,1.0.1.255,CN', /line 2: .*overlaps/],
    ['rows out of order', '1.0.1.0,1.0.1.255,AU\n1.0.0.0,1.0.0.255,CN', /line 2: .*out of order/],
    ['an IPv6 overlap', '2001:200::,2001:200::ff,JP\n2001:200::80,2001:201::,JP', /line 2: /],
    ['a range that ends before it starts', '1.0.1.0,1.0.0.255,AU', /line 1: .*ends before/],
    ['two families in one row', '1.0.0.0,2001::,AU', /line 1: not an address range/],
    ['a lower-case country', '1.0.0.0,1.0.0.255,au', /line 1: .*two capital letters/],
    ['a three-letter country', '1.0.0.0,1.0.0.255,AUS', /line 1: not "start,end,country"/],
    ['a page that is not the CSV', '<!DOCTYPE html>\n<html>', /line 1: not "start,end,country"/],
    ['a line far too long', `1.0.0.0,1.0.0.255,AU\n${'1'.repeat(200)}`, /line 2: too long/],
  ])('refuses %s, naming the line', async (_label, text, message) => {
    await expect(parse(text)).rejects.toThrow(message);
  });
});

describe('createGeo', () => {
  let dir: string;
  let clock: Date;
  const geos: Geo[] = [];
  const now = (): Date => clock;
  const SEPTEMBER = CSV;
  const OCTOBER = CSV.replace('1.0.0.255,AU', '1.0.0.255,NZ');

  // DB-IP's download host, as the files it has: month → CSV.
  function dbip(files: Record<string, string>) {
    return vi.fn(async (url: string | URL | Request) => {
      const month = /lite-(\d{4}-\d{2})\.csv\.gz$/.exec(String(url))?.[1] ?? '';
      const csv = files[month];
      return csv === undefined
        ? new Response('Not Found', { status: 404 })
        : new Response(gzipSync(Buffer.from(csv)));
    });
  }

  function geo(options: Partial<GeoOptions>): Geo {
    const g = createGeo({ dir, now, minRows: 1, ...options });
    geos.push(g);
    return g;
  }

  function keep(month: string, csv: string): void {
    writeFileSync(join(dir, dbipFileName(month)), gzipSync(Buffer.from(csv)));
  }

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'funny-geo-'));
    clock = new Date('2026-10-17T12:00:00Z');
  });

  afterEach(() => {
    for (const g of geos.splice(0)) g.stop();
    vi.useRealTimers();
    rmSync(dir, { recursive: true, force: true });
  });

  it('is off without a directory', async () => {
    const fetch = dbip({ '2026-10': OCTOBER });
    const g = createGeo({ dir: null, fetch: fetch as typeof globalThis.fetch });
    await g.ready;
    expect(g.country('1.0.0.1')).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("downloads the month's file when it keeps none, and looks up with it", async () => {
    const fetch = dbip({ '2026-10': OCTOBER });
    const loads: unknown[] = [];
    const g = geo({ fetch: fetch as typeof globalThis.fetch, onLoad: (load) => loads.push(load) });
    expect(g.country('1.0.0.1')).toBeNull();
    await g.ready;
    expect(g.country('1.0.0.1')).toBe('NZ');
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://download.db-ip.com/free/dbip-country-lite-2026-10.csv.gz');
    expect(init.headers).toMatchObject({ 'user-agent': expect.stringContaining('funny') });
    expect(loads).toEqual([{ month: '2026-10', rows: 8, ms: expect.any(Number) }]);
    expect(readdirSync(dir)).toEqual([dbipFileName('2026-10')]);
  });

  it('loads the file it keeps and asks for nothing while the month is current', async () => {
    keep('2026-10', OCTOBER);
    const fetch = dbip({});
    const g = geo({ fetch: fetch as typeof globalThis.fetch });
    await g.ready;
    expect(g.country('1.0.0.1')).toBe('NZ');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('swaps in a new month and deletes the older files', async () => {
    keep('2026-09', SEPTEMBER);
    writeFileSync(join(dir, `${dbipFileName('2026-08')}.tmp`), 'left by a crash');
    writeFileSync(join(dir, 'stats.json'), '{}');
    const g = geo({ fetch: dbip({ '2026-10': OCTOBER }) as typeof globalThis.fetch });
    await g.ready;
    expect(g.country('1.0.0.1')).toBe('NZ');
    expect(readdirSync(dir).sort()).toEqual([dbipFileName('2026-10'), 'stats.json']);
  });

  it('takes the month before while the new month is not out', async () => {
    const fetch = dbip({ '2026-09': SEPTEMBER });
    const g = geo({ fetch: fetch as typeof globalThis.fetch });
    await g.ready;
    expect(g.country('1.0.0.1')).toBe('AU');
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(existsSync(join(dir, dbipFileName('2026-09')))).toBe(true);
  });

  it('keeps the table it has while the new month is not out', async () => {
    keep('2026-09', SEPTEMBER);
    const errors: unknown[] = [];
    const fetch = dbip({});
    const g = geo({ fetch: fetch as typeof globalThis.fetch, onError: (err) => errors.push(err) });
    await g.ready;
    expect(g.country('1.0.0.1')).toBe('AU');
    // Only this month was asked for, and its absence is no error.
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(errors).toEqual([]);
  });

  it('keeps the table and the file it has when a download is broken', async () => {
    keep('2026-09', SEPTEMBER);
    const errors: unknown[] = [];
    const fetch = vi.fn(async () => new Response('<html>a challenge page</html>'));
    const g = geo({ fetch: fetch as typeof globalThis.fetch, onError: (err) => errors.push(err) });
    await g.ready;
    expect(errors).toHaveLength(1);
    expect(g.country('1.0.0.1')).toBe('AU');
    expect(readdirSync(dir)).toEqual([dbipFileName('2026-09')]);
  });

  it('reports a server error and a file with too few rows', async () => {
    const errors: unknown[] = [];
    const g = geo({
      fetch: vi.fn(async () => new Response('', { status: 503 })) as typeof globalThis.fetch,
      onError: (err) => errors.push(err),
    });
    await g.ready;
    expect(String(errors[0])).toMatch(/HTTP 503/);

    keep('2026-10', OCTOBER);
    const small = geo({
      fetch: dbip({}) as typeof globalThis.fetch,
      minRows: 100,
      onError: (err) => errors.push(err),
    });
    await small.ready;
    expect(String(errors[1])).toMatch(/only 8 rows/);
    expect(small.country('1.0.0.1')).toBeNull();
  });

  it('checks again every hour while it has no table, then once a day', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const files: Record<string, string> = {};
    const fetch = dbip(files);
    const g = geo({ fetch: fetch as typeof globalThis.fetch, onError: () => {} });
    await g.ready;
    // This month and the month before, both missing.
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(1);

    files['2026-10'] = OCTOBER;
    vi.advanceTimersByTime(RETRY_MS - 1);
    expect(fetch).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(1);
    expect(fetch).toHaveBeenCalledTimes(3);
    // A check is over once it has set the next one.
    await vi.waitUntil(() => vi.getTimerCount() === 1);
    expect(g.country('1.0.0.1')).toBe('NZ');

    // November: checked a day after the last check, not an hour.
    clock = new Date('2026-11-02T00:00:00Z');
    files['2026-11'] = SEPTEMBER;
    vi.advanceTimersByTime(RETRY_MS);
    expect(fetch).toHaveBeenCalledTimes(3);
    vi.advanceTimersByTime(CHECK_MS - RETRY_MS);
    expect(fetch).toHaveBeenCalledTimes(4);
    await vi.waitUntil(() => vi.getTimerCount() === 1);
    expect(g.country('1.0.0.1')).toBe('AU');
    expect(readdirSync(dir)).toEqual([dbipFileName('2026-11')]);

    g.stop();
    expect(vi.getTimerCount()).toBe(0);
  });
});
