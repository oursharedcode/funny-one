// SPDX-License-Identifier: AGPL-3.0-only

// Where the app is mounted on its origin (requirements D-5). `/` in dev and in
// production (the game owns its host since B-1a); a sub-path such as
// `/funny37-game/`, as the owner's VM served before, behind a proxy that routes
// one sub-path per game. Three places must agree on the value — the
// client build (Vite `base`, manifest `start_url`/`scope`, Socket.IO client
// path), the server (static prefix, `/health`, Socket.IO server path) and the
// deploy config that feeds both — and a mismatch fails silently: the shell
// loads and the socket never connects. One normaliser, used by all of them,
// so "funny37-game", "/funny37-game" and "/funny37-game/" cannot drift apart.

/**
 * Normalises a deploy-time base path to the form Vite and Fastify both want:
 * starts and ends with `/`, no doubled slashes. `undefined`, `''`, `/` and
 * whitespace all mean "served at the root".
 */
export function normalizeBasePath(raw: string | undefined): string {
  const inner = (raw ?? '')
    .trim()
    .replace(/\/+/g, '/')
    .replace(/^\/|\/$/g, '');
  return inner ? `/${inner}/` : '/';
}
