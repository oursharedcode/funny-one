// SPDX-License-Identifier: AGPL-3.0-only
//
// The character's timeline, read off the canvas calls it makes: the first
// `translate` of a frame is the torso's position, the first `rotate` its tilt.
// recordWobble.test.ts covers the character inside a whole recording; this is
// the motion itself — the monkey's first, then the same for the two Christmas
// characters.

import { beforeEach, describe, expect, it } from 'vitest';
import { installCanvasStub, type Canvas2DStub } from './testutils/canvasStub';
import {
  drawCharacter,
  loadCharacterSprites,
  MONKEY,
  nextCharacter,
  REINDEER,
  resetCharacterTurn,
  SANTA,
  type CharacterRig,
  type CharacterSprites,
  type CharacterStage,
} from './videoCharacter';

const WIDTH = 720;
const GROUND = 250;
// The cartoon's top edge never rises above y ≈ 232 (recordWobble.ts).
const HIGHEST_GROUND = 232;

function stageAt(groundY: number): CharacterStage {
  return { width: WIDTH, groundAt: () => groundY };
}

const sprites: CharacterSprites = {
  torso: new Image(),
  head: new Image(),
  arm: new Image(),
  leg: new Image(),
};

function frameAt(
  ms: number,
  stage: CharacterStage = stageAt(GROUND),
  rig?: CharacterRig,
): Canvas2DStub {
  const ctx = installCanvasStub();
  const canvas = ctx as unknown as CanvasRenderingContext2D;
  // Without a rig, the default one: the monkey.
  if (rig) drawCharacter(canvas, ms, sprites, stage, rig);
  else drawCharacter(canvas, ms, sprites, stage);
  return ctx;
}

/** Arguments of the frame's first call to `method`. */
function first(ctx: Canvas2DStub, method: string): [number, number] {
  const call = ctx.calls.find((c) => c.method === method);
  if (!call) throw new Error(`no ${method} call`);
  return [call.args[0] as number, call.args[1] as number];
}

function says(ctx: Canvas2DStub, speech: string): boolean {
  return ctx.calls.some((c) => c.method === 'fillText' && c.args[0] === speech);
}

/** The corners of the balloon's outline. */
function balloon(ctx: Canvas2DStub): { xs: number[]; ys: number[] } {
  const points = ctx.calls.filter((c) => c.method === 'lineTo' || c.method === 'moveTo');
  return {
    xs: points.map((c) => c.args[0] as number),
    ys: points.map((c) => c.args[1] as number),
  };
}

describe('drawCharacter: the monkey', () => {
  it('draws nothing for the first 1.5 s', () => {
    expect(frameAt(0).calls).toHaveLength(0);
    expect(frameAt(1499).calls).toHaveLength(0);
  });

  it('walks in from beyond the right edge and stops at 78% of the width', () => {
    const [startX] = first(frameAt(1500), 'translate');
    const [midX] = first(frameAt(2250), 'translate');
    const [stopX] = first(frameAt(3000), 'translate');
    expect(startX).toBeGreaterThan(WIDTH);
    expect(midX).toBeLessThan(startX);
    expect(midX).toBeGreaterThan(stopX);
    expect(stopX).toBeCloseTo(WIDTH * 0.78);
  });

  it('stands with its soles just inside the ground it is given', () => {
    const [, torsoY] = first(frameAt(3500), 'translate');
    // Torso centre → sole is 122 px; the soles sink 6 px into the cartoon.
    expect(torsoY + 122).toBe(GROUND + 6);
  });

  it('follows the ground as the cartoon under it wobbles', () => {
    const [, low] = first(frameAt(3500, stageAt(270)), 'translate');
    const [, high] = first(frameAt(3500, stageAt(235)), 'translate');
    expect(low - high).toBe(35);
  });

  it('says ha-ha while it points, not while it walks or falls', () => {
    expect(says(frameAt(2900), 'ha-ha')).toBe(false);
    expect(says(frameAt(3000), 'ha-ha')).toBe(true);
    expect(says(frameAt(3999), 'ha-ha')).toBe(true);
    expect(says(frameAt(4000), 'ha-ha')).toBe(false);
  });

  it('keeps the whole balloon on the canvas even with the cartoon at its highest', () => {
    const { ys } = balloon(frameAt(3500, stageAt(HIGHEST_GROUND)));
    expect(Math.min(...ys)).toBeGreaterThan(0);
  });

  it('stays upright until 4 s, then tips onto its back and drops to the ground', () => {
    expect(first(frameAt(3999), 'rotate')[0]).toBe(0);
    const [, standingY] = first(frameAt(3999), 'translate');
    const fallen = frameAt(5000);
    expect(first(fallen, 'rotate')[0]).toBeCloseTo((78 * Math.PI) / 180);
    expect(first(fallen, 'translate')[1] - standingY).toBe(78);
  });

  it('is the character drawn when none is named', () => {
    expect(frameAt(3500).calls).toEqual(frameAt(3500, stageAt(GROUND), MONKEY).calls);
  });
});

// Owner request 2026-11-26: the same bones and the same timeline, with other
// sprites and "ho-ho-ho" in the balloon.
describe.each([
  ['the reindeer', REINDEER],
  ['Santa', SANTA],
])('drawCharacter: %s', (_name, rig) => {
  const at = (ms: number, groundY = GROUND): Canvas2DStub => frameAt(ms, stageAt(groundY), rig);

  it('keeps the monkey’s timeline: off stage, walking in, stopping at 78%', () => {
    expect(at(1499).calls).toHaveLength(0);
    const [startX] = first(at(1500), 'translate');
    const [stopX] = first(at(3000), 'translate');
    expect(startX).toBeGreaterThan(WIDTH);
    expect(stopX).toBeCloseTo(WIDTH * 0.78);
    // Step for step where the monkey is.
    expect(first(at(2250), 'translate')[0]).toBe(first(frameAt(2250), 'translate')[0]);
  });

  it('makes the monkey’s six sprite draws a frame', () => {
    expect(at(3500).calls.filter((c) => c.method === 'drawImage')).toHaveLength(6);
  });

  it('stands with its soles just inside the ground it is given', () => {
    const [, torsoY] = first(at(3500), 'translate');
    expect(torsoY + rig.hipY + rig.leg.h).toBe(GROUND + 6);
  });

  it('says ho-ho-ho while it points, and never ha-ha', () => {
    expect(says(at(2900), 'ho-ho-ho')).toBe(false);
    expect(says(at(3000), 'ho-ho-ho')).toBe(true);
    expect(says(at(3999), 'ho-ho-ho')).toBe(true);
    expect(says(at(4000), 'ho-ho-ho')).toBe(false);
    expect(says(at(3500), 'ha-ha')).toBe(false);
  });

  it('keeps the whole balloon on the canvas even with the cartoon at its highest', () => {
    const { xs, ys } = balloon(at(3500, HIGHEST_GROUND));
    expect(Math.min(...ys)).toBeGreaterThan(0);
    expect(Math.min(...xs)).toBeGreaterThan(0);
    expect(Math.max(...xs)).toBeLessThan(WIDTH);
  });

  it('keeps its antlers or hat on the canvas, at the top of a step too', () => {
    // The head sprite's top edge, standing; a step lifts it 4 px more.
    const [, torsoY] = first(at(3500, HIGHEST_GROUND), 'translate');
    expect(torsoY + rig.neckY - rig.head.pivotY - 4).toBeGreaterThan(0);
  });

  it('tips onto its back as the monkey does and comes to rest on the ground', () => {
    expect(first(at(3999), 'rotate')[0]).toBe(0);
    const [, standingY] = first(at(3999), 'translate');
    const fallen = at(5000);
    expect(first(fallen, 'rotate')[0]).toBeCloseTo((78 * Math.PI) / 180);
    expect(first(fallen, 'translate')[1] - standingY).toBe(rig.fallDrop);
    // On its back the torso lies about half its width above the ground: not
    // floating over the cartoon, not sunk into it.
    const centreToGround = GROUND - first(fallen, 'translate')[1];
    expect(centreToGround).toBeGreaterThan(rig.torso.w / 2 - 16);
    expect(centreToGround).toBeLessThan(rig.torso.w / 2 + 4);
  });
});

describe('loadCharacterSprites', () => {
  async function asked(rig?: CharacterRig): Promise<string[]> {
    const urls: string[] = [];
    const loader = (src: string): Promise<HTMLImageElement> => {
      urls.push(src);
      return Promise.resolve(new Image());
    };
    const loaded = rig
      ? await loadCharacterSprites(loader, rig)
      : await loadCharacterSprites(loader);
    expect(Object.keys(loaded)).toEqual(['torso', 'head', 'arm', 'leg']);
    return urls;
  }

  it('loads the four sprites from the app’s own monkey/ folder', async () => {
    expect(await asked()).toEqual([
      '/monkey/torso.png',
      '/monkey/head.png',
      '/monkey/arm.png',
      '/monkey/leg.png',
    ]);
  });

  it.each([
    ['reindeer', REINDEER],
    ['santa', SANTA],
  ])('loads the %s’s from its own folder', async (folder, rig) => {
    expect(await asked(rig)).toEqual(
      ['torso', 'head', 'arm', 'leg'].map((part) => `/${folder}/${part}.png`),
    );
  });
});

// Owner request 2026-11-26: the balloon's line aloud, each in its own voice.
describe('the characters’ voices', () => {
  it('gives the monkey none, and the reindeer and the Santa one each', () => {
    expect(MONKEY.voice).toBeNull();
    expect(REINDEER.voice).toBe('sounds/ho-ho-ho-reindeer.mp3');
    expect(SANTA.voice).toBe('sounds/ho-ho-ho-santa.mp3');
  });
});

describe('nextCharacter', () => {
  beforeEach(() => {
    resetCharacterTurn();
  });

  it('gives an ordinary clip the monkey', () => {
    expect(nextCharacter(false)).toBe(MONKEY);
  });

  it('starts a phone’s festive clips with either character, by chance', () => {
    expect(nextCharacter(true, () => 0.2)).toBe(REINDEER);
    resetCharacterTurn();
    expect(nextCharacter(true, () => 0.7)).toBe(SANTA);
  });

  it('then gives them turn about, so each has half of the videos', () => {
    const never = (): number => {
      throw new Error('chance is for the first clip only');
    };
    expect(nextCharacter(true, () => 0.7)).toBe(SANTA);
    expect(nextCharacter(true, never)).toBe(REINDEER);
    expect(nextCharacter(true, never)).toBe(SANTA);
    expect(nextCharacter(true, never)).toBe(REINDEER);
  });

  it('does not spend a turn on an ordinary clip', () => {
    expect(nextCharacter(true, () => 0.2)).toBe(REINDEER);
    expect(nextCharacter(false)).toBe(MONKEY);
    expect(nextCharacter(false)).toBe(MONKEY);
    expect(nextCharacter(true)).toBe(SANTA);
  });
});
