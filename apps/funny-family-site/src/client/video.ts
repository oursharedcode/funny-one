// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: the landing page's video, in each of the two designs.
//
// A — the trailer card is a link to the clip, so it plays without scripts
// too (the browser opens the file). A plain click plays it in place instead,
// with the browser's own controls and the sound on; a click that asks for a
// new tab or window is left to the browser. When the trailer is put on
// YouTube, set YOUTUBE_ID and the card plays YouTube's player instead, from
// youtube-nocookie.com, loaded only on that click. (The games' privacy
// policy has to name YouTube before that ships: the player is a third party
// the visitor's browser then talks to.)
//
// B — the silent loop behind the hero text. Attached only on design B and
// only when the visitor has not asked for less motion or less data; until it
// plays, and instead of it otherwise, the poster frame shows. It stops while
// the hero is off screen or the tab is hidden, and a button on the hero
// pauses it for good (WCAG 2.2.2: anything that moves for more than five
// seconds can be stopped).

export const YOUTUBE_ID = '';

/** A click the browser should handle itself: new tab, new window, download, not the main button. */
function isModifiedClick(event: MouseEvent): boolean {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

export function initTrailer(doc: Document): void {
  const link = doc.querySelector<HTMLAnchorElement>('a.trailer-play');
  if (!link) return;
  link.addEventListener('click', (event) => {
    if (event.defaultPrevented || isModifiedClick(event)) return;
    event.preventDefault();
    const title = link.querySelector('.sr-only')?.textContent ?? '';
    const player = doc.createElement('div');
    player.className = 'player';
    let media: HTMLVideoElement | HTMLIFrameElement;
    if (YOUTUBE_ID) {
      const frame = doc.createElement('iframe');
      frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(YOUTUBE_ID)}?autoplay=1&rel=0&playsinline=1`;
      frame.title = title;
      frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      media = frame;
    } else {
      const video = doc.createElement('video');
      video.controls = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.poster = '/media/poster.webp';
      video.src = link.href;
      video.setAttribute('aria-label', title);
      // Focusable everywhere (Safari does not make a video so by itself), so
      // the focus can move from the link it replaces onto it.
      video.tabIndex = 0;
      media = video;
      // The click is the gesture that lets it start with sound; if the
      // browser still says no, the controls are there to press.
      video.play().catch(() => {});
    }
    player.append(media);
    link.replaceWith(player);
    media.focus();
  });
}

/** Whether the visitor has asked for less motion or less data. */
function wantsStillHero(win: Window): boolean {
  const connection = (win.navigator as Navigator & { connection?: { saveData?: boolean } })
    .connection;
  return (
    win.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true ||
    connection?.saveData === true
  );
}

export function initBackgroundLoop(win: Window): void {
  const doc = win.document;
  if (doc.documentElement.dataset.variant !== 'b' || wantsStillHero(win)) return;
  const hero = doc.querySelector<HTMLElement>('.hero');
  const video = hero?.querySelector<HTMLVideoElement>('video.hero-video');
  const toggle = hero?.querySelector<HTMLButtonElement>('button.bg-toggle');
  if (!hero || !video || !toggle) return;

  for (const [src, type] of [
    ['/media/loop.webm', 'video/webm'],
    ['/media/loop.mp4', 'video/mp4'],
  ] as const) {
    const source = doc.createElement('source');
    source.src = src;
    source.type = type;
    video.append(source);
  }
  video.muted = true;

  let stoppedByVisitor = false;
  let onScreen = true;
  const play = (): void => {
    if (stoppedByVisitor || !onScreen || doc.hidden) return;
    // A refusal (autoplay off, power saving) leaves the poster showing.
    video.play().catch(() => {});
  };
  const showState = (): void => {
    toggle.classList.toggle('is-paused', stoppedByVisitor);
    toggle.setAttribute(
      'aria-label',
      (stoppedByVisitor ? toggle.dataset.resume : toggle.dataset.pause) ?? '',
    );
  };

  video.addEventListener(
    'playing',
    () => {
      hero.classList.add('has-video');
      toggle.hidden = false;
    },
    { once: true },
  );
  toggle.addEventListener('click', () => {
    stoppedByVisitor = !stoppedByVisitor;
    showState();
    if (stoppedByVisitor) video.pause();
    else play();
  });
  doc.addEventListener('visibilitychange', () => {
    if (doc.hidden) video.pause();
    else play();
  });
  if (typeof IntersectionObserver === 'function') {
    new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? true;
      if (onScreen) play();
      else video.pause();
    }).observe(hero);
  }
  play();
}
