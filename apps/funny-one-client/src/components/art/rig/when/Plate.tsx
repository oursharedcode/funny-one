// SPDX-License-Identifier: AGPL-3.0-only

// The sticker plate every `when` badge sits on (T-FO-4.2a, RIG_ART.md "when"): a hard ink
// shadow under a wobbly cream card, so all 22 badges read as one set over any background.
// Renders SVG children only — use inside an asset's own <svg>.

export function Plate() {
  return (
    <>
      <path d="M12 14 q40 -3 80 1 q3 36 -1 74 q-40 3 -80 -1 q-3 -36 1 -74 z" fill="#1f2937" />
      <path
        d="M8 10 q40 -3 80 1 q3 36 -1 74 q-40 3 -80 -1 q-3 -36 1 -74 z"
        fill="#fef3c7"
        stroke="#1f2937"
        strokeWidth="2.5"
      />
    </>
  );
}
