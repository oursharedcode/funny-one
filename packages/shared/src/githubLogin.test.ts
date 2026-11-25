// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import { GITHUB_LOGIN_MAX, parseGitHubLogin } from './githubLogin.js';

describe('parseGitHubLogin', () => {
  it('takes a GitHub name in any case, trimmed, with @ or a profile address taken off', () => {
    expect(parseGitHubLogin('Octocat')).toBe('octocat');
    expect(parseGitHubLogin('  @mona-lisa ')).toBe('mona-lisa');
    expect(parseGitHubLogin('https://github.com/Jo2/')).toBe('jo2');
    expect(parseGitHubLogin('github.com/a')).toBe('a');
    expect(parseGitHubLogin('x'.repeat(GITHUB_LOGIN_MAX))).toBe('x'.repeat(GITHUB_LOGIN_MAX));
  });

  it('refuses what GitHub would not take as a name', () => {
    for (const bad of [
      '',
      ' ',
      '@',
      '-jo',
      'jo-',
      'jo--li',
      'jo_li',
      'jo.li',
      'jo li',
      'ёжик',
      'x'.repeat(GITHUB_LOGIN_MAX + 1),
      42,
      null,
    ]) {
      expect(parseGitHubLogin(bad)).toBeNull();
    }
  });
});
