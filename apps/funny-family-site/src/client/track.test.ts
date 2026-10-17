// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it, vi } from 'vitest';
import { classifyReferrer, deviceClass, initTracking, isClickTarget } from './track.ts';
import { REFERRER_KEY, SENT_KEY } from '../keys.ts';

const HOST = 'www.funny-family.oursharedcode.com';

describe('classifyReferrer', () => {
  it.each([
    ['', 'direct'],
    ['https://www.google.com/', 'search'],
    ['https://www.google.co.uk/search?q=x', 'search'],
    ['https://yandex.ru/', 'search'],
    ['https://www.bing.com/', 'search'],
    ['https://duckduckgo.com/', 'search'],
    ['https://search.brave.com/', 'search'],
    ['https://m.facebook.com/', 'social'],
    ['https://t.co/abc', 'social'],
    ['https://web.telegram.org/', 'social'],
    ['https://www.youtube.com/', 'social'],
    ['https://oursharedcode.com/', 'oursharedcode'],
    ['https://www.oursharedcode.com/', 'oursharedcode'],
    ['https://www.funny37.oursharedcode.com/', 'games'],
    ['https://funny1.oursharedcode.com/', 'games'],
    ['https://example.com/', 'other'],
    ['https://evilgoogle.com/', 'other'],
    ['https://notfacebook.com/', 'other'],
    ['not a url', 'other'],
  ])('%s is %s', (referrer, kind) => {
    expect(classifyReferrer(referrer, HOST)).toBe(kind);
  });

  it('does not count a visit from the site itself, under either name or locally', () => {
    expect(classifyReferrer(`https://${HOST}/ru/`, HOST)).toBeNull();
    expect(classifyReferrer('https://funny-family.oursharedcode.com/', HOST)).toBeNull();
    expect(classifyReferrer('http://localhost:5187/de/', 'localhost:5187')).toBeNull();
    expect(classifyReferrer('http://localhost:3000/', 'localhost:5187')).toBe('other');
  });
});

describe('deviceClass and isClickTarget', () => {
  it('splits phone-sized windows from the rest at 768 px', () => {
    expect(deviceClass(390)).toBe('m');
    expect(deviceClass(767)).toBe('m');
    expect(deviceClass(768)).toBe('d');
  });

  it('knows the twelve click targets', () => {
    for (const target of ['fm', 'fo', 'gh', 'video', 'root'])
      expect(isClickTarget(target)).toBe(true);
    // Step 76: the ♥ and the gift sheet it opens.
    for (const target of ['support', 'payid', 'sponsors', 'lightning', 'kofi', 'bmc', 'donate'])
      expect(isClickTarget(target)).toBe(true);
    for (const value of ['', 'FM', 'bogus', 'payId', null, 1])
      expect(isClickTarget(value)).toBe(false);
  });
});

/** sessionStorage's interface over a map, shared by the "page loads" of one tab. */
function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => void map.delete(key),
    setItem: (key, value) => void map.set(key, String(value)),
  };
}

const BLOCKED = {
  getItem() {
    throw new Error('SecurityError');
  },
  setItem() {
    throw new Error('SecurityError');
  },
  removeItem() {
    throw new Error('SecurityError');
  },
} as unknown as Storage;

interface PageOptions {
  variant?: string;
  code?: string;
  referrer?: string;
  storage?: Storage;
  width?: number;
  navigator?: Record<string, unknown>;
  doNotTrack?: string;
}

/** One page load: a fresh document, the beacon recorded. */
function page(options: PageOptions = {}) {
  const doc = document.implementation.createHTMLDocument('');
  doc.documentElement.dataset.variant = options.variant ?? 'a';
  doc.documentElement.dataset.code = options.code ?? 'ru';
  doc.body.innerHTML = `
    <a data-track="fm" href="#fm"><span class="label">Play</span></a>
    <a data-track="fo" href="#fo">Funny One</a>
    <a data-track="bogus" href="#x">?</a>
    <p class="plain">text</p>`;
  Object.defineProperty(doc, 'referrer', { value: options.referrer ?? '' });
  const sendBeacon = vi.fn((_url: string, _data: string) => true);
  const win = {
    document: doc,
    navigator: { sendBeacon, ...options.navigator },
    sessionStorage: options.storage ?? memoryStorage(),
    location: { host: HOST },
    innerWidth: options.width ?? 390,
    doNotTrack: options.doNotTrack,
  } as unknown as Window;
  const started = initTracking(win);
  const sent = (): Record<string, string>[] =>
    sendBeacon.mock.calls.map(([url, data]) => {
      expect(url).toBe('/api/stats');
      return JSON.parse(data) as Record<string, string>;
    });
  const click = (selector: string, init: MouseEventInit = {}, type = 'click'): void => {
    doc
      .querySelector(selector)
      ?.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, ...init }));
  };
  return { started, sent, click, doc };
}

describe('initTracking', () => {
  it('counts the visit once, with its design, language, kind of referrer and screen', () => {
    const storage = memoryStorage();
    const first = page({ storage, referrer: 'https://www.google.com/', width: 1280 });
    expect(first.started).toBe(true);
    expect(first.sent()).toEqual([{ e: 'hub_view', v: 'a', l: 'ru', r: 'search', d: 'd' }]);

    // A reload, or another language's page, in the same tab: not a new visit.
    const again = page({ storage, code: 'de', referrer: 'https://www.google.com/' });
    expect(again.sent()).toEqual([]);
  });

  it('counts the referrer the head script handed on from /', () => {
    const storage = memoryStorage();
    storage.setItem(REFERRER_KEY, 'https://t.co/x');
    const shown = page({ storage, referrer: `https://${HOST}/` });
    expect(shown.sent()).toEqual([{ e: 'hub_view', v: 'a', l: 'ru', r: 'social', d: 'm' }]);
    expect(storage.getItem(REFERRER_KEY)).toBeNull();
  });

  it('does not count a visit from the site’s own pages, but does count its clicks', () => {
    const shown = page({ referrer: `https://${HOST}/de/` });
    expect(shown.sent()).toEqual([]);
    shown.click('a[data-track="fo"]');
    expect(shown.sent()).toEqual([{ e: 'hub_click', v: 'a', l: 'ru', t: 'fo' }]);
  });

  it('counts each link once per tab, from the link or anything inside it', () => {
    const storage = memoryStorage();
    const shown = page({ storage, variant: 'b' });
    shown.click('a[data-track="fm"] .label');
    shown.click('a[data-track="fm"]');
    shown.click('a[data-track="fo"]');
    shown.click('a[data-track="bogus"]');
    shown.click('p.plain');
    expect(shown.sent().slice(1)).toEqual([
      { e: 'hub_click', v: 'b', l: 'ru', t: 'fm' },
      { e: 'hub_click', v: 'b', l: 'ru', t: 'fo' },
    ]);
    expect(storage.getItem(SENT_KEY)).toBe('view,click:fm,click:fo');

    const reloaded = page({ storage, variant: 'b' });
    reloaded.click('a[data-track="fm"]');
    expect(reloaded.sent()).toEqual([]);
  });

  it('counts a middle click, not a right click', () => {
    const shown = page();
    shown.click('a[data-track="fo"]', { button: 2 }, 'auxclick');
    expect(shown.sent()).toHaveLength(1);
    shown.click('a[data-track="fo"]', { button: 1 }, 'auxclick');
    expect(shown.sent().slice(1)).toEqual([{ e: 'hub_click', v: 'a', l: 'ru', t: 'fo' }]);
  });

  it('counts once per page when storage is blocked', () => {
    const shown = page({ storage: BLOCKED });
    shown.click('a[data-track="fm"]');
    shown.click('a[data-track="fm"]');
    expect(shown.sent().map((event) => event.e)).toEqual(['hub_view', 'hub_click']);
  });

  it.each([
    ['Do Not Track', { navigator: { doNotTrack: '1' } }],
    ['Global Privacy Control', { navigator: { globalPrivacyControl: true } }],
    ['the old Do Not Track', { doNotTrack: '1' }],
    ['no beacons', { navigator: { sendBeacon: undefined } }],
    ['no design', { variant: '' }],
    ['no language', { code: '' }],
  ] as [string, PageOptions][])('sends nothing with %s', (_name, options) => {
    const shown = page(options);
    shown.click('a[data-track="fm"]');
    expect(shown.started).toBe(false);
    expect(shown.sent()).toEqual([]);
  });

  it('shrugs off a beacon the browser refuses', () => {
    expect(() =>
      page({
        navigator: {
          sendBeacon: () => {
            throw new TypeError('refused');
          },
        },
      }),
    ).not.toThrow();
  });
});
