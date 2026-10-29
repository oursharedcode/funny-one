// SPDX-License-Identifier: AGPL-3.0-only

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
