// SPDX-License-Identifier: AGPL-3.0-only

// Auto-reload when a new service worker takes over (spec §13).
//
// Pairs with the NetworkFirst navigation strategy in vite.config.ts:
// - NetworkFirst handles the "user opens the app after a deploy" case
//   (a fresh navigation goes to the network and gets the new shell).
// - This listener handles the "user has the tab open through a deploy"
//   case (the SW updates in the background; when it activates, the
//   running page reloads on the next available tick to pick up the new
//   bundle).
//
// Without this, registerType: 'autoUpdate' would update the SW silently
// but leave the currently-loaded page on the old code until the user
// manually refreshed — the symptom that drove backlog item 16.
//
// B-26 (Step 94): the reload waits for Home. The client keeps no room or seat
// to come back to, so a reload anywhere else drops the player out of the
// room — and the likeliest moment for one is a page opened just after a
// deploy, whose new SW finishes precaching after the player has joined.
// App.tsx reports through setReloadSafe whether a reload would cost anything;
// an update that arrives while it would is held until Home.

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
  // controllerchange also fires the first time a SW claims the page
  // (clientsClaim), when there was no previous controller. Reloading then
  // would wipe a first visit's room mid-setup as soon as the precache
  // finishes, so only a page that was already controlled — a real update —
  // reloads. The `refreshing` guard keeps that to once per session.
  const hadController = navigator.serviceWorker.controller != null;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || refreshing) return;
    if (safe) reloadNow();
    else pending = true;
  });
}

/** Whether a reload now would cost the player nothing; a held update reloads once it does. */
export function setReloadSafe(value: boolean): void {
  safe = value;
  if (safe && pending && !refreshing) reloadNow();
}
