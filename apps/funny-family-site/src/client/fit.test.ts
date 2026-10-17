// SPDX-License-Identifier: AGPL-3.0-only

import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fitText, initFit } from './fit.ts';

// jsdom lays nothing out: each text here is a box `room` wide holding one
// word `word` wide at the stylesheet's size, the word's width going with the
// font's. Kept whole (overflow-wrap: normal) the word sticks out of the box;
// with the page's break-word it would break and stick out of nothing.
interface Metrics {
  room: number;
  word: number;
}

function stub(el: HTMLElement, metrics: Metrics, designed: number): Metrics {
  const size = () => parseFloat(el.style.fontSize) || designed;
  Object.defineProperty(el, 'clientWidth', { configurable: true, get: () => metrics.room });
  Object.defineProperty(el, 'scrollWidth', {
    configurable: true,
    get: () =>
      el.style.overflowWrap === 'normal'
        ? Math.max(metrics.room, Math.ceil((metrics.word * size()) / designed))
        : metrics.room,
  });
  return metrics;
}

beforeAll(() => {
  const style = document.createElement('style');
  style.textContent = '.brand span { font-size: 22px; } .game h3 { font-size: 28px; }';
  document.head.append(style);
});

afterEach(() => {
  document.body.innerHTML = '';
});

function name(metrics: Metrics): HTMLElement {
  document.body.innerHTML = '<a class="brand"><span>Familienquatsch</span></a>';
  const el = document.querySelector<HTMLElement>('.brand span')!;
  stub(el, metrics, 22);
  return el;
}

describe('fitText', () => {
  it('leaves a word that fits at the stylesheet size', () => {
    const el = name({ room: 200, word: 150 });
    expect(fitText(el)).toBe(0);
    expect(el.style.fontSize).toBe('');
  });

  it('shrinks a word too wide to the largest whole pixel that fits', () => {
    const el = name({ room: 112, word: 160 });
    expect(fitText(el)).toBe(15);
    expect(el.style.fontSize).toBe('15px');
    // And gives the words back their breaking once measured.
    expect(el.style.overflowWrap).toBe('');
  });

  it('steps down a pixel at a time where the width does not go with the font', () => {
    const el = name({ room: 100, word: 0 });
    // A part that keeps its width whatever the size: the first guess is too big.
    Object.defineProperty(el, 'scrollWidth', {
      configurable: true,
      get: () => {
        const size = parseFloat(el.style.fontSize) || 22;
        return el.style.overflowWrap === 'normal' ? Math.max(100, 40 + Math.ceil(5 * size)) : 100;
      },
    });
    // 22px guesses 14, still too wide; 13 is too; 12 fits, above the floor.
    expect(fitText(el, 10)).toBe(12);
  });

  it('stops at the floor, where the word may break instead', () => {
    const el = name({ room: 100, word: 300 });
    expect(fitText(el)).toBe(12);
    expect(fitText(el, 9)).toBe(9);
    expect(el.style.overflowWrap).toBe('');
  });

  it('starts again from the stylesheet size, so a wider box gets it back', () => {
    const metrics = { room: 112, word: 160 };
    const el = name(metrics);
    expect(fitText(el)).toBe(15);
    metrics.room = 300;
    expect(fitText(el)).toBe(0);
    expect(el.style.fontSize).toBe('');
  });

  it('leaves alone a box that is not laid out', () => {
    const el = name({ room: 0, word: 160 });
    expect(fitText(el)).toBe(0);
    expect(el.style.fontSize).toBe('');
  });
});

describe('initFit', () => {
  const resize = (width: number) => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
    window.dispatchEvent(new Event('resize'));
  };

  it("fits the header's name and the games' names, and again when the width changes", () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 320 });
    document.body.innerHTML = `
      <header class="top"><a class="brand"><img alt=""><span>வேடிக்கையான குடும்பம்</span></a></header>
      <article class="game"><h3>வேடிக்கையான கதைகள்</h3><p>3–7</p></article>`;
    const brand = stub(
      document.querySelector<HTMLElement>('.brand span')!,
      { room: 112, word: 200 },
      22,
    );
    const card = stub(
      document.querySelector<HTMLElement>('.game h3')!,
      { room: 234, word: 255 },
      28,
    );
    initFit(window);
    const sizes = () =>
      [...document.querySelectorAll<HTMLElement>('.brand span, .game h3, .game p')].map(
        (el) => el.style.fontSize,
      );
    expect(sizes()).toEqual(['12px', '25px', '']);

    // Turned sideways: room for both at their own size.
    brand.room = 300;
    card.room = 500;
    resize(640);
    expect(sizes()).toEqual(['', '', '']);

    // A height change only (a phone's address bar) measures nothing again.
    brand.room = 112;
    resize(640);
    expect(sizes()).toEqual(['', '', '']);
    resize(320);
    expect(sizes()[0]).toBe('12px');
  });

  it('fits again once the web fonts are in', async () => {
    let loaded!: () => void;
    const ready = new Promise<void>((resolve) => {
      loaded = resolve;
    });
    Object.defineProperty(document, 'fonts', { configurable: true, value: { ready } });
    try {
      document.body.innerHTML = '<a class="brand"><span>Familienquatsch</span></a>';
      const metrics = stub(
        document.querySelector<HTMLElement>('.brand span')!,
        { room: 112, word: 100 },
        22,
      );
      initFit(window);
      expect(document.querySelector<HTMLElement>('.brand span')!.style.fontSize).toBe('');
      // Fredoka in place of the fallback: the word comes out wider.
      metrics.word = 160;
      loaded();
      await ready;
      await Promise.resolve();
      expect(document.querySelector<HTMLElement>('.brand span')!.style.fontSize).toBe('15px');
    } finally {
      Reflect.deleteProperty(document, 'fonts');
    }
  });

  it('does nothing on a page with nothing to fit', () => {
    document.body.innerHTML = '<p>Stats</p>';
    expect(() => initFit(window)).not.toThrow();
  });
});
