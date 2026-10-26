// SPDX-License-Identifier: AGPL-3.0-only

// Auto-reload when a new service worker takes over. Adapted from
// apps/funny-multi-client/src/swReload.ts, with one fix: `controllerchange`
// also fires the first time a service worker claims the page (clientsClaim),
// when there was no previous controller. Funny Multi's once-per-session guard
// stops that from looping but still reloads once — on a first visit that
// lands as soon as the precache finishes, wiping whatever seat setup or game
// is in progress (found by scripts/funny-one-offline.mjs, T-FO-6.1). So the
// page only reloads when it was already controlled, i.e. a real update.
//
// B-26 (Step 94): a real update waits for Home too. A game lives only in this
// page's memory, so a reload anywhere else wipes it — and the likeliest moment
// for one is a page opened just after a deploy, whose new service worker
// finishes precaching mid-game. App.tsx reports through setReloadSafe whether
// a reload would cost anything; an update that arrives while it would is held.

let refreshing = false;
let pending = false;
// Every page starts on Home, so a reload is safe until App.tsx says otherwise.
let safe = true;

function reloadNow(): void {
  refreshing = true;
  window.location.reload();
}

export function installSwReloadListener(): void {
  if (typeof navigator === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  const hadController = navigator.serviceWorker.controller != null;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || refreshing) return;
    if (safe) reloadNow();
    else pending = true;
  });
}

/** Whether a reload now would cost the players nothing; a held update reloads once it does. */
export function setReloadSafe(value: boolean): void {
  safe = value;
  if (safe && pending && !refreshing) reloadNow();
}
