// SPDX-License-Identifier: AGPL-3.0-only
// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';
import { headScript } from './headScript.ts';
import { LANG_KEY, REFERRER_KEY, VARIANT_KEY } from '../keys.ts';

const HOST = 'www.funny-family.oursharedcode.com';

interface Env {
  search?: string;
  hash?: string;
  referrer?: string;
  languages?: readonly string[];
  language?: string;
  session?: Record<string, string>;
  local?: Record<string, string>;
  /** Storage that throws on every access, as a blocked or sandboxed one does. */
  blocked?: boolean;
  random?: number;
  /** Undefined: a browser too old to say. */
  userAgent?: string;
  maxTouchPoints?: number;
}

/** Runs the inline script against stand-ins for the browser globals it uses. */
function run(root: boolean, env: Env = {}) {
  const session = new Map(Object.entries(env.session ?? {}));
  const local = new Map(Object.entries(env.local ?? {}));
  const storage = (map: Map<string, string>) =>
    env.blocked
      ? {
          getItem: () => {
            throw new Error('SecurityError');
          },
          setItem: () => {
            throw new Error('SecurityError');
          },
        }
      : {
          getItem: (key: string) => map.get(key) ?? null,
          setItem: (key: string, value: string) => void map.set(key, String(value)),
        };
  const attributes = new Map<string, string>();
  const style = { visibility: '' };
  const replaced: string[] = [];
  const timers: (() => void)[] = [];
  vi.spyOn(Math, 'random').mockReturnValue(env.random ?? 0.25);

  const script = new Function(
    'document',
    'location',
    'sessionStorage',
    'localStorage',
    'navigator',
    'setTimeout',
    headScript({ root }),
  );
  script(
    {
      documentElement: {
        setAttribute: (name: string, value: string) => attributes.set(name, value),
        style,
      },
      referrer: env.referrer ?? '',
    },
    {
      search: env.search ?? '',
      hash: env.hash ?? '',
      host: HOST,
      replace: (url: string) => replaced.push(url),
    },
    storage(session),
    storage(local),
    {
      languages: env.languages ?? ['en-GB', 'en'],
      language: env.language ?? 'en-GB',
      userAgent: env.userAgent,
      maxTouchPoints: env.maxTouchPoints,
    },
    (callback: () => void) => timers.push(callback),
  );
  return {
    variant: attributes.get('data-variant'),
    ios: attributes.get('data-ios'),
    replaced,
    session,
    style,
    timers,
  };
}

// User agents as browsers of 2025–2026 send them.
const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/138.0.7204.156 Mobile/15E148 Safari/604.1';
const IPAD_CHROME =
  'Mozilla/5.0 (iPad; CPU OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/138.0.7204.156 Mobile/15E148 Safari/604.1';
// An iPad's Safari and a Mac's say the same.
const MAC_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15';
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36';
const WINDOWS_CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36';

describe('the head script: the design', () => {
  it('takes ?v= first, and keeps it for the tab', () => {
    const shown = run(false, { search: '?v=b', session: { [VARIANT_KEY]: 'a' } });
    expect(shown.variant).toBe('b');
    expect(shown.session.get(VARIANT_KEY)).toBe('b');
  });

  it('keeps the design the tab was first shown', () => {
    expect(run(false, { session: { [VARIANT_KEY]: 'b' }, random: 0.1 }).variant).toBe('b');
  });

  it('otherwise tosses a coin, ignoring a ?v= it does not know', () => {
    expect(run(false, { search: '?v=c', random: 0.1 }).variant).toBe('a');
    expect(run(false, { search: '?v=c', random: 0.9 }).variant).toBe('b');
    expect(run(false, { session: { [VARIANT_KEY]: 'z' }, random: 0.9 }).variant).toBe('b');
  });

  it('still picks a design when storage throws', () => {
    expect(run(false, { blocked: true, random: 0.9 }).variant).toBe('b');
  });
});

describe('the head script: iPhones and iPads (Step 110)', () => {
  it('marks an iPhone and an iPad, in any of their browsers', () => {
    for (const userAgent of [IPHONE_SAFARI, IPHONE_CHROME, IPAD_CHROME])
      expect(run(false, { userAgent, maxTouchPoints: 5 }).ios, userAgent).toBe('');
    // An iPad's Safari calls itself a Mac; its touch screen gives it away.
    expect(run(false, { userAgent: MAC_SAFARI, maxTouchPoints: 5 }).ios).toBe('');
  });

  it('leaves a Mac, Android, Windows and a browser that does not say alone', () => {
    expect(run(false, { userAgent: MAC_SAFARI, maxTouchPoints: 0 }).ios).toBeUndefined();
    expect(run(false, { userAgent: ANDROID_CHROME, maxTouchPoints: 5 }).ios).toBeUndefined();
    expect(run(false, { userAgent: WINDOWS_CHROME, maxTouchPoints: 10 }).ios).toBeUndefined();
    expect(run(false, {}).ios).toBeUndefined();
  });

  it('marks it on / too, before the language check can end the script', () => {
    // Back on / from another page of the site: the check stops there.
    const shown = run(true, {
      userAgent: IPHONE_SAFARI,
      maxTouchPoints: 5,
      referrer: `https://${HOST}/ru/`,
      languages: ['ru'],
    });
    expect(shown.replaced).toEqual([]);
    expect(shown.ios).toBe('');
    expect(run(true, { userAgent: IPHONE_SAFARI, languages: ['ja'] })).toMatchObject({
      ios: '',
      replaced: ['/ja/'],
    });
  });
});

describe('the head script: the language, on / only', () => {
  it('sends a browser that prefers a language of the games on to its page', () => {
    const shown = run(true, {
      languages: ['ru-RU', 'en'],
      referrer: 'https://www.google.com/',
      search: '?v=b',
      hash: '#games',
    });
    expect(shown.replaced).toEqual(['/ru/?v=b#games']);
    expect(shown.session.get(REFERRER_KEY)).toBe('https://www.google.com/');
    expect(shown.style.visibility).toBe('hidden');
    shown.timers.forEach((callback) => callback());
    expect(shown.style.visibility).toBe('');
  });

  it('hands on an empty referrer too: a direct visit stays one', () => {
    const shown = run(true, { languages: ['de-DE'] });
    expect(shown.replaced).toEqual(['/de/']);
    expect(shown.session.get(REFERRER_KEY)).toBe('');
  });

  it('leaves English visitors and unknown languages on /', () => {
    expect(run(true, { languages: ['en-US', 'ru'] }).replaced).toEqual([]);
    expect(run(true, { languages: ['xx-YY'] }).replaced).toEqual([]);
  });

  it.each([
    ['es-MX', 'es-419'],
    ['es-419', 'es-419'],
    ['es', 'es-es'],
    ['es-ES', 'es-es'],
    ['pt-PT', 'pt-br'],
    ['pt-BR', 'pt-br'],
    ['iw-IL', 'he'],
    ['he', 'he'],
    ['zh-CN', 'zh'],
    ['zh-Hans-CN', 'zh'],
    ['uk-UA', 'uk'],
    ['ta-IN', 'ta'],
    ['hi-IN', 'hi'],
    ['te-IN', 'te'],
    ['bn-BD', 'bn'],
    ['fa-IR', 'fa'],
    ['zh-HK', 'yue'],
    ['zh-Hant-MO', 'yue'],
    ['yue-HK', 'yue'],
    ['zh-TW', 'zh'],
    ['ar-MA', 'ar'],
    ['ar-EG', 'ar'],
    ['ar', 'ar'],
    ['sw-KE', 'sw'],
    ['sw-TZ', 'sw'],
    ['yo-NG', 'yo'],
  ])('matches %s to %s', (tag, code) => {
    expect(run(true, { languages: [tag] }).replaced).toEqual([`/${code}/`]);
  });

  it('takes the first of the browser’s languages it has', () => {
    expect(run(true, { languages: ['xx', 'fr-CA', 'de'] }).replaced).toEqual(['/fr/']);
  });

  it('falls back to navigator.language', () => {
    expect(run(true, { languages: [], language: 'ko-KR' }).replaced).toEqual(['/ko/']);
  });

  it('puts the language picked here before over the browser’s', () => {
    expect(run(true, { languages: ['ru'], local: { [LANG_KEY]: 'de' } }).replaced).toEqual([
      '/de/',
    ]);
    expect(run(true, { languages: ['ru'], local: { [LANG_KEY]: 'en' } }).replaced).toEqual([]);
    expect(run(true, { languages: ['ru'], local: { [LANG_KEY]: 'xx' } }).replaced).toEqual([
      '/ru/',
    ]);
  });

  it('leaves a visitor who came from another page of the site on /', () => {
    const shown = run(true, { languages: ['ru'], referrer: `https://${HOST}/ru/` });
    expect(shown.replaced).toEqual([]);
    expect(shown.session.has(REFERRER_KEY)).toBe(false);
  });

  it('still redirects when storage throws', () => {
    expect(run(true, { languages: ['ja'], blocked: true }).replaced).toEqual(['/ja/']);
  });

  it('never redirects from a language’s own page', () => {
    expect(run(false, { languages: ['ru'] }).replaced).toEqual([]);
  });
});
