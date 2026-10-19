// SPDX-License-Identifier: AGPL-3.0-only

// Step 85 (B-23): scripts/android-labels.mjs names both Android apps in each
// game language. The apps are built rarely and by hand, so nothing else would
// notice a language added without a name, or a twa-manifest.json whose
// English name no longer matches the game's title.

import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LANGUAGES } from '@funny/shared';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));

interface Labels {
  name: string;
  launcherName: string;
  labels: Record<string, { appName: string; launcherName: string }>;
}

function dryRun(): Record<string, Labels> {
  const run = spawnSync(process.execPath, ['scripts/android-labels.mjs', '--dry-run'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  expect(run.stderr).toBe('');
  expect(run.status).toBe(0);
  return JSON.parse(run.stdout) as Record<string, Labels>;
}

const manifest = (dir: string): { name: string; launcherName: string } =>
  JSON.parse(readFileSync(`${ROOT}deploy/${dir}/twa-manifest.json`, 'utf8')) as {
    name: string;
    launcherName: string;
  };

describe('android-labels', () => {
  const all = dryRun();

  it('keeps both apps English by default, as their manifests say', () => {
    expect(manifest('android')).toMatchObject({ name: 'Funny Multi', launcherName: 'Funny Multi' });
    expect(manifest('android-funny1')).toMatchObject({
      name: 'Funny One',
      launcherName: 'Funny One',
    });
    expect(all['funny-multi']).toMatchObject({ name: 'Funny Multi', launcherName: 'Funny Multi' });
    expect(all['funny-one']).toMatchObject({ name: 'Funny One', launcherName: 'Funny One' });
  });

  it('names each app in every other game language, by the codes Android matches', () => {
    // Every language but English has a name of its own; Hebrew and Indonesian
    // come under their old codes too, Cantonese under Hong Kong's Chinese too.
    expect(Object.keys(all['funny-multi']?.labels ?? {})).toHaveLength(LANGUAGES.length - 1 + 3);
    for (const app of Object.values(all)) {
      for (const pair of Object.values(app.labels)) {
        expect(pair.appName.trim()).not.toBe('');
        expect(pair.launcherName.trim()).not.toBe('');
      }
    }
  });

  it('takes the names from the games’ titles, with a short Russian one for Funny One', () => {
    expect(all['funny-multi']?.labels.ru).toEqual({
      appName: 'Чепуха 37',
      launcherName: 'Чепуха 37',
    });
    expect(all['funny-one']?.labels.ru).toEqual({
      appName: 'Одна Чепуха: по кругу',
      launcherName: 'Одна Чепуха',
    });
    expect(all['funny-one']?.labels.de).toEqual({
      appName: 'Unsinn im Kreis',
      launcherName: 'Unsinn im Kreis',
    });
    expect(all['funny-multi']?.labels.iw).toEqual(all['funny-multi']?.labels.he);
    expect(all['funny-multi']?.labels['zh-rHK']).toEqual(all['funny-multi']?.labels['b+yue']);
    expect(all['funny-multi']?.labels['b+es+419']?.appName).toBe('Historias Divertidas');
  });
});
