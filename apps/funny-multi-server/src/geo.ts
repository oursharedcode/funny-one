// SPDX-License-Identifier: AGPL-3.0-only

// Step 79 (B-20): the country a counted visit comes from, for the world map on
// the landing page's /stats/. analytics.ts keeps the country as a daily tally
// of its own; the address is looked up here and goes no further.
//
// The table is DB-IP's free "IP to Country Lite" database (CC BY 4.0; /stats/
// credits https://db-ip.com): one file a month of address ranges and their
// country — `1.0.0.0,1.0.0.255,AU`, the IPv4 ranges and then the IPv6 ones,
// about 710 000 rows, 4.5 MB gzipped. The server keeps its own copy in
// GEO_DIR, so no address is ever sent anywhere to be looked up. On start it
// loads the newest file there; then once a day it checks whether the month
// has turned and, if so, downloads the new month's file, checks that it
// parses, swaps it in and deletes the older ones. With no table at all it
// tries every hour, and takes the month before while the new one is not out.
// A failed download keeps the table there is; with none, a visit's country is
// simply not known.
//
// In memory, each address family is its ranges' first addresses in ascending
// order (IPv6 as four 32-bit words each) beside a country index per range. A
// range runs up to the next one's start, so a gap in the file becomes a range
// of its own with no country, and neighbours with the same country merge. A
// lookup is a binary search. October 2026's file makes 8.5 MB of table, read
// a chunk at a time so that requests keep flowing: 1.4 s on its own on a
// desktop, 3.3 to 4 s inside the running server there.

import { createReadStream } from 'node:fs';
import { mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';

export interface CountryTable {
  /** Rows read from the file. */
  rows: number;
  /** IPv4 range starts, ascending from 0.0.0.0; a range ends where the next begins. */
  v4: Uint32Array;
  v4Codes: Uint16Array;
  /** IPv6 range starts the same way, four big-endian 32-bit words each. */
  v6: Uint32Array;
  v6Codes: Uint16Array;
  /** Country index → its two-letter code; index 0 is "not known". */
  codes: readonly string[];
}

const UNKNOWN = 0;
const LF = 0x0a;
const CR = 0x0d;
const COMMA = 0x2c;
const DOT = 0x2e;
const COLON = 0x3a;
const LETTER_A = 0x41;

/** Longer than any row (two full IPv6 addresses and a code): not this CSV. */
const MAX_LINE = 128;
/** ~2.8 times today's rows: a ceiling on what a broken file can take of memory. */
const MAX_ROWS = 2_000_000;

const HEX = new Int8Array(256).fill(-1);
for (let d = 0; d < 10; d += 1) HEX[0x30 + d] = d;
for (let d = 0; d < 6; d += 1) {
  HEX[0x41 + d] = 10 + d;
  HEX[0x61 + d] = 10 + d;
}

/** A dotted IPv4 address in bytes[from, to) as a number, or -1. */
function parseV4(bytes: Uint8Array, from: number, to: number): number {
  let value = 0;
  let part = 0;
  let digits = 0;
  let dots = 0;
  for (let i = from; i < to; i += 1) {
    const c = bytes[i];
    if (c === DOT) {
      if (digits === 0 || dots === 3) return -1;
      value = value * 256 + part;
      part = 0;
      digits = 0;
      dots += 1;
      continue;
    }
    const d = c - 0x30;
    if (d < 0 || d > 9 || digits === 3) return -1;
    part = part * 10 + d;
    if (part > 255) return -1;
    digits += 1;
  }
  return dots === 3 && digits > 0 ? value * 256 + part : -1;
}

const GROUPS = new Uint16Array(8);

/**
 * An IPv6 address in bytes[from, to) into four 32-bit words at out[at], or
 * false. Hex groups and one `::` only — no zone, no dotted IPv4 tail.
 */
function parseV6(
  bytes: Uint8Array,
  from: number,
  to: number,
  out: Uint32Array,
  at: number,
): boolean {
  let count = 0;
  let gap = -1;
  let i = from;
  if (to - from >= 2 && bytes[i] === COLON && bytes[i + 1] === COLON) {
    gap = 0;
    i += 2;
  }
  while (i < to) {
    let group = 0;
    let digits = 0;
    while (i < to && HEX[bytes[i]] >= 0) {
      group = group * 16 + HEX[bytes[i]];
      digits += 1;
      i += 1;
    }
    if (digits === 0 || digits > 4 || count === 8) return false;
    GROUPS[count] = group;
    count += 1;
    if (i === to) break;
    if (bytes[i] !== COLON) return false;
    i += 1;
    if (i < to && bytes[i] === COLON) {
      if (gap >= 0) return false;
      gap = count;
      i += 1;
    } else if (i === to) {
      return false;
    }
  }
  if (gap < 0 ? count !== 8 : count > 7) return false;
  if (gap >= 0) {
    // The groups after `::` move to the end, and zeros fill the space.
    const tail = count - gap;
    GROUPS.copyWithin(8 - tail, gap, count);
    GROUPS.fill(0, gap, 8 - tail);
  }
  for (let w = 0; w < 4; w += 1) out[at + w] = (GROUPS[2 * w] << 16) | GROUPS[2 * w + 1];
  return true;
}

function compare6(a: Uint32Array, at: number, b: Uint32Array, bt: number): number {
  for (let k = 0; k < 4; k += 1) {
    if (a[at + k] !== b[bt + k]) return a[at + k] < b[bt + k] ? -1 : 1;
  }
  return 0;
}

/** Adds one to a four-word address; false when it wrapped past the last one. */
function increment6(words: Uint32Array): boolean {
  for (let k = 3; k >= 0; k -= 1) {
    if (words[k] !== 0xffffffff) {
      words[k] += 1;
      return true;
    }
    words[k] = 0;
  }
  return false;
}

function grow32(data: Uint32Array<ArrayBuffer>): Uint32Array<ArrayBuffer> {
  const bigger = new Uint32Array(data.length * 2);
  bigger.set(data);
  return bigger;
}

function grow16(data: Uint16Array<ArrayBuffer>): Uint16Array<ArrayBuffer> {
  const bigger = new Uint16Array(data.length * 2);
  bigger.set(data);
  return bigger;
}

function joined(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a);
  out.set(b, a.length);
  return out;
}

/**
 * Reads DB-IP's country CSV, as its bytes arrive. Throws — naming the line —
 * on anything that is not a sorted, non-overlapping list of
 * `start,end,CC` rows, so a broken or changed file never becomes the table.
 * DB-IP's `ZZ` (reserved space) reads as not known.
 */
export async function parseCountryTable(
  chunks: AsyncIterable<Uint8Array> | Iterable<Uint8Array>,
): Promise<CountryTable> {
  let line = 0;
  let rows = 0;

  const codes: string[] = [''];
  const codeIds = new Int16Array(26 * 26).fill(-1);
  codeIds[25 * 26 + 25] = UNKNOWN;

  // Sized for October 2026's file (362 122 and 348 712 ranges), so that a
  // file like it never has to grow them.
  let v4 = new Uint32Array(1 << 19);
  let v4Codes = new Uint16Array(1 << 19);
  let v4Size = 0;
  let v4Last = -1;
  // The first address no range has covered yet; 2^32 once one ends at the last.
  let v4Next = 0;

  let v6 = new Uint32Array(1 << 21);
  let v6Codes = new Uint16Array(1 << 19);
  let v6Size = 0;
  let v6Last = -1;
  const v6Next = new Uint32Array(4);
  let v6Full = false;
  const start6 = new Uint32Array(4);
  const end6 = new Uint32Array(4);

  function fail(why: string): never {
    throw new Error(`DB-IP country file, line ${line}: ${why}`);
  }

  /** The line still being gathered, the one after `line`, is longer than a row can be. */
  function tooLong(): never {
    line += 1;
    return fail('too long');
  }

  function codeOf(a: number, b: number): number {
    const x = a - LETTER_A;
    const y = b - LETTER_A;
    if (x < 0 || x > 25 || y < 0 || y > 25) fail('the country is not two capital letters');
    let id = codeIds[x * 26 + y];
    if (id < 0) {
      id = codes.length;
      codes.push(String.fromCharCode(a, b));
      codeIds[x * 26 + y] = id;
    }
    return id;
  }

  function push4(start: number, code: number): void {
    if (code === v4Last) return;
    if (v4Size === v4.length) {
      v4 = grow32(v4);
      v4Codes = grow16(v4Codes);
    }
    v4[v4Size] = start;
    v4Codes[v4Size] = code;
    v4Size += 1;
    v4Last = code;
  }

  function push6(start: Uint32Array, code: number): void {
    if (code === v6Last) return;
    if (v6Size === v6Codes.length) {
      v6 = grow32(v6);
      v6Codes = grow16(v6Codes);
    }
    v6.set(start, v6Size * 4);
    v6Codes[v6Size] = code;
    v6Size += 1;
    v6Last = code;
  }

  function row(bytes: Uint8Array, from: number, to: number): void {
    line += 1;
    if (to > from && bytes[to - 1] === CR) to -= 1;
    if (to === from) return;
    if (to - from > MAX_LINE) fail('too long');
    let comma1 = from;
    while (comma1 < to && bytes[comma1] !== COMMA) comma1 += 1;
    let comma2 = comma1 + 1;
    while (comma2 < to && bytes[comma2] !== COMMA) comma2 += 1;
    if (comma2 + 3 !== to) fail('not "start,end,country"');
    const code = codeOf(bytes[comma2 + 1], bytes[comma2 + 2]);
    rows += 1;
    if (rows > MAX_ROWS) fail('too many rows');

    const start = parseV4(bytes, from, comma1);
    if (start >= 0) {
      const end = parseV4(bytes, comma1 + 1, comma2);
      if (end < 0) fail('not an address range');
      if (end < start) fail('the range ends before it starts');
      if (start < v4Next) fail('the range overlaps or is out of order');
      if (start > v4Next) push4(v4Next, UNKNOWN);
      push4(start, code);
      v4Next = end + 1;
      return;
    }
    if (!parseV6(bytes, from, comma1, start6, 0) || !parseV6(bytes, comma1 + 1, comma2, end6, 0)) {
      fail('not an address range');
    }
    if (compare6(end6, 0, start6, 0) < 0) fail('the range ends before it starts');
    const after = v6Full ? -1 : compare6(start6, 0, v6Next, 0);
    if (after < 0) fail('the range overlaps or is out of order');
    if (after > 0) push6(v6Next, UNKNOWN);
    push6(start6, code);
    v6Next.set(end6);
    v6Full = !increment6(v6Next);
  }

  let carry: Uint8Array | null = null;
  for await (const chunk of chunks) {
    let from = 0;
    if (carry) {
      const newline = chunk.indexOf(LF);
      if (newline < 0) {
        carry = joined(carry, chunk);
        if (carry.length > MAX_LINE) tooLong();
        continue;
      }
      const whole = joined(carry, chunk.subarray(0, newline));
      carry = null;
      row(whole, 0, whole.length);
      from = newline + 1;
    }
    for (let newline = chunk.indexOf(LF, from); newline >= 0; newline = chunk.indexOf(LF, from)) {
      row(chunk, from, newline);
      from = newline + 1;
    }
    if (from < chunk.length) {
      if (chunk.length - from > MAX_LINE) tooLong();
      // A copy: the stream may reuse the chunk's memory.
      carry = new Uint8Array(chunk.subarray(from));
    }
  }
  if (carry) row(carry, 0, carry.length);

  if (v4Next < 2 ** 32) push4(v4Next, UNKNOWN);
  if (!v6Full) push6(v6Next, UNKNOWN);
  return {
    rows,
    v4: v4.slice(0, v4Size),
    v4Codes: v4Codes.slice(0, v4Size),
    v6: v6.slice(0, v6Size * 4),
    v6Codes: v6Codes.slice(0, v6Size),
    codes,
  };
}

/** The index of the last range starting at or below `address`; ranges start at 0. */
function search4(starts: Uint32Array, address: number): number {
  let low = 0;
  let high = starts.length - 1;
  while (low < high) {
    const mid = (low + high + 1) >>> 1;
    if (starts[mid] <= address) low = mid;
    else high = mid - 1;
  }
  return low;
}

function search6(starts: Uint32Array, address: Uint32Array): number {
  let low = 0;
  let high = starts.length / 4 - 1;
  while (low < high) {
    const mid = (low + high + 1) >>> 1;
    if (compare6(starts, mid * 4, address, 0) <= 0) low = mid;
    else high = mid - 1;
  }
  return low;
}

const ADDRESS6 = new Uint32Array(4);

/** The country of an address as two capital letters, or null when not known. */
export function lookupCountry(table: CountryTable, ip: string): string | null {
  let text = ip.trim();
  const zone = text.indexOf('%');
  if (zone >= 0) text = text.slice(0, zone);
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(text);
  if (mapped) text = mapped[1];
  if (!/^[\d.:a-f]{2,45}$/i.test(text)) return null;
  const bytes = Buffer.from(text, 'latin1');
  let code: number;
  const v4 = parseV4(bytes, 0, bytes.length);
  if (v4 >= 0) {
    code = table.v4Codes[search4(table.v4, v4)];
  } else if (parseV6(bytes, 0, bytes.length, ADDRESS6, 0)) {
    // ::ffff:a.b.c.d written in hex is still an IPv4 address.
    const ipv4 = ADDRESS6[0] === 0 && ADDRESS6[1] === 0 && ADDRESS6[2] === 0xffff;
    code = ipv4
      ? table.v4Codes[search4(table.v4, ADDRESS6[3])]
      : table.v6Codes[search6(table.v6, ADDRESS6)];
  } else {
    return null;
  }
  return code === UNKNOWN ? null : table.codes[code];
}

async function gunzipTable(source: Readable): Promise<CountryTable> {
  return pipeline(source, createGunzip({ chunkSize: 64 * 1024 }), (chunks: AsyncIterable<Buffer>) =>
    parseCountryTable(chunks),
  );
}

export const DBIP_URL = 'https://download.db-ip.com/free/';
/** How often to check for a new month's file once there is a table... */
export const CHECK_MS = 24 * 60 * 60_000;
/** ...and while there is none. */
export const RETRY_MS = 60 * 60_000;
/** Fewer rows than this and a file is taken for broken; October 2026's had 710 834. */
export const MIN_ROWS = 100_000;
const DOWNLOAD_TIMEOUT_MS = 120_000;
/** Seven times October 2026's 4.5 MB. */
const MAX_DOWNLOAD_BYTES = 32 * 1024 * 1024;
const USER_AGENT = 'funny-multi-server (+https://github.com/oursharedcode/funny-one)';
const LOCAL_FILE = /^dbip-country-lite-(\d{4}-\d{2})\.csv\.gz(\.tmp)?$/;

/** The name DB-IP gives a month's file (`YYYY-MM`), and this server keeps it under. */
export function dbipFileName(month: string): string {
  return `dbip-country-lite-${month}.csv.gz`;
}

function monthOf(at: Date): string {
  return at.toISOString().slice(0, 7);
}

function monthBefore(month: string): string {
  const year = Number(month.slice(0, 4));
  const number = Number(month.slice(5, 7));
  return number === 1 ? `${year - 1}-12` : `${year}-${String(number - 1).padStart(2, '0')}`;
}

async function readCapped(res: Response): Promise<Buffer> {
  const parts: Uint8Array[] = [];
  let size = 0;
  if (res.body) {
    for await (const part of res.body) {
      size += part.byteLength;
      if (size > MAX_DOWNLOAD_BYTES) throw new Error('DB-IP country file: too large');
      parts.push(part);
    }
  }
  return Buffer.concat(parts);
}

export interface Geo {
  /** The country of a visit's address as two capital letters; null when not known. */
  country(ip: string): string | null;
  /** Settles once the start-up load and the first check are over (tests wait on it). */
  ready: Promise<void>;
  /** Stops the checks. */
  stop(): void;
}

export interface GeoLoad {
  /** The month of DB-IP's file, `YYYY-MM`. */
  month: string;
  rows: number;
  /** How long reading it took. */
  ms: number;
}

export interface GeoOptions {
  /** The directory the monthly file is kept in; null turns the lookup off. */
  dir: string | null;
  /** fetch injection point for tests. */
  fetch?: typeof fetch;
  /** Clock injection point for tests. */
  now?: () => Date;
  /** Where a failed load or download is reported; lookups go on with the table there is. */
  onError?: (err: unknown) => void;
  /** Told of each table swapped in. */
  onLoad?: (load: GeoLoad) => void;
  /** Tests lower it to load a file of a few rows. */
  minRows?: number;
}

export function createGeo(options: GeoOptions): Geo {
  const {
    dir,
    fetch: download = fetch,
    now = () => new Date(),
    onError = () => {},
    onLoad = () => {},
    minRows = MIN_ROWS,
  } = options;
  if (!dir) return { country: () => null, ready: Promise.resolve(), stop() {} };
  const folder: string = dir;

  let table: CountryTable | null = null;
  let tableMonth = '';
  let timer: NodeJS.Timeout | null = null;
  let stopped = false;

  async function read(source: Readable, month: string): Promise<void> {
    const started = performance.now();
    const next = await gunzipTable(source);
    if (next.rows < minRows) {
      throw new Error(`DB-IP country file ${month}: only ${next.rows} rows`);
    }
    table = next;
    tableMonth = month;
    onLoad({ month, rows: next.rows, ms: Math.round(performance.now() - started) });
  }

  /** The files kept and their months, newest first; a `.tmp` too when asked. */
  async function kept(withTmp = false): Promise<{ month: string; name: string }[]> {
    let names: string[];
    try {
      names = await readdir(folder);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') onError(err);
      return [];
    }
    const files: { month: string; name: string }[] = [];
    for (const name of names) {
      const match = LOCAL_FILE.exec(name);
      if (match && (withTmp || !match[2])) files.push({ month: match[1], name });
    }
    return files.sort((a, b) => (a.month < b.month ? 1 : -1));
  }

  async function loadKept(): Promise<void> {
    for (const { month, name } of await kept()) {
      try {
        await read(createReadStream(join(folder, name)), month);
        return;
      } catch (err) {
        onError(err);
      }
    }
  }

  /** Downloads and swaps in a month's file; false when DB-IP has none (yet). */
  async function fetchMonth(month: string): Promise<boolean> {
    const res = await download(DBIP_URL + dbipFileName(month), {
      headers: { 'user-agent': USER_AGENT },
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
    });
    if (!res.ok) {
      await res.body?.cancel();
      if (res.status === 404) return false;
      throw new Error(`DB-IP country file ${month}: HTTP ${res.status}`);
    }
    const body = await readCapped(res);
    if (stopped) return true;
    await read(Readable.from([body]), month);
    const file = join(folder, dbipFileName(month));
    await mkdir(folder, { recursive: true });
    await writeFile(`${file}.tmp`, body);
    await rename(`${file}.tmp`, file);
    for (const old of await kept(true)) {
      if (old.month < month) await rm(join(folder, old.name), { force: true });
    }
    return true;
  }

  async function check(): Promise<void> {
    const month = monthOf(now());
    if (table && tableMonth >= month) return;
    if (await fetchMonth(month)) return;
    // DB-IP publishes a month's file on its first day or so; until then the
    // month before is as good as nothing when there is no table at all.
    if (!table && !(await fetchMonth(monthBefore(month)))) {
      throw new Error(`DB-IP country file: none for ${month} or the month before`);
    }
  }

  async function cycle(): Promise<void> {
    if (stopped) return;
    try {
      await check();
    } catch (err) {
      onError(err);
    }
    if (stopped) return;
    // unref() so an idle timer never holds the process (or a test runner) open.
    timer = setTimeout(() => void cycle(), table ? CHECK_MS : RETRY_MS);
    timer.unref?.();
  }

  const ready = loadKept().then(cycle);

  return {
    country: (ip) => (table ? lookupCountry(table, ip) : null),
    ready,
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
}
