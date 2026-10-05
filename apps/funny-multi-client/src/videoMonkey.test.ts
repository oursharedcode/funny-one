// SPDX-License-Identifier: AGPL-3.0-only
//
// The monkey's timeline, read off the canvas calls it makes: the first
// `translate` of a frame is the torso's position, the first `rotate` its tilt.
// recordWobble.test.ts covers the monkey inside a whole recording; this is the
// motion itself.

import { describe, expect, it } from 'vitest';
import { installCanvasStub, type Canvas2DStub } from './testutils/canvasStub';
import { drawMonkey, loadMonkeySprites, type MonkeySprites, type MonkeyStage } from './videoMonkey';

const WIDTH = 720;
const GROUND = 250;

function stageAt(groundY: number): MonkeyStage {
  return { width: WIDTH, groundAt: () => groundY };
}

const sprites: MonkeySprites = {
  torso: new Image(),
  head: new Image(),
  arm: new Image(),
  leg: new Image(),
};

function frameAt(ms: number, stage: MonkeyStage = stageAt(GROUND)): Canvas2DStub {
  const ctx = installCanvasStub();
  drawMonkey(ctx as unknown as CanvasRenderingContext2D, ms, sprites, stage);
  return ctx;
}

/** Arguments of the frame's first call to `method`. */
function first(ctx: Canvas2DStub, method: string): [number, number] {
  const call = ctx.calls.find((c) => c.method === method);
  if (!call) throw new Error(`no ${method} call`);
  return [call.args[0] as number, call.args[1] as number];
}

function saysHaHa(ctx: Canvas2DStub): boolean {
  return ctx.calls.some((c) => c.method === 'fillText' && c.args[0] === 'ha-ha');
}

describe('drawMonkey', () => {
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
    expect(saysHaHa(frameAt(2900))).toBe(false);
    expect(saysHaHa(frameAt(3000))).toBe(true);
    expect(saysHaHa(frameAt(3999))).toBe(true);
    expect(saysHaHa(frameAt(4000))).toBe(false);
  });

  it('keeps the whole balloon on the canvas even with the cartoon at its highest', () => {
    // The cartoon's top edge never rises above y ≈ 232 (recordWobble.ts).
    const ctx = frameAt(3500, stageAt(232));
    const ys = ctx.calls
      .filter((c) => c.method === 'lineTo' || c.method === 'moveTo')
      .map((c) => c.args[1] as number);
    expect(Math.min(...ys)).toBeGreaterThan(0);
  });

  it('stays upright until 4 s, then tips onto its back and drops to the ground', () => {
    expect(first(frameAt(3999), 'rotate')[0]).toBe(0);
    const [, standingY] = first(frameAt(3999), 'translate');
    const fallen = frameAt(5000);
    expect(first(fallen, 'rotate')[0]).toBeCloseTo((78 * Math.PI) / 180);
    expect(first(fallen, 'translate')[1] - standingY).toBe(78);
  });
});

describe('loadMonkeySprites', () => {
  it('loads the four sprites from the app’s own monkey/ folder', async () => {
    const asked: string[] = [];
    const loaded = await loadMonkeySprites((src) => {
      asked.push(src);
      return Promise.resolve(new Image());
    });
    expect(asked).toEqual([
      '/monkey/torso.png',
      '/monkey/head.png',
      '/monkey/arm.png',
      '/monkey/leg.png',
    ]);
    expect(Object.keys(loaded)).toEqual(['torso', 'head', 'arm', 'leg']);
  });
});
