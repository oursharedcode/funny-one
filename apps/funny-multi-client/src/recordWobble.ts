// SPDX-License-Identifier: AGPL-3.0-only
//
// Records a 5-second 9:16 wobble of the AI cartoon to WebM via MediaRecorder.
// Copied from SRC/client/src/recordWobble.ts (T-5.2, design §8.3). `loadImage`
// sets `img.crossOrigin = 'anonymous'` for a cross-origin `pictureUrl`, which
// is what a `PictureRef.url` needs to land on the canvas untainted — paired
// with the Worker route's `Access-Control-Allow-Origin: *` (design §7.2),
// `canvas.captureStream()` never throws.
//
// ARC-3/DD-9 (T-1.6) dropped SRC's wire-level `WobbleEngine` choice, so there
// is one recorder. Since B-12 (2026-10-05) it also carries what SRC's second
// recorder (`recordWobbleLottie.ts`) added on top of this one — the laughing
// monkey, see videoCharacter.ts — and that file's two Android fixes, marked
// below.
//
// Sibling to downloadStory.ts: same idea (composite + download), but the
// composite is animated. The easing math mirrors the CSS keyframes in
// styles/index.css so the recorded clip matches the in-app preview.
//
// Container/codec: MediaRecorder support is patchy across browsers — VP9, VP8,
// then MP4 (Safari) are tried in order. If none is supported the function
// rejects; the caller surfaces this as a button-disabled state.
//
// The deployer-logo stamp below is best-effort against `/deployer-logo.png`,
// which now ships (T-7.2, same placeholder asset as `<LogoStamp />`'s in-app
// overlay). Still wrapped in a try/catch: a deployer who removes the file
// without replacing it degrades to "no stamp" rather than a broken export.
//
// Step 117 (owner decision D1 A): a Christmas story's clip plays its scene for
// the first half, then its ending for the second — a golden story's ending
// picture, or the ending as a text card (videoFooter.ts `drawEndingCard`) —
// still five seconds, still silent: the sleigh bells come with the paid half.
// A golden story's footer is the edition's (landingUrl.ts `footerTarget`).
// Step 122: a paid story's footer is the buyer's thank-you, measured with the
// same label it is drawn with, since that one can wrap.
// Step 126 (owner decisions 2026-11-25 D1 A, D2 A): a golden story's and a
// paid story's clip rings with sleigh bells (clipSound.ts), to the speaker
// and into the recording; every other clip stays silent.
// Owner request 2026-11-26: in those two clips a reindeer or a Santa, turn
// about, takes the monkey's place and says "ho-ho-ho" — in the balloon and
// aloud, as the balloon goes up.
// Step 135 (B-29 #7): the whole game's video — every story's 5 s clip, one
// after another, in one file (`buildGameVideoFile`). Both videos record MP4
// first on Apple devices (Photos takes no WebM, B-14) and have their length
// written into a WebM that lacks it (webmDuration.ts).

import { footerTarget, type FooterTarget } from './landingUrl';
import { openClipSound, type ClipSound, type SoundPart } from './clipSound';
import { withBase } from './basePath';
import { downloadFile } from './share';
import { setWebmDuration } from './webmDuration';
import {
  drawAttribution,
  drawEndingCard,
  drawStoryText,
  measureAttributionHeight,
  renderQrCanvas,
} from './videoFooter';
import {
  drawCharacter,
  loadCharacterSprites,
  nextCharacter,
  POINT_START_MS,
  type CharacterRig,
  type CharacterSprites,
} from './videoCharacter';
import type { AuthoredLanguage } from '@funny/shared';

const W = 720;
const H = 1280;
const FPS = 30;
const DURATION_MS = 5000;
// The whole-game video's rates: some 7 MB for seven stories.
const GAME_RATES = { videoBitsPerSecond: 1_500_000, audioBitsPerSecond: 96_000 };
// A Christmas story's ending takes over halfway, fading in over FADE_MS.
const ENDING_AT_MS = DURATION_MS / 2;
const FADE_MS = 300;
const CREAM = '#fef3c7';
const PINK = '#ec4899';

// Half-cycle sine eased between 0 and 1 (matches CSS ease-in-out closely
// enough for visual parity at 30 fps).
function tri(t: number): number {
  return 0.5 - 0.5 * Math.cos(Math.PI * 2 * t);
}

interface WobbleFrame {
  scale: number;
  dx: number;
  dy: number;
  rot: number;
  pulse: number;
}

function wobbleAt(ms: number): WobbleFrame {
  // Each axis has its own period; matches the four keyframe blocks.
  const zoomPhase = (ms % 2400) / 2400;
  const driftPhase = (ms % 5000) / 5000;
  const jigglePhase = (ms % 1600) / 1600;
  const pulsePhase = (ms % 600) / 600;
  return {
    scale: 1 + 0.05 * tri(zoomPhase),
    dx: 12 * Math.sin(driftPhase * Math.PI * 2) - 6,
    dy: 8 * Math.sin(driftPhase * Math.PI * 2 + Math.PI / 2) + 1,
    rot: ((2.8 * tri(jigglePhase) - 1.4) * Math.PI) / 180,
    pulse: 1 + 0.12 * tri(pulsePhase),
  };
}

function isApple(): boolean {
  return typeof navigator !== 'undefined' && /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
}

// With a sound track, a container that names its audio codec first; the plain
// types after them take whatever audio the browser records by default.
function pickMime(withAudio = false): { mime: string; ext: string } | null {
  const candidates: Array<[string, string]> = [
    // An iPhone's Photos takes MP4 and no WebM, though Safari records both.
    ...(isApple() ? ([['video/mp4', 'mp4']] as Array<[string, string]>) : []),
    ...(withAudio
      ? ([
          ['video/webm;codecs=vp9,opus', 'webm'],
          ['video/webm;codecs=vp8,opus', 'webm'],
        ] as Array<[string, string]>)
      : []),
    ['video/webm;codecs=vp9', 'webm'],
    ['video/webm;codecs=vp8', 'webm'],
    ['video/webm', 'webm'],
    ['video/mp4', 'mp4'],
  ];
  for (const [mime, ext] of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
      return { mime, ext };
    }
  }
  return null;
}

function safeFileName(nickname: string, ext: string): string {
  const slug = nickname
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return `funny-stories-${slug || 'story'}.${ext}`;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  // Only for a true cross-origin URL (SRC's first Android fix). On a
  // same-origin image it makes Android browsers treat the Workbox-cached
  // response as CORS-restricted, since that response carries no CORS headers:
  // `decode()` still resolves, but `drawImage` paints nothing.
  if (/^https?:/.test(src) && !src.startsWith(window.location.origin)) {
    img.crossOrigin = 'anonymous';
  }
  img.src = src;
  await img.decode();
  return img;
}

export function isVideoRecordingSupported(): boolean {
  return (
    typeof MediaRecorder !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.captureStream === 'function' &&
    pickMime() !== null
  );
}

/** A Christmas story's ending (Step 117): its picture when it has one. */
export interface VideoEnding {
  pictureUrl: string | null;
  /** The ending in the story's language, for the card. */
  text: string;
}

export interface WobbleVideoOptions {
  nickname: string;
  prose: string;
  pictureUrl: string;
  /** The language the prose is in — a switched story (B-15) can differ
   *  from the interface's. The footer notice follows it, not the active
   *  UI locale. */
  language: AuthoredLanguage;
  /** Step 117: a golden story, whose footer is the edition's. */
  golden?: boolean;
  /** Step 122: a story of a paid game, whose footer is the buyer's thank-you. */
  paid?: boolean;
  /** Step 117: a Christmas story's ending, shown for the clip's second half. */
  ending?: VideoEnding | null;
}

export async function buildWobbleVideoFile(opts: WobbleVideoOptions): Promise<File> {
  if (!pickMime()) throw new Error('MediaRecorder not supported in this browser');
  // The character first — the monkey, or a festive clip's reindeer or Santa —
  // because the voice is its own.
  const festive = isFestive(opts);
  const rig = nextCharacter(festive);
  // Opened before the first await, while the tap that asked for the clip still
  // counts as the user's gesture (Safari's rule, clipSound.ts).
  const sound = festive ? openClipSound(rig.voice ? [rig.voice] : []) : null;
  try {
    const clip = await loadClip(opts, rig, festive, makeLoader());
    return await recordClips([clip], {
      target: footerTarget(opts.golden === true, opts.paid === true),
      fileName: (ext) => safeFileName(opts.nickname, ext),
      sound,
    });
  } finally {
    sound?.close();
  }
}

export interface GameVideoOptions {
  /** Each story as its own 5 s clip would take it, in the order they play. */
  stories: WobbleVideoOptions[];
  /** The one footer under every part: the room's, not each story's. */
  footer: { golden: boolean; paid: boolean };
  /** Aborted to give the recording up; leaving the page does so too. */
  signal?: AbortSignal;
  /** Called as each part starts recording, `number` counted from 1. */
  onPart?: (number: number, total: number) => void;
}

/** The recording was given up: the page was left, or the gallery closed. */
export class RecordingStopped extends Error {
  constructor() {
    super('Recording stopped');
    this.name = 'RecordingStopped';
  }
}

/**
 * The whole game in one video (Step 135): each story's own 5 s clip, one after
 * another — its character, its ending, and the sleigh bells where its clip
 * rings. A story whose picture cannot be had is left out.
 */
export async function buildGameVideoFile(opts: GameVideoOptions): Promise<File> {
  if (!pickMime()) throw new Error('MediaRecorder not supported in this browser');
  const cast = opts.stories.map((story) => {
    const festive = isFestive(story);
    return { story, festive, rig: nextCharacter(festive) };
  });
  // One sound for the whole video, opened inside the tap as a clip's is.
  const sound = cast.some((c) => c.festive)
    ? openClipSound(cast.flatMap((c) => (c.rig.voice ? [c.rig.voice] : [])))
    : null;

  // A hidden page draws no frames, so leaving it gives the attempt up; and a
  // phone that locks hides the page, so the screen is kept on.
  const stop = new AbortController();
  const giveUp = (): void => stop.abort();
  const onVisibility = (): void => {
    if (document.visibilityState === 'hidden') giveUp();
  };
  document.addEventListener('visibilitychange', onVisibility);
  opts.signal?.addEventListener('abort', giveUp);
  if (opts.signal?.aborted) giveUp();
  const wakeLock = keepScreenOn();

  try {
    onVisibility();
    // Everything is loaded before the first frame: a wait between two parts
    // would freeze the video.
    const load = makeLoader();
    const loaded = await Promise.all(
      cast.map((c) => loadClip(c.story, c.rig, c.festive, load).catch(() => null)),
    );
    const clips = loaded.filter((clip): clip is Clip => clip !== null);
    if (clips.length === 0) throw new Error('No story picture could be loaded');
    return await recordClips(clips, {
      target: footerTarget(opts.footer.golden, opts.footer.paid),
      fileName: (ext) => `funny-stories-whole-game.${ext}`,
      sound,
      rates: GAME_RATES,
      signal: stop.signal,
      onPart: opts.onPart,
    });
  } finally {
    sound?.close();
    document.removeEventListener('visibilitychange', onVisibility);
    opts.signal?.removeEventListener('abort', giveUp);
    void wakeLock.then((lock) => lock?.release()).catch(() => undefined);
  }
}

/** Best-effort: with no Wake Lock, or a refusal, it records all the same. */
async function keepScreenOn(): Promise<{ release(): Promise<void> } | null> {
  try {
    return (await navigator.wakeLock?.request('screen')) ?? null;
  } catch {
    return null;
  }
}

/** The clips with sound and a Christmas character: a golden story's and a paid story's. */
function isFestive(opts: WobbleVideoOptions): boolean {
  return opts.golden === true || opts.paid === true;
}

type ImageLoader = (src: string) => Promise<HTMLImageElement>;

/** `loadImage`, each address once per video. */
function makeLoader(): ImageLoader {
  const images = new Map<string, Promise<HTMLImageElement>>();
  return (src) => {
    let image = images.get(src);
    if (!image) {
      image = loadImage(src);
      images.set(src, image);
    }
    return image;
  };
}

/** One story's part of a video, with everything it draws already loaded. */
interface Clip {
  nickname: string;
  prose: string;
  language: AuthoredLanguage;
  festive: boolean;
  rig: CharacterRig;
  picture: HTMLImageElement;
  logo: HTMLImageElement | null;
  character: CharacterSprites | null;
  ending: VideoEnding | null;
  endingPicture: HTMLImageElement | null;
}

async function loadClip(
  opts: WobbleVideoOptions,
  rig: CharacterRig,
  festive: boolean,
  load: ImageLoader,
): Promise<Clip> {
  const { nickname, prose, pictureUrl, language } = opts;
  const ending = opts.ending ?? null;

  const picture = await load(pictureUrl);
  // Deployer logo: best-effort — if it fails to load (404 / CORS), the video
  // still records, just without the stamp.
  const logo = await load(withBase('deployer-logo.png')).catch(() => null);
  // The character is best-effort too: without its sprites the clip is the
  // plain wobble it was before B-12.
  const character = await loadCharacterSprites(load, rig).catch(() => null);
  // The ending's picture is best-effort as well: without it, the card.
  const endingPicture = ending?.pictureUrl ? await load(ending.pictureUrl).catch(() => null) : null;
  return {
    nickname,
    prose,
    language,
    festive,
    rig,
    picture,
    logo,
    character,
    ending,
    endingPicture,
  };
}

interface RecordOptions {
  target: FooterTarget;
  fileName: (ext: string) => string;
  sound: ClipSound | null;
  rates?: { videoBitsPerSecond: number; audioBitsPerSecond: number };
  signal?: AbortSignal;
  onPart?: (number: number, total: number) => void;
}

/** Draws the clips one after another into one recording. */
async function recordClips(clips: Clip[], opts: RecordOptions): Promise<File> {
  const { target, sound, signal } = opts;
  // QR code rendered once, then blitted onto every recorded frame.
  const qrCanvas = await renderQrCanvas(target.url);
  // The sound's track, when it loaded; the video is silent otherwise.
  const soundTrack = sound ? await sound.ready : null;
  if (signal?.aborted) throw new RecordingStopped();

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  // In the page but out of sight (SRC's second Android fix): Android Chrome
  // throttles the frame loop of a canvas that is never in the DOM, which left
  // the character frozen or missing. Not `display:none` — that pauses it too.
  canvas.style.cssText = 'position:fixed;left:-99999px;top:0;pointer-events:none;opacity:0;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    throw new Error('Canvas 2D context unavailable');
  }

  // The picture is square (Flux Schnell default); fit it into the 9:16 frame
  // with a margin and let the wobble play on top.
  const margin = 40;
  const picSize = W - margin * 2;
  const picX = margin;
  const picY = (H - picSize) / 2 - 60; // bias up to leave room for the badge

  // Vertical budget for the story text: whatever's left between the name and
  // the attribution footer, so a long story shrinks rather than clipping the
  // QR off the bottom. A footer's height depends on its language alone.
  const STORY_GAP = 30; // gap between the story block and the footer
  const BOTTOM_MARGIN = 40;
  const badgeY = picY + picSize + 50;
  const storyTop = badgeY + 40;
  const storyHeights = clips.map(
    (clip) =>
      H -
      BOTTOM_MARGIN -
      measureAttributionHeight(ctx, W, clip.language, target.labelKey) -
      STORY_GAP -
      storyTop,
  );

  const stream = canvas.captureStream(FPS);
  let mime = pickMime(soundTrack !== null)!;
  let recorder: MediaRecorder;
  try {
    if (soundTrack) stream.addTrack(soundTrack);
    recorder = new MediaRecorder(stream, { mimeType: mime.mime, ...opts.rates });
  } catch (err) {
    if (!soundTrack) {
      canvas.remove();
      throw err;
    }
    // A browser that will not record this sound records the picture alone.
    stream.removeTrack(soundTrack);
    sound?.close();
    mime = pickMime()!;
    recorder = new MediaRecorder(stream, { mimeType: mime.mime, ...opts.rates });
  }
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e): void => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const totalMs = clips.length * DURATION_MS;
  const done = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = (): void => {
      if (signal?.aborted) reject(new RecordingStopped());
      else resolve(new Blob(chunks, { type: mime.mime }));
    };
  });
  let stopped = false;
  function stopRecorder(): void {
    if (stopped) return;
    stopped = true;
    recorder.stop();
  }

  const start = performance.now();
  let raf = 0;
  let current = -1;

  function drawFrame(now: number): void {
    // Which part this frame belongs to, and how far into that part it is.
    const total = now - start;
    const index = Math.min(clips.length - 1, Math.max(0, Math.floor(total / DURATION_MS)));
    const elapsed = total - index * DURATION_MS;
    const clip = clips[index]!;
    const { picture, ending, endingPicture, logo, character, rig, language } = clip;
    if (index !== current) {
      current = index;
      opts.onPart?.(index + 1, clips.length);
    }
    const w = wobbleAt(elapsed);

    // Background.
    ctx!.fillStyle = CREAM;
    ctx!.fillRect(0, 0, W, H);

    // Picture with the four-axis transform — composed around its own centre.
    const cx = picX + picSize / 2;
    const cy = picY + picSize / 2;
    // How far the ending has faded in: 0 for the scene, 1 once it has.
    const endingShown = ending ? Math.min(1, Math.max(0, (elapsed - ENDING_AT_MS) / FADE_MS)) : 0;
    ctx!.save();
    ctx!.translate(cx + w.dx, cy + w.dy);
    ctx!.rotate(w.rot);
    ctx!.scale(w.scale, w.scale);
    if (endingShown < 1) {
      ctx!.globalAlpha = 1 - endingShown;
      ctx!.drawImage(picture, -picSize / 2, -picSize / 2, picSize, picSize);
    }
    if (ending && endingShown > 0) {
      ctx!.globalAlpha = endingShown;
      if (endingPicture) {
        ctx!.drawImage(endingPicture, -picSize / 2, -picSize / 2, picSize, picSize);
      } else {
        drawEndingCard(ctx!, ending.text, {
          x: -picSize / 2,
          y: -picSize / 2,
          size: picSize,
          language,
        });
      }
    }
    ctx!.globalAlpha = 1;
    // Deployer logo stamp (25×25, bottom-right of the picture rect). It marks
    // pictures, so over an ending card, which has none (as on the screen), it
    // fades out with the scene (Step 133).
    const stampShown = ending && !endingPicture ? 1 - endingShown : 1;
    if (logo && stampShown > 0) {
      ctx!.globalAlpha = stampShown;
      ctx!.drawImage(logo, picSize / 2 - 33, picSize / 2 - 33, 25, 25);
      ctx!.globalAlpha = 1;
    }
    ctx!.restore();

    // The character, on top of the cartoon. Its ground is the cartoon's top
    // edge under the same four-axis transform, so it rides the wobble.
    if (character) {
      const stage = {
        width: W,
        groundAt: (x: number): number =>
          cy + w.dy + (x - cx - w.dx) * Math.sin(w.rot) - (picSize / 2) * w.scale * Math.cos(w.rot),
      };
      drawCharacter(ctx!, elapsed, character, stage, rig);
    }

    // Pulsing nickname badge — the "speech bubble pulse" element. URL was
    // moved out of the pulse into the static attribution block below; the
    // pulse now carries just the nickname to avoid duplicating the URL.
    const badgeCx = W / 2;
    ctx!.save();
    ctx!.translate(badgeCx, badgeY);
    ctx!.scale(w.pulse, w.pulse);
    ctx!.fillStyle = PINK;
    ctx!.font = 'bold 36px system-ui, sans-serif';
    ctx!.textAlign = 'center';
    ctx!.textBaseline = 'middle';
    ctx!.fillText(clip.nickname, 0, 0);
    ctx!.restore();

    // Full story text, just below the player's name. Font auto-shrinks to fit
    // the budgeted height so the footer below never clips off the bottom.
    const storyBottom = drawStoryText(ctx!, clip.prose, {
      topY: storyTop,
      canvasWidth: W,
      maxHeight: storyHeights[index]!,
      language,
    });

    // Static attribution footer matching the downloadable PNG's footer:
    // wrapped content-responsibility notice + QR + source label + URL.
    drawAttribution(ctx!, qrCanvas, {
      topY: storyBottom + STORY_GAP,
      canvasWidth: W,
      language,
      labelKey: target.labelKey,
      urlText: target.urlText,
    });

    if (total >= totalMs) {
      stopRecorder();
      return;
    }
    raf = requestAnimationFrame(drawFrame);
  }

  const onAbort = (): void => {
    cancelAnimationFrame(raf);
    stopRecorder();
  };
  signal?.addEventListener('abort', onAbort);
  recorder.start();
  // The voice comes as each ringing part's balloon goes up.
  sound?.play(
    clips.flatMap((clip, i): SoundPart[] =>
      clip.festive
        ? [{ atMs: i * DURATION_MS, voice: clip.rig.voice, voiceAtMs: POINT_START_MS }]
        : [],
    ),
  );
  raf = requestAnimationFrame(drawFrame);
  try {
    let blob = await done;
    if (mime.ext === 'webm') blob = await setWebmDuration(blob, totalMs);
    return new File([blob], opts.fileName(mime.ext), { type: mime.mime });
  } finally {
    signal?.removeEventListener('abort', onAbort);
    cancelAnimationFrame(raf);
    canvas.remove();
  }
}

// Records the wobble clip and saves it to disk. Thin wrapper over
// buildWobbleVideoFile so the same recording can instead be handed to the
// native share sheet (see share.ts).
export async function recordWobbleVideo(opts: WobbleVideoOptions): Promise<void> {
  downloadFile(await buildWobbleVideoFile(opts));
}
