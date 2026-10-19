// SPDX-License-Identifier: AGPL-3.0-only

// Takes the Google Play phone screenshots of both games (Step 87, S-3c / B-1e):
// a real game in a phone-sized headless Chromium, 360×640 CSS px at 3× — so
// 1080×1920, 9:16, a 24-bit PNG, as Play asks — in English and Russian:
//
//   store/<game>/listing/<en-GB|ru-RU>/images/phoneScreenshots/<n>-<screen>.png
//
//   npm run build && node scripts/store-screens.mjs [funny-one] [funny-multi]
//
// Funny One runs on an in-process Vite dev server (a free port the OS picks),
// played by funny-one-play.mjs; its pictures are the built-in ones, drawn on
// the device.
//
// Funny Multi needs `npm run build` first: three players, each in their own
// context, play a room on the production server, started here on port 3000
// (so the Docker app must not be running). Its cartoons come from a local
// stand-in for the picture Worker on 127.0.0.1:5185 — the real
// cloudflare/worker.js with a made-up secret, whose store reads the public
// picture library. Those reads, plain GETs of public images that any player's
// phone makes, are the only requests that leave the machine; they are cached
// in .screens/store-pictures. Both ports are in the machine's port register.
//
// The images/ folders are gitignored: regenerate rather than commit. The order
// below is the listing's order; Play shows the first three most.

import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { chromium } from 'playwright';
import { playToEnd } from './funny-one-play.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const STORE = join(ROOT, 'store');
const FO_CLIENT = join(ROOT, 'apps/funny-one-client');
const FM_CLIENT = join(ROOT, 'apps/funny-multi-client');
const LIBRARY = process.env.PICTURES_URL ?? 'https://funny-multi-image.oursharedcode.workers.dev';
const PICTURE_CACHE = join(ROOT, '.screens/store-pictures');
const SERVER_ORIGIN = 'http://localhost:3000';
const WORKER_PORT = 5185;
const WORKER_ORIGIN = `http://127.0.0.1:${WORKER_PORT}`;

// Play locale → catalog code. Other listing languages show the default's.
const LOCALES = { 'en-GB': 'en', 'ru-RU': 'ru' };
const NAMES = {
  en: { people: ['Anna', 'Ben', 'Chloe'], bot: 'Robo' },
  // Indeclinable, so the games' "Передай телефон {{name}}" reads right.
  ru: { people: ['Элли', 'Тео', 'Мими'], bot: 'Робик' },
};
const ORDER = {
  'funny-one': ['end', 'round', 'handoff', 'home', 'thinking'],
  // The reveal's Continue button floats over its cartoon, so the gallery leads.
  'funny-multi': ['gallery', 'reveal', 'round', 'lobby', 'home'],
};
const PHONE = {
  viewport: { width: 360, height: 640 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
};

const catalog = async (client, code) =>
  JSON.parse(await readFile(join(client, `src/i18n/${code}.json`), 'utf8'));

/** Writes one locale's shots in listing order, replacing what was there. */
async function save(game, locale, shots) {
  const dir = join(STORE, game, 'listing', locale, 'images', 'phoneScreenshots');
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  for (const [i, name] of ORDER[game].entries()) {
    if (!shots[name]) throw new Error(`${game} ${locale}: no "${name}" screenshot`);
    await writeFile(join(dir, `${i + 1}-${name}.png`), shots[name]);
  }
  console.log(`${game} ${locale}: ${ORDER[game].length} screenshots`);
}

/** Records page errors; a run with any fails, since the shot may show them. */
function watch(page, errors, who) {
  page.on('pageerror', (e) => errors.push(`${who}: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`${who}: ${m.text()}`));
}

async function funnyOne(browser) {
  // PostCSS and Tailwind resolve their configs from cwd (funny-one-screens.mjs).
  process.chdir(FO_CLIENT);
  const vite = await createViteServer({
    root: FO_CLIENT,
    configFile: join(FO_CLIENT, 'vite.config.ts'),
    logLevel: 'error',
    server: { port: 0 },
  });
  await vite.listen();
  try {
    for (const [locale, code] of Object.entries(LOCALES)) {
      const cat = await catalog(FO_CLIENT, code);
      const { people, bot } = NAMES[code];
      const context = await browser.newContext({ ...PHONE, locale: code });
      await context.addInitScript((lang) => {
        try {
          localStorage.setItem('funny-one.language', lang);
        } catch {
          /* the locale above still applies */
        }
      }, code);
      const page = await context.newPage();
      const errors = [];
      watch(page, errors, 'page');
      const shots = {};
      await page.goto(vite.resolvedUrls.local[0]);
      await playToEnd(
        page,
        cat,
        async (screen) => {
          if (screen === '1-home') {
            const human = page.getByRole('textbox', { name: cat.home.humanSeatLabel, exact: true });
            await human.nth(0).fill(people[0]);
            await human.nth(1).fill(people[1]);
            await page
              .getByRole('textbox', { name: cat.home.virtualSeatLabel, exact: true })
              .fill(bot);
            await page.evaluate(() => document.activeElement?.blur());
          }
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.waitForTimeout(700); // entrance animations finish
          shots[screen.replace(/^\d-/, '')] = await page.screenshot();
        },
        { botName: bot },
      );
      await page.waitForTimeout(2500); // the first story's reveal settles
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      shots.end = await page.screenshot();
      await context.close();
      if (errors.length > 0) throw new Error(`funny-one ${locale}:\n${errors.join('\n')}`);
      await save('funny-one', locale, shots);
    }
  } finally {
    await vite.close();
    process.chdir(ROOT);
  }
}

/** The picture Worker stand-in: worker.js over a store that reads the library. */
async function startPictureStandIn() {
  const { default: worker } = await import(pathToFileURL(join(ROOT, 'cloudflare/worker.js')).href);
  await mkdir(PICTURE_CACHE, { recursive: true });
  const bytes = async (key) => {
    const file = join(PICTURE_CACHE, key.replace(/^i\//, ''));
    try {
      return await readFile(file);
    } catch {
      const res = await fetch(`${LIBRARY}/${key}`);
      if (!res.ok) return null;
      const body = Buffer.from(await res.arrayBuffer());
      await writeFile(file, body);
      return body;
    }
  };
  // A PNG's width and height are the IHDR chunk's first two fields.
  const stored = (key, body, withBody) => ({
    httpEtag: `"${key}"`,
    customMetadata: { width: String(body.readUInt32BE(16)), height: String(body.readUInt32BE(20)) },
    writeHttpMetadata: (headers) => headers.set('Content-Type', 'image/png'),
    ...(withBody ? { body } : {}),
  });
  const env = {
    WORKER_SECRET: randomUUID(),
    IMAGES: {
      head: async (key) => {
        const body = await bytes(key);
        return body && stored(key, body, false);
      },
      get: async (key) => {
        const body = await bytes(key);
        return body && stored(key, body, true);
      },
      put: async () => {},
    },
  };
  const server = createHttpServer(async (req, res) => {
    const headers = req.headers['x-secret'] ? { 'X-Secret': req.headers['x-secret'] } : {};
    const response = await worker.fetch(
      new Request(`${WORKER_ORIGIN}${req.url}`, { headers }),
      env,
    );
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  });
  await new Promise((done) => server.listen(WORKER_PORT, '127.0.0.1', done));
  return { secret: env.WORKER_SECRET, close: () => (server.close(), server.closeAllConnections()) };
}

async function startGameServer(secret) {
  const server = spawn(process.execPath, ['apps/funny-multi-server/dist/index.js'], {
    cwd: ROOT,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: '3000',
      CLOUDFLARE_WORKER_URL: WORKER_ORIGIN,
      CLOUDFLARE_WORKER_SECRET: secret,
      // Set, so the repo .env cannot fill them in: counts stay in memory, and
      // no gift links show — the store apps have none.
      STATS_FILE: '',
      GEO_DIR: '',
      DEPLOYER_BMC_URL: '',
      DEPLOYER_DONATE_URL: '',
      DEPLOYER_KOFI_URL: '',
      DEPLOYER_LIGHTNING_ADDRESS: '',
      DEPLOYER_PAYID: '',
      DEPLOYER_PAYID_NAME: '',
      DEPLOYER_SPONSORS_URL: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  server.stdout.on('data', (d) => (log += d));
  server.stderr.on('data', (d) => (log += d));
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(`${SERVER_ORIGIN}/health`)).ok) return server;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  server.kill();
  throw new Error(`the game server did not start (is port 3000 free?):\n${log.slice(-1500)}`);
}

async function funnyMulti(browser) {
  const standIn = await startPictureStandIn();
  let server;
  try {
    server = await startGameServer(standIn.secret);
    for (const [locale, code] of Object.entries(LOCALES)) {
      const cat = await catalog(FM_CLIENT, code);
      const { people } = NAMES[code];
      const errors = [];
      const pages = [];
      for (const name of people) {
        const page = await (await browser.newContext({ ...PHONE, locale: code })).newPage();
        watch(page, errors, name);
        pages.push(page);
      }
      const [host, ...joiners] = pages;
      const shots = {};

      await host.goto(`${SERVER_ORIGIN}/?lang=${code}`);
      await host.getByPlaceholder(cat.home.nicknamePlaceholder).fill(people[0]);
      await host.evaluate(() => document.activeElement?.blur());
      await host.waitForTimeout(800); // the open-rooms counter arrives
      shots.home = await host.screenshot();
      await host.getByRole('button', { name: cat.home.create, exact: true }).click();
      const start = host.getByRole('button', { name: cat.lobby.startGame, exact: true });
      await start.waitFor();
      const room = (await host.locator('p.tracking-widest').first().innerText()).trim();
      for (const [i, page] of joiners.entries()) {
        await page.goto(`${SERVER_ORIGIN}/?room=${room}&lang=${code}`);
        await page.getByPlaceholder(cat.home.nicknamePlaceholder).fill(people[i + 1]);
        await page.getByRole('button', { name: cat.home.join, exact: true }).click();
      }
      await start.and(host.locator(':enabled')).waitFor();
      await host.getByText(people[2]).first().waitFor();
      await host.waitForTimeout(600);
      shots.lobby = await host.screenshot();
      await start.click();

      // Seven rounds: everyone picks the first answer and submits.
      const playRounds = async (page) => {
        const reveal = page.getByText(cat.reveal.title);
        const submit = page.getByRole('button', { name: cat.round.submit, exact: true });
        const deadline = Date.now() + 240_000;
        while (Date.now() < deadline) {
          if (await reveal.isVisible()) return;
          if ((await submit.isVisible()) && (await page.getByRole('radio').first().isEnabled())) {
            await page.getByRole('radio').first().click();
            if (page === host && !shots.round) {
              // The click scrolls the question off the top; bring it back.
              await page.evaluate(() => window.scrollTo(0, 0));
              await page.waitForTimeout(300);
              shots.round = await page.screenshot();
            }
            if (await submit.isEnabled()) await submit.click();
          }
          await page.waitForTimeout(200);
        }
        throw new Error('never reached the reveal');
      };
      await Promise.all(pages.map(playRounds));

      const cartoon = host.locator('img[alt]').first();
      await cartoon.waitFor({ timeout: 45_000 });
      await cartoon.evaluate((img) => img.decode());
      await host.waitForTimeout(1500);
      shots.reveal = await host.screenshot();
      for (const page of pages) {
        await page.getByRole('button', { name: cat.reveal.continue, exact: true }).click();
        await page.getByText(cat.end.roundsOver).waitFor();
      }

      await host.getByRole('button', { name: cat.gallery.share, exact: true }).click();
      const viewer = joiners[0];
      await viewer.getByText(cat.gallery.title).waitFor();
      await viewer
        .locator('section img')
        .first()
        .evaluate((img) => img.decode());
      await viewer.waitForTimeout(1500);
      shots.gallery = await viewer.screenshot();

      for (const page of pages) await page.context().close();
      if (errors.length > 0) throw new Error(`funny-multi ${locale}:\n${errors.join('\n')}`);
      await save('funny-multi', locale, shots);
    }
  } finally {
    server?.kill();
    standIn.close();
  }
}

const games = process.argv.slice(2);
const run = games.length > 0 ? games : ['funny-one', 'funny-multi'];
const browser = await chromium.launch();
try {
  if (run.includes('funny-one')) await funnyOne(browser);
  if (run.includes('funny-multi')) await funnyMulti(browser);
} finally {
  await browser.close();
}
