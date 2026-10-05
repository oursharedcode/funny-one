// SPDX-License-Identifier: AGPL-3.0-only

// The service worker Funny One's FORMER address answers with (Step 60):
// https://<SITE_HOST>/funny1-game/sw.js — see deploy/caddy/Caddyfile.
//
// Funny One precaches the whole game, so a browser that visited the old
// address keeps answering it from its own cache and would never notice that
// the game moved to its own host. The one thing it still asks the server for
// is this script (the service worker update check). Being different from the
// worker it has, this one installs, takes over at once, removes the old
// caches and its own registration, and reloads every open page of the old
// address — which, with no worker left in the way, reaches the server and is
// forwarded to the new host.
//
// Plain script, no build step, no imports: it is served exactly as written.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const pages = await self.clients.matchAll({ type: 'window' });
      for (const name of await caches.keys()) await caches.delete(name);
      await self.registration.unregister();
      for (const page of pages) {
        // A page this worker does not control refuses navigate(); it is
        // forwarded on its next load instead.
        try {
          await page.navigate(page.url);
        } catch {
          /* See above. */
        }
      }
    })(),
  );
});
