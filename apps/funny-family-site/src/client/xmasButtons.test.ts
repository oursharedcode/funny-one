// SPDX-License-Identifier: AGPL-3.0-only

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { BELLS_URL, BELLS_VOLUME, FADE_MS, JINGLE_MS, initXmasButtons } from './xmasButtons.ts';

// jsdom has no media playback and no PointerEvent: record the calls, and send
// mouse events carrying a pointer type.
let play: Mock<() => Promise<void>>;
let pause: Mock<() => void>;
let made: HTMLAudioElement[];
let stop: (() => void) | undefined;

function init(): void {
  stop = initXmasButtons(window);
}

function pointer(type: string, pointerType: string): Event {
  const event = new MouseEvent(type, { bubbles: type === 'pointermove' });
  Object.defineProperty(event, 'pointerType', { value: pointerType });
  return event;
}

function button(place: 'top' | 'foot'): HTMLAnchorElement {
  return document.querySelector<HTMLAnchorElement>(`[data-track="xm-${place}"]`)!;
}

function wrap(place: 'top' | 'foot'): HTMLElement {
  return button(place).parentElement!;
}

beforeEach(() => {
  vi.useFakeTimers();
  made = [];
  play = vi.fn(function (this: HTMLMediaElement) {
    Object.defineProperty(this, 'paused', { value: false, configurable: true });
    return Promise.resolve();
  });
  pause = vi.fn(function (this: HTMLMediaElement) {
    Object.defineProperty(this, 'paused', { value: true, configurable: true });
  });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(play);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pause);
  const RealAudio = window.Audio;
  vi.stubGlobal(
    'Audio',
    class extends RealAudio {
      constructor(src?: string) {
        super(src);
        made.push(this);
      }
    },
  );
  document.body.innerHTML = ['top', 'foot']
    .map(
      (place) => `<div class="xmas xmas-${place}"><span class="xmas-wrap">
        <a class="btn btn-xmas" href="/x" data-track="xm-${place}" aria-describedby="xmas-tip-${place}">Christmas</a>
        <span class="xmas-tip" id="xmas-tip-${place}" role="tooltip">Hint</span></span></div>`,
    )
    .join('');
});

afterEach(() => {
  stop?.();
  stop = undefined;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('initXmasButtons: the bells', () => {
  it('rings from the start, not at full strength, when a mouse comes over a button', () => {
    init();
    button('top').dispatchEvent(pointer('pointerenter', 'mouse'));
    expect(made).toHaveLength(1);
    expect(made[0]!.src).toContain(BELLS_URL);
    expect(made[0]!.volume).toBe(BELLS_VOLUME);
    expect(play).toHaveBeenCalledTimes(1);
    // The other button rings the same bells again, from the start.
    button('foot').dispatchEvent(pointer('pointerenter', 'mouse'));
    expect(made).toHaveLength(1);
    expect(play).toHaveBeenCalledTimes(2);
    expect(made[0]!.currentTime).toBe(0);
  });

  it('fetches the bells with the first mouse move, before any hover', () => {
    init();
    document.body.dispatchEvent(pointer('pointermove', 'touch'));
    expect(made).toHaveLength(0);
    document.body.dispatchEvent(pointer('pointermove', 'mouse'));
    expect(made).toHaveLength(1);
    expect(made[0]!.preload).toBe('auto');
    expect(play).not.toHaveBeenCalled();
  });

  it('does not ring when a finger merely comes over a button', () => {
    init();
    button('top').dispatchEvent(pointer('pointerenter', 'touch'));
    button('top').dispatchEvent(pointer('pointerenter', 'pen'));
    expect(made).toHaveLength(0);
    expect(play).not.toHaveBeenCalled();
  });

  it('fades out and stops when the mouse leaves', () => {
    init();
    button('top').dispatchEvent(pointer('pointerenter', 'mouse'));
    button('top').dispatchEvent(pointer('pointerleave', 'mouse'));
    vi.advanceTimersByTime(FADE_MS / 2);
    expect(made[0]!.volume).toBeLessThan(BELLS_VOLUME);
    expect(made[0]!.volume).toBeGreaterThan(0);
    expect(pause).not.toHaveBeenCalled();
    vi.advanceTimersByTime(FADE_MS);
    expect(pause).toHaveBeenCalledTimes(1);
    // Ready for the next hover at its usual strength.
    expect(made[0]!.volume).toBe(BELLS_VOLUME);
  });

  it('rings again at full strength if the mouse comes back during the fade', () => {
    init();
    button('top').dispatchEvent(pointer('pointerenter', 'mouse'));
    button('top').dispatchEvent(pointer('pointerleave', 'mouse'));
    vi.advanceTimersByTime(FADE_MS / 2);
    button('top').dispatchEvent(pointer('pointerenter', 'mouse'));
    expect(made[0]!.volume).toBe(BELLS_VOLUME);
    vi.advanceTimersByTime(FADE_MS * 2);
    expect(pause).not.toHaveBeenCalled();
  });

  it('carries on quietly when the browser will not sound yet', async () => {
    play.mockImplementation(() => Promise.reject(new DOMException('no', 'NotAllowedError')));
    init();
    expect(() => button('top').dispatchEvent(pointer('pointerenter', 'mouse'))).not.toThrow();
    await Promise.resolve();
    button('top').dispatchEvent(pointer('pointerleave', 'mouse'));
    vi.advanceTimersByTime(FADE_MS * 2);
  });

  it('does nothing on a page without the buttons', () => {
    document.body.innerHTML = '<main></main>';
    init();
    document.body.dispatchEvent(pointer('pointermove', 'mouse'));
    expect(made).toHaveLength(0);
  });
});

describe('initXmasButtons: a tap on a touch screen', () => {
  let go: Mock<(url: string) => void>;
  const touchScreen = (yes: boolean): void => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: yes && query === '(hover: none)' }));
  };
  const click = (place: 'top' | 'foot', init: MouseEventInit = {}): MouseEvent => {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...init });
    button(place).dispatchEvent(event);
    return event;
  };
  beforeEach(() => {
    go = vi.fn();
    touchScreen(true);
  });
  const start = (): void => {
    stop = initXmasButtons(window, go);
  };

  it('fetches the bells at once on a touch screen, and not on a desktop', () => {
    touchScreen(false);
    start();
    expect(made).toHaveLength(0);
    stop?.();
    touchScreen(true);
    start();
    expect(made).toHaveLength(1);
    expect(play).not.toHaveBeenCalled();
  });

  it('rings the bells, then opens the game', () => {
    start();
    button('top').dispatchEvent(pointer('pointerdown', 'touch'));
    const event = click('top');
    expect(event.defaultPrevented).toBe(true);
    expect(play).toHaveBeenCalledTimes(1);
    expect(go).not.toHaveBeenCalled();
    vi.advanceTimersByTime(JINGLE_MS);
    expect(go).toHaveBeenCalledTimes(1);
    expect(go).toHaveBeenCalledWith(button('top').href);
  });

  it('opens the game once for a double tap', () => {
    start();
    for (let i = 0; i < 2; i += 1) {
      button('foot').dispatchEvent(pointer('pointerdown', 'touch'));
      expect(click('foot').defaultPrevented).toBe(true);
    }
    vi.advanceTimersByTime(JINGLE_MS * 2);
    expect(go).toHaveBeenCalledTimes(1);
  });

  it('opens it even when the browser will not sound', () => {
    play.mockImplementation(() => Promise.reject(new DOMException('no', 'NotAllowedError')));
    start();
    button('top').dispatchEvent(pointer('pointerdown', 'pen'));
    click('top');
    vi.advanceTimersByTime(JINGLE_MS);
    expect(go).toHaveBeenCalledTimes(1);
  });

  it('leaves a mouse click, a key and a new-tab click to the link itself', () => {
    start();
    button('top').dispatchEvent(pointer('pointerdown', 'mouse'));
    expect(click('top').defaultPrevented).toBe(false);
    expect(click('top').defaultPrevented).toBe(false); // Enter: no pointer at all
    button('top').dispatchEvent(pointer('pointerdown', 'touch'));
    expect(click('top', { ctrlKey: true }).defaultPrevented).toBe(false);
    vi.advanceTimersByTime(JINGLE_MS);
    expect(go).not.toHaveBeenCalled();
    expect(play).not.toHaveBeenCalled();
  });

  it('is quiet and ready again when the visitor comes back from the game', () => {
    start();
    button('top').dispatchEvent(pointer('pointerdown', 'touch'));
    click('top');
    window.dispatchEvent(new Event('pagehide'));
    expect(pause).toHaveBeenCalled();
    vi.advanceTimersByTime(JINGLE_MS);
    expect(go).not.toHaveBeenCalled();
    button('top').dispatchEvent(pointer('pointerdown', 'touch'));
    click('top');
    vi.advanceTimersByTime(JINGLE_MS);
    expect(go).toHaveBeenCalledTimes(1);
  });
});

describe('initXmasButtons: Escape and the tooltip', () => {
  it('hides the tooltip of the focused button until the focus leaves', () => {
    init();
    button('foot').focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(wrap('foot').dataset.tipHidden).toBe('');
    expect(wrap('top').dataset.tipHidden).toBeUndefined();
    button('foot').blur();
    expect(wrap('foot').dataset.tipHidden).toBeUndefined();
  });

  it('shows it again once the mouse has left the button and its tooltip', () => {
    init();
    button('top').focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(wrap('top').dataset.tipHidden).toBe('');
    wrap('top').dispatchEvent(pointer('pointerleave', 'mouse'));
    expect(wrap('top').dataset.tipHidden).toBeUndefined();
  });

  it('leaves it alone for other keys', () => {
    init();
    button('top').focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(wrap('top').dataset.tipHidden).toBeUndefined();
  });
});
