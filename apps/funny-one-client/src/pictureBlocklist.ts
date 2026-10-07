// SPDX-License-Identifier: AGPL-3.0-only

// T-FO-8.2 (FO-ID-1) — library pictures the Families-audience review put to
// the owner, who blocked every one of them (2026-10-07), see
// docs/PICTURE_REVIEW.md. A blocked story draws the rig: the library address
// is never built, so the device makes no request for it.
//
// Each entry names the four visual options (slots who, with, where, did — the
// story the picture was drawn for) and the library key `libraryPictureUrl`
// would compute for them. The key is what the client checks; the options are
// for a reader, and the unit test holds the two together, so a prompt or pool
// change that moves a key is caught rather than silently un-blocking it.

export interface BlockedPicture {
  /** sha256 of the prompt, lower-case hex — the `/i/<hash>.png` key. */
  readonly hash: string;
  /** Option ids of slots 0, 1, 2 and 4, as `Story.answers` holds them. */
  readonly options: readonly [who: string, withWhom: string, where: string, did: string];
  /** What the review saw. */
  readonly why: string;
}

export const BLOCKED_PICTURES: readonly BlockedPicture[] = [
  {
    hash: 'e5afbcff12e8eb77790def803de3c75bcc891a82e1ed28addac54120eba76004',
    options: [
      'who.retired-superhero',
      'with.haunted-toaster',
      'where.gloomy-birthday',
      'did.staring-contest',
    ],
    why: 'an unexplained red puddle on the floor reads as blood',
  },
  {
    hash: '428a7f329e9ce02a18f0074e023f4a2df070e824b9a4dd68147a7b47377da929',
    options: [
      'who.muddy-knight',
      'with.professor-goat',
      'where.snowy-mountain',
      'did.stacking-chairs',
    ],
    why: 'a dark cross-in-circle emblem on a red banner; ambiguous, not worth keeping',
  },
  {
    hash: '8b78d8d34626c0295d6c20082bf857ec77199cc196e6c9f272939824626d1bc8',
    options: [
      'who.skating-grandma',
      'with.riddle-robot',
      'where.underwater-canyon',
      'did.sorting-clouds',
    ],
    why: 'a caption of gibberish words across the top that looks like it should be read',
  },
  {
    hash: '7b52f39dcde2f703d57f5d775d596d0eff4e30fd9c3952848a17163709202f1e',
    options: ['who.muddy-knight', 'with.giant-snail', 'where.snowy-mountain', 'did.sorting-clouds'],
    why: "a red-and-yellow flag that reads as Spain's",
  },
  {
    hash: '9414ac0de593ccae410074cc09131ec23df3ef246f61adbafae70e7e8db2f479',
    options: [
      'who.muddy-knight',
      'with.philosophical-goldfish',
      'where.cloud-castle',
      'did.staring-contest',
    ],
    why: 'the knight points a dagger at the goldfish bowl',
  },
  {
    hash: 'f0f8fbd5fac3343065e481236cbf2c1c0b12b875890784900dcd945050f8d71f',
    options: [
      'who.muddy-knight',
      'with.haunted-toaster',
      'where.cloud-castle',
      'did.staring-contest',
    ],
    why: 'the knight holds a sword up to the toaster',
  },
  {
    hash: 'fc6ca533dbf5134260ceeb9b0b95482277d718f10635dc445966ea0f20cd2d96',
    options: ['who.muddy-knight', 'with.riddle-robot', 'where.cloud-castle', 'did.staring-contest'],
    why: 'the knight holds a dagger towards the robot',
  },
  {
    hash: '2c25b85b74a5c7a93bf95cab67d6370647880cb5925040ed9d1ad1987f7a846b',
    options: ['who.muddy-knight', 'with.angry-geese', 'where.cloud-castle', 'did.staring-contest'],
    why: 'the knight holds a mallet facing the geese',
  },
  {
    hash: '7557a2d30cd94293ad7514e6cb5f5a3e503d457dd84427930cdce83df921eea9',
    options: [
      'who.muddy-knight',
      'with.riddle-robot',
      'where.gloomy-birthday',
      'did.staring-contest',
    ],
    why: 'the knight holds a dagger towards the robot, in a dark hall',
  },
  {
    hash: '3d38c880d5b6a1c2795ed0ae28e20f6091b897e011fdf2c2628681ec5aef645b',
    options: [
      'who.muddy-knight',
      'with.giant-snail',
      'where.gloomy-birthday',
      'did.baking-giant-cake',
    ],
    why: 'a dark-red splash on the floor under the cake, in a dark room, reads as blood',
  },
];

const HASHES: ReadonlySet<string> = new Set(BLOCKED_PICTURES.map((p) => p.hash));

/** True when `hash` (the library key, lower-case hex) is on the blocklist. */
export function isBlockedPicture(hash: string): boolean {
  return HASHES.has(hash);
}
