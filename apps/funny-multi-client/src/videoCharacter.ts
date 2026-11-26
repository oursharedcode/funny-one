// SPDX-License-Identifier: AGPL-3.0-only
//
// The laughing character of the 5-second share video. It walks in from the
// right along the cartoon's top edge, points down at the cartoon with a speech
// balloon, then falls on its back laughing.
//
// The first one is the monkey (B-12, owner request 2026-10-05), carried from
// SRC/client/src/recordWobbleLottie.ts — the rig (bones, draw order) and the
// timeline are SRC's. Despite that file's name there is no Lottie in it: SRC
// ended up drawing the monkey with plain canvas calls and four PNG sprites,
// which is what this is, so ARC-3 (no animation library) holds. DD-9's dropped
// `WobbleEngine` choice stays dropped — the character is simply part of the
// one recorder.
//
// Three things differ from SRC, all because the stage moved. SRC stood the
// monkey on bare background below the cartoon; this layout has the story text
// and the QR footer there, so the character takes the empty band above the
// cartoon instead and uses the cartoon's top edge as its ground:
//   - the ground is a callback (`groundAt`), so the character rides the wobble;
//   - it points down-left at the cartoon rather than up-left;
//   - the balloon sits beside the head rather than above it (no room above),
//     and the fall drops all the way onto the ground, which SRC never showed.
//
// B-29 (owner request 2026-11-26): a golden story's and a paid story's clip
// has a reindeer in a Christmas sweater or a Santa in the monkey's place,
// turn about, saying "ho-ho-ho" — aloud too, see clipSound.ts. Same bones,
// same timeline: a character is a `CharacterRig`, four sprites of its own and
// the sizes that go with them.

import { withBase } from './basePath';

interface Size {
  w: number;
  h: number;
}

/**
 * One character: where its four sprites are and how they hang together. All
 * lengths are canvas pixels of the 720 × 1280 clip; each sprite ships at twice
 * its drawn size, for a crisp result under rotation.
 */
export interface CharacterRig {
  /** The folder of `torso.png`, `head.png`, `arm.png` and `leg.png`, under the app's base. */
  folder: string;
  torso: Size;
  /** `pivotY` is how far below the sprite's top edge the neck is: antlers and
   *  a hat rise above the face, a beard hangs below the neck. */
  head: Size & { pivotY: number };
  arm: Size;
  leg: Size;
  // Bone attachments, relative to the torso centre.
  hipX: number;
  hipY: number;
  shoulderX: number;
  shoulderY: number;
  neckY: number;
  /** How far the torso centre drops between standing and lying on its back. */
  fallDrop: number;
  /** The tip of the balloon's tail, by the mouth, relative to the torso centre. */
  tailX: number;
  tailY: number;
  /** What the balloon says — the same in every language, as in SRC. */
  speech: string;
  speechW: number;
  /** The same line aloud, a file under the app's base (clipSound.ts); null for
   *  a character whose balloon is all there is. */
  voice: string | null;
}

export const MONKEY: CharacterRig = {
  folder: 'monkey',
  torso: { w: 70, h: 95 },
  head: { w: 78, h: 78, pivotY: 78 },
  arm: { w: 18, h: 72 },
  leg: { w: 22, h: 78 },
  hipX: 16,
  hipY: 44,
  shoulderX: 32,
  shoulderY: -32,
  neckY: -4,
  fallDrop: 78,
  tailX: -44,
  tailY: -52,
  speech: 'ha-ha',
  speechW: 160,
  voice: null,
};

// The two Christmas characters are shorter in the leg than the monkey: the
// band above the cartoon is some 230 px high, and antlers and a hat need
// their share of it.
export const REINDEER: CharacterRig = {
  folder: 'reindeer',
  // The sweater is 68 wide; the rest of the sprite is the tail's.
  torso: { w: 84, h: 84 },
  head: { w: 110, h: 100, pivotY: 98 },
  arm: { w: 20, h: 66 },
  leg: { w: 22, h: 54 },
  hipX: 16,
  hipY: 36,
  shoulderX: 31,
  shoulderY: -27,
  neckY: -34,
  fallDrop: 47,
  tailX: -44,
  tailY: -50,
  speech: 'ho-ho-ho',
  speechW: 196,
  voice: 'sounds/ho-ho-ho-reindeer.mp3',
};

export const SANTA: CharacterRig = {
  folder: 'santa',
  torso: { w: 94, h: 92 },
  // The beard hangs 36 px below the neck, over the chest.
  head: { w: 110, h: 132, pivotY: 96 },
  arm: { w: 22, h: 64 },
  leg: { w: 26, h: 44 },
  hipX: 18,
  hipY: 40,
  shoulderX: 40,
  shoulderY: -28,
  neckY: -30,
  fallDrop: 28,
  tailX: -46,
  tailY: -44,
  speech: 'ho-ho-ho',
  speechW: 196,
  voice: 'sounds/ho-ho-ho-santa.mp3',
};

// The soles sink this far into the cartoon, so no gap opens as it wobbles.
const FOOT_SINK = 6;

const WALK_START_MS = 1500;
/** When the character stops, points and speaks. */
export const POINT_START_MS = 3000;
const FALL_START_MS = 4000;

export interface CharacterSprites {
  torso: HTMLImageElement;
  head: HTMLImageElement;
  arm: HTMLImageElement;
  leg: HTMLImageElement;
}

export interface CharacterStage {
  /** Canvas width — the character walks in from beyond the right edge. */
  width: number;
  /** y of the surface under the character's feet at canvas x. */
  groundAt: (x: number) => number;
}

interface CharacterFrame {
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

function characterAt(ms: number, stage: CharacterStage, rig: CharacterRig): CharacterFrame | null {
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
    lift = rig.fallDrop * fallEase;
    torsoRot = degToRad(78 * fallEase);
    headRot = degToRad(-12 + 24 * fallEase - 18 * Math.sin(t * Math.PI * 5));
    armPointRot = degToRad(50 + 95 * fallEase - 30 * Math.sin(t * Math.PI * 8));
    armFreeRot = degToRad(10 + 40 * Math.sin(t * Math.PI * 6));
    legLeftRot = degToRad(40);
    legRightRot = degToRad(30);
  }

  // Torso centre → sole, standing.
  const standHeight = rig.hipY + rig.leg.h;
  const torsoY = stage.groundAt(torsoX) + FOOT_SINK - standHeight + lift;
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
  size: Size,
): void {
  ctx.save();
  ctx.translate(attachX, attachY);
  ctx.rotate(rotation);
  ctx.drawImage(sprite, -size.w / 2, 0, size.w, size.h);
  ctx.restore();
}

// The balloon is up while the character points, gone before the fall so the
// fall reads cleanly.
const SPEECH_H = 70;
const SPEECH_RADIUS = 24;
const INK = '#1f2937';

// One outline — rounded body plus a tail on its right edge reaching the head —
// so no stroke runs across the tail's base. Drawn in canvas coordinates, not
// inside the character's transform stack.
function drawSpeechBalloon(
  ctx: CanvasRenderingContext2D,
  torsoX: number,
  torsoY: number,
  rig: CharacterRig,
): void {
  const tailX = torsoX + rig.tailX;
  const tailY = torsoY + rig.tailY;
  const left = tailX - 26 - rig.speechW;
  const top = tailY - 8 - SPEECH_H / 2;
  const right = left + rig.speechW;
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
  ctx.fillText(rig.speech, left + rig.speechW / 2, midY);
  ctx.restore();
}

/**
 * Paints the character as it is `ms` into the clip — nothing at all before it
 * walks in. The torso is the root bone: its transform cascades to the limbs
 * and the head through the save/restore stack.
 */
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  ms: number,
  sprites: CharacterSprites,
  stage: CharacterStage,
  rig: CharacterRig = MONKEY,
): void {
  const m = characterAt(ms, stage, rig);
  if (!m) return;

  ctx.save();
  ctx.translate(m.torsoX, m.torsoY);
  ctx.rotate(m.torsoRot);

  // Legs first so the torso paints over their hip attachments.
  drawLimbSprite(ctx, sprites.leg, -rig.hipX, rig.hipY, m.legLeftRot, rig.leg);
  drawLimbSprite(ctx, sprites.leg, rig.hipX, rig.hipY, m.legRightRot, rig.leg);

  ctx.drawImage(sprites.torso, -rig.torso.w / 2, -rig.torso.h / 2, rig.torso.w, rig.torso.h);

  // The pointing arm is on the screen-left shoulder (the character faces the
  // viewer) and is drawn last, on top of the torso and the free arm.
  drawLimbSprite(ctx, sprites.arm, rig.shoulderX, rig.shoulderY, m.armFreeRot, rig.arm);
  drawLimbSprite(ctx, sprites.arm, -rig.shoulderX, rig.shoulderY, m.armPointRot, rig.arm);

  // Head — pivots around the neck, just above the torso centre, and overlaps
  // the torso rather than floating above it.
  ctx.save();
  ctx.translate(0, rig.neckY);
  ctx.rotate(m.headRot);
  ctx.translate(0, -rig.head.pivotY);
  ctx.drawImage(sprites.head, -rig.head.w / 2, 0, rig.head.w, rig.head.h);
  ctx.restore();

  ctx.restore();

  if (ms >= POINT_START_MS && ms < FALL_START_MS) {
    drawSpeechBalloon(ctx, m.torsoX, m.torsoY, rig);
  }
}

/**
 * Loads a character's four sprites. The loader is the recorder's own, passed
 * in so every image of the clip loads under the same cross-origin rule.
 */
export async function loadCharacterSprites(
  loadImage: (src: string) => Promise<HTMLImageElement>,
  rig: CharacterRig = MONKEY,
): Promise<CharacterSprites> {
  const load = (part: string): Promise<HTMLImageElement> =>
    loadImage(withBase(`${rig.folder}/${part}.png`));
  const [torso, head, arm, leg] = await Promise.all([
    load('torso'),
    load('head'),
    load('arm'),
    load('leg'),
  ]);
  return { torso, head, arm, leg };
}

// Which of the two Christmas characters the next festive clip gets: they take
// turns on this phone, the first by chance, so each has half of the videos.
let festiveTurn: number | null = null;

/** The character of a clip: the monkey, or for a festive clip the next of the two. */
export function nextCharacter(festive: boolean, random: () => number = Math.random): CharacterRig {
  if (!festive) return MONKEY;
  festiveTurn = festiveTurn === null ? (random() < 0.5 ? 0 : 1) : 1 - festiveTurn;
  return festiveTurn === 0 ? REINDEER : SANTA;
}

/** Forgets whose turn it is, for tests. */
export function resetCharacterTurn(): void {
  festiveTurn = null;
}
