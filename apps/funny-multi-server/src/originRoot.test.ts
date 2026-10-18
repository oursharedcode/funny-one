// SPDX-License-Identifier: AGPL-3.0-only

// B-1b: the two files Caddy serves at the root of Funny Multi's host, from
// deploy/origin-root/funny37 (see deploy/caddy/Caddyfile). Neither is code, so
// nothing else would notice a language added without a policy section, a
// stylesheet pulled from a CDN into a page that promises no third-party
// requests, or a malformed Digital Asset Links statement — Google gives no
// error for one; the Android app just shows a URL bar.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LANGUAGES } from '@funny/shared';

const ORIGIN_ROOT = fileURLToPath(new URL('../../../deploy/origin-root/funny37/', import.meta.url));
const read = (path: string): string => readFileSync(ORIGIN_ROOT + path, 'utf8');

describe('assetlinks.json', () => {
  interface Statement {
    relation: string[];
    target: { namespace: string; package_name: string; sha256_cert_fingerprints: string[] };
  }
  const statements = JSON.parse(read('.well-known/assetlinks.json')) as Statement[];

  it('lets the Funny Multi app handle every URL on this origin', () => {
    expect(statements).toHaveLength(1);
    const [statement] = statements;
    expect(statement?.relation).toEqual(['delegate_permission/common.handle_all_urls']);
    expect(statement?.target.namespace).toBe('android_app');
    // Permanent once published on Play (Step 54).
    expect(statement?.target.package_name).toBe('com.oursharedcode.funny37');
  });

  it('lists fingerprints only in the colon-separated upper-case form Google matches', () => {
    // Empty until B-1d creates the signing key.
    for (const fingerprint of statements[0]?.target.sha256_cert_fingerprints ?? []) {
      expect(fingerprint).toMatch(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
    }
  });
});

describe('privacy.html', () => {
  const html = read('privacy.html');

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

  it('says in every section that a visit’s country is looked up (Step 79)', () => {
    expect(html.match(/DB-IP/g)).toHaveLength(LANGUAGES.length);
  });

  it('loads nothing: no scripts, stylesheets, images, fonts or frames', () => {
    // The page states that the game makes no third-party requests; it must not
    // make any of its own, to anyone.
    expect(html).not.toMatch(/<(script|link|img|iframe|object|embed)\b/i);
    expect(html).not.toMatch(/\bsrc=|@import|url\(/i);
  });
});
