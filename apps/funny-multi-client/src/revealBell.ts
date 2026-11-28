// SPDX-License-Identifier: AGPL-3.0-only
//
// The golden story's bell (Step 133, B-29 #9, owner decision D3 A). As the
// reveal screen opens on a golden story, the phone rings the first 2.5 s of
// the clips' sleigh bells (clipSound.ts), softly, fading out. Only a golden
// story rings. Each phone reveals its own story, so one phone rings in a free
// game; a paid story's reveal stays quiet, because its clip rings already.
// The bell lasts under 3 s, so it needs no control to stop it (WCAG 1.4.2).
//
// A reveal comes from the server, not from a tap, and a browser sounds only
// after a tap: Safari lets an AudioContext make sound only once it has started
// inside one. So while the room's pack is on, App calls `wakeRevealBell` on
// every tap and key press. The first opens the context inside the gesture and
// fetches the bells. The context then idles, suspended, since a running one
// keeps the phone's sound awake.
//
// Starting it again takes a phone a moment, at times over a second, which at
// the reveal would come too late. So on the phone whose story is golden, App
// calls `warmRevealBell` as the last round starts: the context runs, silent,
// until `ringRevealBell` rings it as the reveal opens, and then idles again.
// `coolRevealBell` lets it idle should the reveal not ring.
//
// Best-effort throughout. No Web Audio, bells that fail to load, or a phone
// that refuses the sound or answers too late (`LATE_MS`) leaves the reveal
// silent, with no error. Like all Web Audio, the bell keeps to an iPhone's
// silent switch.

import { withBase } from './basePath';
import { SLEIGH_BELLS_PATH, audioContextCtor } from './clipSound';

/** How long the bell rings, and from when it fades to silence. */
export const RING_S = 2.5;
export const FADE_FROM_S = 1.8;
/** Soft, as Home's reindeer's bells (ChristmasDressing.tsx). */
export const REVEAL_BELL_VOLUME = 0.5;
/** A bell this long after the screen opened would not belong to it. */
export const LATE_MS = 2000;

let context: AudioContext | null = null;
let bells: Promise<AudioBuffer | null> | null = null;
/** The context has run once, so it may resume outside a gesture. */
let woken = false;
/** A ring is waiting or sounding, so nothing else suspends the context. */
let ringing = false;
/** A golden reveal is near, so the context stays running for it. */
let warm = false;
let rung = new WeakSet<object>();

async function loadBells(ctx: AudioContext): Promise<AudioBuffer | null> {
  try {
    const response = await fetch(withBase(SLEIGH_BELLS_PATH));
    if (!response.ok) return null;
    return await ctx.decodeAudioData(await response.arrayBuffer());
  } catch {
    return null;
  }
}

function idle(ctx: AudioContext): void {
  if (!ringing && !warm) void ctx.suspend().catch(() => undefined);
}

/** Starts a context that has run once: outside a gesture, that is allowed. */
function rouse(ctx: AudioContext): void {
  if (ctx.state !== 'running') void ctx.resume().catch(() => undefined);
}

function stopRinging(ctx: AudioContext): void {
  ringing = false;
  idle(ctx);
}

/**
 * Readies the bell. Call it synchronously in a tap's or key press's handler,
 * the only place the context may start. Once it has started, it only starts a
 * warm context again that the phone stopped (an iPhone does, for a call).
 */
export function wakeRevealBell(): void {
  if (woken) {
    if (warm && context) rouse(context);
    return;
  }
  try {
    if (!context) {
      const Ctor = audioContextCtor();
      if (!Ctor) {
        // Nothing to wake, now or later.
        woken = true;
        return;
      }
      context = new Ctor();
      bells = loadBells(context);
    }
    const ctx = context;
    // A silent sample started inside the gesture unlocks older iPhones;
    // resume() does it everywhere else.
    const silence = ctx.createBufferSource();
    silence.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    silence.connect(ctx.destination);
    silence.start();
    ctx.resume().then(
      () => {
        if (woken) return;
        woken = true;
        idle(ctx);
      },
      () => undefined,
    );
  } catch {
    // A browser that throws here will not ring: stop asking it.
    woken = true;
  }
}

function ring(ctx: AudioContext, buffer: AudioBuffer): void {
  try {
    const at = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(REVEAL_BELL_VOLUME, at);
    gain.gain.setValueAtTime(REVEAL_BELL_VOLUME, at + FADE_FROM_S);
    gain.gain.linearRampToValueAtTime(0, at + RING_S);
    gain.connect(ctx.destination);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      stopRinging(ctx);
    };
    source.start(at, 0, RING_S);
  } catch {
    stopRinging(ctx);
  }
}

/**
 * Keeps the context running from now until the reveal rings, so it rings the
 * moment the reveal opens. The context starts now if a tap has woken it, or
 * else at the first tap.
 */
export function warmRevealBell(): void {
  warm = true;
  if (woken && context) rouse(context);
}

/** Lets the context idle again: the warm reveal has passed, rung or not. */
export function coolRevealBell(): void {
  warm = false;
  if (woken && context) idle(context);
}

/**
 * Rings the bell for the reveal `key`, once however often it is asked (a
 * screen's effects run twice in development). Silent if no tap woke it.
 */
export function ringRevealBell(key: object): void {
  if (rung.has(key)) return;
  rung.add(key);
  // Rung or not, this reveal's bell is spent: nothing more needs it warm.
  warm = false;
  const ctx = context;
  const loading = bells;
  if (!ctx || !loading) return;
  ringing = true;
  const ready = Promise.all([loading, ctx.state === 'running' ? null : ctx.resume()]).then(
    ([buffer]) => buffer,
  );
  const late = new Promise<null>((resolve) => window.setTimeout(() => resolve(null), LATE_MS));
  Promise.race([ready, late]).then(
    (buffer) => {
      if (buffer && ctx.state === 'running') ring(ctx, buffer);
      else stopRinging(ctx);
    },
    () => stopRinging(ctx),
  );
}

export function __resetRevealBellForTest(): void {
  context = null;
  bells = null;
  woken = false;
  ringing = false;
  warm = false;
  rung = new WeakSet();
}
