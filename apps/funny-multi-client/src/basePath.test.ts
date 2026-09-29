// SPDX-License-Identifier: AGPL-3.0-only

import { afterEach, describe, expect, it, vi } from 'vitest';
import { baseUrl, homeUrl, serverOrigin, withBase } from './basePath';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('basePath', () => {
  it('is the root in this build, so nothing here changes the default deploy', () => {
    expect(baseUrl()).toBe('/');
    expect(withBase('flags/en.png')).toBe('/flags/en.png');
    expect(withBase('/deployer-logo.png')).toBe('/deployer-logo.png');
    expect(homeUrl()).toBe(`${window.location.origin}/`);
  });

  it('carries the sub-path into assets, the socket path and the join link', () => {
    vi.stubEnv('BASE_URL', '/funny37-game/');
    expect(withBase('flags/en.png')).toBe('/funny37-game/flags/en.png');
    expect(withBase('/deployer-logo.png')).toBe('/funny37-game/deployer-logo.png');
    expect(`${baseUrl()}socket.io`).toBe('/funny37-game/socket.io');
    expect(`${homeUrl()}?room=ABCDEF`).toBe(`${window.location.origin}/funny37-game/?room=ABCDEF`);
  });
});

describe('serverOrigin', () => {
  it('points at :3000 under Vite dev/test (import.meta.env.DEV) — never a same-origin fetch, which would silently hit Vite instead of the server', () => {
    expect(import.meta.env.DEV).toBe(true);
    expect(serverOrigin()).toBe('http://localhost:3000');
  });
});
