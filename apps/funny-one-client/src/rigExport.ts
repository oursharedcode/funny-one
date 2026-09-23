// SPDX-License-Identifier: AGPL-3.0-only
//
// Composites a story into a single PNG and triggers a browser download or
// hands it to the native share sheet (T-FO-4.3b, OQ-4: local export only —
// no `/i/<hash>` upload, no video). Adapted from
// funny-multi-client/src/downloadStory.ts, but Funny One has no
// `PictureRef.url` to fetch: the "picture" is `RigScene`'s seven stacked SVG
// components. `drawRigScene` rasterizes each one via `renderToStaticMarkup` +
// `new Image()`/`.decode()` (recordWobble.ts's `loadImage` pattern — there's
// no cross-origin bitmap here, so `createImageBitmap` isn't needed) and
// composites them with `ctx.drawImage`, reading the same `RIG_LAYERS`
// geometry that drives the on-screen `RigScene` so the exported PNG never
// drifts from what the player actually saw.

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Story } from '@funny/shared';
import i18n from './i18n/index';
import { SOURCE_URL } from './sourceUrl';
import { downloadFile } from './share';
import { RIG_INDEX } from './components/art/rig/rigIndex';
import { RIG_LAYERS } from './components/art/rig/rigGeometry';

const STAGE_W = 400;
const STAGE_H = 300;
const EXPORT_SCALE = 2;
const RIG_W = STAGE_W * EXPORT_SCALE;
const RIG_H = STAGE_H * EXPORT_SCALE;

const WIDTH = RIG_W;
const PAD = 28;
const PROSE_FONT = '22px Georgia, serif';
const PROSE_LINE_HEIGHT = 32;
const NAME_FONT = '16px system-ui, sans-serif';
const NAME_HEIGHT = 24;
const CREAM = '#fef3c7';
const INK = '#1f2937';
const PINK = '#ec4899';

// Footer (same "scan-to-clone" contract as downloadStory.ts — item 6 of vol02
// BUGS_AND_IMPROVEMENTS carried over unmodified).
const FOOTER_DIVIDER_PAD = 18;
const NOTICE_FONT = 'italic 13px Georgia, serif';
const NOTICE_LINE_HEIGHT = 18;
const NOTICE_COLOR = '#4b5563';
const QR_SIZE = 96;
const QR_TEXT_GAP = 14;
const SOURCE_LABEL_FONT = 'bold 13px system-ui, sans-serif';
const SOURCE_LABEL_HEIGHT = 16;
const URL_FONT = '12px ui-monospace, "SF Mono", Consolas, monospace';
const URL_LINE_HEIGHT = 16;
const NOTICE_SOURCE_GAP = 10;

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (!word) continue;
    const test = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function safeFileName(name: string): string {
  const slug = name
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return `funny-story-${slug || 'story'}.png`;
}

async function renderQrCanvas(value: string): Promise<HTMLCanvasElement> {
  const { default: QRCode } = await import('qrcode');
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, value, {
    width: QR_SIZE,
    margin: 1,
    color: { dark: INK, light: CREAM },
  });
  return qrCanvas;
}

// Serializes a rig Art component (className-only contract, RIG_ART.md "File
// / id mapping") to a sized data: URI. Explicit width/height are set on the
// root <svg> before loading — the components carry no intrinsic size of
// their own (className is Tailwind, which has no effect outside the page's
// stylesheet), so an unset width/height would rasterize at the SVG's
// viewBox-derived default and blur when drawn larger.
function sizedSvgDataUri(markup: string, widthPx: number, heightPx: number): string {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  const svg = doc.documentElement;
  svg.setAttribute('width', String(widthPx));
  svg.setAttribute('height', String(heightPx));
  const serialized = new XMLSerializer().serializeToString(svg);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;
}

async function loadArtImage(
  Art: (typeof RIG_INDEX)[keyof typeof RIG_INDEX],
  widthPx: number,
  heightPx: number,
): Promise<HTMLImageElement> {
  const markup = renderToStaticMarkup(createElement(Art));
  const img = new Image();
  img.src = sizedSvgDataUri(markup, widthPx, heightPx);
  await img.decode();
  return img;
}

// Draws every layer of `story` onto `ctx`'s top-left `RIG_W`x`RIG_H` corner,
// in `RIG_LAYERS`'s z-order — the same geometry `RigScene` uses on screen,
// so the export never drifts from what was actually shown.
async function drawRigScene(ctx: CanvasRenderingContext2D, story: Story): Promise<void> {
  for (const layer of RIG_LAYERS) {
    const optionId = story.answers[layer.slot];
    if (!optionId) continue;
    const Art = RIG_INDEX[optionId];
    if (!Art) continue;

    const dx = (layer.xPct / 100) * RIG_W;
    const dy = (layer.yPct / 100) * RIG_H;
    const dw = (layer.wPct / 100) * RIG_W;
    const dh = (layer.hPct / 100) * RIG_H;
    const img = await loadArtImage(Art, Math.round(dw), Math.round(dh));

    if (layer.rotate) {
      ctx.save();
      ctx.translate(dx + dw / 2, dy + dh / 2);
      ctx.rotate((layer.rotate * Math.PI) / 180);
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    } else {
      ctx.drawImage(img, dx, dy, dw, dh);
    }
  }
}

export async function buildStoryImageFile(opts: {
  name: string;
  prose: string;
  story: Story;
}): Promise<File> {
  const { name, prose, story } = opts;

  const notice = i18n.t('footer.contentNotice');
  const sourceLabel = i18n.t('footer.source');

  const qrCanvas = await renderQrCanvas(SOURCE_URL);

  const rightColX = PAD + QR_SIZE + QR_TEXT_GAP;
  const rightColWidth = WIDTH - rightColX - PAD;

  const scratch = document.createElement('canvas').getContext('2d')!;
  scratch.font = PROSE_FONT;
  const proseLines = wrapText(scratch, prose, WIDTH - PAD * 2);
  scratch.font = NOTICE_FONT;
  const noticeLines = wrapText(scratch, notice, rightColWidth);

  const noticeHeight = noticeLines.length * NOTICE_LINE_HEIGHT;
  const sourceLabelTop = Math.max(QR_SIZE - SOURCE_LABEL_HEIGHT, noticeHeight + NOTICE_SOURCE_GAP);
  const footerRowHeight = Math.max(QR_SIZE, sourceLabelTop + URL_LINE_HEIGHT + 4 + URL_LINE_HEIGHT);

  const height =
    RIG_H +
    PAD +
    proseLines.length * PROSE_LINE_HEIGHT +
    PAD +
    NAME_HEIGHT +
    FOOTER_DIVIDER_PAD +
    footerRowHeight +
    PAD;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, WIDTH, height);
  await drawRigScene(ctx, story);

  ctx.textBaseline = 'top';
  ctx.fillStyle = INK;
  ctx.font = PROSE_FONT;
  let y = RIG_H + PAD;
  for (const line of proseLines) {
    ctx.fillText(line, PAD, y);
    y += PROSE_LINE_HEIGHT;
  }

  ctx.fillStyle = PINK;
  ctx.font = NAME_FONT;
  ctx.fillText(`— ${name}`, PAD, y + PAD);
  y += PAD + NAME_HEIGHT + FOOTER_DIVIDER_PAD;

  const rowTop = y;

  ctx.drawImage(qrCanvas, PAD, rowTop, QR_SIZE, QR_SIZE);

  ctx.fillStyle = NOTICE_COLOR;
  ctx.font = NOTICE_FONT;
  let noticeY = rowTop;
  for (const line of noticeLines) {
    ctx.fillText(line, rightColX, noticeY);
    noticeY += NOTICE_LINE_HEIGHT;
  }

  const sourceLabelY = rowTop + sourceLabelTop;
  ctx.fillStyle = INK;
  ctx.font = SOURCE_LABEL_FONT;
  ctx.fillText(sourceLabel, rightColX, sourceLabelY);

  ctx.font = URL_FONT;
  ctx.fillText(SOURCE_URL, rightColX, sourceLabelY + URL_LINE_HEIGHT + 4);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png');
  });
  if (!blob) throw new Error('Failed to render story image');
  return new File([blob], safeFileName(name), { type: 'image/png' });
}

// Composites the story into a PNG and triggers a browser download. Thin
// wrapper over buildStoryImageFile so the same composite can instead be
// handed to the native share sheet (see share.ts).
export async function downloadStoryImage(opts: {
  name: string;
  prose: string;
  story: Story;
}): Promise<void> {
  downloadFile(await buildStoryImageFile(opts));
}
