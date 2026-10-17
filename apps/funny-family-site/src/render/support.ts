// SPDX-License-Identifier: AGPL-3.0-only

// Step 76: the header's Support Author ♥ and the gift sheet it opens — the
// landing page's copy of Funny Multi's own (SupportHeart.tsx and
// SupportScreen.tsx in apps/funny-multi-client), so a visitor meets the same
// heart, the same words hopping after it, and the same rails in the same
// order: PayID, GitHub Sponsors, Lightning, Ko-fi, Buy Me a Coffee, the
// donation page.
//
// The rails themselves are not in the page: they live in the games' server
// (DEPLOYER_* env vars, one place for both), and client/support.ts fills
// them in from GET /api/config. So the page carries the ♥ invisible but
// holding its place, and the sheet empty; each row says which rail it shows
// (`data-rail`), the script removes the rows of rails that are not set, and
// takes the ♥ away altogether when none is — or when there is no script.

import type { Language } from '@funny/shared';
import { esc } from './html.ts';
import { SUPPORT_STRINGS } from '../supportStrings.ts';

/**
 * The parts of the label that hop one by one: its words, or — for a label
 * written without spaces, as in Chinese and Japanese — its characters.
 * Grapheme clusters rather than code points, so no script ever has a vowel
 * sign or a combining mark torn from its letter. Funny Multi's own, run here
 * at build time.
 */
export function hopParts(label: string): string[] {
  const words = label.split(/\s+/).filter(Boolean);
  if (words.length !== 1) return words;
  if (typeof Intl.Segmenter !== 'function') return words;
  const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(label);
  return Array.from(graphemes, (part) => part.segment);
}

/**
 * The ♥ and its label, one button whose name is exactly the visible label
 * (WCAG 2.5.3). The heart beats, then the label's parts hop after it, each a
 * little later than the one before (styles/landing.css). It waits invisible
 * (`data-state="pending"`) until the rails arrive.
 */
export function supportButton(code: Language): string {
  const label = SUPPORT_STRINGS[code].openLabel;
  const parts = hopParts(label).map(
    (part, index) =>
      `<span class="hop" style="animation-delay:${200 + index * 110}ms">${esc(part)}</span>`,
  );
  // Words keep the spaces between them; characters never had any.
  const joiner = /\s/.test(label.trim()) ? ' ' : '';
  return `<button class="support-open" type="button" data-state="pending" aria-haspopup="dialog" aria-controls="support-sheet" aria-label="${esc(label)}" data-track="support"><span class="support-heart" aria-hidden="true">♥</span><span class="support-words" aria-hidden="true">${parts.join(joiner)}</span></button>`;
}

// The cup icons of the Ko-fi and Buy Me a Coffee buttons, as Funny Multi
// draws them (from the books page, oursharedcode.github.io).
const KOFI_CUP = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M4 5h12a1 1 0 0 1 1 1v6a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V6a1 1 0 0 1 1-1Z" fill="currentColor" opacity=".95"/><path d="M17 7h1.5a2.5 2.5 0 0 1 0 5H17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M9.6 8.6c.7-.8 1.9-.5 2.1.5.2-1 1.4-1.3 2.1-.5.6.7.3 1.7-.6 2.4l-1.5 1.2-1.5-1.2c-.9-.7-1.2-1.7-.6-2.4Z" fill="#ff5e5b"/><path d="M4 20h13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
const COFFEE_CUP = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M5 8h11v5a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V8Z" fill="currentColor"/><path d="M16 9.5h1.5a2.5 2.5 0 0 1 0 5H16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M8 5.2c0-.8 1-.9 1-1.7M11 5.2c0-.8 1-.9 1-1.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M4 20.5h13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;

// Addresses read left to right on every page, and a translating browser
// leaves them alone.
const ADDRESS = 'dir="ltr" translate="no"';
const NEW_TAB = 'target="_blank" rel="noopener noreferrer"';

/** A rail's name with a short note beside it: "In Australia", "Crypto Bitcoin". */
function railTitle(name: string, note: string): string {
  return `<p class="rail-title">${esc(name)} <span class="rail-note">${esc(note)}</span></p>`;
}

/** The gift sheet, a modal <dialog>: its rows wait for client/support.ts. */
export function supportSheet(code: Language): string {
  const t = SUPPORT_STRINGS[code];
  const [beforeName = '', afterName = ''] = t.payIdBankNote.split('{{name}}');
  const copy = (rail: 'payId' | 'lightningAddress', target: 'payid' | 'lightning'): string =>
    `<button class="rail-copy" type="button" data-copy="${rail}" data-copied="${esc(t.copied)}" data-track="${target}">${esc(t.copy)}</button>`;
  return `<dialog class="sheet" id="support-sheet" aria-labelledby="support-title">
<div class="sheet-inner">
<div class="sheet-head">
<h2 id="support-title">${esc(t.title)}</h2>
<button class="sheet-close" type="button" aria-label="${esc(t.close)}"><span aria-hidden="true">×</span></button>
</div>
<p class="sheet-intro">${esc(t.intro)}</p>
<div class="rail" data-rail="payId">
${railTitle(t.payId, t.payIdWhere)}
<div class="rail-row"><code ${ADDRESS} data-text="payId"></code>${copy('payId', 'payid')}</div>
<p class="rail-hint" data-rail="payIdName">${esc(beforeName)}<span ${ADDRESS} data-text="payIdName"></span>${esc(afterName)}</p>
</div>
<div class="rail" data-rail="sponsorsUrl">
<p class="rail-title">${esc(t.sponsors)}</p>
<a class="rail-link" ${ADDRESS} ${NEW_TAB} data-link="sponsorsUrl" data-text="sponsorsUrl" data-track="sponsors"></a>
<p class="rail-hint">${esc(t.sponsorsHint)}</p>
</div>
<div class="rail" data-rail="lightningAddress">
${railTitle(t.lightning, t.lightningWhat)}
<div class="rail-row"><a class="rail-link" ${ADDRESS} data-link="lightningAddress" data-scheme="lightning:" data-text="lightningAddress" data-track="lightning"></a>${copy('lightningAddress', 'lightning')}</div>
<div class="rail-qr" data-qr="lightningAddress"></div>
</div>
<a class="gift gift-kofi" ${NEW_TAB} data-rail="kofiUrl" data-link="kofiUrl" data-track="kofi">${KOFI_CUP}<span>${esc(t.kofi)}</span></a>
<a class="gift gift-bmc" ${NEW_TAB} data-rail="bmcUrl" data-link="bmcUrl" data-track="bmc">${COFFEE_CUP}<span>${esc(t.bmc)}</span></a>
<a class="rail-donate" ${NEW_TAB} data-rail="donateUrl" data-link="donateUrl" data-track="donate">${esc(t.donate)}</a>
<p class="sr-only" role="status" data-status></p>
</div>
</dialog>`;
}
