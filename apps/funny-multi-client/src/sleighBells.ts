// SPDX-License-Identifier: AGPL-3.0-only
//
// Step 126 (B-29, owner decisions 2026-11-25 D1 A and D2 A): the sleigh bells
// of a golden story's and a paid story's 5 s video. The sound plays to the
// phone's speaker and into the recording at once — one Web Audio source wired
// to the speaker and to a MediaStream destination whose track rides along
// with the canvas's.
//
// The recording is `public/sounds/sleigh-bells.mp3`: the first 5 s of
// "Sleigh bells.wav" by The Midnite Wolf on Wikimedia Commons (CC0, recorded
// through an AKG C414), high-passed at 150 Hz, normalised and faded out over
// its last 0.7 s; MP3 because every browser decodes it. README names it.
//
// Best-effort throughout: no Web Audio, a fetch or decode that fails, or a
// browser that refuses the sound leaves the clip silent, as it was before.
//
// `openSleighBells` must be called synchronously in the tap's handler, before
// anything is awaited: Safari only lets an AudioContext make sound when it is
// created (or resumed) inside the user's gesture.

import { withBase } from './basePath';

export const SLEIGH_BELLS_PATH = 'sounds/sleigh-bells.mp3';

export interface SleighBells {
  /** Resolves to the audio track for the recording, or null for silence. */
  ready: Promise<MediaStreamTrack | null>;
  /** Starts the bells, to the speaker and into the track. */
  play(): void;
  /** Stops them and lets the audio context go. Safe to call twice. */
  close(): void;
}

type AudioContextCtor = new () => AudioContext;

function audioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/** Null where the browser has no Web Audio at all. */
export function openSleighBells(): SleighBells | null {
  const Ctor = audioContextCtor();
  if (!Ctor) return null;
  let ctx: AudioContext;
  try {
    ctx = new Ctor();
  } catch {
    return null;
  }
  // Inside the gesture, where Safari wants it; a context that starts running
  // makes this a no-op.
  void ctx.resume?.().catch(() => undefined);

  let buffer: AudioBuffer | null = null;
  let source: AudioBufferSourceNode | null = null;
  let destination: MediaStreamAudioDestinationNode | null = null;
  let closed = false;

  const ready = (async (): Promise<MediaStreamTrack | null> => {
    try {
      const response = await fetch(withBase(SLEIGH_BELLS_PATH));
      if (!response.ok) throw new Error(`bells ${response.status}`);
      buffer = await ctx.decodeAudioData(await response.arrayBuffer());
      destination = ctx.createMediaStreamDestination();
      return destination.stream.getAudioTracks()[0] ?? null;
    } catch {
      close();
      return null;
    }
  })();

  function play(): void {
    if (closed || !buffer || !destination) return;
    try {
      source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.connect(destination);
      source.start();
    } catch {
      source = null;
    }
  }

  function close(): void {
    if (closed) return;
    closed = true;
    try {
      source?.stop();
    } catch {
      // Already stopped, or never started.
    }
    void ctx.close?.().catch(() => undefined);
  }

  return { ready, play, close };
}
