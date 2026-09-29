// SPDX-License-Identifier: AGPL-3.0-only

// The client's view of BASE_PATH (requirements D-5). Vite bakes the build's
// `base` into `import.meta.env.BASE_URL` — `/` by default, `/funny37-game/`
// on the owner's VM — always with a trailing slash. Every root-absolute URL
// the app used to write by hand (`/flags/en.png`, `/deployer-logo.png`, the
// `?room=` join link, the Socket.IO path) goes through here, so a sub-path
// deploy changes one build argument rather than a grep.
//
// Functions, not constants: vitest's `vi.stubEnv` swaps the value at call
// time, which is what lets a test assert the sub-path shape without a second
// build.

/** The mount point, with its trailing slash — `/` or `/funny37-game/`. */
export function baseUrl(): string {
  return import.meta.env.BASE_URL;
}

/** Prefixes a path relative to the app root: `withBase('flags/en.png')`. */
export function withBase(relative: string): string {
  return baseUrl() + relative.replace(/^\/+/, '');
}

/**
 * The absolute URL of the app's home, for links that leave the page — the
 * `?room=` invitation and the QR code that encodes it.
 */
export function homeUrl(): string {
  return window.location.origin + baseUrl();
}

/**
 * Origin of the Socket.IO/REST server. In dev the client (Vite, :5173) and
 * server (:3000) run on separate origins, so a same-origin fetch from the
 * client never reaches the server — it silently hits Vite's dev server
 * instead. In prod they're the same origin. Socket.IO has needed this split
 * since T-8.1; any REST call to this server (e.g. `GET /config`) needs it
 * too.
 */
export function serverOrigin(): string {
  return import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin;
}
