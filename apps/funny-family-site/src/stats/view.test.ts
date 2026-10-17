// SPDX-License-Identifier: AGPL-3.0-only

import { describe, expect, it } from 'vitest';
import type { Summary } from './data.ts';
import { periodText, renderStats } from './view.ts';

const NAMES = {
  en: 'English (United Kingdom)',
  ru: 'Русский (Россия)',
  de: 'Deutsch (Deutschland)',
};

const SUMMARY: Summary = {
  from: '2026-10-01',
  to: '2026-10-03',
  fields: ['v', 'l', 's', 't', 'r', 'd'],
  days: {
    '2026-10-01': {
      'hub_view|a|en|||direct|m': 6,
      'hub_view|b|ru|||search|d': 4,
      'hub_click|a|en||fm||': 3,
      'hub_click|b|ru||fo||': 1,
      'fm_view|a|en|hub|||': 2,
      'fm_view||ru|direct|||': 7,
      'fm_support|a|en|hub|||': 1,
      'fm_support||ru|direct|||': 2,
      'fm_gift|a|en|hub|payid||': 1,
    },
    '2026-10-03': { 'hub_view|a|en|||direct|m': 2 },
  },
};

function render(summary: Summary = SUMMARY): HTMLElement {
  const root = document.createElement('div');
  root.append(renderStats(summary, NAMES));
  return root;
}

/** A section's table, as rows of cell text. */
function tableOf(root: HTMLElement, heading: string, index = 0): string[][] {
  const section = [...root.querySelectorAll('section')].find(
    (candidate) => candidate.querySelector('h2')?.textContent === heading,
  );
  const table = section?.querySelectorAll('table')[index];
  return [...(table?.querySelectorAll('tbody tr') ?? [])].map((row) =>
    [...row.children].map((cell) => cell.textContent ?? ''),
  );
}

/** The country map's key, as the text of each entry. */
function legendOf(root: HTMLElement): string[] {
  return [...root.querySelectorAll('.map .legend li')].map((item) => item.textContent ?? '');
}

describe('periodText', () => {
  it('names the period and its length in days', () => {
    expect(periodText(SUMMARY)).toBe('1 Oct 2026 – 3 Oct 2026: 3 days, counted by UTC day.');
    expect(periodText({ ...SUMMARY, to: '2026-10-01' })).toBe(
      '1 Oct 2026 – 1 Oct 2026: 1 day, counted by UTC day.',
    );
  });
});

describe('renderStats', () => {
  it('puts the headline numbers first', () => {
    const tiles = [...render().querySelectorAll('.tile')].map((tile) => [
      tile.querySelector('.tile-label')?.textContent,
      tile.querySelector('.tile-value')?.textContent,
    ]);
    expect(tiles).toEqual([
      ['Landing-page visits', '12'],
      ['Went on to Funny Multi', '3'],
      ['Went on to Funny One', '1'],
      ['Funny Multi visits, all', '9'],
      ['Gift sheet opened, all', '3'],
      ['Gift option chosen, all', '1'],
    ]);
  });

  it('follows the landing page’s visits to the gift options', () => {
    const steps = [...render().querySelectorAll('.funnel li')].map((step) => [
      step.querySelector('.funnel-label')?.textContent,
      step.querySelector('.funnel-numbers')?.firstChild?.textContent,
      step.querySelector('small')?.textContent ?? null,
    ]);
    expect(steps).toEqual([
      ['Visited the landing page', '12', null],
      ['Clicked to play Funny Multi', '3', '25% of the step before · 25% of visits'],
      ['Opened Funny Multi', '2', '66.7% of the step before · 16.7% of visits'],
      ['Opened the gift sheet', '1', '50% of the step before · 8.3% of visits'],
      ['Chose a gift option', '1', '100% of the step before · 8.3% of visits'],
    ]);
  });

  it('compares the two designs', () => {
    const root = render();
    expect(tableOf(root, 'Design A against design B')).toEqual([
      ['A: trailer card', '8', '3', '37.5%', '2', '1', '1'],
      ['B: background video', '4', '0', '0%', '0', '0', '0'],
    ]);
    expect(root.querySelector('.verdict')?.textContent).toBe(
      'Too early to compare: each design needs at least 100 visits (A has 8, B has 4).',
    );
  });

  it('splits Funny Multi’s own visits by where they came from', () => {
    expect(tableOf(render(), 'Funny Multi, every visitor')).toEqual([
      ['Visits', '2', '7', '9'],
      ['Opened the gift sheet', '1', '2', '3'],
      ['Chose a gift option', '1', '0', '1'],
      ['Gift sheet opened, per visit', '50%', '28.6%', '33.3%'],
    ]);
    expect(tableOf(render(), 'Funny Multi, every visitor', 1)).toEqual([
      ['PayID', '1'],
      ['GitHub Sponsors', '0'],
      ['Lightning', '0'],
      ['Ko-fi', '0'],
      ['Buy Me a Coffee', '0'],
      ['Donation page', '0'],
    ]);
  });

  it('lists what was clicked on the landing page, its own ♥ and gift sheet too', () => {
    const root = render({
      ...SUMMARY,
      days: {
        '2026-10-01': {
          ...SUMMARY.days['2026-10-01'],
          'hub_click|a|en||support||': 2,
          'hub_click|b|ru||kofi||': 1,
        },
      },
    });
    expect(tableOf(root, 'What was clicked on the landing page')).toEqual([
      ['Funny Multi', '3', '30%'],
      ['Funny One', '1', '10%'],
      ['The source code (GitHub)', '0', '0%'],
      ['The trailer', '0', '0%'],
      ['oursharedcode.com', '0', '0%'],
      ['Support Author ♥: opened the gift sheet', '2', '20%'],
      ['Gift sheet: PayID copied', '0', '0%'],
      ['Gift sheet: GitHub Sponsors', '0', '0%'],
      ['Gift sheet: Lightning', '0', '0%'],
      ['Gift sheet: Ko-fi', '1', '10%'],
      ['Gift sheet: Buy Me a Coffee', '0', '0%'],
      ['Gift sheet: donation page', '0', '0%'],
    ]);
  });

  it('lists the languages with visits, busiest first, by their names', () => {
    const root = render();
    expect(tableOf(root, 'By language')).toEqual([
      ['English (United Kingdom)', '8', '3', '2', '1', '1'],
      ['Русский (Россия)', '4', '0', '7', '2', '0'],
    ]);
    expect([...root.querySelectorAll('img.flag')].map((flag) => flag.getAttribute('src'))).toEqual([
      '/flags/en.png',
      '/flags/ru.png',
    ]);
  });

  it('draws the days as lines, and gives their numbers in a table, newest first', () => {
    const root = render();
    expect(root.querySelectorAll('.chart svg[role="img"] polyline')).toHaveLength(3);
    expect(tableOf(root, 'Day by day')).toEqual([
      ['3 Oct 2026', '2', '0', '0'],
      ['2 Oct 2026', '0', '0', '0'],
      ['1 Oct 2026', '10', '9', '3'],
    ]);
  });

  it('shows where visits came from, and an empty period without failing', () => {
    expect(tableOf(render(), 'Where the landing page’s visits came from')).toEqual([
      ['Direct: typed, bookmarked or from an app', '8', '66.7%'],
      ['Search engines', '4', '33.3%'],
    ]);
    const empty = render({ ...SUMMARY, days: {} });
    expect(tableOf(empty, 'By language')).toEqual([['Nothing counted in this period.']]);
    expect(empty.querySelector('.tile-value')?.textContent).toBe('0');
  });

  it('shades each country on the map by its visits, and lists them', () => {
    const root = render({
      ...SUMMARY,
      countries: { hub_view: { AU: 5, LU: 2, ZZ: 1 }, fm_view: { AU: 3, RU: 1 } },
      countriesSince: '2026-09-01',
    });
    expect(tableOf(root, 'Visits by country')).toEqual([
      ['Australia', '8', '5', '3', '66.7%'],
      ['Luxembourg', '2', '2', '0', '16.7%'],
      ['Russia', '1', '0', '1', '8.3%'],
      ['Not known', '1', '1', '0', '8.3%'],
    ]);
    const place = (code: string, tag = 'path'): Element | null =>
      root.querySelector(`.map-land ${tag}[data-code="${code}"]`);
    // On a log scale: the busiest the darkest, one visit the lightest, two of
    // eight a third of the way.
    expect(place('AU')?.getAttribute('fill')).toBe('#831843');
    expect(place('RU')?.getAttribute('fill')).toBe('#f9a8d4');
    expect(place('LU')?.getAttribute('fill')).toBe('#e55296');
    expect(place('FR')?.getAttribute('fill')).toBe('#e5e7eb');
    expect(place('AU')?.textContent).toBe('Australia: 8 visits (landing page 5, Funny Multi 3)');
    expect(place('FR')?.textContent).toBe('France: no visits');
    // Luxembourg is too small to see, so it has a dot as well; only a country
    // with visits gets one.
    expect(
      [...root.querySelectorAll('.map-dot')].map((dot) => dot.getAttribute('data-code')),
    ).toEqual(['LU']);
    expect(place('LU', 'circle')?.getAttribute('fill')).toBe('#e55296');
    // The key's scale runs from 1 to the busiest country's 8.
    expect(legendOf(root)).toEqual(['No visits', '18 visits', 'Shaded on a log scale']);
    expect(root.querySelector('a[href="https://db-ip.com"]')?.textContent).toBe(
      'IP Geolocation by DB-IP',
    );
    expect(root.textContent).not.toContain('Countries are counted from');
  });

  it('says from when countries are counted, and draws no map before any was', () => {
    const later = render({
      ...SUMMARY,
      countries: { hub_view: { AU: 1 } },
      countriesSince: '2026-10-02',
    });
    expect(later.textContent).toContain(
      'Countries are counted from 2 Oct 2026: the visits before that day are missing here.',
    );
    expect(later.querySelector('.map-land path[data-code="AU"]')?.getAttribute('fill')).toBe(
      '#831843',
    );
    expect(legendOf(later)).toEqual(['No visits', '1 visit']);
    const quiet = render({ ...SUMMARY, countries: {}, countriesSince: '2026-09-01' });
    expect(tableOf(quiet, 'Visits by country')).toEqual([['Nothing counted in this period.']]);
    expect(quiet.querySelector('.map-land path:not([fill="#e5e7eb"])')).toBeNull();
    expect(legendOf(quiet)).toEqual(['No visits']);
    const before = render();
    expect(before.querySelector('.map')).toBeNull();
    expect(before.textContent).toContain('No visit’s country has been counted yet.');
  });

  it('never reads a label as markup', () => {
    const root = render({
      ...SUMMARY,
      days: { '2026-10-01': { 'hub_view|a|<img src=x onerror=alert(1)>|||direct|m': 1 } },
      countries: { hub_view: { '<img src=x onerror=alert(1)>': 1 } },
      countriesSince: '2026-10-01',
    });
    expect(root.querySelector('img[src="x"]')).toBeNull();
    expect(tableOf(root, 'By language')[0]?.[0]).toBe('<img src=x onerror=alert(1)>');
    expect(tableOf(root, 'Visits by country')[0]?.[0]).toBe('<img src=x onerror=alert(1)>');
  });
});
