// SPDX-License-Identifier: AGPL-3.0-only

import { LANGUAGES } from '@funny/shared';
import { describe, expect, it } from 'vitest';
import { esc, withLink } from './html.ts';
import { renderNotFound, renderStatsPage } from './extra.ts';
import { HTML_LANG, OG_LOCALE, shortLanguageName } from './locale.ts';
import { assetTags, renderPage } from './page.ts';
import type { EntryAssets } from './page.ts';
import { hopParts } from './support.ts';
import {
  FO_URL,
  fmUrl,
  GITHUB_URL,
  pagePath,
  privacyUrl,
  ROOT_URL,
  SITE_ORIGIN,
} from '../links.ts';
import { qrPath } from '../qr.ts';
import { GAME_NAMES, STRINGS } from '../strings.ts';
import { SUPPORT_STRINGS } from '../supportStrings.ts';

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
    expect(html.getAttribute('dir')).toBe(
      code === 'he' || code === 'fa' || code === 'ar' ? 'rtl' : 'ltr',
    );
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

describe("the games' QR codes (Step 78)", () => {
  // Each code as its classes and its drawing, which qr.test.ts ties to the text.
  const codes = (box: Element | undefined): [string | null, string | null][] =>
    [...(box?.querySelectorAll('svg.play-qr') ?? [])].map((svg) => [
      svg.getAttribute('class'),
      svg.querySelector('path')?.getAttribute('d') ?? null,
    ]);

  it.each(CODES)(
    "%s: beside each game's button, the button's address; Funny Multi's once per design",
    (code) => {
      const doc = parse(renderPage(code, ASSETS));
      const fm = [
        ['play-qr va-only', qrPath(fmUrl(code, 'a')).d],
        ['play-qr vb-only', qrPath(fmUrl(code, 'b')).d],
      ];
      const fo = [['play-qr', qrPath(FO_URL).d]];
      // The hero's two buttons, then the two cards' "Play now".
      for (const selector of ['.hero .cta-item', '.game-play']) {
        const [fmBox, foBox, ...rest] = doc.querySelectorAll(selector);
        expect(rest).toEqual([]);
        expect(fmBox?.querySelector('a')?.dataset.track).toBe('fm');
        expect(codes(fmBox)).toEqual(fm);
        expect(foBox?.querySelector('a')?.dataset.track).toBe('fo');
        expect(codes(foBox)).toEqual(fo);
      }
      expect(doc.querySelectorAll('svg.play-qr')).toHaveLength(6);
    },
  );

  it("each code shares its button's row, the hero's line under both (Step 82)", () => {
    const doc = parse(renderPage('he', ASSETS));
    const children = (box: Element | null | undefined): (string | null)[] =>
      [...(box?.children ?? [])].map((child) =>
        child.tagName === 'A' ? 'button' : child.getAttribute('class'),
      );
    const fm = ['button', 'play-qr va-only', 'play-qr vb-only'];
    const fo = ['button', 'play-qr'];
    const [fmItem, foItem] = doc.querySelectorAll('.hero .cta-item');
    expect(children(fmItem)).toEqual(['cta-row', 'cta-tag']);
    expect(children(fmItem?.querySelector('.cta-row'))).toEqual(fm);
    expect(children(foItem)).toEqual(['cta-row', 'cta-tag']);
    expect(children(foItem?.querySelector('.cta-row'))).toEqual(fo);
    const [fmCard, foCard] = doc.querySelectorAll('.game-play');
    expect(children(fmCard)).toEqual(fm);
    expect(children(foCard)).toEqual(fo);
  });

  it('each has the quiet zone a scanner looks for, and is neither read out nor focused', () => {
    // In page order: the hero's three codes, then the cards' three.
    const urls = [fmUrl('he', 'a'), fmUrl('he', 'b'), FO_URL];
    const svgs = [...parse(renderPage('he', ASSETS)).querySelectorAll('svg.play-qr')];
    expect(svgs).toHaveLength(6);
    svgs.forEach((svg, i) => {
      const side = qrPath(urls[i % 3] ?? '').size + 4;
      expect(svg.getAttribute('viewBox')).toBe(`-2 -2 ${side} ${side}`);
      const paper = svg.querySelector('rect');
      expect(
        ['x', 'y', 'width', 'height', 'fill'].map((name) => paper?.getAttribute(name)),
      ).toEqual(['-2', '-2', String(side), String(side), '#fff']);
      expect(svg.getAttribute('aria-hidden')).toBe('true');
      expect(svg.getAttribute('focusable')).toBe('false');
      expect(svg.closest('a')).toBeNull();
    });
  });
});

describe('the Support Author ♥ and its gift sheet (Step 76)', () => {
  it.each(CODES)(
    '%s: the ♥ sits between the name and the picker, waiting for its rails',
    (code) => {
      const doc = parse(renderPage(code, ASSETS));
      const label = SUPPORT_STRINGS[code].openLabel;
      const header = doc.querySelector('header.top');
      expect([...(header?.children ?? [])].map((child) => child.className)).toEqual([
        'brand',
        'support-open',
        'lang',
      ]);
      const open = doc.querySelector<HTMLButtonElement>('button.support-open');
      expect(open?.getAttribute('type')).toBe('button');
      expect(open?.dataset.state).toBe('pending');
      expect(open?.getAttribute('aria-label')).toBe(label);
      expect(open?.getAttribute('aria-controls')).toBe('support-sheet');
      expect(open?.dataset.track).toBe('support');
      expect(open?.querySelector('.support-heart')?.textContent).toBe('♥');
      // The words hop one after another, and together still read as the label.
      expect(open?.querySelector('.support-words')?.textContent).toBe(label);
      const delays = [...(open?.querySelectorAll('.hop') ?? [])].map((hop) =>
        hop.getAttribute('style'),
      );
      expect(delays).toEqual(hopParts(label).map((_, i) => `animation-delay:${200 + i * 110}ms`));
    },
  );

  it.each(CODES)('%s: the sheet has the rows of the game, in its order and language', (code) => {
    const doc = parse(renderPage(code, ASSETS));
    const t = SUPPORT_STRINGS[code];
    const sheet = doc.querySelector('dialog#support-sheet');
    expect(sheet?.hasAttribute('open')).toBe(false);
    expect(doc.getElementById(sheet?.getAttribute('aria-labelledby') ?? '')?.textContent).toBe(
      t.title,
    );
    expect(sheet?.querySelector('.sheet-intro')?.textContent).toBe(t.intro);
    expect(sheet?.querySelector('.sheet-close')?.getAttribute('aria-label')).toBe(t.close);

    const rows = [...(sheet?.querySelectorAll<HTMLElement>('[data-rail]') ?? [])];
    expect(rows.map((row) => row.dataset.rail)).toEqual([
      'payId',
      'payIdName',
      'sponsorsUrl',
      'lightningAddress',
      'kofiUrl',
      'bmcUrl',
      'donateUrl',
    ]);
    expect([...(sheet?.querySelectorAll('.rail-title') ?? [])].map((p) => p.textContent)).toEqual([
      `${t.payId} ${t.payIdWhere}`,
      t.sponsors,
      `${t.lightning} ${t.lightningWhat}`,
    ]);
    // The account name goes where the translation puts it.
    const bankNote = sheet?.querySelector('[data-rail="payIdName"]');
    expect(bankNote?.textContent).toBe(t.payIdBankNote.replace('{{name}}', ''));
    expect(bankNote?.querySelector('[data-text="payIdName"]')).not.toBeNull();
    expect(sheet?.querySelector('.gift-kofi')?.textContent).toBe(t.kofi);
    expect(sheet?.querySelector('.gift-bmc')?.textContent).toBe(t.bmc);
    expect(sheet?.querySelector('.rail-donate')?.textContent).toBe(t.donate);
    const copies = [...(sheet?.querySelectorAll<HTMLElement>('button[data-copy]') ?? [])];
    expect(copies.map((button) => [button.textContent, button.dataset.copied])).toEqual([
      [t.copy, t.copied],
      [t.copy, t.copied],
    ]);

    // Every rail is counted, and none links anywhere until the script fills it in.
    const tracked = [...(sheet?.querySelectorAll<HTMLElement>('[data-track]') ?? [])];
    expect(tracked.map((element) => element.dataset.track)).toEqual([
      'payid',
      'sponsors',
      'lightning',
      'lightning',
      'kofi',
      'bmc',
      'donate',
    ]);
    expect(sheet?.querySelectorAll('a[href]')).toHaveLength(0);
    for (const link of sheet?.querySelectorAll('a[target="_blank"]') ?? [])
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('without scripts there is no ♥ to press', () => {
    const doc = parse(renderPage('en', ASSETS));
    expect(doc.head.querySelector('noscript')?.textContent).toContain(
      '.support-open{display:none}',
    );
  });

  it('the stats page and the 404 page have neither', () => {
    for (const html of [renderStatsPage(ASSETS), renderNotFound(ASSETS)]) {
      expect(html).not.toContain('support-open');
      expect(html).not.toContain('support-sheet');
    }
  });

  it('hops word by word, or character by character where words have no spaces', () => {
    expect(hopParts('Support Author')).toEqual(['Support', 'Author']);
    expect(hopParts('  Поддержать   автора ')).toEqual(['Поддержать', 'автора']);
    expect(hopParts('支持作者')).toEqual(['支', '持', '作', '者']);
    // A letter and its combining accent hop together.
    expect(hopParts('Café')).toEqual(['C', 'a', 'f', 'é']);
  });
});
