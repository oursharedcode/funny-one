// SPDX-License-Identifier: AGPL-3.0-only

// B-1c (FM-APP-3): is this page running inside the Android store app? A TWA
// renders the deployed bundle unchanged, so no build flag can tell — the page
// has to work it out at run time. Two signals, either one enough (owner
// decision 2026-10-04):
//
// - `?shell=android` on the launch URL, which the Bubblewrap project sets.
//   Kept in `sessionStorage` once seen, because a session can lose both
//   signals: "new room" navigates to the bare home URL (and that navigation's
//   referrer is our own page), and Home's "start over" strips the query.
// - A referrer of `android-app://com.oursharedcode.funny37`, which Chrome sets
//   when our app opens the page — this catches a `?room=` invitation that the
//   app's link handling opened directly, launch parameter or not. Only our
//   own package counts: other Android apps (the Google app, Gmail) send
//   `android-app://` referrers of their own when they hand a link to Chrome.
//
// Storage reads and writes are wrapped: a browser that blocks storage still
// gets the launch-URL signal, just without the persistence.

const PARAM = 'shell';
const PARAM_VALUE = 'android';
const REFERRER = 'android-app://com.oursharedcode.funny37';
const STORAGE_KEY = 'funny37.storeShell';

export function isStoreShell(): boolean {
  const fromUrl = new URLSearchParams(window.location.search).get(PARAM) === PARAM_VALUE;
  const fromReferrer =
    document.referrer === REFERRER || document.referrer.startsWith(REFERRER + '/');
  if (fromUrl || fromReferrer) {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Storage blocked — this page load still knows, which is what matters.
    }
    return true;
  }
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}
