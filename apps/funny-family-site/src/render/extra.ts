// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: the site's other files — the statistics page's shell, the 404 page
// and the sitemap.

import { esc } from './html.ts';
import { HTML_LANG, LANGUAGE_CODES, languageName } from './locale.ts';
import { assetTags, languageList, siteHeader } from './page.ts';
import type { EntryAssets } from './page.ts';
import { FM_ORIGIN, pagePath, SITE_ORIGIN } from '../links.ts';

function plainHead(title: string, assets: EntryAssets): string {
  return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)}</title>
<meta name="theme-color" content="#fef3c7">
<meta name="color-scheme" content="light">
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
${assetTags(assets)}
</head>`;
}

/**
 * /stats/: the counts the games' server keeps for this page and its funnel,
 * drawn by stats/main.ts. In English only — it is the author's page, public
 * because the counts are anonymous, kept out of search results by `noindex`.
 * The language names come with it, so the script needs no copy of them.
 */
export function renderStatsPage(assets: EntryAssets): string {
  const names = Object.fromEntries(LANGUAGE_CODES.map((code) => [code, languageName(code)]));
  const json = JSON.stringify(names).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en" dir="ltr" data-code="en">
${plainHead('Funny Family — visitor statistics', assets)}
<body class="stats-page">
<a class="skip" href="#main">Skip to content</a>
${siteHeader('en', false)}
<main id="main" class="stats">
<h1>Visitor statistics</h1>
<p class="stats-intro">Visits to <a href="/">the landing page</a>, where they go next, and how many reach the gift options in <a href="${FM_ORIGIN}/">Funny Multi</a>. Anonymous daily counts: no cookies, no addresses, nobody followed from page to page.</p>
<div class="periods" role="group" aria-label="Period">
<button type="button" data-days="7" aria-pressed="false">7 days</button>
<button type="button" data-days="30" aria-pressed="true">30 days</button>
<button type="button" data-days="90" aria-pressed="false">90 days</button>
<button type="button" data-days="365" aria-pressed="false">365 days</button>
</div>
<p class="range" id="stats-status" role="status">Loading…</p>
<noscript><p class="stats-note">This page needs JavaScript to draw the counts.</p></noscript>
<div id="stats-root"></div>
</main>
<script type="application/json" id="language-names">${json}</script>
</body>
</html>
`;
}

/** Any address that is not a page: Caddy answers it with this file and a 404. */
export function renderNotFound(assets: EntryAssets): string {
  return `<!doctype html>
<html lang="en" dir="ltr" data-code="en">
${plainHead('Page not found — Funny Family', assets)}
<body>
${siteHeader('en', false)}
<main id="main" class="not-found">
<h1>Page not found</h1>
<p>There is nothing at this address. Pick a language to go to the home page:</p>
${languageList(null, 'Languages')}
</main>
</body>
</html>
`;
}

/** Every language's page, each listing all of them as alternates. */
export function renderSitemap(): string {
  const alternates = [
    ...LANGUAGE_CODES.map(
      (code) =>
        `    <xhtml:link rel="alternate" hreflang="${HTML_LANG[code]}" href="${SITE_ORIGIN}${pagePath(code)}"/>`,
    ),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_ORIGIN}/"/>`,
  ].join('\n');
  const urls = LANGUAGE_CODES.map(
    (code) => `  <url>
    <loc>${SITE_ORIGIN}${pagePath(code)}</loc>
${alternates}
  </url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}
