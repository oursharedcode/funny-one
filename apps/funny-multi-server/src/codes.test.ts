// SPDX-License-Identifier: AGPL-3.0-only

// Step 122 (B-29): the paid code's signature and its standing in the receipt
// log — the verdict's order, the forgiving reading, a PayID code's 48 hours.

import { describe, expect, it } from 'vitest';
import { cutoffOf, parseCode } from '@funny/shared';
import { CLAIM_HOURS, createPackCodes, type IssueDetails } from './codes.js';
import { openReceiptLog, type ReceiptLog } from './receipts.js';

const SECRET = 'a-test-secret-of-some-length';
const START = Date.parse('2026-12-01T09:00:00Z');
const HOUR = 60 * 60 * 1000;

/** A log and the codes over it, on one clock the test moves. */
function setup(secret: string | null = SECRET, log?: ReceiptLog) {
  const clock = { now: START };
  const receipts = log ?? openReceiptLog({ file: null, now: () => new Date(clock.now) });
  const codes = createPackCodes({ secret, log: receipts, now: () => clock.now });
  return { clock, receipts, codes };
}

const PAYID: IssueDetails = {
  pack: 'chr26',
  rail: 'payid',
  ref: 'ref-1',
  amount: 'A$2.60',
  delivered: 'pay page',
  policy: '2026-11',
  pending: true,
};

describe('a minted code', () => {
  it('checks good, in its canonical form and pack', () => {
    const { codes } = setup();
    const code = codes.mint('chr26');
    expect(code).toMatch(/^XMAS26-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/u);
    expect(codes.check(code)).toEqual({ ok: true, code, pack: 'chr26' });
  });

  it('is read however a person writes it', () => {
    const { codes } = setup();
    const code = codes.mint('chr26');
    const body = code.slice('XMAS26-'.length).replace('-', '');
    const variants = [
      code.toLowerCase(),
      ` ${code.replaceAll('-', ' ')} `,
      code.replaceAll('-', ''),
      body,
      `${body.slice(0, 4)}.${body.slice(4)}`,
      code.replaceAll('0', 'O').replaceAll('1', 'I'),
      code.replaceAll('1', 'l'),
    ];
    for (const typed of variants) {
      expect(codes.check(typed), typed).toEqual({ ok: true, code, pack: 'chr26' });
    }
  });

  it('is not a code with one character changed, or under another secret', () => {
    const { codes } = setup();
    const code = codes.mint('chr26');
    // The last character is the signature's: the id is the same, the tag not.
    const last = code.at(-1)!;
    const forged = code.slice(0, -1) + (last === 'Z' ? 'Y' : 'Z');
    expect(codes.check(forged)).toEqual({ ok: false, error: 'CODE_INVALID' });
    expect(setup('another-secret-entirely').codes.check(code)).toEqual({
      ok: false,
      error: 'CODE_INVALID',
    });
  });

  it('is not a code when what was typed is not one', () => {
    const { codes } = setup();
    for (const raw of ['', 'XMAS26', 'XMAS26-ABCD-EFG', 'UUUUUUUU', 42, null, 'x'.repeat(65)]) {
      expect(codes.check(raw)).toEqual({ ok: false, error: 'CODE_INVALID' });
    }
  });

  it('gives a different code each time', () => {
    const { codes } = setup();
    const issued = new Set<string>();
    for (let i = 0; i < 200; i++) issued.add(codes.issue({ ...PAYID, pending: false }));
    expect(issued.size).toBe(200);
  });
});

describe('the verdict', () => {
  it('ends with the pack’s paid part (FM-PACK-6), all day on its last day', () => {
    const { clock, codes } = setup();
    const code = codes.mint('chr26');
    clock.now = cutoffOf('2027-08-01') - 1;
    expect(codes.check(code).ok).toBe(true);
    clock.now = cutoffOf('2027-08-01');
    expect(codes.check(code)).toEqual({ ok: false, error: 'CODE_ENDED' });
  });

  it('says ended before blocked: the edition is over for everyone', () => {
    const { clock, codes } = setup();
    const code = codes.mint('chr26');
    expect(codes.block(code, 'leaked')).toBe(true);
    clock.now = cutoffOf('2027-08-01');
    expect(codes.check(code)).toEqual({ ok: false, error: 'CODE_ENDED' });
  });

  it('refuses a blocked code, once blocked', () => {
    const { codes } = setup();
    const code = codes.mint('chr26');
    expect(codes.block(code.toLowerCase(), 'refund')).toBe(true);
    expect(codes.check(code)).toEqual({ ok: false, error: 'CODE_BLOCKED' });
    expect(codes.block(code, 'refund')).toBe(false);
    expect(codes.block('XMAS26-0000-0000', 'leaked')).toBe(false);
  });
});

describe('a PayID code (B-29 #5)', () => {
  it('waits for its payment, opens for 48 hours on a claim, and for good on receipt', () => {
    const { clock, codes } = setup();
    const code = codes.issue(PAYID);
    expect(codes.check(code)).toEqual({ ok: false, error: 'CODE_PENDING' });

    expect(codes.claim(code)).toBe(true);
    expect(codes.check(code).ok).toBe(true);
    clock.now += CLAIM_HOURS * HOUR - 1;
    expect(codes.check(code).ok).toBe(true);
    // A second claim does not start the 48 hours again.
    expect(codes.claim(code)).toBe(false);
    clock.now += 1;
    expect(codes.check(code)).toEqual({ ok: false, error: 'CODE_PENDING' });

    expect(codes.receive(code)).toBe(true);
    expect(codes.check(code).ok).toBe(true);
    expect(codes.receive(code)).toBe(false);
    clock.now += 30 * 24 * HOUR;
    expect(codes.check(code).ok).toBe(true);
  });

  it('takes no claim or receipt for a code that is not pending', () => {
    const { codes } = setup();
    const sponsors = codes.issue({ ...PAYID, rail: 'sponsors', pending: false });
    expect(codes.claim(sponsors)).toBe(false);
    expect(codes.receive(sponsors)).toBe(false);
    const minted = codes.mint('chr26');
    expect(codes.claim(minted)).toBe(false);
    expect(codes.receive(minted)).toBe(false);
  });

  it('is blocked over its claim', () => {
    const { codes } = setup();
    const code = codes.issue(PAYID);
    codes.claim(code);
    codes.block(code, 'reversed');
    expect(codes.check(code)).toEqual({ ok: false, error: 'CODE_BLOCKED' });
  });
});

describe('the receipt log', () => {
  it('records each issue, claim, receipt and block', () => {
    const { receipts, codes } = setup();
    const code = codes.issue(PAYID);
    codes.claim(code);
    codes.receive(code);
    codes.block(code, 'asked');
    expect(receipts.records().map((r) => r.type)).toEqual(['issue', 'claim', 'received', 'block']);
    expect(receipts.records()[0]).toMatchObject({
      type: 'issue',
      code,
      pack: 'chr26',
      rail: 'payid',
      ref: 'ref-1',
      amount: 'A$2.60',
      delivered: 'pay page',
      policy: '2026-11',
      state: 'pending',
    });
    expect(receipts.records()[0]).not.toHaveProperty('pending');
  });

  it('gives back every standing after a restart', () => {
    const first = setup();
    const blocked = first.codes.issue({ ...PAYID, pending: false });
    first.codes.block(blocked, 'leaked');
    const waiting = first.codes.issue(PAYID);
    const claimed = first.codes.issue(PAYID);
    first.codes.claim(claimed);
    const received = first.codes.issue(PAYID);
    first.codes.receive(received);

    const clock = { now: START + HOUR };
    const again = createPackCodes({ secret: SECRET, log: first.receipts, now: () => clock.now });
    expect(again.check(blocked)).toEqual({ ok: false, error: 'CODE_BLOCKED' });
    expect(again.check(waiting)).toEqual({ ok: false, error: 'CODE_PENDING' });
    expect(again.check(claimed).ok).toBe(true);
    expect(again.claim(claimed)).toBe(false);
    clock.now = START + CLAIM_HOURS * HOUR;
    expect(again.check(claimed)).toEqual({ ok: false, error: 'CODE_PENDING' });
    expect(again.check(received).ok).toBe(true);
  });
});

describe('without a usable secret', () => {
  for (const secret of [null, '', 'short-secret']) {
    it(`refuses every code and mints none (${JSON.stringify(secret)})`, () => {
      const good = setup().codes.mint('chr26');
      const { codes } = setup(secret);
      expect(codes.enabled).toBe(false);
      expect(codes.check(good)).toEqual({ ok: false, error: 'CODE_INVALID' });
      expect(() => codes.mint('chr26')).toThrow(/PACK_CODE_SECRET/u);
      expect(parseCode(good)?.code).toBe(good);
    });
  }
});
