// SPDX-License-Identifier: AGPL-3.0-only

import { isStoreShell } from './storeShell';

// Where the QR code on a downloaded story picture and on the 5 s video leads
// (owner decision 2026-10-29): the Funny Family landing page
// (apps/funny-family-site), which shows both games and links both
// repositories. Until then it led to SOURCE_URL. The in-app SourceFooter keeps
// SOURCE_URL — that link is the AGPL's offer of the running program's source;
// an exported file is not the program, so its code can invite people to play.
// Hardcoded like SOURCE_URL: a deployer with a page of their own changes it.
export const LANDING_URL = 'https://www.funny-family.oursharedcode.com/';

/** LANDING_URL as printed under the QR code: no scheme, no trailing slash. */
export const LANDING_URL_TEXT = 'www.funny-family.oursharedcode.com';

// Step 117 (B-29): a golden story's download — the still and the video —
// leads to the Christmas 2026 edition's own page instead (the 11-05 plan's
// "short payment address"), on the website only: inside the Android app it
// keeps LANDING_URL, since the app may carry no payment address. Neither URL
// ever holds a room code or an unlock code: an exported file travels.
export const XMAS_URL = 'https://www.funny-family.oursharedcode.com/xmas';

/** XMAS_URL as printed under the QR code: no scheme. */
export const XMAS_URL_TEXT = 'www.funny-family.oursharedcode.com/xmas';

export interface FooterTarget {
  /** What the QR code encodes. */
  url: string;
  /** The address printed under the label. */
  urlText: string;
  /** The label above it: the family's name, or the edition's. */
  labelKey: 'footer.family' | 'footer.edition';
}

/**
 * Where an exported story's QR code leads and what its footer calls it: a
 * golden story names the edition and, on the website, leads to its page; every
 * other story keeps the landing page under the family's name. The still
 * (downloadStory.ts) and the video (recordWobble.ts) both ask here.
 */
export function footerTarget(golden: boolean): FooterTarget {
  if (!golden) return { url: LANDING_URL, urlText: LANDING_URL_TEXT, labelKey: 'footer.family' };
  if (isStoreShell()) {
    return { url: LANDING_URL, urlText: LANDING_URL_TEXT, labelKey: 'footer.edition' };
  }
  return { url: XMAS_URL, urlText: XMAS_URL_TEXT, labelKey: 'footer.edition' };
}
