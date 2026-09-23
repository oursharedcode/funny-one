// SPDX-License-Identifier: AGPL-3.0-only

import { SLOT_COUNT } from '@funny/shared';
import { describe, expect, it } from 'vitest';
import { createGame, isDone, pickVirtualAnswer, submitAnswer, type Seat } from './roundRobin.js';
import { resolveStory } from './resolveStory.js';

const SEATS: Seat[] = [
  { id: 's0', name: 'Ann', kind: 'virtual' },
  { id: 's1', name: 'Bo', kind: 'virtual' },
];

function playToEnd(language: 'en' | 'ru') {
  let state = createGame(SEATS, language);
  while (!isDone(state)) {
    state = submitAnswer(state, pickVirtualAnswer(state));
  }
  return state;
}

describe('resolveStory', () => {
  it('resolves every slot of a finished story to non-empty display text', () => {
    const state = playToEnd('en');
    const resolved = resolveStory('en', state.stories[0]!);
    expect(resolved.answers).toHaveLength(SLOT_COUNT);
    expect(resolved.answers.every((a) => a.length > 0)).toBe(true);
    expect(resolved.prose.length).toBeGreaterThan(0);
  });

  it('capitalises the opening word and ends with a terminal period', () => {
    const state = playToEnd('en');
    const { prose } = resolveStory('en', state.stories[1]!);
    expect(prose[0]).toBe(prose[0]!.toUpperCase());
    expect(prose.endsWith('.')).toBe(true);
  });

  it('applies the Russian clause-comma polish pass', () => {
    const state = playToEnd('ru');
    const { prose } = resolveStory('ru', state.stories[0]!);
    expect(prose.length).toBeGreaterThan(0);
    expect(prose.endsWith('.')).toBe(true);
  });

  it('resolves an unanswered slot to an empty string rather than throwing', () => {
    const state = createGame(SEATS, 'en');
    const resolved = resolveStory('en', state.stories[0]!);
    expect(resolved.answers).toEqual(['', '', '', '', '', '', '']);
  });
});
