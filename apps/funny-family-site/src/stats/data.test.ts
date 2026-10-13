// SPDX-License-Identifier: AGPL-3.0-only
// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { daily, daysBetween, funnel, isSummary, rate, rowsOf, total, totalsBy } from './data.ts';
import type { Summary } from './data.ts';

// Keys as the server writes them: e|v|l|s|t|r|d.
const SUMMARY: Summary = {
  from: '2026-09-29',
  to: '2026-10-02',
  fields: ['v', 'l', 's', 't', 'r', 'd'],
  days: {
    '2026-09-29': {
      'hub_view|a|en|||direct|m': 3,
      'hub_view|b|ru|||search|d': 2,
      'hub_click|a|en||fm||': 1,
      'fm_view||en|direct|||': 5,
      'fm_view|a|en|hub|||': 1,
      'hub_view|a|de|||direct|m': 0,
      'hub_view|b|de|||direct|m': -2,
    },
    '2026-10-02': {
      'hub_view|a|en|||direct|m': 4,
      'fm_support|a|en|hub|||': 1,
    },
  },
};

describe('isSummary', () => {
  it('accepts the server’s answer and nothing else', () => {
    expect(isSummary(SUMMARY)).toBe(true);
    expect(isSummary({ from: '', to: '', fields: [], days: {} })).toBe(true);
    for (const value of [
      null,
      [],
      'x',
      { from: 1, to: '', fields: [], days: {} },
      { from: '', to: '', fields: {}, days: {} },
      { from: '', to: '', fields: [], days: null },
      { from: '', to: '', fields: [] },
    ]) {
      expect(isSummary(value)).toBe(false);
    }
  });
});

describe('rowsOf', () => {
  const rows = rowsOf(SUMMARY);

  it('reads every positive count, its labels by the summary’s fields', () => {
    expect(rows).toHaveLength(7);
    expect(rows[0]).toEqual({
      day: '2026-09-29',
      e: 'hub_view',
      v: 'a',
      l: 'en',
      s: '',
      t: '',
      r: 'direct',
      d: 'm',
      n: 3,
    });
    expect(rows.find((row) => row.e === 'fm_view' && row.s === 'hub')).toMatchObject({ v: 'a' });
  });

  it('follows the fields’ order, and skips a field it does not know', () => {
    const [row] = rowsOf({
      from: '2026-10-01',
      to: '2026-10-01',
      fields: ['l', 'x', 'v'],
      days: { '2026-10-01': { 'hub_view|ru|?|b': 2 } },
    });
    expect(row).toMatchObject({ e: 'hub_view', l: 'ru', v: 'b', n: 2 });
  });
});

describe('sums', () => {
  const rows = rowsOf(SUMMARY);

  it('total adds the rows that carry every label asked for', () => {
    expect(total(rows, { e: 'hub_view' })).toBe(9);
    expect(total(rows, { e: 'hub_view', v: 'a' })).toBe(7);
    expect(total(rows, { e: 'fm_view', s: 'hub', v: 'a' })).toBe(1);
    expect(total(rows, { e: 'fm_gift' })).toBe(0);
  });

  it('totalsBy splits by one label, largest first', () => {
    expect([...totalsBy(rows, { e: 'hub_view' }, 'r')]).toEqual([
      ['direct', 7],
      ['search', 2],
    ]);
  });

  it('daysBetween lists every UTC day, both ends included', () => {
    expect(daysBetween('2026-09-29', '2026-10-02')).toEqual([
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
    ]);
    expect(daysBetween('2026-10-02', '2026-10-02')).toEqual(['2026-10-02']);
    expect(daysBetween('2026-10-03', '2026-10-02')).toEqual([]);
  });

  it('daily puts a zero on a day with nothing', () => {
    const days = daysBetween(SUMMARY.from, SUMMARY.to);
    expect(daily(rows, { e: 'hub_view' }, days)).toEqual([5, 0, 0, 4]);
  });

  it('rate has no answer without a whole', () => {
    expect(rate(1, 4)).toBe(0.25);
    expect(rate(0, 0)).toBeNull();
  });

  it('funnel gives each step its share of the step before and of the first', () => {
    expect(
      funnel([
        { label: 'a', count: 10 },
        { label: 'b', count: 4 },
        { label: 'c', count: 0 },
        { label: 'd', count: 0 },
      ]),
    ).toEqual([
      { label: 'a', count: 10, ofPrevious: null, ofFirst: 1 },
      { label: 'b', count: 4, ofPrevious: 0.4, ofFirst: 0.4 },
      { label: 'c', count: 0, ofPrevious: 0, ofFirst: 0 },
      { label: 'd', count: 0, ofPrevious: null, ofFirst: 0 },
    ]);
    expect(funnel([{ label: 'a', count: 0 }])[0]?.ofFirst).toBeNull();
  });
});
