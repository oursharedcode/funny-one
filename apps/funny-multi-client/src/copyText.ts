// SPDX-License-Identifier: AGPL-3.0-only

// Copies a text to the clipboard: the Clipboard API where the browser grants
// it, else a hidden textarea and execCommand — an older browser, or a page
// the API refuses. Resolves when done either way; the caller shows "Copied!".
// One place for the Support sheet's copy buttons and the pay page's (Step 124).

function fallbackCopy(value: string): void {
  const ta = document.createElement('textarea');
  ta.value = value;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } catch {
    // Nothing more to try: the text is on the screen to copy by hand.
  }
  document.body.removeChild(ta);
}

export async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Refused: the old way below.
    }
  }
  fallbackCopy(value);
}
