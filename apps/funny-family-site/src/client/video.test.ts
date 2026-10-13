// SPDX-License-Identifier: AGPL-3.0-only

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { initBackgroundLoop, initTrailer } from './video.ts';

// jsdom has no media playback: record the calls instead.
let play: Mock<() => Promise<void>>;
let pause: Mock<() => void>;
beforeEach(() => {
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(play);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pause);
});

describe('initTrailer (design A)', () => {
  beforeEach(() => {
    document.body.innerHTML = `<figure>
      <a class="trailer-play" href="/media/clip.mp4"><img alt=""><span class="sr-only">Play the trailer</span></a>
    </figure>`;
    // A click the trailer leaves alone must not reach jsdom's navigation.
    document.addEventListener('click', (event) => event.preventDefault());
    initTrailer(document);
  });

  it('plays the clip in place on a plain click', () => {
    document
      .querySelector('.trailer-play img')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    expect(document.querySelector('a.trailer-play')).toBeNull();
    const video = document.querySelector<HTMLVideoElement>('figure > .player > video');
    expect(video?.controls).toBe(true);
    expect(video?.getAttribute('src')).toMatch(/\/media\/clip\.mp4$/);
    expect(video?.getAttribute('aria-label')).toBe('Play the trailer');
    expect(play).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(video);
  });

  it('leaves a click for a new tab or window to the browser', () => {
    for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }]) {
      document
        .querySelector('.trailer-play')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ...init }));
    }
    expect(document.querySelector('a.trailer-play')).not.toBeNull();
    expect(play).not.toHaveBeenCalled();
  });
});

describe('initBackgroundLoop (design B)', () => {
  function setUp(variant: string, navigator: object = {}, reduceMotion = false) {
    document.documentElement.dataset.variant = variant;
    document.body.innerHTML = `<section class="hero">
      <video class="hero-video" muted loop playsinline preload="none"></video>
      <button class="bg-toggle" type="button" hidden aria-label="Pause" data-pause="Pause" data-resume="Play"></button>
    </section>`;
    const win = {
      document,
      navigator,
      matchMedia: (query: string) => ({ matches: reduceMotion && query.includes('reduce') }),
    } as unknown as Window;
    initBackgroundLoop(win);
    return {
      hero: document.querySelector<HTMLElement>('.hero')!,
      video: document.querySelector<HTMLVideoElement>('video.hero-video')!,
      toggle: document.querySelector<HTMLButtonElement>('button.bg-toggle')!,
    };
  }

  it('starts the silent loop, WebM first, and shows the button once it plays', () => {
    const { hero, video, toggle } = setUp('b');
    expect(
      [...video.querySelectorAll('source')].map((source) => source.getAttribute('src')),
    ).toEqual(['/media/loop.webm', '/media/loop.mp4']);
    expect(video.muted).toBe(true);
    expect(play).toHaveBeenCalledTimes(1);
    expect(toggle.hidden).toBe(true);
    video.dispatchEvent(new Event('playing'));
    expect(hero.classList.contains('has-video')).toBe(true);
    expect(toggle.hidden).toBe(false);
  });

  it('stops for good when the visitor presses the button, and starts again on the next press', () => {
    const { toggle } = setUp('b');
    toggle.click();
    expect(pause).toHaveBeenCalledTimes(1);
    expect(toggle.getAttribute('aria-label')).toBe('Play');
    expect(toggle.classList.contains('is-paused')).toBe(true);
    toggle.click();
    expect(play).toHaveBeenCalledTimes(2);
    expect(toggle.getAttribute('aria-label')).toBe('Pause');
  });

  it.each([
    ['design A', 'a', {}, false],
    ['less motion asked for', 'b', {}, true],
    ['data saving on', 'b', { connection: { saveData: true } }, false],
  ] as const)('stays a still picture with %s', (_name, variant, navigator, reduceMotion) => {
    const { video } = setUp(variant, navigator, reduceMotion);
    expect(video.querySelector('source')).toBeNull();
    expect(play).not.toHaveBeenCalled();
  });
});
