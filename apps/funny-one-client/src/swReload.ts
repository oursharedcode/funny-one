// SPDX-License-Identifier: AGPL-3.0-only

// Auto-reload when a new service worker takes over. Copied verbatim from
// apps/funny-multi-client/src/swReload.ts — this behavior is product-agnostic.
// Funny One's precache is total rather than shell-only (FO-IMG-2), but the
// controllerchange handshake that reloads a still-open tab works the same way
// either way.

let refreshing = false;

export function installSwReloadListener(): void {
  if (typeof navigator === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}
