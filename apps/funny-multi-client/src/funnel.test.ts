// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: what Funny Multi reports to the visit funnel (funnel.ts), and when
// it reports nothing at all. Step 85: what it reports inside the Android app.
// Steps 117 and 123: the Christmas 2026 edition's counts, playing and paying.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from './i18n';
import { setUrl } from './testutils/socketMock';
import {
  __resetFunnelForTest,
  initFunnel,
  trackChristmasGame,
  trackGift,
  trackGoldenCartoon,
  trackPayCard,
  trackPayPage,
  trackPayPress,
  trackSupportOpen,
} from './funnel';

let beacon: ReturnType<typeof vi.fn>;

function sent(): unknown[] {
  return beacon.mock.calls.map(([, body]) => JSON.parse(body as string));
}

beforeEach(async () => {
  __resetFunnelForTest();
  sessionStorage.clear();
  await i18n.changeLanguage('en');
  beacon = vi.fn(() => true);
  Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });
});

afterEach(() => {
  Object.defineProperty(navigator, 'doNotTrack', { value: null, configurable: true });
  Object.defineProperty(navigator, 'globalPrivacyControl', {
    value: undefined,
    configurable: true,
  });
});

describe('initFunnel', () => {
  it("counts a visit from the landing page with its variant and the link's language", () => {
    setUrl('?lang=ru&from=hub&hv=b');
    initFunnel();
    expect(beacon).toHaveBeenCalledTimes(1);
    expect(beacon.mock.calls[0]?.[0]).toBe('http://localhost:3000/api/stats');
    expect(sent()).toEqual([{ e: 'fm_view', s: 'hub', v: 'b', l: 'ru' }]);
  });

  it('takes its own parameters off the address bar and keeps the rest', () => {
    setUrl('?room=ABCDEF&from=hub&lang=de&hv=a');
    initFunnel();
    expect(window.location.search).toBe('?room=ABCDEF&lang=de');
  });

  it('leaves an address without them untouched', () => {
    setUrl('?room=ABCDEF');
    const replace = vi.spyOn(window.history, 'replaceState');
    initFunnel();
    expect(replace).not.toHaveBeenCalled();
    replace.mockRestore();
  });

  it('counts any other visit as direct, without a variant', () => {
    setUrl('');
    initFunnel();
    setUrl('?from=hub&hv=z');
    initFunnel();
    expect(sent()).toEqual([
      { e: 'fm_view', s: 'direct', l: 'en' },
      { e: 'fm_view', s: 'direct', l: 'en' },
    ]);
  });
});

describe('support and gifts', () => {
  it('counts the sheet once per page load, in the interface language', async () => {
    setUrl('?from=hub&hv=a');
    initFunnel();
    await i18n.changeLanguage('he');
    trackSupportOpen();
    trackSupportOpen();
    expect(sent().slice(1)).toEqual([{ e: 'fm_support', s: 'hub', v: 'a', l: 'he' }]);
  });

  it('counts the first gift rail of a page load and no other', () => {
    setUrl('');
    initFunnel();
    trackGift('payid');
    trackGift('payid');
    trackGift('lightning');
    expect(sent().slice(1)).toEqual([{ e: 'fm_gift', s: 'direct', l: 'en', t: 'payid' }]);
  });
});

// Step 117 (D2 A): the Christmas funnel's first two steps.
describe('the Christmas 2026 edition', () => {
  it('counts a Christmas game once per page load, switched on or off', () => {
    setUrl('?from=hub&hv=b');
    initFunnel();
    trackChristmasGame(true);
    trackChristmasGame(false);
    expect(sent().slice(1)).toEqual([{ e: 'xm_game', s: 'hub', v: 'b', l: 'en', t: 'on' }]);
  });

  it('counts a game the host switched the Christmas stories off in', () => {
    setUrl('');
    initFunnel();
    trackChristmasGame(false);
    expect(sent().slice(1)).toEqual([{ e: 'xm_game', s: 'direct', l: 'en', t: 'off' }]);
  });

  it('counts a Christmas game with seat bots once more, as xm_bots (Step 130)', () => {
    setUrl('');
    initFunnel();
    trackChristmasGame(true, true);
    trackChristmasGame(true, true);
    expect(sent().slice(1)).toEqual([
      { e: 'xm_game', s: 'direct', l: 'en', t: 'on' },
      { e: 'xm_bots', s: 'direct', l: 'en' },
    ]);
  });

  it('counts the first golden cartoon of a page load, in the interface language', async () => {
    setUrl('');
    initFunnel();
    await i18n.changeLanguage('ru');
    trackGoldenCartoon();
    trackGoldenCartoon();
    expect(sent().slice(1)).toEqual([{ e: 'xm_gold', s: 'direct', l: 'ru' }]);
  });
});

// Step 123: the paying half — the card, the page by its door, the press by its rail.
describe("the Christmas 2026 edition's pay card and pay page", () => {
  it('counts the pay card once per page load, in the interface language', async () => {
    setUrl('?from=hub&hv=a');
    initFunnel();
    await i18n.changeLanguage('de');
    trackPayCard();
    trackPayCard();
    expect(sent().slice(1)).toEqual([{ e: 'xm_card', s: 'hub', v: 'a', l: 'de' }]);
  });

  it('counts the pay page once per page load, by the door it was first opened from', () => {
    setUrl('');
    initFunnel();
    trackPayPage('card');
    trackPayPage('link');
    expect(sent().slice(1)).toEqual([{ e: 'xm_page', s: 'direct', l: 'en', t: 'card' }]);
  });

  it("counts a link's page in the link's language, which the game has not switched to yet", () => {
    setUrl('?pay=x26&lang=ja');
    initFunnel();
    trackPayPage('link');
    expect(sent().slice(1)).toEqual([{ e: 'xm_page', s: 'direct', l: 'ja', t: 'link' }]);
  });

  it("counts a link's page in the interface language when the link names none it knows", () => {
    setUrl('?pay=x26&lang=xx');
    initFunnel();
    trackPayPage('link');
    expect(sent().slice(1)).toEqual([{ e: 'xm_page', s: 'direct', l: 'en', t: 'link' }]);
  });

  it("counts the card's page in the interface language, whatever the address says", async () => {
    setUrl('?lang=ja');
    initFunnel();
    await i18n.changeLanguage('ru');
    trackPayPage('card');
    expect(sent().slice(1)).toEqual([{ e: 'xm_page', s: 'direct', l: 'ru', t: 'card' }]);
  });

  it('counts the first pay press of a page load, by its rail, and no other', () => {
    setUrl('');
    initFunnel();
    trackPayPress('sponsors');
    trackPayPress('sponsors');
    trackPayPress('payid');
    expect(sent().slice(1)).toEqual([{ e: 'xm_pay', s: 'direct', l: 'en', t: 'sponsors' }]);
  });
});

describe('inside the Android store app', () => {
  it('counts the visit as the app’s, without a variant, whatever the link says', () => {
    setUrl('?shell=android&from=hub&hv=a&lang=de');
    initFunnel();
    expect(sent()).toEqual([{ e: 'fm_view', s: 'app', l: 'de' }]);
    expect(window.location.search).toBe('?shell=android&lang=de');
  });

  it('counts the visit when the app is known only by its referrer', () => {
    setUrl('');
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      get: () => 'android-app://com.oursharedcode.funny37/',
    });
    initFunnel();
    delete (document as { referrer?: string }).referrer;
    expect(sent()).toEqual([{ e: 'fm_view', s: 'app', l: 'en' }]);
  });

  it("counts nothing but the visit: no gifts in the app, and the Christmas funnel is the website's", () => {
    setUrl('?shell=android');
    initFunnel();
    trackSupportOpen();
    trackGift('payid');
    trackChristmasGame(true);
    trackGoldenCartoon();
    trackPayCard();
    trackPayPage('link');
    trackPayPress('payid');
    expect(sent()).toEqual([{ e: 'fm_view', s: 'app', l: 'en' }]);
  });

  it('counts nothing when the browser asks not to be tracked', () => {
    Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true });
    setUrl('?shell=android');
    initFunnel();
    expect(beacon).not.toHaveBeenCalled();
  });
});

describe('sends nothing', () => {
  it('when the browser asks not to be tracked', () => {
    Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true });
    setUrl('');
    initFunnel();
    expect(beacon).not.toHaveBeenCalled();
  });

  it('under Global Privacy Control', () => {
    Object.defineProperty(navigator, 'globalPrivacyControl', { value: true, configurable: true });
    setUrl('');
    initFunnel();
    expect(beacon).not.toHaveBeenCalled();
  });

  it('without sendBeacon, and without failing', () => {
    Object.defineProperty(navigator, 'sendBeacon', { value: undefined, configurable: true });
    setUrl('');
    expect(() => initFunnel()).not.toThrow();
  });
});
