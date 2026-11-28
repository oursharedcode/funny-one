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
//
// Step 117 (B-29, owner decision D2 A): the Christmas 2026 edition's funnel
// starts here, on the website only like every count but the visit — a game
// played in a room that was offered the Christmas stories, with the host's
// switch on or off (`xm_game`), and a golden story's cartoon seen (`xm_gold`),
// each at most once per page load. /stats/ shows them per language.
//
// Step 123 (B-29): the paying half, on the website only as well — the pay
// card shown after a free Christmas game (`xm_card`), the pay page opened,
// from that card or from a link (`xm_page`), and its pay button pressed, by
// rail (`xm_pay`). Nothing about the buyer or the payment goes with them.
//
// Step 130 (B-29 #1): a Christmas game that bots helped fill — fewer than
// three people, bots in the empty seats — counts once more as `xm_bots`, with
// its `xm_game`, so /stats/ can tell whether playing alone brings players.
//
// Step 134: the pay button pressed to buy the pack for a friend
// (`xm_giftpay`) is counted apart from `xm_pay`.
//
// Step 135 (B-29 #7, owner decision D4 A): a video of the whole game made
// (`fm_video`), Christmas games and ordinary ones apart.

import { isLanguage, type Language, type PayRail } from '@funny/shared';
import i18n from './i18n';
import { serverOrigin, withBase } from './basePath';
import { isStoreShell } from './storeShell';
import type { PayDoor } from './pay';

export type GiftRail = 'payid' | 'sponsors' | 'lightning' | 'kofi' | 'bmc' | 'donate';

type Origin = { s: 'direct' } | { s: 'app' } | { s: 'hub'; v: 'a' | 'b' };

let origin: Origin = { s: 'direct' };
let supportSent = false;
let giftSent = false;
let christmasGameSent = false;
let goldenSent = false;
let payCardSent = false;
let payPageSent = false;
let payPressSent = false;
let giftPressSent = false;
let gameVideoSent = false;

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

/**
 * A game started in a room offered the Christmas stories (Step 117), and
 * whether bots took empty seats in it (Step 130).
 */
export function trackChristmasGame(on: boolean, withBots = false): void {
  if (christmasGameSent) return;
  christmasGameSent = true;
  send({ e: 'xm_game', t: on ? 'on' : 'off' });
  if (withBots) send({ e: 'xm_bots' });
}

/** A golden story's cartoon on screen, in the reveal or the gallery. */
export function trackGoldenCartoon(): void {
  if (goldenSent) return;
  goldenSent = true;
  send({ e: 'xm_gold' });
}

/** The pay card on screen, after a free Christmas game (Step 123). */
export function trackPayCard(): void {
  if (payCardSent) return;
  payCardSent = true;
  send({ e: 'xm_card' });
}

/**
 * The pay page opened, by its door. A link's page opens with the first
 * render, before HomeScreen has switched to the link's `?lang=`, so that
 * language is read here, as the visit's is.
 */
export function trackPayPage(door: PayDoor): void {
  // Home's gift link (Step 134) is not a door of the sale: its pay press is counted.
  if (door === 'home' || payPageSent) return;
  payPageSent = true;
  const urlLanguage = new URLSearchParams(window.location.search).get('lang');
  send(
    { e: 'xm_page', t: door },
    door === 'link' && isLanguage(urlLanguage) ? urlLanguage : currentLanguage(),
  );
}

/** The pay page's pay button pressed. Only the first in a page load counts. */
export function trackPayPress(rail: PayRail): void {
  if (payPressSent) return;
  payPressSent = true;
  send({ e: 'xm_pay', t: rail });
}

/** The pay button pressed for a gift (Step 134). Only the first in a page load counts. */
export function trackGiftPayPress(): void {
  if (giftPressSent) return;
  giftPressSent = true;
  send({ e: 'xm_giftpay' });
}

/** A whole-game video made (Step 135). Only the first in a page load counts. */
export function trackGameVideo(christmas: boolean): void {
  if (gameVideoSent) return;
  gameVideoSent = true;
  send({ e: 'fm_video', t: christmas ? 'xm' : 'base' });
}

export function __resetFunnelForTest(): void {
  origin = { s: 'direct' };
  supportSent = false;
  giftSent = false;
  christmasGameSent = false;
  goldenSent = false;
  payCardSent = false;
  payPageSent = false;
  payPressSent = false;
  giftPressSent = false;
  gameVideoSent = false;
}
