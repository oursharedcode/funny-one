// SPDX-License-Identifier: AGPL-3.0-only
// @vitest-environment node
// (files read from disk: under jsdom `import.meta.url` is not a file: URL)

// Step 60: the files Caddy serves beside the game on Funny One's own host,
// from deploy/origin-root/funny1, and the retiring service worker its former
// address answers with, from deploy/origin-root/funny1-retired (see
// deploy/caddy/Caddyfile). None of them is code the build touches, so nothing
// else would notice a language added without a policy section, a policy that
// names a picture option by a label the start screen no longer shows, a
// malformed Digital Asset Links statement — Google gives no error for one; the
// Android app just shows a URL bar — or a retiring worker that starts
// answering requests. Funny Multi's twin is
// apps/funny-multi-server/src/originRoot.test.ts.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LANGUAGES } from '@funny/shared';

const DEPLOY = fileURLToPath(new URL('../../../deploy/origin-root/', import.meta.url));
const read = (path: string): string => readFileSync(DEPLOY + path, 'utf8');

describe('assetlinks.json', () => {
  interface Statement {
    relation: string[];
    target: { namespace: string; package_name: string; sha256_cert_fingerprints: string[] };
  }
  const statements = JSON.parse(read('funny1/.well-known/assetlinks.json')) as Statement[];

  it('lets the Funny One app handle every URL on this origin', () => {
    expect(statements).toHaveLength(1);
    const [statement] = statements;
    expect(statement?.relation).toEqual(['delegate_permission/common.handle_all_urls']);
    expect(statement?.target.namespace).toBe('android_app');
    // Owner decision 2026-10-03; permanent once published on Play.
    expect(statement?.target.package_name).toBe('com.oursharedcode.funny1');
  });

  it('lists at least one fingerprint, in the colon-separated upper-case form Google matches', () => {
    const fingerprints = statements[0]?.target.sha256_cert_fingerprints ?? [];
    expect(fingerprints.length).toBeGreaterThan(0);
    for (const fingerprint of fingerprints) {
      expect(fingerprint).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
    }
  });
});

describe('privacy.html', () => {
  const html = read('funny1/privacy.html');
  const section = (code: string): string =>
    new RegExp(`<section id="privacy-${code}"[\\s\\S]*?</section>`).exec(html)?.[0] ?? '';
  // Line wrapping falls anywhere, inside a label too.
  const squeezed = (text: string): string => text.replace(/\s+/g, '');

  it('has a section, and a link to it, in every language the game offers', () => {
    for (const { code } of LANGUAGES) {
      expect(html, code).toMatch(
        new RegExp(`<section[^>]* id="privacy-${code}"[^>]* lang="${code}"`),
      );
      expect(html, code).toContain(`href="#privacy-${code}"`);
    }
    expect(html.match(/<section /g)).toHaveLength(LANGUAGES.length);
  });

  it('sets right-to-left on the Hebrew, Persian and Arabic sections', () => {
    expect(html).toMatch(/<section[^>]* id="privacy-he"[^>]* dir="rtl"/);
    expect(html).toMatch(/<section[^>]* id="privacy-fa"[^>]* dir="rtl"/);
    expect(html).toMatch(/<section[^>]* id="privacy-ar"[^>]* dir="rtl"/);
  });

  it('gives the contact address in every section', () => {
    expect(html.match(/href="mailto:privacy@oursharedcode\.com"/g)).toHaveLength(LANGUAGES.length);
  });

  // D-10: the one thing the game can send is the request for a library
  // picture, and the policy tells the player which start-screen option turns
  // it on and which turns it off — by the labels that language shows.
  it('names both picture options by the labels the start screen shows', () => {
    for (const { code } of LANGUAGES) {
      const catalog = JSON.parse(
        readFileSync(new URL(`./i18n/${code}.json`, import.meta.url), 'utf8'),
      ) as { home: { picturesBuiltIn: string; picturesOnline: string } };
      const text = squeezed(section(code));
      expect(text, code).toContain(squeezed(catalog.home.picturesOnline));
      expect(text, code).toContain(squeezed(catalog.home.picturesBuiltIn));
      expect(text, code).toContain('Cloudflare');
    }
  });

  it('loads nothing: no scripts, stylesheets, images, fonts or frames', () => {
    expect(html).not.toMatch(/<(script|link|img|iframe|object|embed)\b/i);
    expect(html).not.toMatch(/\bsrc=|@import|url\(/i);
  });
});

describe('the retiring service worker of the former address', () => {
  const script = read('funny1-retired/sw.js');

  it('removes the caches and its own registration, then reloads the open pages', () => {
    expect(script).toContain('self.skipWaiting()');
    expect(script).toContain('caches.delete(');
    expect(script).toContain('self.registration.unregister()');
    expect(script).toContain('.navigate(');
  });

  it('answers no request itself and pulls in nothing', () => {
    // A fetch handler would keep the old address alive; an import would be a
    // second file the old path has to serve.
    expect(script).not.toMatch(/addEventListener\(\s*['"]fetch['"]/);
    expect(script).not.toMatch(/importScripts|\bimport\b\s*[('"{*]/);
  });
});
