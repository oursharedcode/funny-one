// SPDX-License-Identifier: AGPL-3.0-only

// D-10 (owner decision 2026-10-05) — where a finished story's picture comes
// from. Two sources, the player's choice on Home:
//
//   - `builtin` — the rig: SVG layers shipped in the bundle and composed on
//     the device. No network, ever. The default, and the only source in a
//     build that names no picture library.
//   - `online` — the picture library: the cartoons Funny Multi's players see,
//     pre-generated for all 10⁴ combinations of the four visual slots
//     (design.md DD-11) and served publicly by the picture Worker at
//     `/i/<sha256(prompt)>.png`. One GET per story, straight from the device
//     to the Worker. The address is a hash of the four picked options; no
//     name, no identifier and nothing typed rides along (FO-IMG-2, FO-ID-1 as
//     amended by D-10).
//
// The library is only ever an upgrade: every caller falls back to the rig
// when a picture does not arrive (offline, slow, a 404), so a game never ends
// without pictures and airplane mode still plays end to end.

import { buildPrompt } from '@funny/shared';
import type { Story } from '@funny/shared';

export type PictureSource = 'builtin' | 'online';

const STORAGE_KEY = 'funny-one.pictures';

/**
 * The picture Worker's origin this build was given (`VITE_PICTURES_URL`), with
 * no trailing slash, or `null` when the build names none — a self-hoster's
 * copy without a library, where the Home screen offers no choice at all.
 *
 * Read on every call rather than once at module load so a test can stub it.
 */
export function picturesBaseUrl(): string | null {
  const raw: unknown = import.meta.env.VITE_PICTURES_URL;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().replace(/\/+$/, '');
  return /^https?:\/\/\S+$/.test(trimmed) ? trimmed : null;
}

export function onlinePicturesAvailable(): boolean {
  return picturesBaseUrl() !== null;
}

// Storage can throw (private browsing, blocked site data) — a lost preference
// is fine, a crash at boot is not. Same pattern as i18n/uiLanguage.ts.
export function loadPictureSource(): PictureSource {
  if (!onlinePicturesAvailable()) return 'builtin';
  try {
    return localStorage.getItem(STORAGE_KEY) === 'online' ? 'online' : 'builtin';
  } catch {
    return 'builtin';
  }
}

export function storePictureSource(source: PictureSource): void {
  try {
    localStorage.setItem(STORAGE_KEY, source);
  } catch {
    // See loadPictureSource.
  }
}

/**
 * The library address of `story`'s picture, or `null` when there is none to
 * ask for: no library in this build, a story with an unfilled visual slot
 * (`buildPrompt` throws), or no `crypto.subtle` (a page not served over
 * HTTPS). `null` always means "draw the rig".
 *
 * The key must match `cloudflare/worker.js`'s `imageKey` to the character —
 * sha256 of the UTF-8 prompt, lower-case hex — and the prompt must be the one
 * the library was generated from, which is why `buildPrompt` is shared.
 */
export async function libraryPictureUrl(story: Story): Promise<string | null> {
  const base = picturesBaseUrl();
  if (!base) return null;
  try {
    const bytes = new TextEncoder().encode(buildPrompt(story));
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
    return `${base}/i/${hex}.png`;
  } catch {
    return null;
  }
}
