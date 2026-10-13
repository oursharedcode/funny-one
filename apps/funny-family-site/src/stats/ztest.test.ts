// SPDX-License-Identifier: AGPL-3.0-only
// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { erf, normalCdf, twoProportionZTest, verdict } from './ztest.ts';

describe('the normal distribution', () => {
  it('erf and the CDF agree with the tables', () => {
    expect(erf(0)).toBeCloseTo(0, 7);
    expect(erf(1)).toBeCloseTo(0.8427008, 6);
    expect(erf(-1)).toBeCloseTo(-0.8427008, 6);
    expect(normalCdf(0)).toBeCloseTo(0.5, 7);
    expect(normalCdf(1.959964)).toBeCloseTo(0.975, 6);
    expect(normalCdf(-1.959964)).toBeCloseTo(0.025, 6);
  });
});

describe('twoProportionZTest', () => {
  it('finds 13% against 10% of a thousand each significant at 5%', () => {
    const test = twoProportionZTest(100, 1000, 130, 1000);
    expect(test?.z).toBeCloseTo(2.1027, 3);
    expect(test?.p).toBeCloseTo(0.0355, 3);
  });

  it('is symmetric, with the sign telling which is higher', () => {
    const forward = twoProportionZTest(100, 1000, 130, 1000);
    const back = twoProportionZTest(130, 1000, 100, 1000);
    expect(back?.z).toBeCloseTo(-(forward?.z ?? 0), 10);
    expect(back?.p).toBeCloseTo(forward?.p ?? 0, 10);
  });

  it('gives p = 1 for equal rates', () => {
    const test = twoProportionZTest(50, 500, 50, 500);
    expect(test?.z).toBe(0);
    expect(test?.p).toBeCloseTo(1, 6);
  });

  it('has no answer for counts that cannot be compared', () => {
    expect(twoProportionZTest(0, 0, 1, 10)).toBeNull();
    expect(twoProportionZTest(11, 10, 1, 10)).toBeNull();
    expect(twoProportionZTest(-1, 10, 1, 10)).toBeNull();
    expect(twoProportionZTest(0, 10, 0, 10)).toBeNull();
    expect(twoProportionZTest(10, 10, 10, 10)).toBeNull();
  });
});

describe('verdict', () => {
  it('waits for 100 visits to each design', () => {
    expect(verdict({ visits: 99, clicks: 10 }, { visits: 500, clicks: 90 })).toBe(
      'Too early to compare: each design needs at least 100 visits (A has 99, B has 500).',
    );
  });

  it('names the design that wins, when the gap is unlikely to be chance', () => {
    expect(verdict({ visits: 1000, clicks: 100 }, { visits: 1000, clicks: 130 })).toBe(
      'Design B gets more clicks to Funny Multi, and the gap is unlikely to be chance (z = 2.10, p = 0.035, under the usual 0.05).',
    );
    expect(verdict({ visits: 1000, clicks: 200 }, { visits: 1000, clicks: 100 })).toMatch(
      /^Design A gets more clicks to Funny Multi, .*\(z = -6\.\d\d, p < 0\.001, under/,
    );
  });

  it('says so when the gap may still be chance', () => {
    expect(verdict({ visits: 200, clicks: 20 }, { visits: 200, clicks: 24 })).toMatch(
      /^No clear difference yet \(z = 0\.\d\d, p = 0\.\d{3}\): the gap may still be chance\.$/,
    );
  });

  it('says why when there is nothing to test', () => {
    expect(verdict({ visits: 100, clicks: 0 }, { visits: 100, clicks: 0 })).toBe(
      'Nothing to compare yet: no visit to either design went on to Funny Multi.',
    );
    expect(verdict({ visits: 100, clicks: 100 }, { visits: 120, clicks: 120 })).toBe(
      'Nothing to compare: every visit to both designs went on to Funny Multi.',
    );
    expect(verdict({ visits: 100, clicks: 101 }, { visits: 100, clicks: 5 })).toBe(
      'No comparison possible: the click counts do not fit the visit counts.',
    );
  });
});
