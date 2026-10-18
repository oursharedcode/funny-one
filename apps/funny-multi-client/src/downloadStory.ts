// SPDX-License-Identifier: AGPL-3.0-only
//
// Composites a gallery story into a single PNG and triggers a browser
// download (spec §24). Adapted from SRC/client/src/downloadStory.ts (T-5.2,
// design §8.3): SRC's picture was already a base64 data URL, so `<img
// src>` + `canvas.toBlob()` never touched a cross-origin resource. Ours is a
// `PictureRef.url` served by the Cloudflare Worker (design §7.2) — a
// different origin from the client, so drawing it straight into the canvas
// would taint it and `canvas.toBlob()` would throw. `fetch(url)` → blob →
// `createImageBitmap` sidesteps that: the bytes never pass through an
// `<img>` element, so there is nothing for the canvas to taint. The Worker
// route sending `Access-Control-Allow-Origin: *` is what makes the `fetch`
// itself succeed at all.
//
// Item 6 of BUGS_AND_IMPROVEMENTS_02.md (SRC) adds a "scan-to-clone" footer
// to the downloaded image: the upstream-project QR code, its URL printed
// below, and the verbatim content-responsibility notice
// (`footer.contentNotice` from the active locale). The disclaimer must
// travel with the image because the downloaded asset moves out of the
// in-app context where the source footer would otherwise carry it.

import i18n, { proseFontFamily, textDirection } from './i18n/index';
import { SOURCE_URL } from './sourceUrl';
import { downloadFile } from './share';
import { wrapText, type AuthoredLanguage } from '@funny/shared';

const WIDTH = 512;
const PAD = 28;
// The prose and the notice take the story's own family (proseFontFamily).
const PROSE_SIZE = '22px';
const PROSE_LINE_HEIGHT = 32;
const NAME_FONT = '16px system-ui, sans-serif';
const NAME_HEIGHT = 24;
const CREAM = '#fef3c7';
const INK = '#1f2937';
const PINK = '#ec4899';

// Footer (item 6 of vol02 BUGS_AND_IMPROVEMENTS).
const FOOTER_DIVIDER_PAD = 18;
const NOTICE_STYLE = 'italic 13px';
const NOTICE_LINE_HEIGHT = 18;
const NOTICE_COLOR = '#4b5563';
const QR_SIZE = 96;
const QR_TEXT_GAP = 14;
const SOURCE_LABEL_FONT = 'bold 13px system-ui, sans-serif';
const SOURCE_LABEL_HEIGHT = 16;
const URL_FONT = '12px ui-monospace, "SF Mono", Consolas, monospace';
const URL_LINE_HEIGHT = 16;
// Minimum gap between the notice (top of the right column) and the source
// label (dropped to the QR's bottom edge) so a long notice never overlaps it.
const NOTICE_SOURCE_GAP = 10;

function safeFileName(nickname: string): string {
  const slug = nickname
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return `funny-stories-${slug || 'story'}.png`;
}

// Renders a QR for `value` onto an offscreen canvas and returns it. Lazy
// `import('qrcode')` keeps the QR library out of the main bundle — it loads
// only when a player taps Download.
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

// Fetches `pictureUrl` and decodes it off the DOM's `<img>` tainting path
// (see the file header). Returns null for a null input so callers keep the
// "no picture" branch they already had under SRC's `<img>` version.
async function loadPictureBitmap(pictureUrl: string | null): Promise<ImageBitmap | null> {
  if (!pictureUrl) return null;
  const res = await fetch(pictureUrl);
  const blob = await res.blob();
  return createImageBitmap(blob);
}

export async function buildStoryImageFile(opts: {
  nickname: string;
  prose: string;
  pictureUrl: string | null;
  /** The language the prose is in — a switched story (B-15) can differ
   *  from the interface's. The footer notice and the prose/nickname
   *  direction both follow it, not the active UI locale. */
  language: AuthoredLanguage;
}): Promise<File> {
  const { nickname, prose, pictureUrl, language } = opts;

  // Translated content-responsibility notice — must accompany the image
  // wherever it goes (item 6 of BUGS_AND_IMPROVEMENTS_02.md). Pulled from
  // the same i18n key the in-app footer uses, fixed to the story's own
  // language (not the interface's) so a downloaded or shared picture always
  // carries the notice in the language its prose is written in.
  const fixedT = i18n.getFixedT(language);
  const notice = fixedT('footer.contentNotice');
  const sourceLabel = fixedT('footer.source');
  const dir = textDirection(language);
  const proseFont = `${PROSE_SIZE} ${proseFontFamily(language)}`;
  const noticeFont = `${NOTICE_STYLE} ${proseFontFamily(language)}`;

  // Load the picture first (if any) so its drawn height is known.
  const picture = await loadPictureBitmap(pictureUrl);
  const pictureHeight = picture ? WIDTH : 0;

  // QR code for the upstream repo — rendered to an offscreen canvas, then
  // drawn onto the composite below.
  const qrCanvas = await renderQrCanvas(SOURCE_URL);

  // Right-column geometry: the notice and the source label/URL sit to the
  // right of the QR. The notice stacks at the top of the column; the source
  // label drops to the QR's bottom edge with the URL just beneath it.
  const rightColX = PAD + QR_SIZE + QR_TEXT_GAP;
  const rightColWidth = WIDTH - rightColX - PAD;

  // Measure the wrapped prose (full width) and notice (right column width).
  const scratch = document.createElement('canvas').getContext('2d')!;
  scratch.font = proseFont;
  const proseLines = wrapText(scratch, prose, WIDTH - PAD * 2);
  scratch.font = noticeFont;
  const noticeLines = wrapText(scratch, notice, rightColWidth);

  // Footer row: QR on the left; right column = notice (top) + source label
  // dropped to the QR's bottom edge + URL below it. The source label sits at
  // `QR_SIZE - SOURCE_LABEL_HEIGHT` from the row top, unless a tall notice
  // pushes it lower. The URL drops below, so the row can exceed the QR height.
  const noticeHeight = noticeLines.length * NOTICE_LINE_HEIGHT;
  const sourceLabelTop = Math.max(QR_SIZE - SOURCE_LABEL_HEIGHT, noticeHeight + NOTICE_SOURCE_GAP);
  const footerRowHeight = Math.max(QR_SIZE, sourceLabelTop + URL_LINE_HEIGHT + 4 + URL_LINE_HEIGHT);

  const height =
    pictureHeight +
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
  if (picture) ctx.drawImage(picture, 0, 0, WIDTH, pictureHeight);

  // The prose and nickname render in the story's own direction (B-15 can
  // put a Hebrew story on screen under any interface language); `start`
  // anchors at the right edge under `rtl`, same as the in-app `dir`
  // attribute (RoomGallery.tsx) mirrors for the DOM.
  ctx.textBaseline = 'top';
  ctx.fillStyle = INK;
  ctx.font = proseFont;
  ctx.direction = dir;
  ctx.textAlign = dir === 'rtl' ? 'right' : 'left';
  const textX = dir === 'rtl' ? WIDTH - PAD : PAD;
  let y = pictureHeight + PAD;
  for (const line of proseLines) {
    ctx.fillText(line, textX, y);
    y += PROSE_LINE_HEIGHT;
  }

  ctx.fillStyle = PINK;
  ctx.font = NAME_FONT;
  ctx.fillText(`— ${nickname}`, textX, y + PAD);
  y += PAD + NAME_HEIGHT + FOOTER_DIVIDER_PAD;

  // The footer's layout is the app's own (QR at the left, text beside it), but
  // its notice and label are in the story's language, so they keep the
  // story's direction and start at the column's start edge; drawn left to
  // right, a Persian or Hebrew sentence came out scrambled (Step 73). The URL
  // reads left to right but sits under its label, at the same edge.
  const colX = dir === 'rtl' ? WIDTH - PAD : rightColX;

  // Footer row begins here.
  const rowTop = y;

  // QR (left).
  ctx.drawImage(qrCanvas, PAD, rowTop, QR_SIZE, QR_SIZE);

  // Content-responsibility notice — right column, stacked from the top.
  // Italic, muted, wraps to the right-column width.
  ctx.fillStyle = NOTICE_COLOR;
  ctx.font = noticeFont;
  let noticeY = rowTop;
  for (const line of noticeLines) {
    ctx.fillText(line, colX, noticeY);
    noticeY += NOTICE_LINE_HEIGHT;
  }

  // Source label dropped to the QR's bottom edge, URL just beneath it.
  const sourceLabelY = rowTop + sourceLabelTop;
  ctx.fillStyle = INK;
  ctx.font = SOURCE_LABEL_FONT;
  ctx.fillText(sourceLabel, colX, sourceLabelY);

  ctx.direction = 'ltr';
  ctx.font = URL_FONT;
  ctx.fillText(SOURCE_URL, colX, sourceLabelY + URL_LINE_HEIGHT + 4);
  ctx.textAlign = 'left';

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png');
  });
  if (!blob) throw new Error('Failed to render story image');
  return new File([blob], safeFileName(nickname), { type: 'image/png' });
}

// Composites the story into a PNG and triggers a browser download
// (spec §24). Thin wrapper over buildStoryImageFile so the same composite
// can instead be handed to the native share sheet (see share.ts).
export async function downloadStoryImage(opts: {
  nickname: string;
  prose: string;
  pictureUrl: string | null;
  language: AuthoredLanguage;
}): Promise<void> {
  downloadFile(await buildStoryImageFile(opts));
}
