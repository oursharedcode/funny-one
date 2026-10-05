// SPDX-License-Identifier: AGPL-3.0-only

// The URL the in-game footer link and every exported story picture's QR code
// point at: wherever this build is being served from (T-FO-6.2). Derived at
// runtime rather than baked in, so the owner's host
// (`https://www.funny1.oursharedcode.com/` since Step 60) can change domain
// without a rebuild, and a self-hoster's copy points at their own. It used to
// be the GitHub repo, which is private until launch — a dead link for
// players. Unlike Funny Multi there's no room to encode: this is the game's
// home page.

import { baseUrl } from './basePath';

/** Absolute URL of the app's home page, e.g. `https://host/` or `https://host/one/`. */
export function gameUrl(): string {
  return window.location.origin + baseUrl();
}
