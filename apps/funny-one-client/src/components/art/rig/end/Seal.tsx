// SPDX-License-Identifier: AGPL-3.0-only

// Shared stamp every `end` overlay draws on (T-FO-4.2c): an octagonal imprint —
// white field, heavy ink border, pink inner rule, a pink lozenge top and bottom
// — over a hard ink shadow. Deliberately not another cream shape: `when` is a
// card and `why` is a cloud, so the stamp needs its own silhouette. RigScene
// tilts it; the art itself is drawn square. Icons stay inside x 24–76 /
// y 24–76, corners cut (x + y >= 46 and so on) so nothing crosses the rule.

const OUTER = 'M22 10 h56 l12 12 v56 l-12 12 h-56 l-12 -12 v-56 z';
const INNER = 'M27 17 h46 l10 10 v46 l-10 10 h-46 l-10 -10 v-46 z';

export function Seal() {
  return (
    <>
      <path d={OUTER} fill="#1f2937" transform="translate(3 3)" />
      <path d={OUTER} fill="#fff" stroke="#1f2937" strokeWidth="3" strokeLinejoin="round" />
      <path d={INNER} fill="none" stroke="#ec4899" strokeWidth="2.5" strokeLinejoin="round" />
      <g fill="#ec4899" stroke="#1f2937" strokeWidth="1.2" strokeLinejoin="round">
        <path d="M50 10.5 l3 3 l-3 3 l-3 -3 z" />
        <path d="M50 83.5 l3 3 l-3 3 l-3 -3 z" />
      </g>
    </>
  );
}
