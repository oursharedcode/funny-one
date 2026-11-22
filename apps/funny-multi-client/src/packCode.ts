// SPDX-License-Identifier: AGPL-3.0-only

// Step 122 (B-29): the paid code on this phone. The pay page's link carries
// it (`?code=XMAS26-K7QM-3FPA`); the page takes it off the address bar before
// the first render, so it is never copied along with an invitation, and keeps
// it in localStorage, so every room this phone creates is paid until the
// pack's paid part ends. A person can remove it on Home; nothing forgets it
// on its own, so a code the server refuses keeps saying why.
//
// Only the website reads codes. The Android app ignores them entirely, under
// Play's payments policy: it neither keeps one from a link it opens nor sends
// one Chrome remembers from the website, whose storage a TWA shares. A room
// someone else paid for still plays paid in the app.
//
// Storage reads and writes are wrapped, as in storeShell.ts: a browser that
// blocks storage keeps the code for this page load only.

import {
  isPackFree,
  isPackPaid,
  packHasLanguage,
  parseCode,
  type AuthoredLanguage,
  type PackCode,
  type RoomPack,
} from '@funny/shared';
import { isStoreShell } from './storeShell';

const PARAM = 'code';
const STORAGE_KEY = 'funny37.packCode';

// The code where storage is blocked; also set where it is not.
let memory: string | null = null;
// This page load's link carried something that is not a code.
let linkRefused = false;

/** Takes a pay link's code off the address bar and keeps it. Before the first render. */
export function capturePackCodeFromUrl(): void {
  if (isStoreShell()) return;
  const url = new URL(window.location.href);
  const raw = url.searchParams.get(PARAM);
  if (raw === null) return;
  url.searchParams.delete(PARAM);
  window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  const code = parseCode(raw);
  if (code) rememberPackCode(code.code);
  else linkRefused = true;
}

/** True when this page load's link carried something that is not a code. */
export function linkCodeRefused(): boolean {
  return linkRefused;
}

/** The code this phone keeps, or null — always null in the Android app. */
export function readPackCode(): PackCode | null {
  if (isStoreShell()) return null;
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage blocked: this page load's code, if any.
  }
  return parseCode(stored ?? memory);
}

export function rememberPackCode(code: string): void {
  memory = code;
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Storage blocked — kept for this page load.
  }
}

export function forgetPackCode(): void {
  memory = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked — nothing was kept there.
  }
}

/**
 * True when this phone's code could open the pack of a room in `language`:
 * the lobby's and the end screen's "Use my Christmas pack here". The server
 * has the last word; this only keeps the button away where it cannot work.
 * A room with no pack had none to offer — its language has none, or the
 * pack's free part had ended — and only the second can be opened.
 */
export function canUnlockRoom(
  pack: RoomPack | null,
  language: AuthoredLanguage,
  now = Date.now(),
): boolean {
  const code = readPackCode();
  if (!code || pack?.paid) return false;
  if (!isPackPaid(code.pack, now) || !packHasLanguage(code.pack, language)) return false;
  return pack ? pack.id === code.pack : !isPackFree(code.pack, now);
}

export function __resetPackCodeForTest(): void {
  memory = null;
  linkRefused = false;
}
