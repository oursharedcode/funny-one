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
// monkey, see videoMonkey.ts — and that file's two Android fixes, marked
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

import { SOURCE_URL } from './sourceUrl';
import { withBase } from './basePath';
import { downloadFile } from './share';
import {
  drawAttribution,
  drawStoryText,
  measureAttributionHeight,
  renderQrCanvas,
} from './videoFooter';
import { drawMonkey, loadMonkeySprites, type MonkeySprites } from './videoMonkey';

const W = 720;
const H = 1280;
const FPS = 30;
const DURATION_MS = 5000;
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

function pickMime(): { mime: string; ext: string } | null {
  const candidates: Array<[string, string]> = [
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

export async function buildWobbleVideoFile(opts: {
  nickname: string;
  prose: string;
  pictureUrl: string;
}): Promise<File> {
  const { nickname, prose, pictureUrl } = opts;
  const mime = pickMime();
  if (!mime) throw new Error('MediaRecorder not supported in this browser');

  const picture = await loadImage(pictureUrl);
  // Deployer logo: best-effort — if it fails to load (404 / CORS), the video
  // still records, just without the stamp.
  let logo: HTMLImageElement | null = null;
  try {
    logo = await loadImage(withBase('deployer-logo.png'));
  } catch {
    logo = null;
  }
  // The monkey is best-effort too: without its sprites the clip is the plain
  // wobble it was before B-12.
  let monkey: MonkeySprites | null = null;
  try {
    monkey = await loadMonkeySprites(loadImage);
  } catch {
    monkey = null;
  }
  // QR code rendered once, then blitted onto every recorded frame.
  const qrCanvas = await renderQrCanvas(SOURCE_URL);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  // In the page but out of sight (SRC's second Android fix): Android Chrome
  // throttles the frame loop of a canvas that is never in the DOM, which left
  // the monkey frozen or missing. Not `display:none` — that pauses it too.
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
  // QR off the bottom. The footer height is constant, so measure it once.
  const STORY_GAP = 30; // gap between the story block and the footer
  const BOTTOM_MARGIN = 40;
  const badgeY = picY + picSize + 50;
  const storyTop = badgeY + 40;
  const attributionHeight = measureAttributionHeight(ctx, W);
  const maxStoryHeight = H - BOTTOM_MARGIN - attributionHeight - STORY_GAP - storyTop;

  const stream = canvas.captureStream(FPS);
  const recorder = new MediaRecorder(stream, { mimeType: mime.mime });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e): void => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const done = new Promise<File>((resolve) => {
    recorder.onstop = (): void => {
      const blob = new Blob(chunks, { type: mime.mime });
      resolve(new File([blob], safeFileName(nickname, mime.ext), { type: mime.mime }));
    };
  });

  const start = performance.now();
  let raf = 0;

  function drawFrame(now: number): void {
    const elapsed = now - start;
    const w = wobbleAt(elapsed);

    // Background.
    ctx!.fillStyle = CREAM;
    ctx!.fillRect(0, 0, W, H);

    // Picture with the four-axis transform — composed around its own centre.
    const cx = picX + picSize / 2;
    const cy = picY + picSize / 2;
    ctx!.save();
    ctx!.translate(cx + w.dx, cy + w.dy);
    ctx!.rotate(w.rot);
    ctx!.scale(w.scale, w.scale);
    ctx!.drawImage(picture, -picSize / 2, -picSize / 2, picSize, picSize);
    // Deployer logo stamp (25×25, bottom-right of the picture rect).
    if (logo) {
      ctx!.drawImage(logo, picSize / 2 - 33, picSize / 2 - 33, 25, 25);
    }
    ctx!.restore();

    // The monkey, on top of the cartoon. Its ground is the cartoon's top edge
    // under the same four-axis transform, so it rides the wobble.
    if (monkey) {
      drawMonkey(ctx!, elapsed, monkey, {
        width: W,
        groundAt: (x) =>
          cy + w.dy + (x - cx - w.dx) * Math.sin(w.rot) - (picSize / 2) * w.scale * Math.cos(w.rot),
      });
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
    ctx!.fillText(nickname, 0, 0);
    ctx!.restore();

    // Full story text, just below the player's name. Font auto-shrinks to fit
    // the budgeted height so the footer below never clips off the bottom.
    const storyBottom = drawStoryText(ctx!, prose, {
      topY: storyTop,
      canvasWidth: W,
      maxHeight: maxStoryHeight,
    });

    // Static attribution footer matching the downloadable PNG's footer:
    // wrapped content-responsibility notice + QR + source label + URL.
    drawAttribution(ctx!, qrCanvas, { topY: storyBottom + STORY_GAP, canvasWidth: W });

    if (elapsed >= DURATION_MS) {
      recorder.stop();
      return;
    }
    raf = requestAnimationFrame(drawFrame);
  }

  recorder.start();
  raf = requestAnimationFrame(drawFrame);
  try {
    return await done;
  } finally {
    cancelAnimationFrame(raf);
    canvas.remove();
  }
}

// Records the wobble clip and saves it to disk. Thin wrapper over
// buildWobbleVideoFile so the same recording can instead be handed to the
// native share sheet (see share.ts).
export async function recordWobbleVideo(opts: {
  nickname: string;
  prose: string;
  pictureUrl: string;
}): Promise<void> {
  downloadFile(await buildWobbleVideoFile(opts));
}
