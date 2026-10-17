// SPDX-License-Identifier: AGPL-3.0-only

import QRCode from 'qrcode';
import { describe, expect, it } from 'vitest';
import { qrPath } from './qr.ts';

const RUN = /M(\d+) (\d+)h(\d+)v1h-\3z/g;

describe('qrPath', () => {
  it('draws every dark module of the code once, and nothing else', () => {
    const text = 'lightning:someone@example.com';
    const { size, d } = qrPath(text);
    const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' });
    expect(size).toBe(modules.size);
    // A code of version v is 4v + 17 modules a side.
    expect((size - 17) % 4).toBe(0);
    expect(d.replace(RUN, '')).toBe('');

    const painted = new Set<string>();
    for (const [, x, y, width] of d.matchAll(RUN)) {
      for (let col = Number(x); col < Number(x) + Number(width); col += 1) {
        const cell = `${y},${col}`;
        expect(painted.has(cell)).toBe(false);
        painted.add(cell);
      }
    }
    const dark = new Set<string>();
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (modules.get(row, col)) dark.add(`${row},${col}`);
      }
    }
    expect(painted).toEqual(dark);
  });

  it('has the three corner squares a scanner looks for', () => {
    const { size, d } = qrPath('https://www.funny37.oursharedcode.com/');
    // The top edge of each: seven dark modules, with a light one beside them.
    expect(d).toContain('M0 0h7v1h-7z');
    expect(d).toContain(`M${size - 7} 0h7v1h-7z`);
    expect(d).toContain(`M0 ${size - 7}h7v1h-7z`);
  });
});
