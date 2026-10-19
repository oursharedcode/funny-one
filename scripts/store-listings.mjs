// SPDX-License-Identifier: AGPL-3.0-only

// Checks the Google Play listing texts under store/<game>/listing/<locale>/
// (Step 87, S-3c / B-1e) and writes a paste sheet for entering them in Play
// Console, one copy button per field:
//
//   node scripts/store-listings.mjs     → store/paste-sheet.html (gitignored)
//
// Checks, per game and locale: the three files exist; Play's limits, counted in
// code points (title 30, short description 80, full description 4000); no
// trailing newline on the one-line fields and exactly one on the full
// description (CRLF is read as LF); the title starts with the game's name in that language (the
// catalog's home.title); the privacy and source links are there; Funny One's
// full description names its "From the Internet" option as the game does, and
// Funny Multi's names Funny One the same way. Where the gitignored images/
// folders exist (scripts/store-graphics.mjs, store-screens.mjs), Play's image
// rules too: the icon 512×512 with alpha, at most 1 MB; the feature graphic
// 1024×500 without alpha; 2–8 phone screenshots without alpha, each side
// 320–3840 px and the long side at most twice the short. Exits 1 on any problem.

import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const STORE = join(ROOT, 'store');

// Play locale → the games' catalog code. Yoruba (yo) has no Play locale and
// falls back to the default listing, en-GB.
const LOCALES = {
  'en-GB': 'en',
  'ru-RU': 'ru',
  'fr-FR': 'fr',
  'de-DE': 'de',
  'it-IT': 'it',
  'es-ES': 'es-es',
  'es-419': 'es-419',
  'pt-BR': 'pt-br',
  id: 'id',
  uk: 'uk',
  'iw-IL': 'he',
  fa: 'fa',
  ar: 'ar',
  'zh-CN': 'zh',
  'zh-HK': 'yue',
  'ja-JP': 'ja',
  'ko-KR': 'ko',
  'hi-IN': 'hi',
  'ta-IN': 'ta',
  'te-IN': 'te',
  'bn-BD': 'bn',
  sw: 'sw',
};
const GAMES = {
  'funny-one': {
    client: 'apps/funny-one-client',
    links: [
      'https://www.funny1.oursharedcode.com/privacy',
      'https://github.com/oursharedcode/funny-one',
    ],
  },
  'funny-multi': {
    client: 'apps/funny-multi-client',
    links: [
      'https://www.funny37.oursharedcode.com/privacy',
      'https://github.com/oursharedcode/funny-one',
    ],
  },
};
const FIELDS = [
  { file: 'title.txt', label: 'App name', limit: 30, oneLine: true },
  { file: 'short_description.txt', label: 'Short description', limit: 80, oneLine: true },
  { file: 'full_description.txt', label: 'Full description', limit: 4000, oneLine: false },
];

const length = (s) => [...s].length;
const catalog = async (client, code) =>
  JSON.parse(await readFile(join(ROOT, client, `src/i18n/${code}.json`), 'utf8'));
// Width, height and whether the pixels carry alpha, from a PNG's IHDR chunk.
const png = async (path) => {
  const b = await readFile(path);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20), alpha: [4, 6].includes(b[25]) };
};
const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const problems = [];
const sheet = [];
let imagesChecked = 0;
for (const [game, { client, links }] of Object.entries(GAMES)) {
  const found = (await readdir(join(STORE, game, 'listing'))).sort();
  for (const locale of found) {
    if (!(locale in LOCALES)) problems.push(`${game}/${locale}: not a locale this script knows`);
  }
  for (const [locale, code] of Object.entries(LOCALES)) {
    const where = `${game}/${locale}`;
    if (!found.includes(locale)) {
      problems.push(`${where}: missing`);
      continue;
    }
    const own = await catalog(client, code);
    const fields = [];
    for (const { file, label, limit, oneLine } of FIELDS) {
      let text;
      try {
        // Git's core.autocrlf may check the files out with CRLF; Play gets LF.
        text = (await readFile(join(STORE, game, 'listing', locale, file), 'utf8')).replace(
          /\r\n/g,
          '\n',
        );
      } catch {
        problems.push(`${where}/${file}: missing`);
        continue;
      }
      if (text.includes('\r')) problems.push(`${where}/${file}: has a stray CR`);
      if (oneLine && /\s$/.test(text)) problems.push(`${where}/${file}: ends in whitespace`);
      if (oneLine && text.includes('\n')) problems.push(`${where}/${file}: more than one line`);
      if (!oneLine && (!text.endsWith('\n') || text.endsWith('\n\n'))) {
        problems.push(`${where}/${file}: must end with exactly one newline`);
      }
      const value = oneLine ? text : text.replace(/\n$/, '');
      if (length(value) > limit) {
        problems.push(`${where}/${file}: ${length(value)} > ${limit} characters`);
      }
      fields.push({ label, limit, value });
    }
    const [title, , full] = fields.map((f) => f.value ?? '');
    if (!title.startsWith(own.home.title)) {
      problems.push(`${where}: title does not start with "${own.home.title}"`);
    }
    for (const link of links) {
      if (!full.includes(link)) problems.push(`${where}: full description lacks ${link}`);
    }
    if (game === 'funny-one' && !full.includes(own.home.picturesOnline)) {
      problems.push(`${where}: full description lacks "${own.home.picturesOnline}"`);
    }
    if (game === 'funny-multi') {
      const one = (await catalog(GAMES['funny-one'].client, code)).home.title;
      if (!full.includes(one)) problems.push(`${where}: full description does not name "${one}"`);
    }
    sheet.push({ game, locale, code, fields });

    const images = join(STORE, game, 'listing', locale, 'images');
    const has = async (path) => (await stat(path).catch(() => null)) !== null;
    if (!(await has(images))) continue;
    imagesChecked++;
    if (locale === 'en-GB' || (await has(join(images, 'icon.png')))) {
      const icon = await png(join(images, 'icon.png')).catch(() => null);
      const size = (await stat(join(images, 'icon.png')).catch(() => ({ size: 0 }))).size;
      if (!icon || icon.width !== 512 || icon.height !== 512 || !icon.alpha || size > 1024 * 1024) {
        problems.push(`${where}: icon.png must be a 512×512 PNG with alpha, at most 1 MB`);
      }
    }
    const feature = await png(join(images, 'featureGraphic.png')).catch(() => null);
    if (!feature || feature.width !== 1024 || feature.height !== 500 || feature.alpha) {
      problems.push(`${where}: featureGraphic.png must be a 1024×500 PNG without alpha`);
    }
    const shots = await readdir(join(images, 'phoneScreenshots')).catch(() => []);
    if (shots.length < 2 || shots.length > 8) {
      problems.push(`${where}: ${shots.length} phone screenshots, Play takes 2–8`);
    }
    for (const shot of shots) {
      const { width, height, alpha } = await png(join(images, 'phoneScreenshots', shot));
      const [short, long] = [width, height].sort((a, b) => a - b);
      if (alpha || short < 320 || long > 3840 || long > 2 * short) {
        problems.push(
          `${where}/${shot}: ${width}×${height}${alpha ? ' with alpha' : ''} breaks Play's rules`,
        );
      }
    }
  }
}

const rtl = new Set(['he', 'fa', 'ar']);
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Play listing texts</title><style>
  body { margin: 0 auto; max-width: 860px; padding: 16px; font: 15px/1.45 system-ui, sans-serif;
    background: #fef3c7; color: #1f2937; }
  h2 { margin: 32px 0 8px; } h3 { margin: 20px 0 6px; }
  .field { background: #fff; border-radius: 10px; padding: 10px 12px; margin: 8px 0; }
  .head { display: flex; gap: 12px; align-items: center; font-weight: 600; }
  .count { color: #6b7280; font-weight: 400; } .over { color: #dc2626; }
  button { margin-left: auto; padding: 4px 14px; border-radius: 999px; border: 2px solid #1f2937;
    background: #f9c33f; font: inherit; cursor: pointer; }
  pre { white-space: pre-wrap; margin: 6px 0 0; font: inherit; }
  nav a { margin-right: 8px; }
</style></head><body>
<h1>Play listing texts</h1>
<p>Made by <code>node scripts/store-listings.mjs</code>. English and Russian are written
for the store; every other language is a machine draft awaiting a native speaker (B-3).</p>
${Object.keys(GAMES)
  .map(
    (game) =>
      `<h2 id="${game}">${game}</h2><nav>${sheet
        .filter((s) => s.game === game)
        .map((s) => `<a href="#${game}-${s.locale}">${s.locale}</a>`)
        .join('')}</nav>${sheet
        .filter((s) => s.game === game)
        .map(
          (s) =>
            `<h3 id="${game}-${s.locale}">${s.locale} <span class="count">(${s.code})</span></h3>${s.fields
              .map(
                (f) => `<div class="field"><div class="head">${f.label}
              <span class="count${length(f.value) > f.limit ? ' over' : ''}">${length(f.value)} / ${f.limit}</span>
              <button type="button">Copy</button></div>
              <pre dir="${rtl.has(s.code) ? 'rtl' : 'auto'}">${escape(f.value)}</pre></div>`,
              )
              .join('')}`,
        )
        .join('')}`,
  )
  .join('')}
<script>
  for (const button of document.querySelectorAll('button')) {
    button.addEventListener('click', async () => {
      await navigator.clipboard.writeText(button.closest('.field').querySelector('pre').textContent);
      button.textContent = 'Copied';
      setTimeout(() => (button.textContent = 'Copy'), 1200);
    });
  }
</script></body></html>
`;
await writeFile(join(STORE, 'paste-sheet.html'), html);

for (const game of Object.keys(GAMES)) {
  const rows = sheet.filter((s) => s.game === game);
  console.log(`${game}: ${rows.length} locales`);
  for (const { locale, fields } of rows) {
    console.log(
      `  ${locale.padEnd(7)} ${fields.map((f) => String(length(f.value)).padStart(4)).join(' ')}  ${fields[0].value}`,
    );
  }
}
console.log(`images checked in ${imagesChecked} listings`);
console.log('paste sheet: store/paste-sheet.html');
if (problems.length > 0) {
  console.log(`\n${problems.length} problem(s):`);
  problems.forEach((p) => console.log(`  ${p}`));
  process.exit(1);
}
console.log('all listings pass');
