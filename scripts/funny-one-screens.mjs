// SPDX-License-Identifier: AGPL-3.0-only

// Drives apps/funny-one-client through a full game in a headless phone-sized
// Chromium, once per UI language, and screenshots every screen type:
// home → handoff → round → thinking → end/gallery. Also flags any element whose
// content overflows its box (clipped button text, horizontal page scroll).
//
//   node scripts/funny-one-screens.mjs [lang ...] [--out <dir>] [--width <px>] [--url <base>]
//
// Default langs: en. Default out: ./.screens (gitignored). Needs
// packages/shared built (`npm run build -w packages/shared`).
//
// It starts its own Vite dev server in-process, so nothing else needs to run.
// With --url it drives that deployed build instead (e.g. the live
// /funny1-game/); selectors still come from the local catalogs, so the
// deploy must match the checked-out commit.
// The game itself is driven by funny-one-play.mjs, shared with the offline
// check (funny-one-offline.mjs).

import { mkdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { playToEnd } from './funny-one-play.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const CLIENT = join(ROOT, 'apps/funny-one-client');

const args = process.argv.slice(2);
function option(name, fallback) {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  const [, value] = args.splice(i, 2);
  return value;
}
const outDir = resolve(option('--out', join(ROOT, '.screens')));
const width = Number(option('--width', '360'));
const liveUrl = option('--url', null);
const langs = args.length > 0 ? args : ['en'];

/** Elements whose content is wider than their box, plus page-level horizontal scroll. */
function findOverflow() {
  const hits = [];
  const doc = document.documentElement;
  if (doc.scrollWidth > doc.clientWidth + 1) {
    hits.push(`page scrolls horizontally (${doc.scrollWidth} > ${doc.clientWidth})`);
  }
  for (const el of document.querySelectorAll('button, h1, h2, h3, p, label, input, span')) {
    const style = getComputedStyle(el);
    if (style.overflowX === 'auto' || style.overflowX === 'scroll') continue;
    if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
      const text = (el.textContent || el.getAttribute('placeholder') || '').trim().slice(0, 60);
      hits.push(`<${el.tagName.toLowerCase()}> "${text}" (${el.scrollWidth} > ${el.clientWidth})`);
    }
  }
  return hits;
}

async function runLanguage(browser, baseUrl, lang) {
  const cat = JSON.parse(await readFile(join(CLIENT, `src/i18n/${lang}.json`), 'utf8'));
  const context = await browser.newContext({
    viewport: { width, height: 780 },
    deviceScaleFactor: 2,
    locale: lang,
  });
  // Remembered pick wins over the device locale (uiLanguage.ts), so this
  // pins the language even where Chromium maps `locale` differently.
  await context.addInitScript((code) => {
    try {
      localStorage.setItem('funny-one.language', code);
    } catch {
      /* private mode: fall back to the locale above */
    }
  }, lang);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  const report = { lang, dir: '', overflow: {}, errors };
  const shot = async (name) => {
    await page.screenshot({ path: join(outDir, `${lang}-${name}.png`), fullPage: true });
    const hits = await page.evaluate(findOverflow);
    if (hits.length > 0) report.overflow[name] = hits;
  };

  await page.goto(baseUrl);
  await page.getByText(cat.home.subtitle).waitFor();
  report.dir = await page.evaluate(() => document.documentElement.dir);
  try {
    await playToEnd(page, cat, shot);
  } catch (e) {
    await page.screenshot({ path: join(outDir, `${lang}-stuck.png`), fullPage: true });
    throw new Error(`${e.message} (see ${lang}-stuck.png)`);
  }
  await page.waitForTimeout(2500); // let the first story's reveal settle
  await shot('5-end');

  await context.close();
  return report;
}

await mkdir(outDir, { recursive: true });
// PostCSS finds tailwind.config.js, and Tailwind resolves its content globs,
// relative to cwd — the same place `npm run dev -w` puts it.
let server = null;
if (!liveUrl) {
  process.chdir(CLIENT);
  server = await createServer({
    root: CLIENT,
    configFile: join(CLIENT, 'vite.config.ts'),
    logLevel: 'error',
    server: { port: 0 },
  });
  await server.listen();
}
const baseUrl = liveUrl ?? server.resolvedUrls.local[0];
const browser = await chromium.launch();
let failed = false;
try {
  for (const lang of langs) {
    try {
      const r = await runLanguage(browser, baseUrl, lang);
      const overflow = Object.entries(r.overflow);
      console.log(
        `${lang}: dir=${r.dir || 'ltr'} overflow=${overflow.length} errors=${r.errors.length}`,
      );
      for (const [screen, hits] of overflow) hits.forEach((h) => console.log(`  [${screen}] ${h}`));
      r.errors.forEach((e) => console.log(`  [error] ${e}`));
      if (r.errors.length > 0) failed = true;
    } catch (e) {
      failed = true;
      console.log(`${lang}: FAILED — ${e.message.split('\n')[0]}`);
    }
  }
} finally {
  await browser.close();
  await server?.close();
}
console.log(`screenshots: ${outDir}`);
process.exit(failed ? 1 : 0);
