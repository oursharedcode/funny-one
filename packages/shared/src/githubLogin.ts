// SPDX-License-Identifier: AGPL-3.0-only

// Step 125 (B-29, owner decision D1 A, 2026-11-25): the GitHub user name a
// Sponsors buyer types on the pay page before paying, which is how GitHub's
// webhook finds their code. One reading for the page and the server: as
// GitHub allows a name — 1 to 39 letters, digits and hyphens, no hyphen first,
// last or twice in a row — trimmed, with an `@` in front or a pasted profile
// address taken off, and in lower case, since GitHub's names ignore case.

export const GITHUB_LOGIN_MAX = 39;

const LOGIN = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/u;
const PROFILE = /^(?:https?:\/\/)?(?:www\.)?github\.com\//u;

/** The GitHub user name as typed, in lower case; null when it cannot be one. */
export function parseGitHubLogin(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const login = raw
    .trim()
    .toLowerCase()
    .replace(PROFILE, '')
    .replace(/^@/u, '')
    .replace(/\/+$/u, '');
  return LOGIN.test(login) ? login : null;
}
