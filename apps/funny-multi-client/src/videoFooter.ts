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
//   - QR code on the left, label + URL stacked to its right — the landing
//     page under its name since 2026-10-29 (landingUrl.ts), SRC's source
//     repository before
// Keeps the i18n notice in sync with the in-app SourceFooter via the same
// `footer.contentNotice` key, fixed to the story's own language (B-15) via
// `i18n.getFixedT`, not the active UI locale — same fix as the still's footer.
//
// Step 117: a golden story's video names the Christmas 2026 edition and leads
// to its page, as its still does — the caller passes the label and the URL
// text (downloadStory.ts `footerTarget`).
//
// Step 122: a label too long for the column — a paid story's thank-you —
// wraps, and its lines past the first push the URL down; the caller measures
// the block with the same label it draws.

import i18n, { proseFontFamily, textDirection } from './i18n/index';
import { LANDING_URL_TEXT, type FooterTarget } from './landingUrl';
import { wrapText, type AuthoredLanguage } from '@funny/shared';

const QR_SIZE = 120;
const QR_TEXT_GAP = 18;
const PAD = 40;
const NOTICE_STYLE = 'italic 20px'; // in the story's own family (proseFontFamily)
const NOTICE_LINE_HEIGHT = 28;
const NOTICE_COLOR = '#4b5563';
const SOURCE_LABEL_FONT = 'bold 24px system-ui, sans-serif';
const URL_FONT = '20px ui-monospace, "SF Mono", Consolas, monospace';
const URL_LINE_HEIGHT = 26;
const SOURCE_LABEL_HEIGHT = 28;
const LABEL_LINE_HEIGHT = 30;
// Minimum gap so a long notice never overlaps the source label that's
// dropped to the QR's bottom edge.
const NOTICE_SOURCE_GAP = 16;
const INK = '#1f2937';
const CREAM = '#fef3c7';

// Story text drawn between the nickname badge and the attribution block,
// in the story's own family (proseFontFamily: Yoruba's letters need one of
// their own, Step 81). The font auto-shrinks from MAX down to MIN px so a
// long story still fits the height the caller budgets (so the QR footer
// never gets clipped).
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
  labelLines: string[];
  rightColX: number;
  sourceLabelTop: number;
  urlTop: number;
  footerRowHeight: number;
}

// Computes the footer-row geometry (shared by measure + draw). The QR sits on
// the left; the right column holds the notice (top) and the source label —
// dropped to the QR's bottom edge — with the URL just beneath it. A tall
// notice pushes the source label lower so the two never overlap. Sets the
// context font to the notice's as a measuring side effect.
//
// `language` fixes the notice to the story's own language (B-15 can put a
// story on screen under any interface language), not the active UI locale —
// same fix as the downloadable still's footer (downloadStory.ts).
function computeLayout(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  language: AuthoredLanguage,
  labelKey: FooterTarget['labelKey'] = 'footer.family',
): FooterLayout {
  const t = i18n.getFixedT(language);
  const notice = t('footer.contentNotice');
  const rightColX = PAD + QR_SIZE + QR_TEXT_GAP;
  const rightColWidth = canvasWidth - rightColX - PAD;
  // The label first, so the font left set is the notice's.
  ctx.font = SOURCE_LABEL_FONT;
  const labelLines = wrapText(ctx, t(labelKey), rightColWidth);
  ctx.font = `${NOTICE_STYLE} ${proseFontFamily(language)}`;
  const noticeLines = wrapText(ctx, notice, rightColWidth);
  const noticeHeight = noticeLines.length * NOTICE_LINE_HEIGHT;
  const sourceLabelTop = Math.max(QR_SIZE - SOURCE_LABEL_HEIGHT, noticeHeight + NOTICE_SOURCE_GAP);
  const labelExtra = Math.max(0, labelLines.length - 1) * LABEL_LINE_HEIGHT;
  const urlTop = sourceLabelTop + labelExtra + URL_LINE_HEIGHT + 6;
  const footerRowHeight = Math.max(QR_SIZE, urlTop + URL_LINE_HEIGHT);
  return { noticeLines, labelLines, rightColX, sourceLabelTop, urlTop, footerRowHeight };
}

// Returns the total height the attribution block occupies given the canvas
// width — useful for layout planning in the caller (knowing how far to push
// other elements out of the way).
export function measureAttributionHeight(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  language: AuthoredLanguage,
  labelKey?: FooterTarget['labelKey'],
): number {
  return computeLayout(ctx, canvasWidth, language, labelKey).footerRowHeight;
}

// Picks the largest story font (STORY_MAX_PX → STORY_MIN_PX) whose wrapped
// lines fit within `maxHeight`, returning the chosen size, line height, and
// wrapped lines. If even the smallest font overflows, the smallest is used
// (the caller's height budget should be generous enough that this is rare).
function fitStory(
  ctx: CanvasRenderingContext2D,
  prose: string,
  family: string,
  maxWidth: number,
  maxHeight: number,
): { fontPx: number; lineHeight: number; lines: string[] } {
  let chosen = { fontPx: STORY_MIN_PX, lineHeight: 0, lines: [] as string[] };
  for (let fontPx = STORY_MAX_PX; fontPx >= STORY_MIN_PX; fontPx--) {
    ctx.font = `${fontPx}px ${family}`;
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
  const { lineHeight, lines } = fitStory(
    ctx,
    prose,
    proseFontFamily(language),
    canvasWidth - PAD * 2,
    maxHeight,
  );
  ctx.fillStyle = INK;
  const x = dir === 'rtl' ? canvasWidth - PAD : PAD;
  let y = topY;
  for (const line of lines) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

// Step 117 (owner decision D1 A): the ending of a Christmas story whose ending
// has no picture of its own — a slice story's, or a golden one's whose picture
// could not be had — drawn as a card in the picture's square. The bell above
// it, the ending in the story's own family below, as large as fits.
const CARD_PINK = '#ec4899';
const CARD_MAX_PX = 52;
const CARD_MIN_PX = 26;

export function drawEndingCard(
  ctx: CanvasRenderingContext2D,
  text: string,
  opts: { x: number; y: number; size: number; language: AuthoredLanguage },
): void {
  const { x, y, size, language } = opts;
  const r = 36;
  const inset = 6;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + size - r, y);
  ctx.quadraticCurveTo(x + size, y, x + size, y + r);
  ctx.lineTo(x + size, y + size - r);
  ctx.quadraticCurveTo(x + size, y + size, x + size - r, y + size);
  ctx.lineTo(x + r, y + size);
  ctx.quadraticCurveTo(x, y + size, x, y + size - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = inset;
  ctx.strokeStyle = CARD_PINK;
  ctx.stroke();

  const cx = x + size / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.direction = textDirection(language);
  ctx.font = '72px system-ui, sans-serif';
  ctx.fillStyle = CARD_PINK;
  const bellTop = y + 56;
  ctx.fillText('🔔', cx, bellTop);

  const textTop = bellTop + 110;
  const maxHeight = y + size - 56 - textTop;
  let fontPx = CARD_MAX_PX;
  let lines: string[] = [];
  let lineHeight = 0;
  for (; fontPx >= CARD_MIN_PX; fontPx -= 2) {
    ctx.font = `${fontPx}px ${proseFontFamily(language)}`;
    lines = wrapText(ctx, text, size - 2 * 56);
    lineHeight = Math.round(fontPx * STORY_LINE_RATIO);
    if (lines.length * lineHeight <= maxHeight) break;
  }
  ctx.fillStyle = INK;
  // Centred in the space under the bell.
  let lineY = textTop + Math.max(0, (maxHeight - lines.length * lineHeight) / 2);
  for (const line of lines) {
    ctx.fillText(line, cx, lineY);
    lineY += lineHeight;
  }
  ctx.restore();
  ctx.textAlign = 'left';
}

// Renders the QR + notice + label/URL block with its top edge at `topY`.
// Same content and layout the downloadable PNG carries, scaled up for the
// 720×1280 video canvas. `labelKey` and `urlText` default to the family's
// name and the landing page.
export function drawAttribution(
  ctx: CanvasRenderingContext2D,
  qrCanvas: HTMLCanvasElement,
  opts: {
    topY: number;
    canvasWidth: number;
    language: AuthoredLanguage;
    labelKey?: FooterTarget['labelKey'];
    urlText?: string;
  },
): void {
  const { topY, canvasWidth, language } = opts;
  const dir = textDirection(language);

  // The notice and label keep the story's direction, as on the still
  // (downloadStory.ts); the URL reads left to right under its label.
  ctx.direction = dir;
  ctx.textAlign = dir === 'rtl' ? 'right' : 'left';
  ctx.textBaseline = 'top';

  const { noticeLines, labelLines, rightColX, sourceLabelTop, urlTop } = computeLayout(
    ctx,
    canvasWidth,
    language,
    opts.labelKey,
  );

  const colX = dir === 'rtl' ? canvasWidth - PAD : rightColX;

  // QR code on the left.
  ctx.drawImage(qrCanvas, PAD, topY, QR_SIZE, QR_SIZE);

  // Content-responsibility notice — right column, stacked from the top.
  ctx.font = `${NOTICE_STYLE} ${proseFontFamily(language)}`;
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
  labelLines.forEach((line, i) => ctx.fillText(line, colX, sourceLabelY + i * LABEL_LINE_HEIGHT));

  ctx.direction = 'ltr';
  ctx.font = URL_FONT;
  ctx.fillText(opts.urlText ?? LANDING_URL_TEXT, colX, topY + urlTop);
  ctx.textAlign = 'left';
}
