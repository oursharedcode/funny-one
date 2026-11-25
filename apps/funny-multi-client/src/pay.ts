// SPDX-License-Identifier: AGPL-3.0-only

// Step 123 (B-29): what the pay page (components/PayScreen.tsx) needs besides
// its markup. The page is a sheet over the game, on the website only, and it
// opens two ways: from the card a free Christmas game ends with, or from a
// link — `?pay=x26`, which is where the landing site's `/x26` forwards, and so
// where the QR code on a golden story's picture leads.
//
// The link's parameter stays on the address bar while the page is open, so a
// refresh shows it again, and comes off when the page is closed. The Android
// app never reads it: under Play's payments policy the app shows no price and
// no way to pay, whichever link opened it.
//
// `startPayment` is the seam each rail plugs into. Step 124 gives it PayID:
// the server issues a code that waits for its payment (POST /pay/payid) and
// answers with the transfer to make — the PayID, its account name, the amount
// and the code as the reference. The phone keeps that one waiting code until
// "I've paid" (POST /pay/claim, `claimPayId`) makes it work, so a reload, a
// closed tab or a second press shows the same code again and never asks the
// server for another (owner decision D4 A: three per address per hour).
//
// Step 125 gives it Sponsors (owner decisions 2026-11-25): the buyer types the
// GitHub name they will pay with (D1 A), the server issues a code that waits
// for that name's sponsorship (POST /pay/sponsors) and answers with GitHub's
// checkout link for the pack's tier. The phone keeps that waiting code too, and
// asks the server whether it works yet (POST /pay/status, `checkPayStatus`):
// it works once GitHub's webhook reports the sponsorship, or once the owner
// presses Received — never on the buyer's word alone (D2 A).

import {
  isPackPaid,
  parseCode,
  parseGitHubLogin,
  type PackId,
  type PayClaimAnswer,
  type PayError,
  type PayIdAnswer,
  type PayRail,
  type PaySponsorsAnswer,
  type PayStatusAnswer,
} from '@funny/shared';
import { serverOrigin, withBase } from './basePath';
import { isStoreShell } from './storeShell';

const PARAM = 'pay';

/** The short names a pay link uses: the landing site's `/x26` is the Christmas 2026 edition's. */
const LINK_PACKS: ReadonlyMap<string, PackId> = new Map([['x26', 'chr26']]);

/** How the pay page was reached: the end screen's card, or a link. */
export type PayDoor = 'card' | 'link';

/**
 * Each pack's tier on GitHub Sponsors, as GitHub shows it — in English,
 * whatever language the guide around it is in, so the buyer finds the words
 * on the page they are sent to.
 */
export const SPONSORS_TIERS: Readonly<Record<PackId, string>> = {
  chr26: 'Christmas 2026 edition',
};

/** The pack this page load's link asks to pay for, or null — always null in the Android app. */
export function payLinkPack(): PackId | null {
  if (isStoreShell()) return null;
  const name = new URLSearchParams(window.location.search).get(PARAM);
  return (name !== null && LINK_PACKS.get(name)) || null;
}

/** Takes the pay link's parameter off the address bar: the pay page was closed. */
export function clearPayLink(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(PARAM)) return;
  url.searchParams.delete(PARAM);
  window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
}

export interface PaymentRequest {
  pack: PackId;
  rail: PayRail;
  /** The refund policy the buyer read: REFUND_POLICY_VERSION, for the receipt log. */
  policy: string;
  /** On Sponsors: the GitHub name the buyer will pay with, as typed. */
  login?: string;
}

/** A PayID transfer to make: the server's answer, kept on the phone until claimed. */
export interface PayIdTransfer {
  pack: PackId;
  /** The code, and the transfer's reference. */
  code: string;
  payId: string;
  payIdName: string;
  amount: string;
}

/** A Sponsors checkout: the server's answer, kept on the phone until its code works. */
export interface SponsorsCheckout {
  pack: PackId;
  /** The code, waiting for the sponsorship of `login`. */
  code: string;
  /** GitHub's checkout of the pack's tier. */
  url: string;
  amount: string;
  /** The GitHub name, as the server read it: lower case. */
  login: string;
}

export interface PaymentStart {
  ok: boolean;
  /** On PayID: the transfer the page shows. */
  transfer?: PayIdTransfer;
  /** On Sponsors: the checkout to open, and the code that waits for it. */
  checkout?: SponsorsCheckout;
  /** Why it was not started, when the server said: LOGIN_INVALID is the buyer's to fix. */
  error?: PayError;
}

type Starter = (request: PaymentRequest) => Promise<PaymentStart>;

const PENDING_KEY = 'funny37.pendingPayId';
// Where storage is blocked: this page load's waiting code.
let pendingMemory: PayIdTransfer | null = null;

function readTransfer(raw: unknown): PayIdTransfer | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const code = parseCode(r.code);
  if (!code || r.pack !== code.pack) return null;
  if (typeof r.payId !== 'string' || typeof r.payIdName !== 'string') return null;
  if (typeof r.amount !== 'string') return null;
  return {
    pack: code.pack,
    code: code.code,
    payId: r.payId,
    payIdName: r.payIdName,
    amount: r.amount,
  };
}

/** The PayID code this phone is waiting to claim for `pack`, or null; always null in the Android app. */
export function readPendingPayId(pack: PackId, now = Date.now()): PayIdTransfer | null {
  if (isStoreShell() || !isPackPaid(pack, now)) return null;
  let kept: PayIdTransfer | null = pendingMemory;
  try {
    const stored = localStorage.getItem(PENDING_KEY);
    if (stored !== null) kept = readTransfer(JSON.parse(stored));
  } catch {
    // Storage blocked, or what it holds does not read: this page load's, if any.
  }
  return kept?.pack === pack ? kept : null;
}

function keepPendingPayId(transfer: PayIdTransfer): void {
  pendingMemory = transfer;
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(transfer));
  } catch {
    // Storage blocked — kept for this page load.
  }
}

export function forgetPendingPayId(): void {
  pendingMemory = null;
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // Storage blocked — nothing was kept there.
  }
}

const SPONSORS_KEY = 'funny37.pendingSponsors';
let sponsorsMemory: SponsorsCheckout | null = null;

function readCheckout(raw: unknown): SponsorsCheckout | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const code = parseCode(r.code);
  if (!code || r.pack !== code.pack) return null;
  if (typeof r.url !== 'string' || !r.url.startsWith('https://github.com/sponsors/')) return null;
  if (typeof r.amount !== 'string' || typeof r.login !== 'string' || r.login === '') return null;
  return { pack: code.pack, code: code.code, url: r.url, amount: r.amount, login: r.login };
}

/** The Sponsors code this phone is waiting on for `pack`, or null; always null in the Android app. */
export function readPendingSponsors(pack: PackId, now = Date.now()): SponsorsCheckout | null {
  if (isStoreShell() || !isPackPaid(pack, now)) return null;
  let kept: SponsorsCheckout | null = sponsorsMemory;
  try {
    const stored = localStorage.getItem(SPONSORS_KEY);
    if (stored !== null) kept = readCheckout(JSON.parse(stored));
  } catch {
    // Storage blocked, or what it holds does not read: this page load's, if any.
  }
  return kept?.pack === pack ? kept : null;
}

function keepPendingSponsors(checkout: SponsorsCheckout): void {
  sponsorsMemory = checkout;
  try {
    localStorage.setItem(SPONSORS_KEY, JSON.stringify(checkout));
  } catch {
    // Storage blocked — kept for this page load.
  }
}

export function forgetPendingSponsors(): void {
  sponsorsMemory = null;
  try {
    localStorage.removeItem(SPONSORS_KEY);
  } catch {
    // Storage blocked — nothing was kept there.
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(serverOrigin() + withBase(path), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return (await res.json()) as T;
}

async function startPayId(request: PaymentRequest): Promise<PaymentStart> {
  const kept = readPendingPayId(request.pack);
  if (kept) return { ok: true, transfer: kept };
  const answer = await postJson<PayIdAnswer>('pay/payid', {
    pack: request.pack,
    policy: request.policy,
  });
  if (!answer.ok) return { ok: false };
  const transfer = readTransfer({ ...answer, pack: request.pack });
  // The amount is the server's, which logs it: the page shows what it says.
  if (!transfer) return { ok: false };
  keepPendingPayId(transfer);
  return { ok: true, transfer };
}

async function startSponsors(request: PaymentRequest): Promise<PaymentStart> {
  const login = parseGitHubLogin(request.login);
  if (!login) return { ok: false, error: 'LOGIN_INVALID' };
  // The same name again: the same waiting code (three per address per hour).
  const kept = readPendingSponsors(request.pack);
  if (kept?.login === login) return { ok: true, checkout: kept };
  const answer = await postJson<PaySponsorsAnswer>('pay/sponsors', {
    pack: request.pack,
    policy: request.policy,
    login,
  });
  if (!answer.ok) return { ok: false, error: answer.error };
  const checkout = readCheckout({ ...answer, pack: request.pack });
  if (!checkout) return { ok: false };
  keepPendingSponsors(checkout);
  return { ok: true, checkout };
}

const STARTERS: Readonly<Record<PayRail, Starter>> = {
  payid: startPayId,
  sponsors: startSponsors,
};

/** Starts a payment on a rail; not ok when it could not be started. Never throws. */
export async function startPayment(request: PaymentRequest): Promise<PaymentStart> {
  const start = STARTERS[request.rail];
  if (!start || isStoreShell()) return { ok: false };
  try {
    return await start(request);
  } catch {
    return { ok: false };
  }
}

export type ClaimResult = { ok: true } | { ok: false; error: PayError | 'NETWORK' };

/**
 * The buyer's "I've paid": the server makes the waiting code work for 48
 * hours, until the owner matches the transfer. Never throws: a lost
 * connection is NETWORK, and the button can be pressed again.
 */
export async function claimPayId(code: string): Promise<ClaimResult> {
  try {
    const answer = await postJson<PayClaimAnswer>('pay/claim', { code });
    return answer.ok ? { ok: true } : { ok: false, error: answer.error };
  } catch {
    return { ok: false, error: 'NETWORK' };
  }
}

/**
 * Does a waiting Sponsors code work yet? ok once GitHub's webhook has reported
 * its sponsorship, or the owner has pressed Received; CODE_PENDING until then.
 * Asks and changes nothing. Never throws: a lost connection is NETWORK.
 */
export async function checkPayStatus(code: string): Promise<ClaimResult> {
  try {
    const answer = await postJson<PayStatusAnswer>('pay/status', { code });
    return answer.ok ? { ok: true } : { ok: false, error: answer.error };
  } catch {
    return { ok: false, error: 'NETWORK' };
  }
}

export function __resetPayForTest(): void {
  pendingMemory = null;
  sponsorsMemory = null;
}
