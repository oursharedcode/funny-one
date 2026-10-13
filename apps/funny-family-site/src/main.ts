// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: the landing page's script. The page is whole without it (see
// render/page.ts); this adds the video playing in place, the background loop
// of design B, the picker closing like a menu, and the visit counts.

import './styles/landing.css';
import { initLanguageMenu } from './client/languageMenu.ts';
import { initTracking } from './client/track.ts';
import { initBackgroundLoop, initTrailer } from './client/video.ts';

// The built page links Funny Multi as design A's; tell the game which design
// this visitor actually saw (the head script chose it), so its own counts of
// visits from here split by design too.
const variant = document.documentElement.dataset.variant === 'b' ? 'b' : 'a';
for (const link of document.querySelectorAll<HTMLAnchorElement>('a[data-track="fm"]')) {
  const url = new URL(link.href);
  url.searchParams.set('hv', variant);
  link.href = url.href;
}

initTracking(window);
initLanguageMenu(document);
initTrailer(document);
initBackgroundLoop(window);
