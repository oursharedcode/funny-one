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
    { languages: env.languages ?? ['en-GB', 'en'], language: env.language ?? 'en-GB' },
    (callback: () => void) => timers.push(callback),
  );
  return { variant: attributes.get('data-variant'), replaced, session, style, timers };
}

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
