// SPDX-License-Identifier: AGPL-3.0-only
//
// The laughing monkey of the 5-second share video (B-12, owner request
// 2026-10-05): it walks in from the right along the cartoon's top edge, points
// down at the cartoon with a "ha-ha" balloon, then falls on its back laughing.
//
// Carried from SRC/client/src/recordWobbleLottie.ts — the rig (sizes, bones,
// draw order) and the timeline are SRC's. Despite that file's name there is no
// Lottie in it: SRC ended up drawing the monkey with plain canvas calls and
// four PNG sprites, which is what this is, so ARC-3 (no animation library)
// holds. DD-9's dropped `WobbleEngine` choice stays dropped — the monkey is
// simply part of the one recorder now.
//
// Three things differ from SRC, all because the stage moved. SRC stood the
// monkey on bare background below the cartoon; this layout has the story text
// and the QR footer there, so the monkey takes the empty band above the
// cartoon instead and uses the cartoon's top edge as its ground:
//   - the ground is a callback (`groundAt`), so the monkey rides the wobble;
//   - it points down-left at the cartoon rather than up-left;
//   - the balloon sits beside the head rather than above it (no room above),
//     and the fall drops all the way onto the ground, which SRC never showed.

import { withBase } from './basePath';

const TORSO_W = 70;
const TORSO_H = 95;
const HEAD_W = 78;
const HEAD_H = 78;
const ARM_W = 18;
const ARM_H = 72;
const LEG_W = 22;
const LEG_H = 78;

// Bone attachments, relative to the torso centre.
const HIP_X = 16;
const HIP_Y = 44;
const SHOULDER_X = 32;
const SHOULDER_Y = -32;

// Torso centre → sole, standing.
const STAND_HEIGHT = HIP_Y + LEG_H;
// The soles sink this far into the cartoon, so no gap opens as it wobbles.
const FOOT_SINK = 6;
// How far the torso centre drops between standing and lying on its back.
const FALL_DROP = 78;

const WALK_START_MS = 1500;
const POINT_START_MS = 3000;
const FALL_START_MS = 4000;

export interface MonkeySprites {
  torso: HTMLImageElement;
  head: HTMLImageElement;
  arm: HTMLImageElement;
  leg: HTMLImageElement;
}

export interface MonkeyStage {
  /** Canvas width — the monkey walks in from beyond the right edge. */
  width: number;
  /** y of the surface under the monkey's feet at canvas x. */
  groundAt: (x: number) => number;
}

interface MonkeyFrame {
  torsoX: number;
  torsoY: number;
  torsoRot: number;
  legLeftRot: number;
  legRightRot: number;
  armPointRot: number;
  armFreeRot: number;
  headRot: number;
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function monkeyAt(ms: number, stage: MonkeyStage): MonkeyFrame | null {
  // Off-screen for the first 1.5 s.
  if (ms < WALK_START_MS) return null;

  const standX = stage.width * 0.78;
  let torsoX = standX;
  let lift = 0;
  let torsoRot = 0;
  let legLeftRot = 0;
  let legRightRot = 0;
  let armPointRot = degToRad(-10);
  let armFreeRot = degToRad(10);
  let headRot = 0;

  if (ms < POINT_START_MS) {
    // 1.5–3.0 s — walking in from the right with alternating leg swings.
    const t = (ms - WALK_START_MS) / (POINT_START_MS - WALK_START_MS);
    torsoX = (1 - t) * (stage.width + 60) + t * standX;
    lift = Math.sin(t * Math.PI * 6) * 4;
    const swing = degToRad(28 * Math.sin(t * Math.PI * 6));
    legLeftRot = swing;
    legRightRot = -swing;
    armPointRot = degToRad(-10) + 1.5 * swing;
    armFreeRot = degToRad(10) - 1.5 * swing;
  } else if (ms < FALL_START_MS) {
    // 3.0–4.0 s — stops, points down-left at the cartoon under its feet, head
    // tilting the same way. Eases into the gesture within 0.6 s.
    const t = Math.min((ms - POINT_START_MS) / 600, 1);
    armPointRot = degToRad(-10 + 60 * t);
    headRot = degToRad(-12 * t);
  } else {
    // 4.0–5.0 s — falls onto its back, laughing: the torso tips clockwise and
    // drops to the ground, legs kick in the air, arms flail.
    const t = (ms - FALL_START_MS) / 1000;
    const fallEase = Math.min(t * 1.4, 1);
    lift = FALL_DROP * fallEase;
    torsoRot = degToRad(78 * fallEase);
    headRot = degToRad(-12 + 24 * fallEase - 18 * Math.sin(t * Math.PI * 5));
    armPointRot = degToRad(50 + 95 * fallEase - 30 * Math.sin(t * Math.PI * 8));
    armFreeRot = degToRad(10 + 40 * Math.sin(t * Math.PI * 6));
    legLeftRot = degToRad(40);
    legRightRot = degToRad(30);
  }

  const torsoY = stage.groundAt(torsoX) + FOOT_SINK - STAND_HEIGHT + lift;
  return {
    torsoX,
    torsoY,
    torsoRot,
    legLeftRot,
    legRightRot,
    armPointRot,
    armFreeRot,
    headRot,
  };
}

// Draws a limb attached at (attachX, attachY) on its parent and rotated around
// that point. The sprite's top-centre pixel is the pivot; the limb hangs down.
function drawLimbSprite(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLImageElement,
  attachX: number,
  attachY: number,
  rotation: number,
  w: number,
  h: number,
): void {
  ctx.save();
  ctx.translate(attachX, attachY);
  ctx.rotate(rotation);
  ctx.drawImage(sprite, -w / 2, 0, w, h);
  ctx.restore();
}

// "ha-ha" — the same in every language, as in SRC. Shown while the monkey
// points, gone before the fall so the fall reads cleanly.
const SPEECH_TEXT = 'ha-ha';
const SPEECH_W = 160;
const SPEECH_H = 70;
const SPEECH_RADIUS = 24;
const INK = '#1f2937';

// One outline — rounded body plus a tail on its right edge reaching the head —
// so no stroke runs across the tail's base. Drawn in canvas coordinates, not
// inside the monkey's transform stack.
function drawSpeechBalloon(ctx: CanvasRenderingContext2D, torsoX: number, torsoY: number): void {
  const tailX = torsoX - 44;
  const tailY = torsoY - 52;
  const left = tailX - 26 - SPEECH_W;
  const top = tailY - 8 - SPEECH_H / 2;
  const right = left + SPEECH_W;
  const bottom = top + SPEECH_H;
  const midY = top + SPEECH_H / 2;
  const r = SPEECH_RADIUS;

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(left + r, top);
  ctx.lineTo(right - r, top);
  ctx.quadraticCurveTo(right, top, right, top + r);
  ctx.lineTo(right, midY - 9);
  ctx.lineTo(tailX, tailY);
  ctx.lineTo(right, midY + 9);
  ctx.lineTo(right, bottom - r);
  ctx.quadraticCurveTo(right, bottom, right - r, bottom);
  ctx.lineTo(left + r, bottom);
  ctx.quadraticCurveTo(left, bottom, left, bottom - r);
  ctx.lineTo(left, top + r);
  ctx.quadraticCurveTo(left, top, left + r, top);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = INK;
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(SPEECH_TEXT, left + SPEECH_W / 2, midY);
  ctx.restore();
}

/**
 * Paints the monkey as it is `ms` into the clip — nothing at all before it
 * walks in. The torso is the root bone: its transform cascades to the limbs
 * and the head through the save/restore stack.
 */
export function drawMonkey(
  ctx: CanvasRenderingContext2D,
  ms: number,
  sprites: MonkeySprites,
  stage: MonkeyStage,
): void {
  const m = monkeyAt(ms, stage);
  if (!m) return;

  ctx.save();
  ctx.translate(m.torsoX, m.torsoY);
  ctx.rotate(m.torsoRot);

  // Legs first so the torso paints over their hip attachments.
  drawLimbSprite(ctx, sprites.leg, -HIP_X, HIP_Y, m.legLeftRot, LEG_W, LEG_H);
  drawLimbSprite(ctx, sprites.leg, HIP_X, HIP_Y, m.legRightRot, LEG_W, LEG_H);

  ctx.drawImage(sprites.torso, -TORSO_W / 2, -TORSO_H / 2, TORSO_W, TORSO_H);

  // The pointing arm is on the screen-left shoulder (the monkey faces the
  // viewer) and is drawn last, on top of the torso and the free arm.
  drawLimbSprite(ctx, sprites.arm, SHOULDER_X, SHOULDER_Y, m.armFreeRot, ARM_W, ARM_H);
  drawLimbSprite(ctx, sprites.arm, -SHOULDER_X, SHOULDER_Y, m.armPointRot, ARM_W, ARM_H);

  // Head — pivots around the neck, just above the torso centre, and overlaps
  // the torso rather than floating above it.
  ctx.save();
  ctx.translate(0, -4);
  ctx.rotate(m.headRot);
  ctx.translate(0, -HEAD_H / 2);
  ctx.drawImage(sprites.head, -HEAD_W / 2, -HEAD_H / 2, HEAD_W, HEAD_H);
  ctx.restore();

  ctx.restore();

  if (ms >= POINT_START_MS && ms < FALL_START_MS) {
    drawSpeechBalloon(ctx, m.torsoX, m.torsoY);
  }
}

/**
 * Loads the four sprites (each ships at 2× its drawn size, for a crisp result
 * under rotation). The loader is the recorder's own, passed in so every image
 * of the clip loads under the same cross-origin rule.
 */
export async function loadMonkeySprites(
  loadImage: (src: string) => Promise<HTMLImageElement>,
): Promise<MonkeySprites> {
  const load = (part: string): Promise<HTMLImageElement> =>
    loadImage(withBase(`monkey/${part}.png`));
  const [torso, head, arm, leg] = await Promise.all([
    load('torso'),
    load('head'),
    load('arm'),
    load('leg'),
  ]);
  return { torso, head, arm, leg };
}
