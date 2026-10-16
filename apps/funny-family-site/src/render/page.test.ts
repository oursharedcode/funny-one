// SPDX-License-Identifier: AGPL-3.0-only

import { LANGUAGES } from '@funny/shared';
import { describe, expect, it } from 'vitest';
import { esc, withLink } from './html.ts';
import { HTML_LANG, OG_LOCALE, shortLanguageName } from './locale.ts';
import { assetTags, renderPage } from './page.ts';
import type { EntryAssets } from './page.ts';
import {
  FO_URL,
  fmUrl,
  GITHUB_URL,
  pagePath,
  privacyUrl,
  ROOT_URL,
  SITE_ORIGIN,
} from '../links.ts';
import { GAME_NAMES, STRINGS } from '../strings.ts';

const CODES = LANGUAGES.map((option) => option.code);

const ASSETS: EntryAssets = {
  scripts: ['/assets/main-abc.js'],
  styles: ['/assets/main-abc.css'],
  preloads: ['/assets/chunk-def.js'],
};

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

describe('esc and withLink', () => {
  it('escapes everything HTML gives meaning to', () => {
    expect(esc(`<a href="x" title='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;',
    );
  });

  it('puts the link markup in place of {link} and escapes the text around it', () => {
    expect(withLink('More <b> at {link} & more', '<a href="/">x</a>')).toBe(
      'More &lt;b&gt; at <a href="/">x</a> &amp; more',
    );
    expect(withLink('{link}', '<a>x</a>')).toBe('<a>x</a>');
  });
});

describe('assetTags', () => {
  it('lists styles, then preloads, then scripts', () => {
    expect(assetTags(ASSETS).split('\n')).toEqual([
      '<link rel="stylesheet" href="/assets/main-abc.css">',
      '<link rel="modulepreload" href="/assets/chunk-def.js">',
      '<script type="module" src="/assets/main-abc.js"></script>',
    ]);
  });
});

describe('renderPage', () => {
  it.each(CODES)('%s: the document is in its language, and says so to search engines', (code) => {
    const doc = parse(renderPage(code, ASSETS));
    const html = doc.documentElement;
    expect(html.getAttribute('lang')).toBe(HTML_LANG[code]);
    expect(html.getAttribute('dir')).toBe(code === 'he' || code === 'fa' ? 'rtl' : 'ltr');
    expect(html.dataset.code).toBe(code);
    expect(html.dataset.variant).toBe('a');
    expect(doc.title).toBe(STRINGS[code].metaTitle);
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      `${SITE_ORIGIN}${pagePath(code)}`,
    );

    const alternates = [...doc.querySelectorAll('link[rel="alternate"][hreflang]')].map((link) => [
      link.getAttribute('hreflang'),
      link.getAttribute('href'),
    ]);
    expect(alternates).toEqual([
      ...CODES.map((other) => [HTML_LANG[other], `${SITE_ORIGIN}${pagePath(other)}`]),
      ['x-default', `${SITE_ORIGIN}/`],
    ]);
    expect(doc.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe(
      OG_LOCALE[code],
    );
    expect(doc.querySelectorAll('meta[property="og:locale:alternate"]')).toHaveLength(
      CODES.length - 1,
    );
  });

  it.each(CODES)('%s: every link goes where it should and is counted', (code) => {
    const doc = parse(renderPage(code, ASSETS));
    const tracked = (target: string): string[] =>
      [...doc.querySelectorAll(`a[data-track="${target}"]`)].map(
        (link) => link.getAttribute('href') ?? '',
      );
    expect(tracked('fm')).toEqual([fmUrl(code, 'a'), fmUrl(code, 'a')]);
    expect(tracked('fo')).toEqual([FO_URL, FO_URL]);
    expect(tracked('gh')).toEqual([GITHUB_URL]);
    expect(tracked('video')).toEqual(['/media/clip.mp4']);
    expect(tracked('root')).toEqual([ROOT_URL]);
    expect(doc.querySelector(`a[href="${privacyUrl(code)}"]`)).not.toBeNull();

    const fmButton = doc.querySelector('.hero a[data-track="fm"]');
    expect(fmButton?.textContent).toBe(GAME_NAMES[code].fm);
    expect(doc.querySelector('a[data-track="gh"]')?.textContent).toBe(GAME_NAMES[code].source);
  });

  it.each(CODES)('%s: the picker and the footer list every language', (code) => {
    const doc = parse(renderPage(code, ASSETS));
    for (const list of ['.lang-menu', '.foot-langs']) {
      const links = [...doc.querySelectorAll<HTMLAnchorElement>(`${list} a[data-lang]`)];
      expect(links.map((link) => link.dataset.lang)).toEqual(CODES);
      expect(links.map((link) => link.getAttribute('href'))).toEqual(CODES.map(pagePath));
      const current = links.filter((link) => link.getAttribute('aria-current') === 'page');
      expect(current.map((link) => link.dataset.lang)).toEqual([code]);
    }
    expect(doc.querySelector('details.lang .lang-name')?.textContent).toBe(shortLanguageName(code));
  });

  it('only the English page, at /, sends visitors on to their language', () => {
    const script = (code: (typeof CODES)[number]): string =>
      parse(renderPage(code, ASSETS)).head.querySelector('script:not([src])')?.textContent ?? '';
    expect(script('en')).toContain('location.replace');
    expect(script('ru')).not.toContain('location.replace');
    expect(script('ru')).toContain("setAttribute('data-variant', v)");
  });

  it('loads the built files, and the head script comes first', () => {
    const doc = parse(renderPage('de', ASSETS));
    const scripts = [...doc.head.querySelectorAll('script')];
    expect(scripts[0]?.hasAttribute('src')).toBe(false);
    expect(scripts.at(-1)?.getAttribute('src')).toBe('/assets/main-abc.js');
    expect(doc.head.querySelector('link[rel="stylesheet"]')?.getAttribute('href')).toBe(
      '/assets/main-abc.css',
    );
  });

  it('has both designs: the trailer card (A) and the background loop (B)', () => {
    const doc = parse(renderPage('en', ASSETS));
    expect(doc.querySelector('.va-only a.trailer-play')).not.toBeNull();
    expect(doc.querySelector('.vb-only video.hero-video')).not.toBeNull();
    const toggle = doc.querySelector<HTMLButtonElement>('button.bg-toggle');
    expect(toggle?.hidden).toBe(true);
    expect(toggle?.dataset.pause).toBe(STRINGS.en.videoPause);
    expect(toggle?.dataset.resume).toBe(STRINGS.en.videoResume);
  });
});
