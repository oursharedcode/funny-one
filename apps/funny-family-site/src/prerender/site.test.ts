// SPDX-License-Identifier: AGPL-3.0-only
// @vitest-environment node

import { LANGUAGES } from '@funny/shared';
import { describe, expect, it } from 'vitest';
import { DEV_ASSETS, entryAssets, pageForPath, renderSite } from './site.ts';
import type { BundleItem, SiteAssets } from './site.ts';

const CODES = LANGUAGES.map((option) => option.code);

function chunk(fileName: string, extra: Partial<BundleItem> & { css?: string[] } = {}): BundleItem {
  const { css = [], ...rest } = extra;
  return { type: 'chunk', fileName, viteMetadata: { importedCss: new Set(css) }, ...rest };
}

const BUNDLE: Record<string, BundleItem> = {
  'assets/main-1.js': chunk('assets/main-1.js', {
    name: 'main',
    isEntry: true,
    imports: ['assets/shared-3.js'],
    css: ['assets/main-1.css'],
  }),
  'assets/stats-2.js': chunk('assets/stats-2.js', {
    name: 'stats',
    isEntry: true,
    imports: ['assets/shared-3.js'],
    css: ['assets/stats-2.css'],
  }),
  'assets/shared-3.js': chunk('assets/shared-3.js', {
    imports: ['assets/deep-4.js'],
    css: ['assets/shared-3.css'],
  }),
  'assets/deep-4.js': chunk('assets/deep-4.js', { css: ['assets/deep-4.css'] }),
  'assets/main-1.css': { type: 'asset', fileName: 'assets/main-1.css' },
};

describe('entryAssets', () => {
  it('collects the entry, its imports to preload, and their CSS dependencies first', () => {
    expect(entryAssets(BUNDLE, 'main')).toEqual({
      scripts: ['/assets/main-1.js'],
      preloads: ['/assets/deep-4.js', '/assets/shared-3.js'],
      styles: ['/assets/deep-4.css', '/assets/shared-3.css', '/assets/main-1.css'],
    });
  });

  it('copes with an import cycle and a missing chunk', () => {
    const bundle: Record<string, BundleItem> = {
      'a.js': chunk('a.js', { name: 'main', isEntry: true, imports: ['b.js', 'gone.js'] }),
      'b.js': chunk('b.js', { imports: ['a.js'], css: ['b.css'] }),
    };
    expect(entryAssets(bundle, 'main')).toEqual({
      scripts: ['/a.js'],
      preloads: ['/b.js'],
      styles: ['/b.css'],
    });
  });

  it('fails the build when an entry is missing', () => {
    expect(() => entryAssets(BUNDLE, 'nope')).toThrow(/no entry chunk named "nope"/);
  });
});

describe('renderSite', () => {
  const assets: SiteAssets = {
    main: entryAssets(BUNDLE, 'main'),
    stats: entryAssets(BUNDLE, 'stats'),
  };
  const files = renderSite(assets);

  it('writes one page per language, /stats/, the 404 page and the sitemap', () => {
    expect([...files.keys()].sort()).toEqual(
      [
        ...CODES.map((code) => (code === 'en' ? 'index.html' : `${code}/index.html`)),
        'stats/index.html',
        '404.html',
        'sitemap.xml',
      ].sort(),
    );
  });

  it('gives each page its own entry’s files', () => {
    expect(files.get('ru/index.html')).toContain('src="/assets/main-1.js"');
    expect(files.get('stats/index.html')).toContain('src="/assets/stats-2.js"');
    expect(files.get('stats/index.html')).toContain('<meta name="robots" content="noindex">');
    const notFound = files.get('404.html') ?? '';
    expect(notFound).toContain('href="/assets/main-1.css"');
    expect(notFound).not.toContain('<script');
  });

  it('lists every language page in the sitemap, each with all its alternates', () => {
    const sitemap = files.get('sitemap.xml') ?? '';
    expect(sitemap.match(/<loc>/g)).toHaveLength(CODES.length);
    expect(sitemap.match(/hreflang="x-default"/g)).toHaveLength(CODES.length);
    expect(sitemap).toContain('<loc>https://www.funny-family.oursharedcode.com/ru/</loc>');
  });
});

describe('pageForPath (the dev server)', () => {
  const page = (path: string): string | null => {
    const answer = pageForPath(path, DEV_ASSETS);
    if (!answer) return null;
    if ('redirect' in answer) return `→ ${answer.redirect}`;
    return /<html lang="([^"]+)"/.exec(answer.html)?.[1] ?? '?';
  };

  it('answers the language pages, with a redirect to the trailing slash', () => {
    expect(page('/')).toBe('en');
    expect(page('/index.html')).toBe('en');
    expect(page('/ru/')).toBe('ru');
    expect(page('/ru/index.html')).toBe('ru');
    expect(page('/pt-br/')).toBe('pt-BR');
    expect(page('/ru')).toBe('→ /ru/');
  });

  it('answers /stats/ and the 404 page', () => {
    expect(pageForPath('/stats/')).toMatchObject({
      html: expect.stringContaining('id="stats-root"'),
    });
    expect(pageForPath('/stats/index.html')).toMatchObject({
      html: expect.stringContaining('id="stats-root"'),
    });
    expect(page('/stats')).toBe('→ /stats/');
    expect(pageForPath('/404.html')).toMatchObject({
      html: expect.stringContaining('Page not found'),
    });
  });

  it('leaves everything else to Vite', () => {
    for (const path of [
      '/en/',
      '/en',
      '/xx/',
      '/ruindex.html',
      '/ru/x',
      '/src/main.ts',
      '/flags/ru.png',
    ]) {
      expect(pageForPath(path), path).toBeNull();
    }
  });
});
