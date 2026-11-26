// SPDX-License-Identifier: AGPL-3.0-only

// The Christmas edition's two buttons (render/page.ts, owner request
// 2026-11-26): a mouse over either rings sleigh bells — Funny Multi's own
// (public/media/sleigh-bells.mp3, CC0, see the README) — which fade out when
// the mouse leaves; and Escape hides the tooltip the stylesheet shows on
// hover and focus, as WCAG 1.4.13 asks, until the mouse or the focus leaves.
//
// Browsers let a page sound only once the visitor has clicked, tapped or
// typed on it: before that the bells stay silent, and nothing else changes.
//
// A touch screen has no hover (owner's pick "1 + jingle", 2026-11-26): the
// stylesheet shows the line as a caption under the button, and a tap — which
// browsers do let sound — rings the bells for JINGLE_MS before the game opens.

export const BELLS_URL = '/media/sleigh-bells.mp3';
/** Not the full strength: the visitor did not ask for a sound. */
export const BELLS_VOLUME = 0.5;
/** How long the bells take to fade once the mouse leaves. */
export const FADE_MS = 400;
/** How long a tap's bells ring before the game opens. */
export const JINGLE_MS = 400;
const FADE_STEPS = 8;

/**
 * Returns a stop that takes the page-wide listeners off again (for the tests).
 * `go` opens the game after a tap's jingle (replaced in the tests).
 */
export function initXmasButtons(
  win: Window & typeof globalThis,
  go: (url: string) => void = (url) => win.location.assign(url),
): () => void {
  const doc = win.document;
  const wraps = [...doc.querySelectorAll<HTMLElement>('.xmas-wrap')];
  const off = new AbortController();
  if (wraps.length === 0) return () => off.abort();

  let bells: HTMLAudioElement | null = null;
  let fading: number | undefined;
  let leaving: number | undefined;
  const audio = (): HTMLAudioElement | null => {
    if (!bells && typeof win.Audio === 'function') {
      const a = new win.Audio(BELLS_URL);
      a.preload = 'auto';
      bells = a;
    }
    return bells;
  };
  // Fetched with the first move of a mouse anywhere on the page, so the first
  // hover rings at once; on a touch screen, at once, so a tap rings at once.
  const warm = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse') return;
    doc.removeEventListener('pointermove', warm);
    audio();
  };
  doc.addEventListener('pointermove', warm, { signal: off.signal });
  if (win.matchMedia?.('(hover: none)').matches) audio();

  const ring = (): void => {
    const a = audio();
    if (!a) return;
    win.clearInterval(fading);
    fading = undefined;
    a.volume = BELLS_VOLUME;
    a.currentTime = 0;
    // Refused until the visitor has clicked or typed on the page: then silent.
    a.play().catch(() => {});
  };
  const hush = (): void => {
    const a = bells;
    if (!a || a.paused || fading !== undefined) return;
    let step = 0;
    fading = win.setInterval(() => {
      step += 1;
      if (step >= FADE_STEPS) {
        win.clearInterval(fading);
        fading = undefined;
        a.pause();
        a.volume = BELLS_VOLUME;
        return;
      }
      a.volume = BELLS_VOLUME * (1 - step / FADE_STEPS);
    }, FADE_MS / FADE_STEPS);
  };
  // Back to this page from the game (the back-forward cache): quiet, and
  // ready for another tap.
  win.addEventListener(
    'pagehide',
    () => {
      bells?.pause();
      win.clearTimeout(leaving);
      leaving = undefined;
    },
    { signal: off.signal },
  );

  for (const wrap of wraps) {
    const button = wrap.querySelector<HTMLAnchorElement>('.btn-xmas');
    if (!button) continue;
    button.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') ring();
    });
    button.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'mouse') hush();
    });
    // A tap: the bells, then the game. A mouse click, a key or a click that
    // opens a new tab goes at once, as any link.
    let pointer = '';
    button.addEventListener('pointerdown', (event) => {
      pointer = event.pointerType;
    });
    button.addEventListener('click', (event) => {
      const tapped = pointer === 'touch' || pointer === 'pen';
      pointer = '';
      if (!tapped || event.defaultPrevented || event.button !== 0) return;
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (leaving !== undefined) return;
      ring();
      const url = button.href;
      leaving = win.setTimeout(() => {
        leaving = undefined;
        go(url);
      }, JINGLE_MS);
    });
    // Escape hides the tooltip until the mouse leaves the button and its
    // tooltip, or the focus leaves the button.
    const show = (): void => {
      delete wrap.dataset.tipHidden;
    };
    wrap.addEventListener('pointerleave', show);
    button.addEventListener('blur', show);
    doc.addEventListener(
      'keydown',
      (event) => {
        if (event.key !== 'Escape') return;
        if (wrap.matches(':hover') || wrap.contains(doc.activeElement)) wrap.dataset.tipHidden = '';
      },
      { signal: off.signal },
    );
  }
  return () => {
    win.clearInterval(fading);
    win.clearTimeout(leaving);
    off.abort();
  };
}
