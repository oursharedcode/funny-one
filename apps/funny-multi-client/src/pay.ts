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
// Paying itself is not wired here. `startPayment` is the seam: Step 124 gives
// it PayID, Step 125 the Sponsors checkout, and until then every rail answers
// "could not start" — which the page says in words that stay true afterwards.

import type { PackId, PayRail } from '@funny/shared';
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
}

export interface PaymentStart {
  ok: boolean;
}

type Starter = (request: PaymentRequest) => Promise<PaymentStart>;

// The rails wired so far: none. Step 124 adds `payid`, Step 125 `sponsors`.
const STARTERS: Partial<Record<PayRail, Starter>> = {};

/** Starts a payment on a rail; not ok when it could not be started. Never throws. */
export async function startPayment(request: PaymentRequest): Promise<PaymentStart> {
  const start = STARTERS[request.rail];
  if (!start) return { ok: false };
  try {
    return await start(request);
  } catch {
    return { ok: false };
  }
}
