// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import { MIN_SEATS, seatBotId, seatBotNumber, seatBotsNeeded } from './seatBots.js';

describe('seat bots (Step 130)', () => {
  it('fills a game to three seats and no further', () => {
    expect(MIN_SEATS).toBe(3);
    expect(seatBotsNeeded(1)).toBe(2);
    expect(seatBotsNeeded(2)).toBe(1);
    expect(seatBotsNeeded(3)).toBe(0);
    expect(seatBotsNeeded(7)).toBe(0);
  });

  it('reads back the number of its own ids only', () => {
    expect(seatBotNumber(seatBotId(1))).toBe(1);
    expect(seatBotNumber(seatBotId(2))).toBe(2);
    expect(seatBotNumber('Xy3k-_Q9aBcDeFgHiJkL')).toBeNull();
    expect(seatBotNumber('bot:')).toBeNull();
    expect(seatBotNumber('bot:0')).toBeNull();
    expect(seatBotNumber('bot:1.5')).toBeNull();
  });
});
