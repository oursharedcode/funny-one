// SPDX-License-Identifier: AGPL-3.0-only

// Step 76: a QR code as SVG path data, one rectangle per run of dark modules
// along a row, in module units — so it scales to any size and stays crisp.
// The gift sheet draws its Lightning address with it when the sheet first
// opens (client/support.ts loads this module only then: the encoder is
// most of its weight). Step 78: the build draws the games' codes with it
// too (render/page.ts), so those cost the page nothing.

import QRCode from 'qrcode';

export interface QrPath {
  /** Modules per side, without the quiet zone around the code. */
  size: number;
  /** The dark modules: `M x y h w v1 h -w z` for each run. */
  d: string;
}

export function qrPath(text: string): QrPath {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const runs: string[] = [];
  for (let row = 0; row < modules.size; row += 1) {
    let col = 0;
    while (col < modules.size) {
      if (!modules.get(row, col)) {
        col += 1;
        continue;
      }
      const start = col;
      while (col < modules.size && modules.get(row, col)) col += 1;
      const width = col - start;
      runs.push(`M${start} ${row}h${width}v1h-${width}z`);
    }
  }
  return { size: modules.size, d: runs.join('') };
}
