// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: the whole site as a list of files, for vite.config.ts. The build
// has two script entries (the landing page's and the statistics page's) and no
// HTML input; once Vite has named the hashed files, this writes every page
// around them. The dev server asks pageForPath() for the same pages with the
// source modules in place of the built ones, so dev and build cannot drift.

import type { Language } from '@funny/shared';
import { renderNotFound, renderSitemap, renderStatsPage } from '../render/extra.ts';
import { LANGUAGE_CODES } from '../render/locale.ts';
import { renderPage } from '../render/page.ts';
import type { EntryAssets } from '../render/page.ts';

export interface SiteAssets {
  /** src/main.ts: the landing pages and the 404 page (styles only). */
  main: EntryAssets;
  /** src/stats/main.ts: /stats/. */
  stats: EntryAssets;
}

/** The dev server's pages load the source modules; Vite serves them transformed. */
export const DEV_ASSETS: SiteAssets = {
  main: { scripts: ['/src/main.ts'], styles: [], preloads: [] },
  stats: { scripts: ['/src/stats/main.ts'], styles: [], preloads: [] },
};

/** What generateBundle needs of a bundle entry: Vite's OutputChunk, structurally. */
export interface BundleItem {
  type: string;
  fileName: string;
  name?: string;
  isEntry?: boolean;
  imports?: readonly string[];
  viteMetadata?: { importedCss: ReadonlySet<string> };
}

/**
 * The files an entry chunk needs in its page: itself, the chunks it imports
 * (to preload) and the CSS of all of them, dependencies' CSS first.
 */
export function entryAssets(bundle: Record<string, BundleItem>, name: string): EntryAssets {
  const entry = Object.values(bundle).find(
    (item) => item.type === 'chunk' && item.isEntry === true && item.name === name,
  );
  if (!entry) throw new Error(`funny-family-site: no entry chunk named "${name}" in the bundle`);
  const styles: string[] = [];
  const preloads: string[] = [];
  const seen = new Set<string>();
  const visit = (item: BundleItem): void => {
    if (seen.has(item.fileName)) return;
    seen.add(item.fileName);
    for (const imported of item.imports ?? []) {
      const chunk = bundle[imported];
      if (!chunk) continue;
      visit(chunk);
      // A chunk can import back from the entry; the entry is not its own preload.
      if (chunk !== entry && !preloads.includes(`/${chunk.fileName}`)) {
        preloads.push(`/${chunk.fileName}`);
      }
    }
    for (const css of item.viteMetadata?.importedCss ?? []) {
      if (!styles.includes(`/${css}`)) styles.push(`/${css}`);
    }
  };
  visit(entry);
  return { scripts: [`/${entry.fileName}`], styles, preloads };
}

/** The 404 page has the landing page's look and none of its scripts. */
function stylesOnly(assets: EntryAssets): EntryAssets {
  return { scripts: [], styles: assets.styles, preloads: [] };
}

function pageFile(code: Language): string {
  return code === 'en' ? 'index.html' : `${code}/index.html`;
}

/** Every generated file of the site: its path under dist/ → its contents. */
export function renderSite(assets: SiteAssets): Map<string, string> {
  const files = new Map<string, string>();
  for (const code of LANGUAGE_CODES) files.set(pageFile(code), renderPage(code, assets.main));
  files.set('stats/index.html', renderStatsPage(assets.stats));
  files.set('404.html', renderNotFound(stylesOnly(assets.main)));
  files.set('sitemap.xml', renderSitemap());
  return files;
}

/**
 * The dev server's answer for a path: a page, a redirect to the same path
 * with its trailing slash (as Caddy's file server does), or null for anything
 * that is not a page — Vite serves that itself.
 */
export function pageForPath(
  pathname: string,
  assets: SiteAssets = DEV_ASSETS,
): { html: string } | { redirect: string } | null {
  if (pathname === '/' || pathname === '/index.html')
    return { html: renderPage('en', assets.main) };
  if (pathname === '/stats/') return { html: renderStatsPage(assets.stats) };
  if (pathname === '/404.html') return { html: renderNotFound(stylesOnly(assets.main)) };
  const match = /^\/([a-z0-9-]+)(?:(\/)(?:index\.html)?)?$/.exec(pathname);
  if (!match) return null;
  const [, segment = '', slash] = match;
  const isPage = segment === 'stats' || (LANGUAGE_CODES as readonly string[]).includes(segment);
  if (!isPage || segment === 'en') return null;
  if (!slash) return { redirect: `/${segment}/` };
  if (segment === 'stats') return { html: renderStatsPage(assets.stats) };
  return { html: renderPage(segment as Language, assets.main) };
}
