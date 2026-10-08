// SPDX-License-Identifier: AGPL-3.0-only
//
// T-FO-8.3: Families-audience review of Funny One's own art, the rig (109
// hand-drawn SVG layers) — unlike the picture library (T-FO-8.2), nothing
// here was model-drawn, so there are no classifiers: a look by eye at
//   1. every layer alone, tiled into contact sheets;
//   2. a random sample of composited stories, rendered through the real
//      `rigExport.ts` (`buildStoryImageFile`, the exact function the app's
//      share/download button calls) and cropped to the rig's own 800x600
//      before the prose/QR footer — for accidental reads where a `did` prop
//      or `why` bubble lands over a character.
//
//   node scripts/picture-review/rig-sheets.mjs [--out <dir>] [--count <n>]
//
// Default out: .picture-review/rig (gitignored). Default count: 200. Needs
// packages/shared built (`npm run build -w packages/shared`).
//
// Starts its own Vite dev server in-process (no `npm run dev` needed, same
// pattern as scripts/funny-one-screens.mjs) and drives it with headless
// Chromium. Every layer and every composite is produced by dynamically
// importing the *real* app modules through that dev server — Vite
// transforms and serves any module under its root on request, whether or
// not anything else references it, so this never duplicates rigExport.ts's
// or RigScene's own logic. The one exception is rasterizing a bare
// component to a sized image, which needs react-dom/server; that's behind
// `src/__reviewHarness.ts`, written to disk just for this run and removed
// when it finishes (never committed).

import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..');
const CLIENT = join(ROOT, 'apps/funny-one-client');
const HARNESS_PATH = join(CLIENT, 'src/__reviewHarness.ts');

const args = process.argv.slice(2);
function option(name, fallback) {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  const [, value] = args.splice(i, 2);
  return value;
}
const outDir = resolve(option('--out', join(ROOT, '.picture-review/rig')));
const count = Number(option('--count', '200'));

const HARNESS_SOURCE = `// SPDX-License-Identifier: AGPL-3.0-only
// Temporary review harness for T-FO-8.3, written to disk by
// scripts/picture-review/rig-sheets.mjs and deleted when it finishes — not
// part of the shipped app. Rasterizes a rig component to a sized data: URI
// the exact way rigExport.ts's own loadArtImage does (renderToStaticMarkup +
// the already-exported sizedSvgDataUri), so a layer-alone contact sheet
// never drifts from what the real export draws.

import { createElement } from 'react';
import type { ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { sizedSvgDataUri } from './rigExport';

export function rasterize(
  Comp: ComponentType<{ className?: string }>,
  widthPx: number,
  heightPx: number,
): string {
  const markup = renderToStaticMarkup(createElement(Comp, { className: '' }));
  return sizedSvgDataUri(markup, widthPx, heightPx);
}

export function rasterizeFragment(
  FragComp: ComponentType,
  viewBox: string,
  widthPx: number,
  heightPx: number,
): string {
  const inner = renderToStaticMarkup(createElement(FragComp));
  return sizedSvgDataUri(\`<svg viewBox="\${viewBox}">\${inner}</svg>\`, widthPx, heightPx);
}
`;

await mkdir(outDir, { recursive: true });
await writeFile(HARNESS_PATH, HARNESS_SOURCE);

process.chdir(CLIENT);
const server = await createServer({
  root: CLIENT,
  configFile: join(CLIENT, 'vite.config.ts'),
  logLevel: 'error',
  server: { port: 0 },
});
await server.listen();
const baseUrl = server.resolvedUrls.local[0];

const browser = await chromium.launch();
let failed = false;
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  await page.goto(baseUrl);
  await page.waitForLoadState('networkidle');

  // ---- 1. every layer alone ------------------------------------------------

  const layerResult = await page.evaluate(async () => {
    const { rasterize, rasterizeFragment } = await import('/src/__reviewHarness.ts');
    const { RIG_INDEX } = await import('/src/components/art/rig/rigIndex.ts');
    const { Plate } = await import('/src/components/art/rig/when/Plate.tsx');
    const { Bubble } = await import('/src/components/art/rig/why/Bubble.tsx');
    const { Seal } = await import('/src/components/art/rig/end/Seal.tsx');

    const CELL = 150;
    const COLS = 10;
    const LABEL_H = 18;

    const entries = Object.entries(RIG_INDEX)
      .map(([id, Comp]) => ({
        id,
        isBg: id.startsWith('where.'),
        rasterize: () => rasterize(Comp, CELL, id.startsWith('where.') ? (CELL * 3) / 4 : CELL),
      }))
      .concat([
        {
          id: '(shared) when/Plate',
          isBg: false,
          rasterize: () => rasterizeFragment(Plate, '0 0 100 100', CELL, CELL),
        },
        {
          id: '(shared) why/Bubble',
          isBg: false,
          rasterize: () => rasterizeFragment(Bubble, '0 0 100 100', CELL, CELL),
        },
        {
          id: '(shared) end/Seal',
          isBg: false,
          rasterize: () => rasterizeFragment(Seal, '0 0 100 100', CELL, CELL),
        },
      ])
      .sort((a, b) => a.id.localeCompare(b.id));

    const perSheet = COLS * 6; // 60 per sheet
    const sheets = [];
    for (let s = 0; s * perSheet < entries.length; s++) {
      const slice = entries.slice(s * perSheet, (s + 1) * perSheet);
      const rows = Math.ceil(slice.length / COLS);
      const canvas = document.createElement('canvas');
      canvas.width = COLS * CELL;
      canvas.height = rows * (CELL + LABEL_H);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < slice.length; i++) {
        const entry = slice[i];
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const x = col * CELL;
        const y = row * (CELL + LABEL_H);
        const img = new Image();
        img.src = entry.rasterize();
        await img.decode();
        const h = entry.isBg ? (CELL * 3) / 4 : CELL;
        ctx.drawImage(img, x, y + (CELL - h) / 2, CELL, h);
        ctx.strokeStyle = '#ddd';
        ctx.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
        ctx.fillStyle = '#111';
        ctx.font = '9px sans-serif';
        ctx.fillText(entry.id, x + 2, y + CELL + 13, CELL - 4);
      }
      sheets.push(canvas.toDataURL('image/png'));
    }
    return { sheets, ids: entries.map((e) => e.id) };
  });

  for (let i = 0; i < layerResult.sheets.length; i++) {
    const base64 = layerResult.sheets[i].split(',')[1];
    await writeFile(
      join(outDir, `layers-${String(i + 1).padStart(2, '0')}.png`),
      Buffer.from(base64, 'base64'),
    );
  }
  console.log(
    `layers: ${layerResult.ids.length} rendered, ${layerResult.sheets.length} sheet(s) written`,
  );

  // ---- 2. random composited stories through rigExport.ts ------------------

  const SLOT_ORDER = ['who', 'with', 'where', 'when', 'did', 'why', 'end'];

  const compositeResult = await page.evaluate(
    async ({ n, slotOrder }) => {
      const { RIG_INDEX } = await import('/src/components/art/rig/rigIndex.ts');
      const { buildStoryImageFile } = await import('/src/rigExport.ts');

      const bySlot = {};
      for (const id of Object.keys(RIG_INDEX)) {
        const slot = id.split('.')[0];
        (bySlot[slot] ??= []).push(id);
      }
      function randomStory() {
        return {
          picture: null,
          answers: slotOrder.map((slot) => {
            const ids = bySlot[slot];
            return ids[Math.floor(Math.random() * ids.length)];
          }),
        };
      }

      const RIG_W = 800;
      const RIG_H = 600;
      const CELL_W = 160;
      const CELL_H = 120;
      const COLS = 10;
      const LABEL_H = 10;
      const perSheet = COLS * 4; // 40 per sheet

      async function cropRig(file) {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.src = url;
        await img.decode();
        URL.revokeObjectURL(url);
        return img;
      }

      const stories = Array.from({ length: n }, randomStory);
      const sheets = [];
      for (let s = 0; s * perSheet < stories.length; s++) {
        const slice = stories.slice(s * perSheet, (s + 1) * perSheet);
        const rows = Math.ceil(slice.length / COLS);
        const canvas = document.createElement('canvas');
        canvas.width = COLS * CELL_W;
        canvas.height = rows * (CELL_H + LABEL_H);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < slice.length; i++) {
          const story = slice[i];
          const globalIndex = s * perSheet + i;
          const file = await buildStoryImageFile({ name: 'R', prose: '.', story });
          const img = await cropRig(file);
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const x = col * CELL_W;
          const y = row * (CELL_H + LABEL_H);
          ctx.drawImage(img, 0, 0, RIG_W, RIG_H, x, y, CELL_W, CELL_H);
          ctx.strokeStyle = '#ccc';
          ctx.strokeRect(x + 0.5, y + 0.5, CELL_W - 1, CELL_H - 1);
          ctx.fillStyle = '#333';
          ctx.font = '7px sans-serif';
          ctx.fillText(String(globalIndex), x + 2, y + CELL_H + 8);
        }
        sheets.push(canvas.toDataURL('image/png'));
      }
      return { sheets, stories: stories.map((st) => st.answers) };
    },
    { n: count, slotOrder: SLOT_ORDER },
  );

  for (let i = 0; i < compositeResult.sheets.length; i++) {
    const base64 = compositeResult.sheets[i].split(',')[1];
    await writeFile(
      join(outDir, `composites-${String(i + 1).padStart(2, '0')}.png`),
      Buffer.from(base64, 'base64'),
    );
  }
  await writeFile(
    join(outDir, 'composites.json'),
    JSON.stringify(compositeResult.stories, null, 2),
  );
  console.log(
    `composites: ${compositeResult.stories.length} rendered, ${compositeResult.sheets.length} sheet(s) written`,
  );

  if (pageErrors.length > 0) {
    failed = true;
    pageErrors.forEach((e) => console.log(`  [page error] ${e}`));
  }
} finally {
  await browser.close();
  await server.close();
  await rm(HARNESS_PATH, { force: true });
}
console.log(`sheets: ${outDir}`);
process.exit(failed ? 1 : 0);
