// SPDX-License-Identifier: AGPL-3.0-only

// Step 122 (B-29): the receipt log on disk — appended, read back at a start,
// its records past 18 months pruned, a torn line kept from the next record.

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { browserFamily, openReceiptLog, type ReceiptInput } from './receipts.js';

let dir = '';
let file = '';
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'receipts-'));
  file = join(dir, 'nested', 'receipts.jsonl');
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const NOW = new Date('2027-01-15T10:00:00Z');
const ROOM: ReceiptInput = {
  type: 'room',
  code: 'XMAS26-AAAA-BBBB',
  how: 'create',
  room: 'ABCDEF',
  lang: 'en',
  players: 1,
  country: 'AU',
  browser: 'chrome',
};

function lineAt(at: string, code = 'XMAS26-AAAA-BBBB'): string {
  return JSON.stringify({ type: 'claim', at, code });
}

function lines(): string[] {
  return readFileSync(file, 'utf8').split('\n');
}

describe('the receipt log', () => {
  it('appends one stamped record a line, and reads them back at the next start', () => {
    const log = openReceiptLog({ file, now: () => NOW });
    expect(log.records()).toEqual([]);
    const written = log.append(ROOM);
    expect(written).toEqual({ ...ROOM, at: NOW.toISOString() });
    log.append({ type: 'block', code: ROOM.code, reason: 'leaked' });
    expect(lines()).toHaveLength(3);
    expect(lines().at(-1)).toBe('');

    const again = openReceiptLog({ file, now: () => NOW });
    expect(again.records()).toEqual(log.records());
    expect(again.records().map((r) => r.type)).toEqual(['room', 'block']);
  });

  it('keeps its records in memory without a file', () => {
    const log = openReceiptLog({ file: null, now: () => NOW });
    log.append(ROOM);
    expect(log.records()).toHaveLength(1);
  });

  it('drops the records past 18 months, and the torn lines among them', () => {
    file = join(dir, 'receipts.jsonl');
    writeFileSync(
      file,
      [
        lineAt('2025-06-01T00:00:00Z'),
        '{"type":"claim","at":"2025-',
        lineAt('2025-07-15T09:59:59Z'),
        lineAt('2025-07-15T10:00:00Z'),
        'not json',
        lineAt('2026-12-01T00:00:00Z'),
      ].join('\n') + '\n',
    );
    const errors: unknown[] = [];
    const log = openReceiptLog({ file, now: () => NOW, onError: (e) => errors.push(e) });
    expect(log.records().map((r) => r.at)).toEqual([
      '2025-07-15T10:00:00Z',
      '2026-12-01T00:00:00Z',
    ]);
    // The unreadable line among the kept stays in the file for a look.
    expect(lines()).toEqual([
      lineAt('2025-07-15T10:00:00Z'),
      'not json',
      lineAt('2026-12-01T00:00:00Z'),
      '',
    ]);
    expect(errors).toHaveLength(1);
    expect(String(errors[0])).toMatch(/2 line\(s\) unreadable/u);
  });

  it('empties a file whose every record is past 18 months', () => {
    file = join(dir, 'receipts.jsonl');
    writeFileSync(file, `${lineAt('2024-01-01T00:00:00Z')}\n`);
    const log = openReceiptLog({ file, now: () => NOW });
    expect(log.records()).toEqual([]);
    expect(readFileSync(file, 'utf8')).toBe('');
  });

  it('leaves a file that does not read at all as it is', () => {
    file = join(dir, 'receipts.jsonl');
    writeFileSync(file, 'garbage\nmore garbage\n');
    const errors: unknown[] = [];
    const log = openReceiptLog({ file, now: () => NOW, onError: (e) => errors.push(e) });
    expect(log.records()).toEqual([]);
    expect(readFileSync(file, 'utf8')).toBe('garbage\nmore garbage\n');
    expect(errors).toHaveLength(1);
  });

  it('starts the next record on its own line after a torn last line', () => {
    file = join(dir, 'receipts.jsonl');
    writeFileSync(file, `${lineAt('2026-12-01T00:00:00Z')}\n{"type":"cla`);
    const log = openReceiptLog({ file, now: () => NOW, onError: () => {} });
    log.append(ROOM);
    const again = openReceiptLog({ file, now: () => NOW, onError: () => {} });
    expect(again.records().map((r) => r.type)).toEqual(['claim', 'room']);
  });

  it('reports a failed write and carries on', () => {
    // A directory where the file should be: every append fails.
    file = dir;
    const errors: unknown[] = [];
    const log = openReceiptLog({ file, now: () => NOW, onError: (e) => errors.push(e) });
    errors.length = 0;
    expect(() => log.append(ROOM)).not.toThrow();
    expect(log.records()).toHaveLength(1);
    expect(errors).toHaveLength(1);
  });
});

describe('browserFamily', () => {
  const UAS: [string | undefined, string][] = [
    [
      'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36',
      'chrome',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
      'safari',
    ],
    [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36 Edg/131.0',
      'edge',
    ],
    [
      'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0 Mobile Safari/537.36',
      'samsung',
    ],
    ['Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0', 'firefox'],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0 Mobile/15E148 Safari/604.1',
      'chrome',
    ],
    ['curl/8.4.0', 'other'],
    [undefined, 'other'],
  ];
  for (const [ua, family] of UAS) {
    it(`reads ${family} from ${ua?.slice(0, 40) ?? 'no user agent'}`, () => {
      expect(browserFamily(ua)).toBe(family);
    });
  }
});
