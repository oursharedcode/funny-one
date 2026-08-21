// SPDX-License-Identifier: AGPL-3.0-only

// Adapted from SRC/client/vite.config.ts. Three changes:
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
//
// Everything else — the NetworkFirst navigation strategy, the deliberately
// un-precached index.html, the Google Fonts rules — is carried verbatim,
// including the reasoning: it is what makes a deploy visible to a player
// whose PWA shell is already installed (spec §13).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8'),
) as { version: string };
const BUILD_DATE = new Date().toISOString().slice(0, 10);

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(BUILD_DATE),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-180.png', 'icon-192.png', 'icon-512.png', 'flags/*.png'],
      manifest: {
        name: 'Funny Multi «Чепуха 37»',
        short_name: 'Funny Multi',
        description: 'Pick absurd answers together, then watch an AI cartoon the story.',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#fef3c7',
        background_color: '#fef3c7',
        start_url: '/',
        scope: '/',
        // PNG only, and each `purpose` declared on its own entry.
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
        // placeholder. NOT verified maskable-safe — the art's ears/hair sit close
        // to the frame edge, outside the usual middle-80% safe zone, so a circular
        // mask (Android adaptive icons) may clip them. Re-check on a real Android
        // install (T-7.1) rather than assuming this is fine.
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
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
        // immutable cache headers (design §7.2).
        globPatterns: ['**/*.{js,css,png,svg,webmanifest}'],
        // Disable the default precached-index.html fallback for SPA
        // navigations — the NetworkFirst rule below handles them.
        navigateFallback: null,
        navigateFallbackDenylist: [/^\/socket\.io/, /^\/health/],
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
          {
            // Google Fonts stylesheet — revalidate in the background.
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            // Google Fonts files — immutable, cache for a year.
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
});
