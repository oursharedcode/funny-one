// SPDX-License-Identifier: AGPL-3.0-only

// Makes Funny One's PNG icons from apps/funny-one-client/public/icon.svg
// (Step 87, S-3c), in a headless Chromium — the same renderer as the phone, so
// the PNGs match the SVG favicon exactly. Rerun after any change to icon.svg:
//
//   node scripts/funny-one-icons.mjs
//
// icon-192/512 are the manifest's "any" icons (512 is also Play's store icon:
// 32-bit PNG, alpha channel present, every pixel opaque); icon-180 is the
// apple-touch-icon; icon-512-maskable is the art at 80 % on its own background,
// so a launcher's mask (at most the inscribed circle of the middle 80 %) never
// cuts into it — the method Funny Multi's maskable icon used (Step 15).

import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const PUBLIC = join(ROOT, 'apps/funny-one-client/public');

const OUTPUTS = [
  { file: 'icon-512.png', size: 512, art: 1 },
  { file: 'icon-192.png', size: 192, art: 1 },
  { file: 'icon-180.png', size: 180, art: 1 },
  { file: 'icon-512-maskable.png', size: 512, art: 0.8 },
];

const svg = await readFile(join(PUBLIC, 'icon.svg'), 'utf8');
const background = svg.match(/<rect[^>]*fill="(#[0-9a-f]{6})"/i)?.[1];
if (!background) throw new Error('icon.svg: no background <rect fill="#rrggbb"> found');
const uri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const { file, size, art } of OUTPUTS) {
    // Drawn on a canvas rather than screenshotted: a screenshot of an opaque
    // page comes out as 24-bit RGB, while the canvas encoder keeps the alpha
    // channel Play asks for.
    const png = await page.evaluate(
      async ({ uri, size, art, background }) => {
        const img = new Image();
        img.src = uri;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, size, size);
        const inner = Math.round(size * art);
        const offset = (size - inner) / 2;
        ctx.drawImage(img, offset, offset, inner, inner);
        return canvas.toDataURL('image/png').split(',')[1];
      },
      { uri, size, art, background },
    );
    await writeFile(join(PUBLIC, file), Buffer.from(png, 'base64'));
    console.log(`wrote ${file} (${size}×${size}, art at ${art * 100} %)`);
  }
} finally {
  await browser.close();
}
