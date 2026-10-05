// SPDX-License-Identifier: AGPL-3.0-only

// FO-IMG-2 check for apps/funny-one-client: zero runtime network calls with
// the built-in pictures — the default; pictures from the Internet are opt-in
// (D-10) and never picked here — and a full game playable with the network
// gone (T-FO-6.1). Per language:
//
//   1. builds the client the way production serves it (BASE_PATH=/, the root
//      of its own host since Step 60) and serves it with `vite preview`;
//   2. online pass — loads it in a headless phone-sized Chromium, waits until
//      the service worker controls the page (precache finished), plays a full
//      game, and fails on any request to another origin;
//   3. airplane pass — shuts the preview server down AND takes the browser
//      context offline, opens the app cold in a fresh tab, plays a full game,
//      exports a story picture (the lazily loaded QR chunk), and fails on any
//      failed request, console/page error, or Fredoka not loading from cache.
//
//   node scripts/funny-one-offline.mjs [lang ...]
//
// Default langs: en he (he covers the Hebrew font subset and RTL). Needs
// packages/shared built (`npm run build -w packages/shared`). Overwrites
// apps/funny-one-client/dist; saves each exported picture to .screens/.

import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import { chromium } from 'playwright';
import { playToEnd } from './funny-one-play.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const CLIENT = join(ROOT, 'apps/funny-one-client');
const BASE_PATH = '/';
const OUT = join(ROOT, '.screens'); // gitignored; the exported picture lands here
const langs = process.argv.length > 2 ? process.argv.slice(2) : ['en', 'he'];

/** data:/blob: URLs never touch the network. */
const isLocal = (url) => url.startsWith('data:') || url.startsWith('blob:');

async function newContext(browser, lang) {
  const context = await browser.newContext({
    viewport: { width: 360, height: 780 },
    locale: lang,
    serviceWorkers: 'allow',
  });
  // Remembered pick wins over the device locale (uiLanguage.ts).
  await context.addInitScript((code) => {
    try {
      localStorage.setItem('funny-one.language', code);
    } catch {
      /* private mode: fall back to the locale above */
    }
  }, lang);
  return context;
}

function watch(page, problems) {
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`));
}

async function runLanguage(browser, lang) {
  const cat = JSON.parse(await readFile(join(CLIENT, `src/i18n/${lang}.json`), 'utf8'));
  // A fresh server per language so each airplane pass can kill its own.
  const server = await preview({
    root: CLIENT,
    configFile: join(CLIENT, 'vite.config.ts'),
    logLevel: 'error',
    preview: { port: 0 },
  });
  const url = server.resolvedUrls.local[0];
  const origin = new URL(url).origin;
  const context = await newContext(browser, lang);
  const problems = [];
  let requests = 0;
  let offline = false;
  context.on('request', (r) => {
    requests++;
    if (!isLocal(r.url()) && new URL(r.url()).origin !== origin) {
      problems.push(`cross-origin request: ${r.url()}`);
    }
  });
  context.on('requestfailed', (r) => {
    if (!isLocal(r.url())) problems.push(`failed request: ${r.url()} (${r.failure()?.errorText})`);
  });

  try {
    // Online pass.
    const page = await context.newPage();
    watch(page, problems);
    await page.goto(url);
    await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, {
      timeout: 30_000,
    });
    await playToEnd(page, cat);
    const onlineRequests = requests;
    await page.close();

    // Airplane pass: no server, no network.
    await new Promise((done) => server.httpServer.close(done));
    await context.setOffline(true);
    offline = true;
    requests = 0;
    const cold = await context.newPage();
    watch(cold, problems);
    await cold.goto(url);
    await playToEnd(cold, cat);
    const fredoka = await cold.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].filter(
        (f) => f.family.replace(/["']/g, '') === 'Fredoka' && f.status === 'loaded',
      ).length;
    });
    if (fredoka === 0) problems.push('Fredoka did not load offline');
    const [download] = await Promise.all([
      cold.waitForEvent('download', { timeout: 30_000 }),
      cold.getByRole('button', { name: cat.gallery.download, exact: true }).first().click(),
    ]);
    await download.saveAs(join(OUT, `${lang}-offline-export.png`));
    return {
      lang,
      onlineRequests,
      offlineRequests: requests,
      fredoka,
      download: download.suggestedFilename(),
      problems,
    };
  } catch (e) {
    problems.push(`${offline ? 'airplane' : 'online'} pass: ${e.message.split('\n')[0]}`);
    return { lang, problems };
  } finally {
    await context.close();
    if (!offline) await new Promise((done) => server.httpServer.close(done));
  }
}

// PostCSS finds tailwind.config.js, and Tailwind resolves its content globs,
// relative to cwd — the same place `npm run build -w` puts it.
process.chdir(CLIENT);
process.env.BASE_PATH = BASE_PATH;
await build({ root: CLIENT, configFile: join(CLIENT, 'vite.config.ts'), logLevel: 'error' });

const browser = await chromium.launch();
let failed = false;
try {
  for (const lang of langs) {
    const r = await runLanguage(browser, lang);
    if (r.problems.length > 0) failed = true;
    console.log(
      `${lang}: ${r.problems.length === 0 ? 'OK' : 'FAILED'}` +
        (r.download
          ? ` — online ${r.onlineRequests} req, airplane ${r.offlineRequests} req (all from` +
            ` cache), Fredoka faces loaded ${r.fredoka}, exported ${r.download}`
          : ''),
    );
    r.problems.forEach((p) => console.log(`  ${p}`));
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
