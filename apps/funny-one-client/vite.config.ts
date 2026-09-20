// SPDX-License-Identifier: AGPL-3.0-only

// Adapted from apps/funny-multi-client/vite.config.ts. Two differences beyond
// product identity:
//
//  1. No workbox runtime-caching rule is needed for a socket/API origin —
//     Funny One makes zero runtime network calls of any kind (FO-IMG-2,
//     D-8): the navigateFallbackDenylist for `socket.io|health` has no
//     equivalent here because there is no server to deny-list.
//  2. `globPatterns` will need to widen once the rig art lands (T-FO-4.1) —
//     the whole point of this product is that gameplay works with the
//     network off, so every asset the compositor reads must be precached,
//     not just the app shell.

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
      // Placeholder icons only (funny-multi-client's, copied verbatim) — Funny
      // One has no branding of its own yet. Swap for real artwork alongside
      // the rig art (T-FO-4.1) before this product is announced anywhere.
      includeAssets: ['icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png'],
      manifest: {
        name: 'Funny One «Семейная Чепуха»',
        short_name: 'Funny One',
        description: 'Pass-and-play absurd stories, one device, no network, no ads.',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#fef3c7',
        background_color: '#fef3c7',
        start_url: BASE_PATH,
        scope: BASE_PATH,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache everything — there is no server to fall back to, so this
        // is a full offline PWA rather than the NetworkFirst-shell strategy
        // apps/funny-multi-client uses (FO-IMG-2).
        globPatterns: ['**/*.{js,css,png,svg,webmanifest}'],
      },
    }),
  ],
  server: {
    port: 5174,
    strictPort: true,
  },
});
