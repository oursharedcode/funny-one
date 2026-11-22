// SPDX-License-Identifier: AGPL-3.0-only

// Step 122 (B-29): signing and checking a pack's paid code, and each code's
// standing in the receipt log (receipts.ts).
//
// A code is its pack's prefix and eight Crockford base32 characters
// (@funny/shared's `packs/code.ts`): 40 bits, a 16-bit id and then a 24-bit
// tag, the first three bytes of HMAC-SHA256(secret, `<pack>:<id>`). The server
// checks a code with its secret alone (B-29 *Code*): nothing is looked up, a
// leaked code costs nothing to serve, and a guess passes the tag once in 16.7
// million tries — some 190 years from one address at rateLimit.ts's limit on
// wrong codes. A 16-bit id is 65,536 codes per pack: more than the edition
// will sell, and every new one is checked against the ids the log holds.
//
// The log adds what the secret cannot know: a code the owner has blocked,
// and a PayID code still waiting for its payment. A code the log has never
// seen is good — a code is issued by the server, which logs it (Steps 124 and
// 125), or minted by hand for a test (scripts/mintCode.mjs), which does not.
//
// The verdict, in this order: not a code, or a tag that does not match —
// CODE_INVALID; past its pack's paid part (FM-PACK-6) — CODE_ENDED; blocked —
// CODE_BLOCKED; a PayID code not yet received, never claimed or claimed more
// than 48 hours ago (B-29 #5) — CODE_PENDING; otherwise good.
//
// A PACK_CODE_SECRET of fewer than 16 characters is no secret at all: every
// code is then CODE_INVALID, nothing can be minted, and the boot log says so.

import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import {
  CODE_ALPHABET,
  CODE_BODY_LENGTH,
  PACK_IDS,
  formatCode,
  isPackPaid,
  parseCode,
  type PackId,
} from '@funny/shared';
import type { ErrorCode } from './types.js';
import type { BlockReason, IssueRecord, ReceiptLog } from './receipts.js';

export const MIN_SECRET_LENGTH = 16;

/** How long "I've paid" opens a PayID code before the owner has matched it. */
export const CLAIM_HOURS = 48;
const CLAIM_MS = CLAIM_HOURS * 60 * 60 * 1000;

const ID_BITS = 16;
const TAG_BYTES = 3;
const TAG_RANGE = 2 ** (TAG_BYTES * 8);
const ID_RANGE = 2 ** ID_BITS;

export type CodeError = Extract<
  ErrorCode,
  'CODE_INVALID' | 'CODE_ENDED' | 'CODE_BLOCKED' | 'CODE_PENDING'
>;

export type CodeVerdict =
  { ok: true; code: string; pack: PackId } | { ok: false; error: CodeError };

/** What an issue records beside the code itself (receipts.ts). */
export type IssueDetails = Omit<IssueRecord, 'type' | 'at' | 'code' | 'state'> & {
  /** A PayID code: it waits for its payment, or for a claim, to work. */
  pending: boolean;
};

export interface PackCodes {
  /** False when no usable secret was set: every code is then CODE_INVALID. */
  readonly enabled: boolean;
  /** The verdict on a code as typed, pasted or linked. */
  check(raw: unknown): CodeVerdict;
  /** A new good code of `pack` whose id the log does not hold yet. Logs nothing. */
  mint(pack: PackId): string;
  /** Mints a code and logs its issue; returns the code. */
  issue(details: IssueDetails): string;
  /** The buyer's "I've paid" on a pending code. False for any other code, or a second claim. */
  claim(raw: unknown): boolean;
  /** The owner's match of a pending code's payment. False for any other code. */
  receive(raw: unknown): boolean;
  /** The owner's block. False for what is not a good code, or one already blocked. */
  block(raw: unknown, reason: BlockReason): boolean;
}

export interface PackCodesOptions {
  /** PACK_CODE_SECRET; null, or shorter than MIN_SECRET_LENGTH, disables codes. */
  secret: string | null | undefined;
  log: ReceiptLog;
  /** Clock injection point for tests. */
  now?: () => number;
}

interface Standing {
  /** Issued as a PayID code and not yet received. */
  pending: boolean;
  /** The first claim's time; a later claim does not extend the 48 hours. */
  claimedAt: number | null;
  blocked: boolean;
}

function encodeBody(value: number): string {
  let body = '';
  let rest = value;
  for (let i = 0; i < CODE_BODY_LENGTH; i++) {
    body = CODE_ALPHABET[rest % 32]! + body;
    rest = Math.floor(rest / 32);
  }
  return body;
}

function decodeBody(body: string): number {
  let value = 0;
  for (const c of body) value = value * 32 + CODE_ALPHABET.indexOf(c);
  return value;
}

export function createPackCodes(options: PackCodesOptions): PackCodes {
  const { log, now = Date.now } = options;
  const secret =
    typeof options.secret === 'string' && options.secret.length >= MIN_SECRET_LENGTH
      ? options.secret
      : null;

  function tagOf(pack: PackId, id: number): Buffer {
    return createHmac('sha256', secret ?? '')
      .update(`${pack}:${id}`)
      .digest()
      .subarray(0, TAG_BYTES);
  }

  /** The code's canonical form and pack when its tag is right, else null. */
  function verify(raw: unknown): { code: string; pack: PackId; id: number } | null {
    if (!secret) return null;
    const parsed = parseCode(raw);
    if (!parsed) return null;
    const value = decodeBody(parsed.body);
    const id = Math.floor(value / TAG_RANGE);
    const given = Buffer.alloc(TAG_BYTES);
    given.writeUIntBE(value % TAG_RANGE, 0, TAG_BYTES);
    if (!timingSafeEqual(given, tagOf(parsed.pack, id))) return null;
    return { code: parsed.code, pack: parsed.pack, id };
  }

  // Each code's standing and each pack's used ids, replayed from the log once
  // and kept up to date by the writes below.
  const standings = new Map<string, Standing>();
  const usedIds = new Map<PackId, Set<number>>(PACK_IDS.map((id) => [id, new Set<number>()]));
  function standingOf(code: string): Standing {
    let standing = standings.get(code);
    if (!standing) {
      standing = { pending: false, claimedAt: null, blocked: false };
      standings.set(code, standing);
    }
    return standing;
  }
  function note(code: string): void {
    const parsed = parseCode(code);
    if (!parsed) return;
    usedIds.get(parsed.pack)?.add(Math.floor(decodeBody(parsed.body) / TAG_RANGE));
  }
  for (const record of log.records()) {
    note(record.code);
    switch (record.type) {
      case 'issue':
        standingOf(record.code).pending = record.state === 'pending';
        break;
      case 'claim': {
        const standing = standings.get(record.code);
        if (standing && standing.claimedAt === null) standing.claimedAt = Date.parse(record.at);
        break;
      }
      case 'received': {
        const standing = standings.get(record.code);
        if (standing) standing.pending = false;
        break;
      }
      case 'block':
        standingOf(record.code).blocked = true;
        break;
      default:
        break;
    }
  }

  function check(raw: unknown): CodeVerdict {
    const good = verify(raw);
    if (!good) return { ok: false, error: 'CODE_INVALID' };
    const at = now();
    if (!isPackPaid(good.pack, at)) return { ok: false, error: 'CODE_ENDED' };
    const standing = standings.get(good.code);
    if (standing?.blocked) return { ok: false, error: 'CODE_BLOCKED' };
    if (standing?.pending && (standing.claimedAt === null || at >= standing.claimedAt + CLAIM_MS)) {
      return { ok: false, error: 'CODE_PENDING' };
    }
    return { ok: true, code: good.code, pack: good.pack };
  }

  function mint(pack: PackId): string {
    if (!secret) throw new Error('PACK_CODE_SECRET is not set');
    const used = usedIds.get(pack)!;
    if (used.size >= ID_RANGE) throw new Error(`every ${pack} code id is used`);
    let id = randomInt(ID_RANGE);
    while (used.has(id)) id = randomInt(ID_RANGE);
    const value = id * TAG_RANGE + tagOf(pack, id).readUIntBE(0, TAG_BYTES);
    return formatCode(pack, encodeBody(value));
  }

  function issue(details: IssueDetails): string {
    const { pending, ...rest } = details;
    const code = mint(details.pack);
    log.append({ type: 'issue', code, ...rest, state: pending ? 'pending' : 'received' });
    note(code);
    standingOf(code).pending = pending;
    return code;
  }

  function claim(raw: unknown): boolean {
    const code = verify(raw)?.code;
    const standing = code ? standings.get(code) : undefined;
    if (!code || !standing?.pending || standing.claimedAt !== null) return false;
    standing.claimedAt = Date.parse(log.append({ type: 'claim', code }).at);
    return true;
  }

  function receive(raw: unknown): boolean {
    const code = verify(raw)?.code;
    const standing = code ? standings.get(code) : undefined;
    if (!code || !standing?.pending) return false;
    log.append({ type: 'received', code });
    standing.pending = false;
    return true;
  }

  function block(raw: unknown, reason: BlockReason): boolean {
    const code = verify(raw)?.code;
    if (!code || standings.get(code)?.blocked) return false;
    log.append({ type: 'block', code, reason });
    standingOf(code).blocked = true;
    return true;
  }

  return { enabled: secret !== null, check, mint, issue, claim, receive, block };
}
