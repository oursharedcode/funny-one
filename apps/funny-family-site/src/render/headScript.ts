// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: the one inline script, at the top of every landing page's <head>.
// It runs before anything is drawn, which is the point of both its jobs:
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
//
// Plain ES5 and every storage access guarded: it must not throw on any
// browser, in a private window, or with storage blocked.

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

// The browser-language match is the one Funny One makes (its uiLanguage.ts
// matchLanguageTag): an exact code, then Spanish and Portuguese by region,
// Hebrew's old code, then the primary subtag.
const REDIRECT = `
var codes = ${JSON.stringify(LANGUAGE_CODES)};
function match(tag) {
  var t = String(tag || '').toLowerCase();
  if (!t) return null;
  if (codes.indexOf(t) >= 0) return t;
  var p = t.split('-')[0];
  if (p === 'es') return t === 'es' ? 'es-es' : 'es-419';
  if (p === 'pt') return 'pt-br';
  if (p === 'iw') return 'he';
  return codes.indexOf(p) >= 0 ? p : null;
}
var target = null;
try { var saved = localStorage.getItem('${LANG_KEY}'); if (codes.indexOf(saved) >= 0) target = saved; } catch (e) {}
if (!target) {
  var internal = false;
  try { internal = !!document.referrer && new URL(document.referrer).host === location.host; } catch (e) {}
  if (internal) return;
  var tags = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
  for (var i = 0; i < tags.length && !target; i++) target = match(tags[i]);
}
if (target && target !== 'en') {
  try { sessionStorage.setItem('${REFERRER_KEY}', document.referrer); } catch (e) {}
  d.style.visibility = 'hidden';
  setTimeout(function () { d.style.visibility = ''; }, 1500);
  location.replace('/' + target + '/' + location.search + location.hash);
}`;

/** The script's source, without the <script> tags. `root` adds the language redirect. */
export function headScript(options: { root: boolean }): string {
  return `(function () {${VARIANT}${options.root ? REDIRECT : ''}
})();`;
}
