// SPDX-License-Identifier: AGPL-3.0-only

// polishRussianProse is the offline, dependency-free punctuation pass applied
// to Russian story prose before it reaches the reveal screen and the
// downloadable image/video. These tests pin the two things that matter: it
// adds the high-confidence commas (and capitalisation + terminal period), and
// it stays conservative — it never rewrites a player's word and never inserts
// the ambiguous commas that would risk reading worse than none.

import { describe, expect, it } from 'vitest';
import { polishProse, polishRussianProse } from './grammar.js';

describe('polishRussianProse — clause commas', () => {
  it('inserts a comma before adversative "но"', () => {
    expect(polishRussianProse('я хотел спать но кот мешал')).toBe('Я хотел спать, но кот мешал.');
  });

  it('inserts a comma before "чтобы"', () => {
    expect(polishRussianProse('мы копали яму чтобы спрятать клад')).toBe(
      'Мы копали яму, чтобы спрятать клад.',
    );
  });

  it('inserts a comma before "потому что" (only as a pair)', () => {
    expect(polishRussianProse('он убежал потому что испугался')).toBe(
      'Он убежал, потому что испугался.',
    );
  });

  it('inserts a comma before a relative "который" form', () => {
    expect(polishRussianProse('кот бежал за мышью которую видел')).toBe(
      'Кот бежал за мышью, которую видел.',
    );
  });

  it('inserts a comma before contrastive "а"', () => {
    expect(polishRussianProse('кот спал а собака бегала')).toBe('Кот спал, а собака бегала.');
  });
});

describe('polishRussianProse — conservative (no wrong commas)', () => {
  it('does not touch the ambiguous "что"', () => {
    expect(polishRussianProse('я знаю что он тут')).toBe('Я знаю что он тут.');
  });

  it('does not put a comma between "даже" and "если"', () => {
    expect(polishRussianProse('приходи даже если поздно')).toBe('Приходи даже если поздно.');
  });

  it('does not double an existing comma', () => {
    expect(polishRussianProse('кот спал, но проснулся')).toBe('Кот спал, но проснулся.');
  });

  it('does not add a comma when the trigger opens a sentence', () => {
    expect(polishRussianProse('он ушёл. Однако вернулся')).toBe('Он ушёл. Однако вернулся.');
  });
});

describe('polishRussianProse — capitalisation, period, spacing', () => {
  it('capitalises the opening word and adds a terminal period', () => {
    expect(polishRussianProse('мышь спала')).toBe('Мышь спала.');
  });

  it('keeps an existing terminal mark', () => {
    expect(polishRussianProse('кот сбежал!')).toBe('Кот сбежал!');
  });

  it('collapses the double space an empty answer slot leaves behind', () => {
    expect(polishRussianProse('кот  бежал')).toBe('Кот бежал.');
  });
});

// ---------------------------------------------------------------------------
// T-2.3 — the language-neutral pass added for the T-1.5 capitalisation
// carry-over. Pool texts are caseless by design, so without this the English
// reveal screen opened lowercase, exactly as SRC shipped it.
// ---------------------------------------------------------------------------

describe('polishProse — non-Russian languages', () => {
  it('capitalises the opening word of English prose', () => {
    expect(polishProse('en', 'a grumpy pirate and a talking fridge were in a kitchen.')).toBe(
      'A grumpy pirate and a talking fridge were in a kitchen.',
    );
  });

  it('adds a terminal period when the template does not supply one', () => {
    expect(polishProse('en', 'they juggled pancakes')).toBe('They juggled pancakes.');
  });

  it('keeps an existing terminal mark and collapses double spaces', () => {
    expect(polishProse('en', 'the llama  won!')).toBe('The llama won!');
  });

  it('does not insert Russian clause commas into a non-Russian language', () => {
    // The comma pass is tuned to Russian tokens; running it elsewhere could
    // only mangle text that happens to contain those letter sequences.
    expect(polishProse('en', 'a cat but a dog')).toBe('A cat but a dog.');
  });

  it('routes Russian through the full pass, commas included', () => {
    expect(polishProse('ru', 'кот спал но собака бегала')).toBe('Кот спал, но собака бегала.');
  });

  it('leaves an empty string alone rather than emitting a bare period', () => {
    expect(polishProse('en', '')).toBe('');
    expect(polishProse('en', '   ')).toBe('');
  });
});
