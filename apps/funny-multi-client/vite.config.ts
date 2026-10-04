// SPDX-License-Identifier: AGPL-3.0-only

// Adapted from SRC/client/vite.config.ts. Four changes:
//
//  1. The version is read from this package.json directly. SRC ran
//     `scripts/bump-version.mjs` in a `prebuild` hook; that script is not
//     carried (no task creates it), so the version moves when someone edits
//     package.json rather than on every build.
//  2. `includeAssets` lists this project's assets. SRC precached its own
//     branding (`monkeys-on-bus.png`); ours is the icon PNGs plus the language
//     picker's flags, which a player needs on the very first screen. `icon.svg`
//     is deliberately not precached here — index.html no longer references it
//     (2026-08-20: the favicon moved to icon-192.png to match the swapped app
//     icon below), so nothing loads it at runtime.
//  3. Manifest identity is Funny Multi (FM-ID-1). The manifest icons are the
//     192/512 PNG pair, as in SRC; `icon.svg` is the favicon only — see the
//     icons[] comment below for why Chrome will not take it as a manifest icon.
//  4. BASE_PATH (T-8.1, requirements D-5). SRC was only ever served at `/`;
//     production was `https://…/funny37-game/` behind Caddy (one sub-path per
//     game) until B-1a gave each game its own host, so it now runs at `/`;
//     the mechanism stays for any sub-path deploy. The build reads BASE_PATH
//     (a Docker build-arg; unset = `/`)
//     and threads it into Vite's `base`, the manifest's `start_url`/`scope`
//     and the workbox denylist; `src/basePath.ts` reads the result back via
//     `import.meta.env.BASE_URL` for the socket path and asset URLs. The
//     server takes the same variable at runtime (static prefix, /health,
//     Socket.IO path) — docker-compose.yml feeds both from one value.
//
// Everything else — the NetworkFirst navigation strategy, the deliberately
// un-precached index.html — is carried verbatim, including the reasoning: it
// is what makes a deploy visible to a player whose PWA shell is already
// installed (spec §13). SRC's two Google Fonts runtime-caching rules were
// dropped when Fredoka became self-hosted (FM-CPL-2, see styles/index.css).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { normalizeBasePath } from '@funny/shared';

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8'),
) as { version: string };
const BUILD_DATE = new Date().toISOString().slice(0, 10);
const BASE_PATH = normalizeBasePath(process.env.BASE_PATH);
// For the workbox regexes below: the base as a literal, not a pattern.
const BASE_RE = BASE_PATH.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

export default defineConfig({
  base: BASE_PATH,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(BUILD_DATE),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icon-180.png',
        'icon-192.png',
        'icon-512.png',
        'icon-512-maskable.png',
        'flags/*.png',
      ],
      manifest: {
        name: 'Funny Multi «Чепуха 37»',
        short_name: 'Funny Multi',
        description: 'Pick absurd answers together, then watch an AI cartoon the story.',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#fef3c7',
        background_color: '#fef3c7',
        start_url: BASE_PATH,
        scope: BASE_PATH,
        // PNG only, and each `purpose` declared on its own entry. Paths are
        // relative: the manifest is served from under the base path, so
        // `icon-192.png` resolves to `${base}icon-192.png` on every deploy,
        // where a root-absolute `/icon-192.png` would miss a sub-path one.
        //
        // `/icon.svg` is deliberately NOT listed. Chrome's manifest icon
        // loader rejects it — "Icon .../icon.svg failed to load" — even though
        // the file is well-formed, carries explicit width/height, and renders
        // when opened directly. Verified against the Render deploy 2026-08-20:
        // the error survived a hard reload, a Clear-site-data, and adding the
        // width/height attributes. The SVG serves as the favicon from
        // index.html instead, where browsers do honour it; installability rests
        // on the PNGs, which is also what iOS uses (apple-touch-icon → 180).
        //
        // Splitting `any` and `maskable` into separate entries clears Chrome's
        // "declaring an icon with 'purpose' of 'any maskable' is discouraged"
        // warning.
        //
        // Artwork (2026-08-20, owner decision): icon-180/192/512.png are SRC's
        // commissioned mascot art (SRC/client/public/icon-192.png, icon-512.png;
        // 180 resized from the 512 master), replacing the hand-authored "37"
        // placeholder.
        //
        // Real Android install (2026-09-15, A3) showed the full-bleed art
        // survives the squircle mask, but with the ears/hair right at the
        // edge — the owner asked for more headroom. `icon-512-maskable.png`
        // is a dedicated maskable variant: the same art shrunk to 80% and
        // padded with its own background pink (sampled from the source
        // corner, not the manifest's cream, so the shrink reads as headroom
        // rather than a mismatched box) — see `steering/tasks.md` T-7.1 /
        // Gate 7. `icon-512.png` (full bleed) stays the `any` icon; only the
        // maskable entry points at the padded file.
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache hashed assets only — index.html is intentionally NOT in
        // the precache so a fresh navigation always picks up the latest
        // shell (spec §13). Socket.IO traffic is never cached; neither are
        // the Worker's `/i/<hash>.png` cartoons, which carry their own
        // immutable cache headers (design §7.2). `woff2` is the self-hosted
        // Fredoka (styles/index.css).
        globPatterns: ['**/*.{js,css,png,svg,woff2,webmanifest}'],
        // Disable the default precached-index.html fallback for SPA
        // navigations — the NetworkFirst rule below handles them.
        navigateFallback: null,
        navigateFallbackDenylist: [new RegExp(`^${BASE_RE}(socket\\.io|health)`)],
        runtimeCaching: [
          {
            // Navigation requests (`/`, `/anything`) — NetworkFirst so a
            // deploy is visible on the next page open. Falls back to the
            // cache only when the network is slow or unreachable, which
            // for a multiplayer game is already a degraded mode.
            urlPattern: ({ request }: { request: Request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-shell',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 4 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5183,
    strictPort: true,
  },
});
