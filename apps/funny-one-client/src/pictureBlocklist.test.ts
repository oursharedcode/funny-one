// SPDX-License-Identifier: AGPL-3.0-only

import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ALL_OPTION_IDS, VISUAL_SLOTS, buildPrompt, type Story } from '@funny/shared';
import { BLOCKED_PICTURES, isBlockedPicture } from './pictureBlocklist';

// cloudflare/worker.js `imageKey`, as libraryPictureUrl computes it.
function libraryKey(story: Story): string {
  return createHash('sha256').update(buildPrompt(story), 'utf8').digest('hex');
}

function storyOf(options: readonly string[]): Story {
  const answers: (string | null)[] = Array.from({ length: 7 }, () => null);
  VISUAL_SLOTS.forEach((slot, axis) => {
    answers[slot] = options[axis];
  });
  return { answers, picture: null };
}

describe('the picture blocklist (T-FO-8.2)', () => {
  it('names real options, in slot order', () => {
    const ids = new Set<string>(ALL_OPTION_IDS);
    const prefixes = ['who.', 'with.', 'where.', 'did.'];
    for (const { options } of BLOCKED_PICTURES) {
      options.forEach((id, axis) => {
        expect(ids.has(id), id).toBe(true);
        expect(id.startsWith(prefixes[axis]), `${id} in slot ${axis}`).toBe(true);
      });
    }
  });

  it('keys each entry by the library key of the story it names', () => {
    // A prompt or pool change that moves a key must fail here, not quietly
    // un-block the picture on players' phones.
    for (const { hash, options } of BLOCKED_PICTURES) {
      expect(libraryKey(storyOf(options))).toBe(hash);
    }
  });

  it('has no duplicate entries', () => {
    const hashes = BLOCKED_PICTURES.map((p) => p.hash);
    expect(new Set(hashes).size).toBe(hashes.length);
  });

  it('answers by key', () => {
    expect(isBlockedPicture(BLOCKED_PICTURES[0].hash)).toBe(true);
    expect(isBlockedPicture(BLOCKED_PICTURES[0].hash.toUpperCase())).toBe(false);
    expect(isBlockedPicture('0'.repeat(64))).toBe(false);
  });
});
