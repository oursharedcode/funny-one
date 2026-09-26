// SPDX-License-Identifier: AGPL-3.0-only

// Auto-reload when a new service worker takes over. Adapted from
// apps/funny-multi-client/src/swReload.ts, with one fix: `controllerchange`
// also fires the first time a service worker claims the page (clientsClaim),
// when there was no previous controller. Funny Multi's once-per-session guard
// stops that from looping but still reloads once — on a first visit that
// lands as soon as the precache finishes, wiping whatever seat setup or game
// is in progress (found by scripts/funny-one-offline.mjs, T-FO-6.1). So the
// page only reloads when it was already controlled, i.e. a real update.

let refreshing = false;

export function installSwReloadListener(): void {
  if (typeof navigator === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  const hadController = navigator.serviceWorker.controller != null;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}
