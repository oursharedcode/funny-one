// SPDX-License-Identifier: AGPL-3.0-only

import { createHash, webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildPrompt, type Story } from '@funny/shared';
import {
  libraryPictureUrl,
  loadPictureSource,
  onlinePicturesAvailable,
  picturesBaseUrl,
  storePictureSource,
} from './pictureSource';

const LIBRARY = 'https://pictures.example';

function story(): Story {
  return {
    picture: null,
    answers: [
      'who.grumpy-pirate',
      'with.haunted-toaster',
      'where.cheese-factory',
      'when.hat-festival',
      'did.baking-giant-cake',
      'why.impress-a-pigeon',
      'end.duck-complaint',
    ],
  };
}

beforeEach(() => {
  localStorage.clear();
  // jsdom's `crypto` has no `subtle`; a browser on HTTPS does.
  if (!globalThis.crypto?.subtle) vi.stubGlobal('crypto', webcrypto);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('picturesBaseUrl (D-10)', () => {
  it('is null in a build that names no picture library', () => {
    expect(picturesBaseUrl()).toBeNull();
    expect(onlinePicturesAvailable()).toBe(false);
  });

  it('trims the value and drops trailing slashes', () => {
    vi.stubEnv('VITE_PICTURES_URL', `  ${LIBRARY}//  `);
    expect(picturesBaseUrl()).toBe(LIBRARY);
    expect(onlinePicturesAvailable()).toBe(true);
  });

  it.each(['', '   ', 'pictures.example', 'ftp://pictures.example', 'https://two words'])(
    'rejects %j',
    (value) => {
      vi.stubEnv('VITE_PICTURES_URL', value);
      expect(picturesBaseUrl()).toBeNull();
    },
  );
});

describe('the remembered picture source', () => {
  it('defaults to the built-in pictures', () => {
    vi.stubEnv('VITE_PICTURES_URL', LIBRARY);
    expect(loadPictureSource()).toBe('builtin');
  });

  it('remembers a pick of Internet pictures', () => {
    vi.stubEnv('VITE_PICTURES_URL', LIBRARY);
    storePictureSource('online');
    expect(loadPictureSource()).toBe('online');
    storePictureSource('builtin');
    expect(loadPictureSource()).toBe('builtin');
  });

  it('is built-in whatever was remembered when the build has no library', () => {
    storePictureSource('online');
    expect(loadPictureSource()).toBe('builtin');
  });

  it('survives storage that throws', () => {
    vi.stubEnv('VITE_PICTURES_URL', LIBRARY);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => storePictureSource('online')).not.toThrow();
    expect(loadPictureSource()).toBe('builtin');
  });
});

describe('libraryPictureUrl', () => {
  it("is the Worker's key for the story: /i/<sha256 of the prompt, hex>.png", async () => {
    vi.stubEnv('VITE_PICTURES_URL', `${LIBRARY}/`);
    // cloudflare/worker.js `imageKey`: sha256 of the UTF-8 prompt, lower-case hex.
    const hex = createHash('sha256').update(buildPrompt(story()), 'utf8').digest('hex');
    expect(await libraryPictureUrl(story())).toBe(`${LIBRARY}/i/${hex}.png`);
  });

  it('does not depend on the slots that are not in the picture', async () => {
    vi.stubEnv('VITE_PICTURES_URL', LIBRARY);
    const other = story();
    other.answers[3] = null;
    other.answers[5] = null;
    other.answers[6] = null;
    expect(await libraryPictureUrl(other)).toBe(await libraryPictureUrl(story()));
  });

  it('is null without a library', async () => {
    expect(await libraryPictureUrl(story())).toBeNull();
  });

  it('is null for a story with an unfilled visual slot', async () => {
    vi.stubEnv('VITE_PICTURES_URL', LIBRARY);
    const partial = story();
    partial.answers[2] = null;
    expect(await libraryPictureUrl(partial)).toBeNull();
  });

  it('is null where crypto.subtle is missing (a page not on HTTPS)', async () => {
    vi.stubEnv('VITE_PICTURES_URL', LIBRARY);
    vi.stubGlobal('crypto', {});
    expect(await libraryPictureUrl(story())).toBeNull();
  });
});
