// SPDX-License-Identifier: AGPL-3.0-only

// The client's view of BASE_PATH (D-5). Vite bakes the build's `base` into
// `import.meta.env.BASE_URL` — `/` by default, `/funny1-game/` on the owner's
// VM — always with a trailing slash. Funny One has no join link or QR code to
// build (FO-ARC-3: no server, no rooms), so `homeUrl()` isn't needed here —
// only the asset-prefixing half of funny-multi-client's basePath.ts carries
// over.

/** The mount point, with its trailing slash — `/` or `/funny1-game/`. */
export function baseUrl(): string {
  return import.meta.env.BASE_URL;
}

/** Prefixes a path relative to the app root: `withBase('rig/bg-01.svg')`. */
export function withBase(relative: string): string {
  return baseUrl() + relative.replace(/^\/+/, '');
}
