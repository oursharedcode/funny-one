// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: the one inline script, at the top of every landing page's <head>.
// It runs before anything is drawn, which is the point of all its jobs:
//
//  1. The A/B design. `?v=a|b` forces one; otherwise the tab keeps the one it
//     was first shown, otherwise it is a coin toss. Written to
//     <html data-variant>, which the stylesheet switches on, so the page is
//     never drawn in one design and redrawn in the other.
//  2. On `/` only, the language. English lives there; a visitor whose browser
//     prefers another language the games ship is sent on to that page before
//     the English one shows. A language the visitor picked here before wins
//     over the browser's, and a visitor who came from another page of this
//     site (who chose `/` from the picker or the footer) stays. The original
//     referrer is handed on in sessionStorage so the visit is still counted
//     by where it came from, not as a visit from `/`.
//  3. (Step 110) An iPhone, iPod or iPad, marked <html data-ios>: the
//     stylesheet hides the games' Google Play badges there, where no app
//     installs. An iPad's Safari calls itself a Mac, but a Mac has no touch
//     screen. Before job 2, which may end the script early.
//  4. (Step 119, B-29) On a page with the Christmas 2026 edition's buttons,
//     the end of its free part: from the cut-off the page is marked
//     <html data-xmas="over">, which hides them — "ended" instead for a
//     visitor sent by /x26, who reads that the edition has ended. The page
//     is built once, so the visitor's clock decides. Before job 2 too.
//
// /x26/ has a script of its own, xmasForwardScript(), which makes job 2's
// choice of language and sends the visitor on to that page.
//
// Plain ES5 and every storage access guarded: it must not throw on any
// browser, in a private window, or with storage blocked.

import { cutoffOf, PACKS } from '@funny/shared';
import { LANG_KEY, REFERRER_KEY, VARIANT_KEY } from '../keys.ts';
import { LANGUAGE_CODES } from './locale.ts';

const VARIANT = `
var d = document.documentElement;
var v = null;
try { v = new URLSearchParams(location.search).get('v'); } catch (e) {}
if (v !== 'a' && v !== 'b') { try { v = sessionStorage.getItem('${VARIANT_KEY}'); } catch (e) {} }
if (v !== 'a' && v !== 'b') v = Math.random() < 0.5 ? 'a' : 'b';
try { sessionStorage.setItem('${VARIANT_KEY}', v); } catch (e) {}
d.setAttribute('data-variant', v);`;

const IOS = `
var ua = navigator.userAgent || '';
if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) d.setAttribute('data-ios', '');`;

/** The moment the edition's buttons go: the free part's last day over everywhere. */
export const XMAS_CUTOFF = cutoffOf(PACKS.chr26.freeUntil);

/** The query that marks a visit sent by /x26/ (client/track.ts counts it so). */
export const FROM_XMAS = 'from=xmas';

const XMAS = `
if (Date.now() >= ${XMAS_CUTOFF}) d.setAttribute('data-xmas', /[?&]${FROM_XMAS}(&|$)/.test(location.search) ? 'ended' : 'over');`;

// The browser-language match is the one both games make (matchLanguageTag in
// packages/shared/src/uiLanguage.ts): an exact code, then Spanish and
// Portuguese by region, Hebrew's old code, Hong Kong and Macau Chinese as
// Cantonese, then the primary subtag. `saved` is the language the visitor
// picked here before, `browser` the first of the browser's that matches.
const MATCH = `
var codes = ${JSON.stringify(LANGUAGE_CODES)};
function match(tag) {
  var t = String(tag || '').toLowerCase();
  if (!t) return null;
  if (codes.indexOf(t) >= 0) return t;
  var p = t.split('-')[0];
  if (p === 'es') return t === 'es' ? 'es-es' : 'es-419';
  if (p === 'pt') return 'pt-br';
  if (p === 'iw') return 'he';
  if (p === 'zh' && /-(hk|mo)$/.test(t)) return 'yue';
  return codes.indexOf(p) >= 0 ? p : null;
}
function saved() {
  try { var s = localStorage.getItem('${LANG_KEY}'); if (codes.indexOf(s) >= 0) return s; } catch (e) {}
  return null;
}
function browser() {
  var tags = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
  for (var i = 0; i < tags.length; i++) { var m = match(tags[i]); if (m) return m; }
  return null;
}`;

const REDIRECT = `${MATCH}
var target = saved();
if (!target) {
  var internal = false;
  try { internal = !!document.referrer && new URL(document.referrer).host === location.host; } catch (e) {}
  if (internal) return;
  target = browser();
}
if (target && target !== 'en') {
  try { sessionStorage.setItem('${REFERRER_KEY}', document.referrer); } catch (e) {}
  d.style.visibility = 'hidden';
  setTimeout(function () { d.style.visibility = ''; }, 1500);
  location.replace('/' + target + '/' + location.search + location.hash);
}`;

/**
 * The script's source, without the <script> tags. `root` adds the language
 * redirect, `xmas` the end of the Christmas edition's buttons.
 */
export function headScript(options: { root: boolean; xmas: boolean }): string {
  return `(function () {${VARIANT}${IOS}${options.xmas ? XMAS : ''}${options.root ? REDIRECT : ''}
})();`;
}

/**
 * /x26/'s script (Step 119): the visitor's language as `/` would choose it —
 * the one picked here before, else the browser's, else English — and on to
 * that page, marked as sent from here. Straight there, not by way of `/`:
 * `/` keeps a visitor arriving from this site's own pages in English. Hidden
 * meanwhile, as `/` is, so its fallback for no script does not flash past.
 */
export function xmasForwardScript(): string {
  return `(function () {${MATCH}
var d = document.documentElement;
var target = saved() || browser() || 'en';
d.style.visibility = 'hidden';
setTimeout(function () { d.style.visibility = ''; }, 1500);
location.replace((target === 'en' ? '/' : '/' + target + '/') + '?${FROM_XMAS}' + location.hash);
})();`;
}
