// SPDX-License-Identifier: AGPL-3.0-only
//
// Copied verbatim from SRC/client/src/videoFooter.ts (T-5.2). Pure canvas
// layout + QR helpers — nothing here reads the picture, so URL-vs-base64
// (design §8.3) doesn't touch it. Used by recordWobble.ts, the one recorder:
// SRC's Lottie-engine sibling isn't carried as a recorder (ARC-3, T-1.6), only
// its monkey is, since B-12 (videoMonkey.ts).
//
// Shared attribution footer for the share-as-video recorder. Mirrors the
// footer baked into the downloadable still (downloadStory.ts):
//   - content-responsibility notice (italic, gray, wrapped)
//   - QR code on the left, source label + URL stacked to its right
// Keeps the i18n notice in sync with the in-app SourceFooter via the same
// `footer.contentNotice` key, fixed to the story's own language (B-15) via
// `i18n.getFixedT`, not the active UI locale — same fix as the still's footer.

import i18n, { textDirection } from './i18n/index';
import { SOURCE_URL } from './sourceUrl';
import { wrapText, type AuthoredLanguage } from '@funny/shared';

const QR_SIZE = 120;
const QR_TEXT_GAP = 18;
const PAD = 40;
const NOTICE_FONT = 'italic 20px Georgia, serif';
const NOTICE_LINE_HEIGHT = 28;
const NOTICE_COLOR = '#4b5563';
const SOURCE_LABEL_FONT = 'bold 24px system-ui, sans-serif';
const URL_FONT = '20px ui-monospace, "SF Mono", Consolas, monospace';
const URL_LINE_HEIGHT = 26;
const SOURCE_LABEL_HEIGHT = 28;
// Minimum gap so a long notice never overlaps the source label that's
// dropped to the QR's bottom edge.
const NOTICE_SOURCE_GAP = 16;
const INK = '#1f2937';
const CREAM = '#fef3c7';

// Story text drawn between the nickname badge and the attribution block.
// The font auto-shrinks from MAX down to MIN px so a long story still fits
// the height the caller budgets (so the QR footer never gets clipped).
const STORY_FONT_FAMILY = 'Georgia, serif';
const STORY_MAX_PX = 24;
const STORY_MIN_PX = 14;
const STORY_LINE_RATIO = 1.42; // line height as a multiple of the font px

// Lazy-imports `qrcode` (already in deps via downloadStory.ts) so the library
// loads only when a recorder runs, not on every page render.
export async function renderQrCanvas(value: string): Promise<HTMLCanvasElement> {
  const { default: QRCode } = await import('qrcode');
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, value, {
    width: QR_SIZE,
    margin: 1,
    color: { dark: INK, light: CREAM },
  });
  return qrCanvas;
}

interface FooterLayout {
  noticeLines: string[];
  rightColX: number;
  sourceLabelTop: number;
  footerRowHeight: number;
}

// Computes the footer-row geometry (shared by measure + draw). The QR sits on
// the left; the right column holds the notice (top) and the source label —
// dropped to the QR's bottom edge — with the URL just beneath it. A tall
// notice pushes the source label lower so the two never overlap. Sets the
// context font to NOTICE_FONT as a measuring side effect.
//
// `language` fixes the notice to the story's own language (B-15 can put a
// story on screen under any interface language), not the active UI locale —
// same fix as the downloadable still's footer (downloadStory.ts).
function computeLayout(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  language: AuthoredLanguage,
): FooterLayout {
  const notice = i18n.getFixedT(language)('footer.contentNotice');
  const rightColX = PAD + QR_SIZE + QR_TEXT_GAP;
  const rightColWidth = canvasWidth - rightColX - PAD;
  ctx.font = NOTICE_FONT;
  const noticeLines = wrapText(ctx, notice, rightColWidth);
  const noticeHeight = noticeLines.length * NOTICE_LINE_HEIGHT;
  const sourceLabelTop = Math.max(QR_SIZE - SOURCE_LABEL_HEIGHT, noticeHeight + NOTICE_SOURCE_GAP);
  const footerRowHeight = Math.max(QR_SIZE, sourceLabelTop + URL_LINE_HEIGHT + 6 + URL_LINE_HEIGHT);
  return { noticeLines, rightColX, sourceLabelTop, footerRowHeight };
}

// Returns the total height the attribution block occupies given the canvas
// width — useful for layout planning in the caller (knowing how far to push
// other elements out of the way).
export function measureAttributionHeight(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  language: AuthoredLanguage,
): number {
  return computeLayout(ctx, canvasWidth, language).footerRowHeight;
}

// Picks the largest story font (STORY_MAX_PX → STORY_MIN_PX) whose wrapped
// lines fit within `maxHeight`, returning the chosen size, line height, and
// wrapped lines. If even the smallest font overflows, the smallest is used
// (the caller's height budget should be generous enough that this is rare).
function fitStory(
  ctx: CanvasRenderingContext2D,
  prose: string,
  maxWidth: number,
  maxHeight: number,
): { fontPx: number; lineHeight: number; lines: string[] } {
  let chosen = { fontPx: STORY_MIN_PX, lineHeight: 0, lines: [] as string[] };
  for (let fontPx = STORY_MAX_PX; fontPx >= STORY_MIN_PX; fontPx--) {
    ctx.font = `${fontPx}px ${STORY_FONT_FAMILY}`;
    const lines = wrapText(ctx, prose, maxWidth);
    const lineHeight = Math.round(fontPx * STORY_LINE_RATIO);
    chosen = { fontPx, lineHeight, lines };
    if (lines.length * lineHeight <= maxHeight) break;
  }
  return chosen;
}

// Draws the full story prose, word-wrapped to the canvas width (less PAD on
// each side), starting with its top edge at `topY`. The font auto-shrinks so
// the block never exceeds `maxHeight` — keeping the attribution footer on
// screen for long stories. Returns the y-coordinate just below the last line
// so the caller can stack the attribution beneath it. Mirrors the prose the
// downloadable PNG carries (downloadStory.ts), scaled for the video canvas,
// in the story's own direction: a Hebrew or Persian story starts at the right
// edge (Step 73; before, it followed whatever the page's direction was).
export function drawStoryText(
  ctx: CanvasRenderingContext2D,
  prose: string,
  opts: { topY: number; canvasWidth: number; maxHeight: number; language: AuthoredLanguage },
): number {
  const { topY, canvasWidth, maxHeight, language } = opts;
  const dir = textDirection(language);
  ctx.direction = dir;
  ctx.textAlign = dir === 'rtl' ? 'right' : 'left';
  ctx.textBaseline = 'top';
  const { lineHeight, lines } = fitStory(ctx, prose, canvasWidth - PAD * 2, maxHeight);
  ctx.fillStyle = INK;
  const x = dir === 'rtl' ? canvasWidth - PAD : PAD;
  let y = topY;
  for (const line of lines) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

// Renders the QR + notice + label/URL block with its top edge at `topY`.
// Same content and layout the downloadable PNG carries, scaled up for the
// 720×1280 video canvas.
export function drawAttribution(
  ctx: CanvasRenderingContext2D,
  qrCanvas: HTMLCanvasElement,
  opts: { topY: number; canvasWidth: number; language: AuthoredLanguage },
): void {
  const { topY, canvasWidth, language } = opts;
  const sourceLabel = i18n.getFixedT(language)('footer.source');
  const dir = textDirection(language);

  // The notice and label keep the story's direction, as on the still
  // (downloadStory.ts); the URL reads left to right under its label.
  ctx.direction = dir;
  ctx.textAlign = dir === 'rtl' ? 'right' : 'left';
  ctx.textBaseline = 'top';

  const { noticeLines, rightColX, sourceLabelTop } = computeLayout(ctx, canvasWidth, language);

  const colX = dir === 'rtl' ? canvasWidth - PAD : rightColX;

  // QR code on the left.
  ctx.drawImage(qrCanvas, PAD, topY, QR_SIZE, QR_SIZE);

  // Content-responsibility notice — right column, stacked from the top.
  ctx.font = NOTICE_FONT;
  ctx.fillStyle = NOTICE_COLOR;
  let noticeY = topY;
  for (const line of noticeLines) {
    ctx.fillText(line, colX, noticeY);
    noticeY += NOTICE_LINE_HEIGHT;
  }

  // Source label dropped to the QR's bottom edge, URL just beneath it.
  const sourceLabelY = topY + sourceLabelTop;
  ctx.fillStyle = INK;
  ctx.font = SOURCE_LABEL_FONT;
  ctx.fillText(sourceLabel, colX, sourceLabelY);

  ctx.direction = 'ltr';
  ctx.font = URL_FONT;
  ctx.fillText(SOURCE_URL.replace(/^https?:\/\//, ''), colX, sourceLabelY + URL_LINE_HEIGHT + 6);
  ctx.textAlign = 'left';
}
