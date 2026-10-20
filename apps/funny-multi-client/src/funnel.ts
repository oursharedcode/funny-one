// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: Funny Multi's end of the funnel that the Funny Family landing page
// starts (apps/funny-family-site), counted by the server's analytics.ts. Three
// moments, each at most once per page load: the game opened, the support
// sheet opened, the first gift rail used. Each carries the interface language and
// where the visit came from: the landing page's "Play" link adds
// `from=hub&hv=<variant>`, which is read once at start-up and then taken off
// the address bar, so a refreshed or shared link does not count as the
// landing page's again.
//
// Step 85 (B-23): inside the Android store app the visit counts too, as its
// own source `app` — and only the visit, since the app offers no gifts. The
// app's Play listing declares it (Data Safety). Nothing is sent when the
// browser asks not to be tracked (Do Not Track, Global Privacy Control), or
// without sendBeacon. deploy/origin-root/funny37/privacy.html says the same;
// change both together.

import { isLanguage, type Language } from '@funny/shared';
import i18n from './i18n';
import { serverOrigin, withBase } from './basePath';
import { isStoreShell } from './storeShell';

export type GiftRail = 'payid' | 'sponsors' | 'lightning' | 'kofi' | 'bmc' | 'donate';

type Origin = { s: 'direct' } | { s: 'app' } | { s: 'hub'; v: 'a' | 'b' };

let origin: Origin = { s: 'direct' };
let supportSent = false;
let giftSent = false;

function trackingRefused(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  const win = window as Window & { doNotTrack?: string };
  return nav.globalPrivacyControl === true || nav.doNotTrack === '1' || win.doNotTrack === '1';
}

function currentLanguage(): Language {
  return isLanguage(i18n.language) ? i18n.language : 'en';
}

function send(event: Record<string, string>, language: Language = currentLanguage()): void {
  if (trackingRefused() || typeof navigator.sendBeacon !== 'function') return;
  if (origin.s === 'app' && event.e !== 'fm_view') return;
  try {
    navigator.sendBeacon(
      serverOrigin() + withBase('api/stats'),
      JSON.stringify({ ...event, ...origin, l: language }),
    );
  } catch {
    // A count is never worth an error in the game.
  }
}

/** Reads and strips the landing page's parameters, then counts the visit. */
export function initFunnel(): void {
  const url = new URL(window.location.href);
  const from = url.searchParams.get('from');
  const variant = url.searchParams.get('hv');
  if (from !== null || variant !== null) {
    url.searchParams.delete('from');
    url.searchParams.delete('hv');
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  }
  origin = isStoreShell()
    ? { s: 'app' }
    : from === 'hub' && (variant === 'a' || variant === 'b')
      ? { s: 'hub', v: variant }
      : { s: 'direct' };
  // HomeScreen switches to `?lang=` only after the first render, so the
  // link's language is read here rather than the one i18next started in (the
  // device's, Step 88).
  const urlLanguage = url.searchParams.get('lang');
  send({ e: 'fm_view' }, isLanguage(urlLanguage) ? urlLanguage : currentLanguage());
}

/** The support sheet opened — from Home's ♥ or from the end screen. */
export function trackSupportOpen(): void {
  if (supportSent) return;
  supportSent = true;
  send({ e: 'fm_support' });
}

/**
 * A gift rail used: an address copied, or a gift link or wallet opened. Only
 * the first in a page load counts, so each step of the funnel counts page
 * loads and none can pass the step before it.
 */
export function trackGift(rail: GiftRail): void {
  if (giftSent) return;
  giftSent = true;
  send({ e: 'fm_gift', t: rail });
}

export function __resetFunnelForTest(): void {
  origin = { s: 'direct' };
  supportSent = false;
  giftSent = false;
}
