// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: one language's landing page, as a complete HTML document. Both
// designs of the A/B test are in every page and the stylesheet shows one,
// by <html data-variant> (render/headScript.ts): `va-only` elements belong to
// design A (a trailer card beside the text), `vb-only` ones to design B (the
// video looping behind it). Without scripts the page is design A.
//
// The page works without JavaScript: every link is a real link, the trailer
// link opens the video file, and the language picker is a <details>. The
// modules in client/ only add on top — the trailer playing in place, the
// background loop, closing the picker, counting visits and clicks, and
// (Step 76) the header's Support Author ♥ with its gift sheet, which only a
// script can fill (render/support.ts). Step 78's QR codes beside the games'
// buttons are drawn here, at build time, and cost the page no script.

import type { Language } from '@funny/shared';
import { CODE_ART, FM_ART, FO_ART, PAUSE_PLAY_ICONS, PLAY_ICON } from './art.ts';
import { esc, withLink } from './html.ts';
import { headScript } from './headScript.ts';
import { supportButton, supportSheet } from './support.ts';
import {
  HTML_LANG,
  isRtl,
  LANGUAGE_CODES,
  languageName,
  OG_LOCALE,
  shortLanguageName,
} from './locale.ts';
import {
  FO_URL,
  fmUrl,
  GITHUB_URL,
  pagePath,
  privacyUrl,
  ROOT_LABEL,
  ROOT_URL,
  SITE_ORIGIN,
} from '../links.ts';
import { qrPath } from '../qr.ts';
import { GAME_NAMES, STRINGS } from '../strings.ts';

/**
 * The side of a game's QR code on a computer, in CSS pixels: 2.5 to 3.2 per
 * module, margin included. On a phone or a tablet the stylesheet sizes it by
 * the screen's density instead — on most phones half that, the height of the
 * button beside it, the least a full row can squeeze it to (Step 82).
 */
const QR_PX = 104;

/** The files a page loads, as Vite built them (or the source modules in dev). */
export interface EntryAssets {
  scripts: readonly string[];
  styles: readonly string[];
  /** Chunks the entry imports, fetched in parallel with it. */
  preloads: readonly string[];
}

export function assetTags(assets: EntryAssets): string {
  return [
    ...assets.styles.map((href) => `<link rel="stylesheet" href="${esc(href)}">`),
    ...assets.preloads.map((href) => `<link rel="modulepreload" href="${esc(href)}">`),
    ...assets.scripts.map((src) => `<script type="module" src="${esc(src)}"></script>`),
  ].join('\n');
}

function flag(code: Language, size: number, lazy: boolean): string {
  return `<img class="flag" src="/flags/${code}.png" alt="" width="${size}" height="${size}"${lazy ? ' loading="lazy"' : ''} decoding="async">`;
}

function head(code: Language, assets: EntryAssets): string {
  const s = STRINGS[code];
  const url = `${SITE_ORIGIN}${pagePath(code)}`;
  const alternates = LANGUAGE_CODES.map(
    (other) =>
      `<link rel="alternate" hreflang="${HTML_LANG[other]}" href="${SITE_ORIGIN}${pagePath(other)}">`,
  );
  const ogAlternates = LANGUAGE_CODES.filter((other) => other !== code).map(
    (other) => `<meta property="og:locale:alternate" content="${OG_LOCALE[other]}">`,
  );
  return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>${headScript({ root: code === 'en' })}</script>
<title>${esc(s.metaTitle)}</title>
<meta name="description" content="${esc(s.metaDescription)}">
<link rel="canonical" href="${url}">
${alternates.join('\n')}
<link rel="alternate" hreflang="x-default" href="${SITE_ORIGIN}/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(s.brand)}">
<meta property="og:title" content="${esc(s.metaTitle)}">
<meta property="og:description" content="${esc(s.metaDescription)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE_ORIGIN}/media/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${OG_LOCALE[code]}">
${ogAlternates.join('\n')}
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#fef3c7">
<meta name="color-scheme" content="light">
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
<link rel="apple-touch-icon" href="/icon-180.png">
${assetTags(assets)}
<noscript><style>.support-open{display:none}</style></noscript>
</head>`;
}

function languagePicker(code: Language): string {
  const s = STRINGS[code];
  const items = LANGUAGE_CODES.map((other) => {
    const current = other === code ? ' aria-current="page"' : '';
    return `<li><a href="${pagePath(other)}" hreflang="${HTML_LANG[other]}" lang="${HTML_LANG[other]}" data-lang="${other}"${current}>${flag(other, 22, true)}<span>${esc(languageName(other))}</span></a></li>`;
  });
  return `<details class="lang">
<summary aria-label="${esc(`${s.langLabel}: ${languageName(code)}`)}">${flag(code, 22, false)}<span class="lang-name">${esc(shortLanguageName(code))}</span><svg class="chevron" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false"><path d="M2 4.5 6 8.5l4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></summary>
<ul class="lang-menu">
${items.join('\n')}
</ul>
</details>`;
}

/** The header; a landing page's (`picker`) also has the ♥ and the language picker. */
export function siteHeader(code: Language, picker: boolean): string {
  const s = STRINGS[code];
  const landing = picker ? `${supportButton(code)}\n${languagePicker(code)}` : '';
  return `<header class="top">
<a class="brand" href="${pagePath(code)}"><img src="/icon-192.png" alt="" width="44" height="44"><span>${esc(s.brand)}</span></a>
${landing}
</header>`;
}

/**
 * Step 78: a game's address as a QR code, so a visitor can open the game on
 * another phone — from a computer's screen, or (Step 82) from a phone or a
 * tablet held out to a friend. Hidden from assistive technology: the link
 * beside it says the same.
 */
function playQr(url: string, only?: 'va-only' | 'vb-only'): string {
  const { size, d } = qrPath(url);
  // Two modules of white all round, the quiet zone a scanner looks for, as
  // the gift sheet's code (client/support.ts).
  const side = size + 4;
  return `<svg class="play-qr${only ? ` ${only}` : ''}" viewBox="-2 -2 ${side} ${side}" width="${QR_PX}" height="${QR_PX}" shape-rendering="crispEdges" aria-hidden="true" focusable="false"><rect x="-2" y="-2" width="${side}" height="${side}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

/**
 * Funny Multi's code, one per design: like the button's link (which main.ts
 * corrects), it tells the game which design the visitor saw, and a code drawn
 * at build time cannot be corrected.
 */
function fmQr(code: Language): string {
  return playQr(fmUrl(code, 'a'), 'va-only') + playQr(fmUrl(code, 'b'), 'vb-only');
}

function hero(code: Language): string {
  const s = STRINGS[code];
  const names = GAME_NAMES[code];
  return `<section class="hero" aria-labelledby="hero-title">
<div class="hero-bg vb-only" aria-hidden="true">
<img class="hero-poster" src="/media/poster.webp" alt="" width="864" height="496" decoding="async">
<video class="hero-video" muted loop playsinline preload="none" tabindex="-1" disablepictureinpicture></video>
<div class="hero-scrim"></div>
</div>
<div class="hero-inner">
<div class="hero-copy">
<h1 id="hero-title">${esc(s.heroTitle)}</h1>
<p class="lead">${esc(s.heroLead)}</p>
<div class="cta">
<div class="cta-item"><span class="cta-row"><a class="btn btn-primary" href="${esc(fmUrl(code, 'a'))}" data-track="fm">${esc(names.fm)}</a>${fmQr(code)}</span><span class="cta-tag">${esc(s.fmTag)}</span></div>
<div class="cta-item"><span class="cta-row"><a class="btn btn-secondary" href="${FO_URL}" data-track="fo">${esc(names.fo)}</a>${playQr(FO_URL)}</span><span class="cta-tag">${esc(s.foTag)}</span></div>
</div>
</div>
<figure class="trailer va-only">
<a class="trailer-play" href="/media/clip.mp4" data-track="video" type="video/mp4"><img src="/media/poster.webp" alt="" width="864" height="496" decoding="async"><span class="play-badge">${PLAY_ICON}</span><span class="sr-only">${esc(s.videoPlay)}</span></a>
<figcaption>${esc(s.videoCaption)}</figcaption>
</figure>
</div>
<button class="bg-toggle vb-only" type="button" hidden aria-label="${esc(s.videoPause)}" data-pause="${esc(s.videoPause)}" data-resume="${esc(s.videoResume)}">${PAUSE_PLAY_ICONS}</button>
</section>`;
}

function games(code: Language): string {
  const s = STRINGS[code];
  const names = GAME_NAMES[code];
  const card = (
    key: 'fm' | 'fo',
    art: string,
    href: string,
    qr: string,
    tag: string,
    text: string,
  ): string =>
    `<article class="game game-${key}">
<div class="game-art">${art}</div>
<h3>${esc(names[key])}</h3>
<p class="tag">${esc(tag)}</p>
<p>${esc(text)}</p>
<div class="game-play"><a class="btn ${key === 'fm' ? 'btn-primary' : 'btn-secondary'}" href="${esc(href)}" data-track="${key}">${esc(s.play)}<span class="sr-only">: ${esc(names[key])}</span></a>${qr}</div>
</article>`;
  return `<section class="games" id="games" aria-labelledby="games-title">
<h2 id="games-title">${esc(s.gamesTitle)}</h2>
<div class="game-grid">
${card('fm', FM_ART, fmUrl(code, 'a'), fmQr(code), s.fmTag, s.fmText)}
${card('fo', FO_ART, FO_URL, playQr(FO_URL), s.foTag, s.foText)}
</div>
</section>`;
}

function how(code: Language): string {
  const s = STRINGS[code];
  const steps = [s.how1, s.how2, s.how3].map(
    (text, i) =>
      `<li><span class="step-n" aria-hidden="true">${i + 1}</span><p>${esc(text)}</p></li>`,
  );
  return `<section class="how" aria-labelledby="how-title">
<div class="wrap">
<h2 id="how-title">${esc(s.howTitle)}</h2>
<ol class="steps">
${steps.join('\n')}
</ol>
</div>
</section>`;
}

function source(code: Language): string {
  const s = STRINGS[code];
  return `<section class="source" aria-labelledby="gh-title">
<div class="source-card">
${CODE_ART}
<div>
<h2 id="gh-title">${esc(s.ghTitle)}</h2>
<p>${esc(s.ghText)}</p>
<a class="btn btn-light" href="${GITHUB_URL}" data-track="gh">${esc(GAME_NAMES[code].source)}</a>
</div>
</div>
</section>`;
}

export function languageList(code: Language | null, label: string): string {
  const items = LANGUAGE_CODES.map((other) => {
    const current = other === code ? ' aria-current="page"' : '';
    return `<li><a href="${pagePath(other)}" hreflang="${HTML_LANG[other]}" lang="${HTML_LANG[other]}" data-lang="${other}"${current}>${flag(other, 18, true)}${esc(languageName(other))}</a></li>`;
  });
  return `<nav class="foot-langs" aria-label="${esc(label)}">
<ul>
${items.join('\n')}
</ul>
</nav>`;
}

function footer(code: Language): string {
  const s = STRINGS[code];
  const root = `<a href="${ROOT_URL}" dir="ltr" data-track="root">${ROOT_LABEL}</a>`;
  return `<footer class="foot">
<div class="wrap">
<p>${esc(s.privacyNote)} <a href="${privacyUrl(code)}">${esc(s.privacyLink)}</a></p>
<p>${withLink(s.footerMore, root)}</p>
${languageList(code, s.langLabel)}
</div>
</footer>`;
}

/** The landing page in one language. */
export function renderPage(code: Language, assets: EntryAssets): string {
  const s = STRINGS[code];
  return `<!doctype html>
<html lang="${HTML_LANG[code]}" dir="${isRtl(code) ? 'rtl' : 'ltr'}" data-code="${code}" data-variant="a">
${head(code, assets)}
<body>
<a class="skip" href="#main">${esc(s.skip)}</a>
${siteHeader(code, true)}
<main id="main">
${hero(code)}
${games(code)}
${how(code)}
${source(code)}
</main>
${footer(code)}
${supportSheet(code)}
</body>
</html>
`;
}
