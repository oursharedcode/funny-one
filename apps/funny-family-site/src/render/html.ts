// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: the pages are plain strings put together at build time, so every
// piece of text that goes into them passes through esc() — the translated
// strings included, since a stray `<` or `"` in a draft must not break the page.

const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Text or an attribute value, safe to put anywhere in HTML. */
export function esc(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ENTITIES[char] ?? char);
}

/**
 * Text that holds one `{link}` placeholder, with the link put in its place.
 * The text is escaped, the link is markup and is not.
 */
export function withLink(text: string, linkHtml: string): string {
  const [before, after = ''] = text.split('{link}');
  return `${esc(before ?? '')}${linkHtml}${esc(after)}`;
}
