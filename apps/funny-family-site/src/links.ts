// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: where the Funny Family landing page lives and everything it links
// to. The games' hosts are deploy/caddy/Caddyfile's FM_HOST and FO_HOST.

import type { Language } from '@funny/shared';

/** This site's own origin: canonical, hreflang and link-preview addresses. */
export const SITE_ORIGIN = 'https://www.funny-family.oursharedcode.com';

export const FM_ORIGIN = 'https://www.funny37.oursharedcode.com';

// Funny One has no `?lang=`: it starts in the device's language, or in the
// one its player picked last time.
export const FO_URL = 'https://www.funny1.oursharedcode.com/';

export const GITHUB_ORG = 'oursharedcode';

// The open-source card's repositories: this one, which Funny Multi's footer
// already links (its SOURCE_URL), and funny-stories (added 2026-10-29).
export const GITHUB_REPOS = ['funny-one', 'funny-stories'] as const;

export function githubUrl(repo: string): string {
  return `https://github.com/${GITHUB_ORG}/${repo}`;
}

export const ROOT_URL = 'https://www.oursharedcode.com/';
export const ROOT_LABEL = 'oursharedcode.com';

/** The landing page's two designs (A/B test): a trailer card, a background loop. */
export type Variant = 'a' | 'b';

/** A language's page: English at the root (also the x-default), the others under their code. */
export function pagePath(code: Language): string {
  return code === 'en' ? '/' : `/${code}/`;
}

/**
 * Funny Multi in the page's language, marked as a visit from this page:
 * the game's funnel.ts reads `from` and `hv` once and takes them off the
 * address bar. The variant in the static page is A's; main.ts sets the one
 * actually shown.
 */
export function fmUrl(code: Language, variant: Variant): string {
  return `${FM_ORIGIN}/?lang=${code}&from=hub&hv=${variant}`;
}

/** The games' privacy policy, at this language's section. */
export function privacyUrl(code: Language): string {
  return `${FM_ORIGIN}/privacy#privacy-${code}`;
}
