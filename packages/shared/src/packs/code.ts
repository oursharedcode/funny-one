// SPDX-License-Identifier: AGPL-3.0-only

// A pack's paid code (Step 122, B-29): `XMAS26-K7QM-3FPA`. Its shape and the
// forgiving reading of what a person types or a link carries live here, so
// the client and the server read a code the same way; signing and checking
// need the server's secret and live in the server's `codes.ts`.
//
// The eight characters after the prefix are Crockford base32 — 40 bits: a
// 16-bit id, then a 24-bit signature over the pack and the id. Crockford's
// alphabet leaves out I, L, O and U, so the reading below takes O for 0 and
// I or L for 1, as a person copying from a bank statement might write them.
// No date is inside the code (FM-PACK-6): the pack's `paidUntil` decides.

import type { PackId } from './schema.js';

/** Crockford's base32 alphabet: digits, then letters without I, L, O and U. */
export const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** Characters after the prefix: two groups of four. */
export const CODE_BODY_LENGTH = 8;

/** Each pack's printed prefix; the one part of a code that names its pack. */
export const CODE_PREFIXES: Readonly<Record<PackId, string>> = {
  chr26: 'XMAS26',
};

/** A code as the server and the client hold it: its pack and its canonical form. */
export interface PackCode {
  readonly pack: PackId;
  /** The eight body characters, upper case, without separators. */
  readonly body: string;
  /** `XMAS26-K7QM-3FPA`: what is printed, remembered and sent. */
  readonly code: string;
}

const LOOKALIKES: Readonly<Record<string, string>> = { O: '0', I: '1', L: '1' };

/** The canonical printed form of a pack's code body. */
export function formatCode(pack: PackId, body: string): string {
  return `${CODE_PREFIXES[pack]}-${body.slice(0, 4)}-${body.slice(4, 8)}`;
}

/**
 * Reads a code as typed, pasted or linked: any case, with or without the
 * prefix, spaces, dashes, dots or underscores anywhere, O for 0, I or L for 1.
 * A bare body is read as the first pack's — chr26's, today the only one. Null
 * when what is left is not eight characters of the alphabet: the shape alone,
 * not the signature, which only the server can check.
 */
export function parseCode(raw: unknown): PackCode | null {
  if (typeof raw !== 'string' || raw.length > 64) return null;
  let rest = raw.toUpperCase().replace(/[\s._-]+/gu, '');
  let pack: PackId | null = null;
  for (const [id, prefix] of Object.entries(CODE_PREFIXES) as [PackId, string][]) {
    if (rest.startsWith(prefix) && rest.length === prefix.length + CODE_BODY_LENGTH) {
      pack = id;
      rest = rest.slice(prefix.length);
      break;
    }
  }
  if (rest.length !== CODE_BODY_LENGTH) return null;
  const body = [...rest].map((c) => LOOKALIKES[c] ?? c).join('');
  if (![...body].every((c) => CODE_ALPHABET.includes(c))) return null;
  const id = pack ?? (Object.keys(CODE_PREFIXES)[0] as PackId);
  return { pack: id, body, code: formatCode(id, body) };
}
