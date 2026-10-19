// SPDX-License-Identifier: AGPL-3.0-only

// Makes the Google Play graphics that are drawn rather than screenshotted
// (Step 87, S-3c / B-1e), for both games, in a headless Chromium:
//
//   store/<game>/listing/en-GB/images/icon.png              512×512, 32-bit PNG
//   store/<game>/listing/<locale>/images/featureGraphic.png  1024×500, 24-bit PNG
//
//   node scripts/store-graphics.mjs
//
// The icon is the game's own icon-512.png re-encoded through a canvas, because
// Play asks for a 32-bit PNG and Funny Multi's is palette-mode. The feature
// graphic is the game's maskable icon in a circle, its name, a tagline and three
// of the game's questions, taken from the catalogs; a screenshot of an opaque
// page is 24-bit with no alpha, which is what Play asks for there. English is set
// in Fredoka, the games' display font; Russian in the system font, as the games
// set it (Fredoka has no Cyrillic) — so the Russian graphic depends on the
// machine; these were made on Windows (Segoe UI).
//
// The images/ folders are gitignored: regenerate rather than commit.
// Screenshots are scripts/store-screens.mjs; the texts, store/README.md.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const STORE = join(ROOT, 'store');

const GAMES = {
  'funny-one': {
    client: 'apps/funny-one-client',
    tagline: {
      en: 'Pass the phone. Build a silly story together.',
      ru: 'Один телефон по кругу — и нелепая история готова.',
    },
  },
  'funny-multi': {
    client: 'apps/funny-multi-client',
    tagline: {
      en: 'A phone each. Absurd stories and cartoons.',
      ru: 'У каждого свой телефон. Нелепые истории и картинки.',
    },
  },
};
// Play locale → the catalog code its text comes from. The other listing
// languages fall back to the default (en-GB) graphics.
const LOCALES = { 'en-GB': 'en', 'ru-RU': 'ru' };
// Who? Where? When? — short enough for one row in every language drawn here.
const QUESTIONS = [0, 2, 3];
const CHIP_COLOURS = [
  ['#ec4899', '#fff'],
  ['#f9c33f', '#1f2937'],
  ['#10b981', '#fff'],
  ['#38bdf8', '#1f2937'],
];

const dataUri = async (path, type) =>
  `data:${type};base64,${(await readFile(join(ROOT, path))).toString('base64')}`;
const catalog = async (client, code) =>
  JSON.parse(await readFile(join(ROOT, client, `src/i18n/${code}.json`), 'utf8'));
const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Fredoka's Latin subset; the Russian graphic does not use it (see above).
const fredoka = await dataUri(
  'apps/funny-one-client/public/fonts/fredoka-latin.woff2',
  'font/woff2',
);

function featureHtml({ badge, title, tagline, questions, latin }) {
  const chips = questions
    .map((q, i) => {
      const [bg, fg] = CHIP_COLOURS[i % CHIP_COLOURS.length];
      const tilt = [-4, 3, -2, 4][i % 4];
      return `<span style="background:${bg};color:${fg};transform:rotate(${tilt}deg)">${escape(q)}</span>`;
    })
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face {
      font-family: 'Fredoka'; font-weight: 500 700; src: url(${fredoka}) format('woff2');
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 1024px; height: 500px; overflow: hidden; }
    body { background: #fef3c7; color: #1f2937; position: relative;
      font-family: ${latin ? "'Fredoka', " : ''}system-ui, sans-serif; }
    .dot { position: absolute; border-radius: 50%; }
    .badge { position: absolute; left: 64px; top: 50px; width: 400px; height: 400px;
      border-radius: 50%; border: 8px solid #1f2937; overflow: hidden; background: #e25f9a; }
    .badge img { width: 100%; height: 100%; display: block; }
    .text { position: absolute; left: 508px; top: 40px; width: 470px; height: 420px;
      display: flex; flex-direction: column; justify-content: center; gap: 22px; }
    h1 { margin: 0; font-weight: 700; line-height: 1.02; text-wrap: balance; }
    p { margin: 0; font-size: 30px; font-weight: 500; line-height: 1.25; opacity: 0.8;
      text-wrap: balance; }
    .chips { display: flex; flex-wrap: wrap; gap: 12px 14px; }
    .chips span { padding: 6px 18px 8px; border: 3px solid #1f2937; border-radius: 999px;
      font-size: 27px; font-weight: 700; white-space: nowrap; }
  </style></head><body>
    <div class="dot" style="left:-50px;top:-60px;width:170px;height:170px;background:#fbcfe8"></div>
    <div class="dot" style="right:-40px;bottom:-70px;width:200px;height:200px;background:#fde68a"></div>
    <div class="dot" style="left:30px;bottom:26px;width:34px;height:34px;background:#a7f3d0"></div>
    <div class="badge"><img src="${badge}" alt=""></div>
    <div class="text">
      <h1>${escape(title)}</h1>
      <p>${escape(tagline)}</p>
      <div class="chips">${chips}</div>
    </div>
  </body></html>`;
}

/**
 * Sizes the title: one line at 96–64 px if it fits, else the largest size
 * (≤ 80 px) that fits in two. False when the text block overflows its box.
 */
function fitTitle() {
  const h1 = document.querySelector('h1');
  const fits = () => h1.scrollWidth <= h1.clientWidth;
  let done = false;
  h1.style.whiteSpace = 'nowrap';
  for (let size = 96; size >= 64 && !done; size -= 2) {
    h1.style.fontSize = `${size}px`;
    done = fits();
  }
  h1.style.whiteSpace = '';
  for (let size = 80; size >= 40 && !done; size -= 2) {
    h1.style.fontSize = `${size}px`;
    done = fits() && h1.getBoundingClientRect().height <= size * 1.02 * 2 + 1;
  }
  const text = document.querySelector('.text');
  return done && text.scrollHeight <= text.clientHeight;
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1024, height: 500 } });
  for (const [game, { client, tagline }] of Object.entries(GAMES)) {
    const badge = await dataUri(`${client}/public/icon-512-maskable.png`, 'image/png');

    const iconDir = join(STORE, game, 'listing/en-GB/images');
    await mkdir(iconDir, { recursive: true });
    await page.setContent('<!doctype html><title>icon</title>');
    const icon = await page.evaluate(
      async (src) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 512;
        canvas.getContext('2d').drawImage(img, 0, 0, 512, 512);
        return canvas.toDataURL('image/png').split(',')[1];
      },
      await dataUri(`${client}/public/icon-512.png`, 'image/png'),
    );
    await writeFile(join(iconDir, 'icon.png'), Buffer.from(icon, 'base64'));
    console.log(`${game}: icon.png`);

    for (const [locale, code] of Object.entries(LOCALES)) {
      const own = await catalog(client, code);
      // Both games ask the same seven questions; Funny Multi's catalog has them.
      const { questions } = await catalog('apps/funny-multi-client', code);
      await page.setContent(
        featureHtml({
          badge,
          title: own.home.title,
          tagline: tagline[code],
          questions: QUESTIONS.map((i) => questions[i]),
          latin: code === 'en',
        }),
        { waitUntil: 'load' },
      );
      await page.evaluate(() => document.fonts.ready);
      if (!(await page.evaluate(fitTitle))) throw new Error(`${game} ${locale}: text overflows`);
      const dir = join(STORE, game, 'listing', locale, 'images');
      await mkdir(dir, { recursive: true });
      await page.screenshot({ path: join(dir, 'featureGraphic.png') });
      console.log(`${game}: ${locale}/featureGraphic.png`);
    }
  }
} finally {
  await browser.close();
}
