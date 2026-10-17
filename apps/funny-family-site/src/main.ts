// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: the landing page's script. The page is whole without it (see
// render/page.ts); this adds the video playing in place, the background loop
// of design B, the picker closing like a menu, the visit counts, and (Step 76)
// the header's Support Author ♥ with its gift sheet and long names shrunk to
// fit a narrow phone.

import './styles/landing.css';
import { initFit } from './client/fit.ts';
import { initLanguageMenu } from './client/languageMenu.ts';
import { initSupport } from './client/support.ts';
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

initFit(window);
initTracking(window);
initLanguageMenu(document);
initTrailer(document);
initBackgroundLoop(window);
void initSupport(window);
