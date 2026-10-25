// SPDX-License-Identifier: AGPL-3.0-only

// Uploads one game's per-language Play graphics through the Google Play
// Developer API (Step 90, B-25): the feature graphic and phone screenshots of
// the ten locales Step 88 added, and Funny Multi's Russian (Step 93), which
// store-graphics.mjs and store-screens.mjs make under
// store/<game>/listing/<locale>/images/:
//
//   GOOGLE_APPLICATION_CREDENTIALS=<key.json> node scripts/store-upload.mjs <game> [--dry-run|--allow-review] [<locale>…]
//
// The key is a service account's JSON key, kept outside the repository; the
// account is a Play Console user with this one app's store-listing permission
// only. Everything runs in one edit. Each named locale (else all the game's) must have
// a listing and its files first, or nothing changes. Then, per locale and image
// type, the images there are removed, the local ones uploaded in their numbered
// order, and Play's list read back and compared with the local files by hash.
// The edit is committed only when every one matches, and only if Play holds it
// back from review: the owner labels the new feature graphics as AI-made in Play
// Console and sends the app for review there. --allow-review commits it even
// when Play would send it for review on its own, which it does while the app is
// a draft (the owner's choice, Step 90). Play then sends every change waiting in
// the Console with it: with no release saved yet, as Funny One's, nothing could
// go; with one, as Funny Multi's, the whole app went for review (Step 93), and
// the owner took it back in Publishing overview with Remove changes. The service
// account then also needs Play's "Edit and delete draft apps" permission while
// the app is a draft. --dry-run changes nothing: it
// shows what each listing holds now and whether that matches the local files.
// en-GB is not on the list: it is the default listing, put in by hand. Nor is
// Funny One's ru-RU: it went in by hand and carries the owner's labels, which a
// run here drops. Funny Multi's ru-RU goes up here, before its labels (Step 93).
//
// The API takes edits only once the app's first bundle is in Play Console, and
// an edit open here goes stale if the app is changed in Play Console meanwhile.
// No dependency: the token is a JWT signed with node:crypto.

import { createHash, createSign } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const STORE = join(ROOT, 'store');
const API = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';
const UPLOAD = 'https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications';

// Game → its Android project, whose twa-manifest.json names the package.
const GAMES = { 'funny-one': 'deploy/android-funny1', 'funny-multi': 'deploy/android' };
// Step 88's ten, in store-graphics.mjs's order, then Russian.
const LOCALES = [
  'fr-FR',
  'it-IT',
  'hi-IN',
  'ta-IN',
  'te-IN',
  'zh-CN',
  'zh-HK',
  'bn-BD',
  'ko-KR',
  'fa',
  'ru-RU',
];
// Locales a game's owner put in by hand and labelled: never touched here.
const BY_HAND = { 'funny-one': ['ru-RU'], 'funny-multi': [] };
const TYPES = ['featureGraphic', 'phoneScreenshots'];

const args = process.argv.slice(2);
const game = args.find((a) => a in GAMES);
const own = LOCALES.filter((l) => !BY_HAND[game]?.includes(l));
const dryRun = args.includes('--dry-run');
const allowReview = args.includes('--allow-review');
const only = args.filter((a) => own.includes(a));
const unknown = args.filter(
  (a) => !(a in GAMES) && a !== '--dry-run' && a !== '--allow-review' && !own.includes(a),
);
const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!game || unknown.length > 0 || !keyFile || (dryRun && allowReview)) {
  if (unknown.length > 0) console.error(`not a game, locale or flag here: ${unknown.join(' ')}`);
  if (!keyFile) console.error("GOOGLE_APPLICATION_CREDENTIALS must name the service account's key");
  console.error(
    `usage: node scripts/store-upload.mjs ${Object.keys(GAMES).join('|')} [--dry-run|--allow-review] [${own.join('|')}…]`,
  );
  process.exit(2);
}
const locales = only.length > 0 ? only : own;
const { packageId } = JSON.parse(
  await readFile(join(ROOT, GAMES[game], 'twa-manifest.json'), 'utf8'),
);

// A service account's OAuth token: a JWT it signs itself, swapped at Google's
// token endpoint for an hour's access to the Play Developer API.
const key = JSON.parse(await readFile(keyFile, 'utf8'));
const tokenUri = key.token_uri ?? 'https://oauth2.googleapis.com/token';
const part = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const unsigned = `${part({ alg: 'RS256', typ: 'JWT' })}.${part({
  iss: key.client_email,
  scope: 'https://www.googleapis.com/auth/androidpublisher',
  aud: tokenUri,
  iat: now,
  exp: now + 3600,
})}`;
const signature = createSign('RSA-SHA256')
  .update(unsigned)
  .sign(key.private_key)
  .toString('base64url');
const tokenResponse = await fetch(tokenUri, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: `${unsigned}.${signature}`,
  }),
});
const token = await tokenResponse.json();
if (!tokenResponse.ok) {
  console.error(`token: ${tokenResponse.status} ${token.error_description ?? token.error}`);
  process.exit(1);
}

// One API call; Google's own message on failure.
const call = async (method, url, init = {}) => {
  const response = await fetch(url, {
    method,
    ...init,
    headers: { Authorization: `Bearer ${token.access_token}`, ...init.headers },
  });
  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { error: { message: text.slice(0, 300) } };
  }
  if (!response.ok) {
    const path = url.replace(/^.*\/applications\//, '').replace(/\?.*$/, '');
    throw new Error(`${method} ${path}: ${response.status} ${body.error?.message ?? ''}`.trim());
  }
  return body;
};
const api = (method, path) => call(method, `${API}/${path}`);
const upload = (path, bytes) =>
  call('POST', `${UPLOAD}/${path}?uploadType=media`, {
    headers: { 'Content-Type': 'image/png' },
    body: bytes,
  });

// Play's Image names the uploaded file's sha256 and sha1. true or false when it
// names one; null when it names neither, so the order is then checked by count.
const same = (image, bytes) => {
  for (const alg of ['sha256', 'sha1']) {
    const theirs = image[alg];
    if (!theirs) continue;
    const ours = createHash(alg).update(bytes).digest();
    return (
      theirs.toLowerCase() === ours.toString('hex') ||
      [ours.toString('base64'), ours.toString('base64url')].includes(theirs)
    );
  }
  return null;
};
const compare = (images, files) => {
  if (images.length !== files.length) return 'differs';
  const each = images.map((image, i) => same(image, files[i].bytes));
  if (each.includes(false)) return 'differs';
  return each.includes(null) ? 'unverified' : 'matches';
};

const local = async (locale) => {
  const dir = join(STORE, game, 'listing', locale, 'images');
  const shots = (await readdir(join(dir, 'phoneScreenshots')))
    .filter((f) => f.endsWith('.png'))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  const read = async (path) => ({ path, bytes: await readFile(path) });
  return {
    featureGraphic: [await read(join(dir, 'featureGraphic.png'))],
    phoneScreenshots: await Promise.all(shots.map((f) => read(join(dir, 'phoneScreenshots', f)))),
  };
};

console.log(`${game}: ${packageId}, as ${key.client_email}${dryRun ? ' — dry run' : ''}`);
const edit = await api('POST', `${packageId}/edits`).catch((e) => {
  console.error(e.message);
  process.exit(1);
});
const listings = `${packageId}/edits/${edit.id}/listings`;
let committed = false;
try {
  // Everything is read and checked before anything changes.
  const plan = [];
  const problems = [];
  for (const locale of locales) {
    const files = await local(locale).catch(() => null);
    if (!files) {
      problems.push(`${locale}: no images under store/${game}/listing/${locale}/images`);
      continue;
    }
    const listing = await api('GET', `${listings}/${locale}`).catch((e) => {
      problems.push(`${locale}: ${e.message}`);
      return null;
    });
    if (listing) plan.push({ locale, title: listing.title, files });
  }
  if (problems.length > 0) {
    problems.forEach((p) => console.error(`  ${p}`));
    throw new Error(`${problems.length} problem(s), nothing changed`);
  }

  for (const { locale, title, files } of plan) {
    const states = [];
    for (const type of TYPES) {
      const where = `${listings}/${locale}/${type}`;
      if (!dryRun) {
        await api('DELETE', where);
        for (const { bytes } of files[type]) await upload(where, bytes);
      }
      const { images = [] } = await api('GET', where);
      const state = compare(images, files[type]);
      if (!dryRun && state === 'differs') {
        throw new Error(`${locale} ${type}: Play's copy differs from the local files`);
      }
      states.push(`${type} ${images.length}/${files[type].length} ${state}`);
    }
    console.log(`  ${locale.padEnd(6)} ${states.join(', ')}  ${title}`);
  }

  if (dryRun) {
    console.log('dry run: nothing changed');
  } else {
    // Play refuses the flag when it would send this app's changes for review on
    // its own. Without --allow-review the edit is then dropped, not committed
    // without it: the feature graphics are labelled as AI-made before the app
    // goes for review.
    let note = 'not sent for review: label the feature graphics, then send in Play Console';
    try {
      await api('POST', `${packageId}/edits/${edit.id}:commit?changesNotSentForReview=true`);
    } catch (e) {
      if (!/must not be set/i.test(e.message)) throw e;
      if (!allowReview) {
        throw new Error(`${e.message}\nnot committed: Play would send it for review on its own`);
      }
      await api('POST', `${packageId}/edits/${edit.id}:commit`);
      note =
        'Play sends changes for review on its own: if Publishing overview shows the app in review, ' +
        'Remove changes there, label the feature graphics, then send';
    }
    committed = true;
    console.log(`committed — ${note}`);
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  if (!committed) await api('DELETE', `${packageId}/edits/${edit.id}`).catch(() => {});
}
