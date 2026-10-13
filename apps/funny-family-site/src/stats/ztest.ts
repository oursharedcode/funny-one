// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: is design B's click rate really different from design A's, or is
// the gap chance? The two-proportion z-test, pooled, two-sided — the usual
// test for an A/B split of a yes/no outcome — and a sentence saying what it
// found.

/** Abramowitz & Stegun 7.1.26: erf to within 1.5e-7, plenty for a p-value. */
export function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const poly =
    t *
    (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  return sign * (1 - poly * Math.exp(-a * a));
}

/** The standard normal distribution's CDF. */
export function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

export interface ZTest {
  /** Positive when the second proportion is the higher. */
  z: number;
  /** Two-sided. */
  p: number;
}

/**
 * x1 of n1 against x2 of n2. Null when there is nothing to compare: an empty
 * group, a count above its total, or no variation at all (every one or none
 * a yes in both groups).
 */
export function twoProportionZTest(x1: number, n1: number, x2: number, n2: number): ZTest | null {
  if (n1 <= 0 || n2 <= 0 || x1 < 0 || x2 < 0 || x1 > n1 || x2 > n2) return null;
  const pooled = (x1 + x2) / (n1 + n2);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2));
  if (!(se > 0)) return null;
  const z = (x2 / n2 - x1 / n1) / se;
  return { z, p: Math.min(1, 2 * (1 - normalCdf(Math.abs(z)))) };
}

/** Fewer visits than this to either design and no verdict is given. */
export const MIN_VISITS = 100;

export interface Arm {
  visits: number;
  clicks: number;
}

/** What the test says about the two designs' click rates, in a sentence. */
export function verdict(a: Arm, b: Arm): string {
  if (Math.min(a.visits, b.visits) < MIN_VISITS) {
    return `Too early to compare: each design needs at least ${MIN_VISITS} visits (A has ${a.visits}, B has ${b.visits}).`;
  }
  if (a.clicks < 0 || b.clicks < 0 || a.clicks > a.visits || b.clicks > b.visits) {
    return 'No comparison possible: the click counts do not fit the visit counts.';
  }
  const test = twoProportionZTest(a.clicks, a.visits, b.clicks, b.visits);
  if (!test) {
    // Valid counts with no variation at all: none clicked, or every one did.
    return a.clicks === 0
      ? 'Nothing to compare yet: no visit to either design went on to Funny Multi.'
      : 'Nothing to compare: every visit to both designs went on to Funny Multi.';
  }
  const numbers = `z = ${test.z.toFixed(2)}, ${test.p < 0.001 ? 'p < 0.001' : `p = ${test.p.toFixed(3)}`}`;
  if (test.p >= 0.05) {
    return `No clear difference yet (${numbers}): the gap may still be chance.`;
  }
  const better = test.z > 0 ? 'B' : 'A';
  return `Design ${better} gets more clicks to Funny Multi, and the gap is unlikely to be chance (${numbers}, under the usual 0.05).`;
}
