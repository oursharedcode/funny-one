// SPDX-License-Identifier: AGPL-3.0-only
//
// The sound of a golden story's and a paid story's 5 s video: sleigh bells
// for the whole clip (Step 126, B-29, owner decisions 2026-11-25 D1 A and
// D2 A), and of their parts of the whole-game video (Step 135), and, since the owner's request of 2026-11-26, the character's
// "ho-ho-ho" when its balloon says so (videoCharacter.ts). The sound plays to the
// phone's speaker and into the recording at once — Web Audio sources wired to
// the speaker and to a MediaStream destination whose track rides along with
// the canvas's.
//
// The bells are `public/sounds/sleigh-bells.mp3`: the first 5 s of
// "Sleigh bells.wav" by The Midnite Wolf on Wikimedia Commons (CC0, recorded
// through an AKG C414), high-passed at 150 Hz, normalised and faded out over
// its last 0.7 s; MP3 because every browser decodes it. README names it.
//
// The voice is the character's own file (`CharacterRig.voice`): Santa's is
// low, the reindeer's a high cartoon voice. Both are the developer's one
// recording, altered before they were put there so that neither is his voice
// as he speaks. A voice is an extra — without the file a clip rings with the
// bells alone, as before — and while it sounds the bells are turned down.
//
// Best-effort throughout: no Web Audio, bells that fail to fetch or decode,
// or a browser that refuses the sound leaves the clip silent, as it was
// before.
//
// `openClipSound` must be called synchronously in the tap's handler, before
// anything is awaited: Safari only lets an AudioContext make sound when it is
// created (or resumed) inside the user's gesture.

import { withBase } from './basePath';

export const SLEIGH_BELLS_PATH = 'sounds/sleigh-bells.mp3';

// How much of the bells is left under the voice, and how fast they give way.
const DUCKED = 0.3;
const DUCK_S = 0.15;

/** One 5 s stretch of a video that rings: when it starts, and its character's voice. */
export interface SoundPart {
  atMs: number;
  /** The voice's file, null for bells alone. */
  voice: string | null;
  /** How long into the part the voice comes. */
  voiceAtMs: number;
}

export interface ClipSound {
  /** Resolves to the audio track for the recording, or null for silence. */
  ready: Promise<MediaStreamTrack | null>;
  /** Schedules each part's bells and voice, to the speaker and into the track. */
  play(parts: SoundPart[]): void;
  /** Stops them and lets the audio context go. Safe to call twice. */
  close(): void;
}

type AudioContextCtor = new () => AudioContext;

/** The browser's AudioContext, or null without Web Audio (revealBell.ts too). */
export function audioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/**
 * Opens a video's sound: the bells, and the voices at `voicePaths`. Which
 * stretches of the video ring is said to `play` — the whole-game video rings
 * only in its golden and paid stories' parts. Null where the browser has no
 * Web Audio at all.
 */
export function openClipSound(voicePaths: string[]): ClipSound | null {
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

  let bells: AudioBuffer | null = null;
  const voices = new Map<string, AudioBuffer>();
  let destination: MediaStreamAudioDestinationNode | null = null;
  const sources: AudioBufferSourceNode[] = [];
  let closed = false;

  async function load(path: string): Promise<AudioBuffer> {
    const response = await fetch(withBase(path));
    if (!response.ok) throw new Error(`${path} ${response.status}`);
    return ctx.decodeAudioData(await response.arrayBuffer());
  }

  async function loadVoice(path: string): Promise<void> {
    try {
      voices.set(path, await load(path));
    } catch {
      // A voice is an extra: its part rings with the bells alone.
    }
  }

  const ready = (async (): Promise<MediaStreamTrack | null> => {
    try {
      [bells] = await Promise.all([
        load(SLEIGH_BELLS_PATH),
        ...[...new Set(voicePaths)].map(loadVoice),
      ]);
      destination = ctx.createMediaStreamDestination();
      return destination.stream.getAudioTracks()[0] ?? null;
    } catch {
      close();
      return null;
    }
  })();

  function wire(node: AudioNode, into: MediaStreamAudioDestinationNode): void {
    node.connect(ctx.destination);
    node.connect(into);
  }

  // Schedules a voice at `at` and returns the gain that turns the bells down
  // under it — null, and bells at full strength, if anything here fails.
  function sayHoHoHo(
    buffer: AudioBuffer,
    at: number,
    into: MediaStreamAudioDestinationNode,
  ): GainNode | null {
    try {
      const end = at + buffer.duration;
      const duck = ctx.createGain();
      duck.gain.setValueAtTime(1, Math.max(0, at - DUCK_S));
      duck.gain.linearRampToValueAtTime(DUCKED, at);
      duck.gain.setValueAtTime(DUCKED, end);
      duck.gain.linearRampToValueAtTime(1, end + 2 * DUCK_S);
      const say = ctx.createBufferSource();
      say.buffer = buffer;
      wire(say, into);
      say.start(at);
      sources.push(say);
      return duck;
    } catch {
      return null;
    }
  }

  function play(parts: SoundPart[]): void {
    if (closed || !bells || !destination) return;
    const startedAt = ctx.currentTime;
    for (const part of parts) {
      try {
        const at = startedAt + part.atMs / 1000;
        const ring = ctx.createBufferSource();
        ring.buffer = bells;
        sources.push(ring);
        const voice = part.voice ? voices.get(part.voice) : undefined;
        const duck = voice ? sayHoHoHo(voice, at + part.voiceAtMs / 1000, destination) : null;
        if (duck) {
          ring.connect(duck);
          wire(duck, destination);
        } else {
          wire(ring, destination);
        }
        if (part.atMs > 0) ring.start(at);
        else ring.start();
      } catch {
        // Whatever did start, `close` stops.
      }
    }
  }

  function close(): void {
    if (closed) return;
    closed = true;
    for (const source of sources) {
      try {
        source.stop();
      } catch {
        // Already stopped, or never started.
      }
    }
    void ctx.close?.().catch(() => undefined);
  }

  return { ready, play, close };
}
