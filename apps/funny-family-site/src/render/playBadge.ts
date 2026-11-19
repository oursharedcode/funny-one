// SPDX-License-Identifier: AGPL-3.0-only

// Step 110: Google Play's "Get it on Google Play" badge in each game's card,
// under its Play row, linking to the game's Android app (owner decision
// 2026-11-19). Not shown on an iPhone or an iPad, which have no app: the head
// script marks them <html data-ios> (render/headScript.ts).
//
// The artwork is Google's own, from its badge page: play.google.com/intl/
// en_us/badges/static/images/badges/<code>_badge_web_generic.png, fetched
// 2026-11-19. Each page has its language's in public/media/google-play/
// <page code>.png, served from this site so a visit asks nothing of Google.
// The files are trimmed of their transparent margin and compressed again,
// every pixel as Google drew it. Google's codes differ from the pages' for zh
// (zh-cn), yue (zh-hk), es-es (es), uk (ua) and he (iw). Yoruba has no badge,
// so its page shows the English one. Google's files for he, fa, ar, ta, te
// and bn still show the Play logo from before 2022; they are what its badge
// page hands out for those languages, and the owner chose to keep them
// (2026-11-19) rather than show those pages the English badge.
//
// Google's rules for the badge: unchanged, at least 28px tall, clear space of
// a quarter of its height all round, on a plain background, in the page's
// language. The stylesheet draws it at the Play button's height (52px).

import type { Language } from '@funny/shared';
import { esc } from './html.ts';

/** The trademark line at the foot of every page, in English. */
export const PLAY_TRADEMARK = 'Google Play and the Google Play logo are trademarks of Google LLC.';

// Google draws its badges at two sizes; these languages have the smaller.
const SMALL: readonly Language[] = ['ar', 'bn', 'en', 'fa', 'he', 'ta', 'te', 'yo'];

/** The badge file of a page's language, and its size in pixels. */
export function playBadgeImage(code: Language): { src: string; width: number; height: number } {
  const [width, height] = SMALL.includes(code) ? [564, 168] : [646, 192];
  return { src: `/media/google-play/${code}.png`, width, height };
}

/**
 * A game's badge, read out as "Google Play: <game>". Counted as `<game>-gp`
 * (client/track.ts).
 */
export function playBadge(code: Language, game: 'fm' | 'fo', href: string, name: string): string {
  const { src, width, height } = playBadgeImage(code);
  return `<a class="store-badge" href="${esc(href)}" data-track="${game}-gp"><img src="${src}" alt="Google Play" width="${width}" height="${height}" loading="lazy" decoding="async"><span class="sr-only">: ${esc(name)}</span></a>`;
}
