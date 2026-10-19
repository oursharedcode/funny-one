// SPDX-License-Identifier: AGPL-3.0-only

// Step 85 (B-23): each Android app's name in the phone's language.
//
// Bubblewrap gives an app a single name, from twa-manifest.json: `name` is the
// app's label (Settings, the app switcher) and `launcherName` the name under
// its home-screen icon, both English since Step 85. Android shows a
// translation from res/values-<language>/ when the phone's language has one,
// so this script writes one into the Gradle project Bubblewrap generated: the
// game's Home title in each of its languages, from the game's own catalogs.
// Only those titles are used, so a fix to a title reaches the app at its
// next build. The machine-drafted ones are B-3's to review.
//
// `bubblewrap update` deletes and regenerates app/, and `bubblewrap build`
// does the same when twa-manifest.json changed since the last update. So run
// this after `update` and before `build` (deploy/android/README.md); it
// refuses to run on a project that `build` would regenerate.
//
//   node scripts/android-labels.mjs            write both projects' labels
//   node scripts/android-labels.mjs --dry-run  print them as JSON, write nothing

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');

// Each game's language code → the resource qualifiers Android matches it by.
// English is the default values/, which Bubblewrap fills from
// twa-manifest.json. Android still matches Hebrew and Indonesian by their old
// codes, iw and in. Cantonese also stands in for Hong Kong's Chinese; the one
// Portuguese is Brazil's, and Spain's Spanish is the plain es.
const QUALIFIERS = {
  en: [],
  fr: ['fr'],
  de: ['de'],
  ru: ['ru'],
  id: ['in', 'id'],
  it: ['it'],
  zh: ['zh'],
  yue: ['b+yue', 'zh-rHK'],
  ja: ['ja'],
  ko: ['ko'],
  'pt-br': ['pt'],
  'es-419': ['b+es+419'],
  'es-es': ['es'],
  uk: ['uk'],
  he: ['iw', 'he'],
  fa: ['fa'],
  ta: ['ta'],
  hi: ['hi'],
  te: ['te'],
  bn: ['bn'],
  ar: ['ar'],
  sw: ['sw'],
  yo: ['yo'],
};

// The two apps. A launcher name differs from the game's title only where the
// title is too long to fit under an icon (owner, 2026-10-19).
const PROJECTS = [
  {
    name: 'funny-multi',
    dir: 'deploy/android',
    catalogs: 'apps/funny-multi-client/src/i18n',
    launcherNames: {},
  },
  {
    name: 'funny-one',
    dir: 'deploy/android-funny1',
    catalogs: 'apps/funny-one-client/src/i18n',
    launcherNames: { ru: 'Одна Чепуха' },
  },
];

const FILE = 'app_labels.xml';

/** A string as Android resource XML reads it: escaped for XML, then for aapt. */
function androidString(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/^([@?])/, '\\$1');
}

function readJson(path) {
  return JSON.parse(readFileSync(join(ROOT, path), 'utf8'));
}

/** One project's labels: the manifest's English pair, and each qualifier's. */
function labelsOf(project) {
  const manifest = readJson(join(project.dir, 'twa-manifest.json'));
  const title = (code) => readJson(join(project.catalogs, `${code}.json`)).home.title;
  if (manifest.name !== title('en')) {
    throw new Error(
      `${project.dir}/twa-manifest.json: name is "${manifest.name}", not the English title "${title('en')}"`,
    );
  }
  const labels = {};
  for (const [code, qualifiers] of Object.entries(QUALIFIERS)) {
    const appName = title(code);
    const launcherName = project.launcherNames[code] ?? appName;
    for (const qualifier of qualifiers) labels[qualifier] = { appName, launcherName };
  }
  return { name: manifest.name, launcherName: manifest.launcherName, labels };
}

function xmlOf({ appName, launcherName }) {
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<!-- Written by scripts/android-labels.mjs (Step 85); edit the catalogs, not this. -->',
    '<resources>',
    `  <string name="appName">${androidString(appName)}</string>`,
    `  <string name="launcherName">${androidString(launcherName)}</string>`,
    '</resources>',
    '',
  ].join('\n');
}

/** Fail unless Bubblewrap's project is there and current, so `build` keeps it. */
function check(project) {
  const dir = join(ROOT, project.dir);
  if (!existsSync(join(dir, 'app/src/main/res/values'))) {
    throw new Error(`${project.dir}: no generated project; run \`bubblewrap update\` there first`);
  }
  const manifest = readFileSync(join(dir, 'twa-manifest.json'));
  const checksum = createHash('sha1').update(manifest).digest('hex');
  const recorded = readFileSync(join(dir, 'manifest-checksum.txt'), 'utf8').trim();
  if (checksum !== recorded) {
    throw new Error(
      `${project.dir}: twa-manifest.json changed since the last \`bubblewrap update\`, so ` +
        '`bubblewrap build` would regenerate the project and drop these labels; update first',
    );
  }
}

function write(project, { labels }) {
  for (const [qualifier, pair] of Object.entries(labels)) {
    const folder = join(ROOT, project.dir, 'app/src/main/res', `values-${qualifier}`);
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, FILE), xmlOf(pair));
  }
  console.log(`${project.dir}: ${Object.keys(labels).length} translated names written`);
}

try {
  const all = Object.fromEntries(PROJECTS.map((project) => [project.name, labelsOf(project)]));
  if (process.argv.includes('--dry-run')) {
    console.log(JSON.stringify(all, null, 2));
  } else {
    PROJECTS.forEach(check);
    for (const project of PROJECTS) write(project, all[project.name]);
  }
} catch (error) {
  console.error(`android-labels: ${error.message}`);
  process.exit(1);
}
