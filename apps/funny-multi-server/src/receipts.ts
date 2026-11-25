// SPDX-License-Identifier: AGPL-3.0-only

// Step 122 (B-29, owner decision 2026-11-01): the receipt log of the paid
// Christmas codes — paid rooms only; a free player is counted as before, by
// the visit counts alone (analytics.ts). One JSON record per line, appended,
// in a file on the stats volume (RECEIPTS_FILE; docker-compose.yml puts it
// beside the visit counts), so it survives a deploy. Its records:
//
//   issue     a code given out: its rail, the rail's reference, the amount,
//             where it was delivered, the refund policy's version shown, and
//             whether its payment is still to be confirmed (a PayID code)
//   claim     the buyer's "I've paid" on a pending code: its 48 hours start
//   received  the owner matched the payment
//   block     the owner's blocklist, by B-29's four cases
//   sponsorship  GitHub's word that a one-time sponsorship of the pack's
//             price was paid (Step 125): the sponsor's GitHub name, the
//             sponsorship's id, the amount, and the code it switched on — or
//             none, when no code was waiting for that name or the pack was
//             no longer on sale (the admin page lists those)
//   room      a room a code made paid — at its creation or by `room:unlock`:
//             the room code, its language, the players then, the country of
//             the address and the browser's family; never the address itself,
//             never a fingerprint
//   game      a paid game, written when it is left: the rounds played, the
//             picks made, the cartoons delivered, the downloads and shares
//
// What it is for: a buyer's question or refund, and a leaked code (its rooms
// in many countries at once). Kept 18 months: older records go at each start.
// Without RECEIPTS_FILE (dev, tests) the records live in memory only.

import { appendFileSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { PackId } from '@funny/shared';

/** How a code was paid: PayID in Australia, Sponsors abroad, or the owner's gift. */
export type ReceiptRail = 'payid' | 'sponsors' | 'owner';

/** B-29's four blocklist cases (decisions 2026-11-05). */
export type BlockReason = 'refund' | 'reversed' | 'leaked' | 'asked';

export interface IssueRecord {
  type: 'issue';
  at: string;
  code: string;
  pack: PackId;
  rail: ReceiptRail;
  /**
   * For a code the owner gives by hand, the code it replaces, or the id of
   * the sponsorship it is for (one GitHub reported with no code waiting),
   * if any. Empty for PayID, whose transfer carries the code itself as its
   * reference (D4 of 2026-11-05), and for Sponsors, whose sponsorship record
   * names the code it switched on.
   */
  ref: string;
  /** As the buyer saw it, `A$2.60`, `US$2`. */
  amount: string;
  /** Where the code was shown: the pay page, by hand. */
  delivered: string;
  /** The refund policy's version shown before paying. */
  policy: string;
  /**
   * `pending` until the payment is matched — by the owner for PayID, by
   * GitHub's webhook for Sponsors; a code the owner gives is `received`.
   */
  state: 'pending' | 'received';
  /**
   * Sponsors only (Step 125, owner decisions D1 A and D3 A of 2026-11-25): the
   * GitHub user name the buyer said they would pay with, in lower case — how
   * GitHub's webhook finds the code.
   */
  login?: string;
}

export interface ClaimRecord {
  type: 'claim';
  at: string;
  code: string;
}

export interface ReceivedRecord {
  type: 'received';
  at: string;
  code: string;
}

export interface BlockRecord {
  type: 'block';
  at: string;
  code: string;
  reason: BlockReason;
}

/** What GitHub's webhook of a sponsorship came to (Step 125). */
export type SponsorshipOutcome = 'matched' | 'no code' | 'not on sale';

export interface SponsorshipRecord {
  type: 'sponsorship';
  at: string;
  /** The code it switched on; empty when it switched none on. */
  code: string;
  /** The sponsorship's id at GitHub (its node id). */
  ref: string;
  /** The sponsor's GitHub name, in lower case. */
  login: string;
  /** As GitHub reported it: `US$2`. */
  amount: string;
  outcome: SponsorshipOutcome;
}

export interface RoomRecord {
  type: 'room';
  at: string;
  code: string;
  how: 'create' | 'unlock';
  room: string;
  lang: string;
  players: number;
  /** Two capital letters, `ZZ` when not known. */
  country: string;
  browser: string;
}

export interface GameRecord {
  type: 'game';
  at: string;
  code: string;
  room: string;
  players: number;
  rounds: number;
  picks: number;
  cartoons: number;
  downloads: number;
  shares: number;
}

export type ReceiptRecord =
  | IssueRecord
  | ClaimRecord
  | ReceivedRecord
  | BlockRecord
  | SponsorshipRecord
  | RoomRecord
  | GameRecord;

type WithoutAt<T> = T extends unknown ? Omit<T, 'at'> : never;
/** A record as written: the log stamps its time. */
export type ReceiptInput = WithoutAt<ReceiptRecord>;

const RECORD_TYPES: readonly string[] = [
  'issue',
  'claim',
  'received',
  'block',
  'sponsorship',
  'room',
  'game',
];

export const RETENTION_MONTHS = 18;

export interface ReceiptLog {
  /** Every record kept, oldest first. */
  records(): readonly ReceiptRecord[];
  /** Stamps and appends one record. A failed write is reported, never thrown. */
  append(input: ReceiptInput): ReceiptRecord;
}

export interface ReceiptLogOptions {
  /** The JSONL file; null keeps the records in memory only. */
  file: string | null;
  /** Clock injection point for tests. */
  now?: () => Date;
  /** Where a failed read or write is reported; the game never stops for it. */
  onError?: (err: unknown) => void;
}

function readRecord(line: string): ReceiptRecord | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
  const record = parsed as Record<string, unknown>;
  if (typeof record.type !== 'string' || !RECORD_TYPES.includes(record.type)) return null;
  if (typeof record.at !== 'string' || !Number.isFinite(Date.parse(record.at))) return null;
  if (typeof record.code !== 'string') return null;
  return parsed as ReceiptRecord;
}

export function openReceiptLog(options: ReceiptLogOptions): ReceiptLog {
  const { file, now = () => new Date(), onError = () => {} } = options;
  const kept: ReceiptRecord[] = [];

  if (file) {
    let text = '';
    try {
      text = readFileSync(file, 'utf8');
    } catch (err) {
      // No file yet is the normal first start; anything else is worth a line.
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') onError(err);
    }
    const lines = text.split('\n').filter((line) => line.trim() !== '');
    const cutoff = new Date(now().getTime());
    cutoff.setUTCMonth(cutoff.getUTCMonth() - RETENTION_MONTHS);
    // The file is in time order, so the records past their 18 months are its
    // first lines. A line that does not read — a write torn by a power cut —
    // goes with an older record after it and stays otherwise, so a file that
    // does not read at all is left whole for a look; it is reported once.
    const records = lines.map(readRecord);
    const unreadable = records.filter((r) => r === null).length;
    if (unreadable > 0) onError(new Error(`receipts: ${unreadable} line(s) unreadable`));
    const firstKept = records.findIndex((r) => r !== null && Date.parse(r.at) >= cutoff.getTime());
    const end = firstKept === -1 ? lines.length : firstKept;
    let drop = 0;
    for (let i = 0; i < end; i++) if (records[i] !== null) drop = i + 1;
    for (const record of records.slice(drop)) if (record) kept.push(record);
    try {
      if (drop > 0) {
        const tmp = `${file}.tmp`;
        const rest = lines.slice(drop);
        writeFileSync(tmp, rest.length > 0 ? `${rest.join('\n')}\n` : '');
        renameSync(tmp, file);
      } else if (text !== '' && !text.endsWith('\n')) {
        // A torn last line must not swallow the next record.
        appendFileSync(file, '\n');
      }
    } catch (err) {
      onError(err);
    }
  }

  function append(input: ReceiptInput): ReceiptRecord {
    const record = { ...input, at: now().toISOString() } as ReceiptRecord;
    kept.push(record);
    if (file) {
      try {
        mkdirSync(dirname(file), { recursive: true });
        appendFileSync(file, `${JSON.stringify(record)}\n`);
      } catch (err) {
        onError(err);
      }
    }
    return record;
  }

  return { records: () => kept, append };
}

/**
 * A browser's family from its user agent, for a room record: the family only,
 * no version, no device. Edge, Opera, Samsung's and Yandex's name Chrome as
 * well, and Chrome names Safari, so the order matters.
 */
const BROWSERS: readonly (readonly [RegExp, string])[] = [
  [/\bEdg(?:e|A|iOS)?\//u, 'edge'],
  [/\bOPR\/|\bOpera\b/u, 'opera'],
  [/\bSamsungBrowser\//u, 'samsung'],
  [/\bYaBrowser\//u, 'yandex'],
  [/\bFirefox\/|\bFxiOS\//u, 'firefox'],
  [/\bChrome\/|\bCriOS\//u, 'chrome'],
  [/\bSafari\//u, 'safari'],
];

export function browserFamily(userAgent: string | undefined): string {
  if (!userAgent) return 'other';
  for (const [pattern, family] of BROWSERS) if (pattern.test(userAgent)) return family;
  return 'other';
}
