// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: the landing page's small drawings, inline so they cost no request
// and scale with the text. All decorative (aria-hidden): the text beside each
// one says what it shows.

const INK = '#1f2937';

function phone(x: number, y: number, screen: string): string {
  return `<rect x="${x}" y="${y}" width="36" height="66" rx="8" fill="#fff" stroke="${INK}" stroke-width="3"/>
<rect x="${x + 6}" y="${y + 8}" width="24" height="44" rx="3" fill="${screen}"/>
<g fill="${INK}"><circle cx="${x + 13}" cy="${y + 24}" r="2.5"/><circle cx="${x + 23}" cy="${y + 24}" r="2.5"/></g>
<path d="M${x + 10} ${y + 32} q8 8 16 0" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>
<circle cx="${x + 18}" cy="${y + 59}" r="2.5" fill="${INK}"/>`;
}

// Funny Multi: three phones, one per player, each grinning at its own answer.
export const FM_ART = `<svg class="art" viewBox="0 0 160 112" width="160" height="112" aria-hidden="true" focusable="false">
<g transform="rotate(-12 40 59)">${phone(22, 26, '#fbcfe8')}</g>
<g>${phone(62, 14, '#fde68a')}</g>
<g transform="rotate(12 120 59)">${phone(102, 26, '#bae6fd')}</g>
<g fill="#ec4899"><path d="M80 4 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/><path d="M14 12 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5z"/><path d="M146 14 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5z"/></g>
</svg>`;

// Funny One: one phone, going round the table.
export const FO_ART = `<svg class="art" viewBox="0 0 160 112" width="160" height="112" aria-hidden="true" focusable="false">
<defs><marker id="fo-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.5" markerHeight="3.5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#ec4899"/></marker></defs>
<g fill="none" stroke="#ec4899" stroke-width="4" stroke-linecap="round" marker-end="url(#fo-arrow)">
<path d="M25.5 40.3 A58 46 0 0 1 134.5 40.3"/><path d="M134.5 71.7 A58 46 0 0 1 25.5 71.7"/>
</g>
<rect x="62" y="23" width="36" height="66" rx="8" fill="#fff" stroke="${INK}" stroke-width="3"/>
<rect x="68" y="31" width="24" height="44" rx="3" fill="#bbf7d0"/>
<g stroke="${INK}" stroke-width="2.5" stroke-linecap="round"><path d="M72 41 h16"/><path d="M72 49 h12"/><path d="M72 57 h16"/><path d="M72 65 h9"/></g>
<circle cx="80" cy="81" r="2.5" fill="${INK}"/>
</svg>`;

// The open-source card: angle brackets.
export const CODE_ART = `<svg class="code-art" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false"><path d="M17 14 7 24l10 10M31 14l10 10-10 10M27 10l-6 28" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const PLAY_ICON = `<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>`;

// The background video's pause/play toggle shows one of the two.
export const PAUSE_PLAY_ICONS = `<svg class="icon-pause" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg><svg class="icon-play" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>`;
