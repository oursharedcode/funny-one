// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: the landing page's visit and click counts. Two kinds of event go
// to the games' server (POST /api/stats, apps/funny-multi-server's
// analytics.ts), each a handful of coarse labels and nothing else:
//
//   hub_view   once per tab: the design shown (v), the page's language (l),
//              where the visit came from as a class (r), phone or not (d)
//   hub_click  once per tab per target (t): either game, the source code,
//              the trailer, the author's site, and (Step 76) the Support
//              Author ♥ and each gift rail on the sheet it opens
//
// No URL, no identifier, no cookie; the referrer is classified here and only
// its class is sent. Nothing at all is sent when the browser asks not to be
// tracked (Do Not Track, Global Privacy Control) — the same rule as Funny
// Multi's funnel.ts — or when it cannot send a beacon.

import { REFERRER_KEY, SENT_KEY } from '../keys.ts';

export type ReferrerClass = 'direct' | 'search' | 'social' | 'oursharedcode' | 'games' | 'other';

const TARGETS = [
  'fm',
  'fo',
  'gh',
  'video',
  'root',
  'support',
  'payid',
  'sponsors',
  'lightning',
  'kofi',
  'bmc',
  'donate',
] as const;
export type ClickTarget = (typeof TARGETS)[number];

// This site under both its names: a visit from one of its own pages is not
// a new visit.
const OWN_HOSTS = ['www.funny-family.oursharedcode.com', 'funny-family.oursharedcode.com'];
const AUTHOR_HOSTS = ['oursharedcode.com', 'www.oursharedcode.com'];
const GAME_HOSTS = [
  'funny37.oursharedcode.com',
  'www.funny37.oursharedcode.com',
  'funny1.oursharedcode.com',
  'www.funny1.oursharedcode.com',
];
const SEARCH_PATTERNS = [
  /(^|\.)google\.[a-z.]+$/,
  /(^|\.)yandex\.[a-z.]+$/,
  /(^|\.)yahoo\.[a-z.]+$/,
];
const SEARCH_HOSTS = [
  'bing.com',
  'duckduckgo.com',
  'baidu.com',
  'ecosia.org',
  'qwant.com',
  'naver.com',
  'startpage.com',
  'search.brave.com',
  'sogou.com',
  'seznam.cz',
  'daum.net',
  'ya.ru',
];
const SOCIAL_HOSTS = [
  'facebook.com',
  'fb.com',
  'messenger.com',
  'instagram.com',
  't.co',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'lnkd.in',
  'reddit.com',
  'vk.com',
  'vk.ru',
  'ok.ru',
  'telegram.org',
  't.me',
  'whatsapp.com',
  'youtube.com',
  'youtu.be',
  'tiktok.com',
  'pinterest.com',
  'threads.net',
  'threads.com',
  'bsky.app',
  'discord.com',
  'discordapp.com',
  'tumblr.com',
  'weibo.com',
  'line.me',
  'kakao.com',
  'mastodon.social',
];

/** The host itself or any name under it: `m.facebook.com` is facebook.com. */
function under(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

/**
 * The class of a visit's referrer, or null when it came from this site
 * itself (`ownHost` is the page's own host, port included). An empty
 * referrer is a direct visit: typed, bookmarked, from an app, or hidden by
 * the referring site's policy.
 */
export function classifyReferrer(referrer: string, ownHost: string): ReferrerClass | null {
  if (!referrer) return 'direct';
  let url: URL;
  try {
    url = new URL(referrer);
  } catch {
    return 'other';
  }
  const host = url.hostname.toLowerCase();
  if (url.host.toLowerCase() === ownHost.toLowerCase() || OWN_HOSTS.includes(host)) return null;
  if (AUTHOR_HOSTS.includes(host)) return 'oursharedcode';
  if (GAME_HOSTS.includes(host)) return 'games';
  if (
    SEARCH_PATTERNS.some((pattern) => pattern.test(host)) ||
    SEARCH_HOSTS.some((domain) => under(host, domain))
  ) {
    return 'search';
  }
  if (SOCIAL_HOSTS.some((domain) => under(host, domain))) return 'social';
  return 'other';
}

/** Phone-sized or not, by the window's width: the only device detail kept. */
export function deviceClass(width: number): 'm' | 'd' {
  return width < 768 ? 'm' : 'd';
}

export function isClickTarget(value: unknown): value is ClickTarget {
  return typeof value === 'string' && (TARGETS as readonly string[]).includes(value);
}

/** The same test Funny Multi's funnel.ts makes. */
export function trackingRefused(win: Window): boolean {
  const nav = win.navigator as Navigator & { globalPrivacyControl?: boolean };
  const legacy = win as Window & { doNotTrack?: string };
  return nav.globalPrivacyControl === true || nav.doNotTrack === '1' || legacy.doNotTrack === '1';
}

/**
 * Starts counting: the visit now, the clicks as they happen. Returns false
 * when nothing will be counted on this page.
 */
export function initTracking(win: Window): boolean {
  const doc = win.document;
  const nav = win.navigator;
  if (trackingRefused(win) || typeof nav.sendBeacon !== 'function') return false;
  const root = doc.documentElement;
  const v = root.dataset.variant;
  const l = root.dataset.code;
  if ((v !== 'a' && v !== 'b') || !l) return false;

  // What this tab already counted: kept in sessionStorage so a reload or a
  // move to another language's page is not a second visit; in memory when
  // storage is blocked.
  const memory = new Set<string>();
  const sent = (token: string): boolean => {
    try {
      return (win.sessionStorage.getItem(SENT_KEY) ?? '').split(',').includes(token);
    } catch {
      return memory.has(token);
    }
  };
  const remember = (token: string): void => {
    memory.add(token);
    try {
      const list = (win.sessionStorage.getItem(SENT_KEY) ?? '').split(',').filter(Boolean);
      if (!list.includes(token)) list.push(token);
      win.sessionStorage.setItem(SENT_KEY, list.join(','));
    } catch {
      // Blocked storage: the in-memory set above is all there is.
    }
  };
  const send = (event: Record<string, string>): void => {
    try {
      nav.sendBeacon('/api/stats', JSON.stringify(event));
    } catch {
      // A beacon the browser refuses is a count lost, nothing more.
    }
  };

  // The referrer the head script handed on when it sent the visit here
  // from `/`; this page's own referrer would be `/` itself.
  let referrer = doc.referrer;
  try {
    const handed = win.sessionStorage.getItem(REFERRER_KEY);
    if (handed !== null) {
      referrer = handed;
      win.sessionStorage.removeItem(REFERRER_KEY);
    }
  } catch {
    // No storage, no hand-off: the page's own referrer stands.
  }
  const r = classifyReferrer(referrer, win.location.host);
  if (r && !sent('view')) {
    send({ e: 'hub_view', v, l, r, d: deviceClass(win.innerWidth) });
    remember('view');
  }

  const onClick = (event: MouseEvent): void => {
    if (event.type === 'auxclick' && event.button !== 1) return;
    const element = event.target instanceof Element ? event.target : null;
    const t = element?.closest('[data-track]')?.getAttribute('data-track');
    if (!isClickTarget(t) || sent(`click:${t}`)) return;
    send({ e: 'hub_click', v, l, t });
    remember(`click:${t}`);
  };
  // Capture: counted before the trailer's own handler swaps its link out.
  doc.addEventListener('click', onClick, true);
  doc.addEventListener('auxclick', onClick, true);
  return true;
}
