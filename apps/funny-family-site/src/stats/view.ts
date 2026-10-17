// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: /stats/ drawn from one summary (data.ts): the headline numbers,
// the funnel from the landing page to Funny Multi's gift sheet, the A/B test
// of the page's two designs, the days, and where the visits came from. Built
// with DOM calls and text nodes only: nothing in the answer is ever parsed as
// HTML.

import { daily, daysBetween, funnel, rate, rowsOf, total, totalsBy } from './data.ts';
import type { FunnelStep, Match, Row, Summary } from './data.ts';
import { verdict } from './ztest.ts';

type Child = Node | string | null;

function h(tag: string, attrs: Record<string, string> = {}, ...children: Child[]): HTMLElement {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
  for (const child of children) if (child !== null) element.append(child);
  return element;
}

function svg(tag: string, attrs: Record<string, string | number>, text?: string): SVGElement {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, String(value));
  if (text !== undefined) element.textContent = text;
  return element;
}

const counts = new Intl.NumberFormat('en');
const percents = new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 1 });
const fullDate = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const shortDate = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

const num = (value: number): string => counts.format(value);
const pct = (value: number | null): string => (value === null ? '—' : percents.format(value));
const dateOf = (day: string): Date => new Date(`${day}T00:00:00Z`);

const REFERRERS: Record<string, string> = {
  direct: 'Direct: typed, bookmarked or from an app',
  search: 'Search engines',
  social: 'Social networks and messengers',
  oursharedcode: 'oursharedcode.com',
  games: 'The games',
  other: 'Other websites',
};
const DEVICES: Record<string, string> = { m: 'Phone-sized screen', d: 'Larger screen' };
// Step 76: the header's Support Author ♥ opens a gift sheet on the landing
// page itself; its rails count as the page's clicks too.
const HUB_TARGETS: Record<string, string> = {
  fm: 'Funny Multi',
  fo: 'Funny One',
  gh: 'The source code (GitHub)',
  video: 'The trailer',
  root: 'oursharedcode.com',
  support: 'Support Author ♥: opened the gift sheet',
  payid: 'Gift sheet: PayID copied',
  sponsors: 'Gift sheet: GitHub Sponsors',
  lightning: 'Gift sheet: Lightning',
  kofi: 'Gift sheet: Ko-fi',
  bmc: 'Gift sheet: Buy Me a Coffee',
  donate: 'Gift sheet: donation page',
};
const GIFT_RAILS: Record<string, string> = {
  payid: 'PayID',
  sponsors: 'GitHub Sponsors',
  lightning: 'Lightning',
  kofi: 'Ko-fi',
  bmc: 'Buy Me a Coffee',
  donate: 'Donation page',
};
const DESIGNS: Record<'a' | 'b', string> = { a: 'A: trailer card', b: 'B: background video' };

/** The period line above the numbers. */
export function periodText(summary: Summary): string {
  const days = daysBetween(summary.from, summary.to).length;
  return `${fullDate.format(dateOf(summary.from))} – ${fullDate.format(dateOf(summary.to))}: ${days} ${days === 1 ? 'day' : 'days'}, counted by UTC day.`;
}

function section(title: string, ...content: Child[]): HTMLElement {
  return h('section', {}, h('h2', {}, title), ...content);
}

function note(text: string): HTMLElement {
  return h('p', { class: 'stats-note' }, text);
}

function tiles(items: readonly (readonly [string, number])[]): HTMLElement {
  return h(
    'div',
    { class: 'tiles' },
    ...items.map(([label, value]) =>
      h(
        'div',
        { class: 'tile' },
        h('span', { class: 'tile-value' }, num(value)),
        h('span', { class: 'tile-label' }, label),
      ),
    ),
  );
}

function funnelList(steps: readonly FunnelStep[]): HTMLElement {
  const first = steps[0]?.count ?? 0;
  return h(
    'ol',
    { class: 'funnel' },
    ...steps.map((step, i) => {
      const width = first > 0 ? Math.min(100, (step.count / first) * 100) : 0;
      const bar = h('span', {
        style: `inline-size: ${width.toFixed(2)}%; min-inline-size: ${step.count > 0 ? 3 : 0}px`,
      });
      const share =
        i === 0
          ? null
          : h(
              'small',
              {},
              `${pct(step.ofPrevious)} of the step before · ${pct(step.ofFirst)} of visits`,
            );
      return h(
        'li',
        {},
        h('span', { class: 'funnel-label' }, step.label),
        h('span', { class: 'funnel-bar', 'aria-hidden': 'true' }, bar),
        h('span', { class: 'funnel-numbers' }, num(step.count), share ? h('br') : null, share),
      );
    }),
  );
}

/** A table whose first cell in each row heads it. */
function table(
  head: readonly string[],
  body: readonly (readonly Child[])[],
  caption = '',
): HTMLElement {
  const rows = body.length
    ? body.map((cells) =>
        h(
          'tr',
          {},
          ...cells.map((cell, i) =>
            i === 0 ? h('th', { scope: 'row' }, cell) : h('td', {}, cell),
          ),
        ),
      )
    : [h('tr', {}, h('td', { colspan: String(head.length) }, 'Nothing counted in this period.'))];
  return h(
    'div',
    { class: 'table-wrap' },
    h(
      'table',
      {},
      caption ? h('caption', {}, caption) : null,
      h('thead', {}, h('tr', {}, ...head.map((text) => h('th', { scope: 'col' }, text)))),
      h('tbody', {}, ...rows),
    ),
  );
}

/** Each value's count and its share of them all. */
function shareTable(
  head: readonly [string, string, string],
  sums: Map<string, number>,
  labels: Record<string, string>,
): HTMLElement {
  const whole = [...sums.values()].reduce((sum, value) => sum + value, 0);
  return table(
    head,
    [...sums].map(([key, value]) => [labels[key] ?? key, num(value), pct(rate(value, whole))]),
  );
}

interface Line {
  label: string;
  color: string;
  dash: string;
  values: number[];
}

/** The smallest of 1, 2, 4, 6, 8 (times a power of ten) at or above `value`: a whole half. */
function niceCeiling(value: number): number {
  const power = 10 ** Math.floor(Math.log10(Math.max(2, value)));
  for (const step of [1, 2, 4, 6, 8, 10]) if (step * power >= value) return step * power;
  return 10 * power;
}

function swatch(line: Line): SVGElement {
  const icon = svg('svg', { width: 28, height: 10, viewBox: '0 0 28 10', 'aria-hidden': 'true' });
  icon.append(
    svg('line', {
      x1: 1,
      y1: 5,
      x2: 27,
      y2: 5,
      stroke: line.color,
      'stroke-width': 3,
      'stroke-dasharray': line.dash,
      'stroke-linecap': 'round',
    }),
  );
  return icon;
}

function chart(days: readonly string[], lines: readonly Line[]): HTMLElement {
  const width = 720;
  const height = 260;
  const left = 52;
  const right = 18;
  const top = 14;
  const bottom = 30;
  const max = niceCeiling(Math.max(2, ...lines.flatMap((line) => line.values)));
  const x = (i: number): number =>
    left + (width - left - right) * (days.length > 1 ? i / (days.length - 1) : 0.5);
  const y = (value: number): number => top + (height - top - bottom) * (1 - value / max);

  const graph = svg('svg', {
    viewBox: `0 0 ${width} ${height}`,
    role: 'img',
    'aria-label': 'Daily counts as lines; the numbers by day are in the table below the chart.',
  });
  for (const value of [0, max / 2, max]) {
    graph.append(
      svg('line', { x1: left, x2: width - right, y1: y(value), y2: y(value), stroke: '#e5e7eb' }),
      svg(
        'text',
        { x: left - 8, y: y(value) + 4, 'text-anchor': 'end', 'font-size': 12, fill: '#4b5563' },
        num(value),
      ),
    );
  }
  const ticks = days.length > 2 ? [0, Math.floor((days.length - 1) / 2), days.length - 1] : [0];
  if (days.length === 2) ticks.push(1);
  for (const i of ticks) {
    const day = days[i];
    if (day === undefined) continue;
    const anchor =
      days.length === 1 ? 'middle' : i === 0 ? 'start' : i === days.length - 1 ? 'end' : 'middle';
    graph.append(
      svg(
        'text',
        { x: x(i), y: height - 8, 'text-anchor': anchor, 'font-size': 12, fill: '#4b5563' },
        shortDate.format(dateOf(day)),
      ),
    );
  }
  for (const line of lines) {
    const points = line.values.map((value, i) => `${x(i).toFixed(1)},${y(value).toFixed(1)}`);
    graph.append(
      svg('polyline', {
        points: points.join(' '),
        fill: 'none',
        stroke: line.color,
        'stroke-width': 2.5,
        'stroke-dasharray': line.dash,
        'stroke-linejoin': 'round',
        'stroke-linecap': 'round',
      }),
    );
    if (days.length <= 45) {
      line.values.forEach((value, i) => {
        graph.append(svg('circle', { cx: x(i), cy: y(value), r: 2.75, fill: line.color }));
      });
    }
  }

  const byDay = days
    .map((day, i) => [
      fullDate.format(dateOf(day)),
      ...lines.map((line) => num(line.values[i] ?? 0)),
    ])
    .reverse();
  return h(
    'div',
    { class: 'chart' },
    graph,
    h('ul', { class: 'legend' }, ...lines.map((line) => h('li', {}, swatch(line), line.label))),
    h(
      'details',
      { class: 'by-day' },
      h('summary', {}, 'The numbers by day'),
      table(['Day', ...lines.map((line) => line.label)], byDay),
    ),
  );
}

function languageTable(rows: readonly Row[], names: Record<string, string>): HTMLElement {
  const columns: readonly Match[] = [
    { e: 'hub_view' },
    { e: 'hub_click', t: 'fm' },
    { e: 'fm_view' },
    { e: 'fm_support' },
    { e: 'fm_gift' },
  ];
  const codes = [...new Set([...Object.keys(names), ...rows.map((row) => row.l)])].filter(Boolean);
  const body = codes
    .map((code) => ({ code, sums: columns.map((match) => total(rows, { ...match, l: code })) }))
    .filter(({ sums }) => sums.some((value) => value > 0))
    .sort((a, b) => (b.sums[0] ?? 0) - (a.sums[0] ?? 0) || (b.sums[2] ?? 0) - (a.sums[2] ?? 0))
    .map(({ code, sums }) => {
      // A flag and a name only for the languages the page knows; any other
      // code (the server allows none) shows as it is.
      const name = Object.hasOwn(names, code) ? names[code] : undefined;
      const flag = name
        ? h('img', { class: 'flag', src: `/flags/${code}.png`, alt: '', width: '18', height: '18' })
        : null;
      return [h('span', {}, flag, name ?? code), ...sums.map(num)];
    });
  return table(
    [
      'Language',
      'Landing-page visits',
      'Clicks to Funny Multi',
      'Funny Multi visits',
      'Gift sheet opened',
      'Gift option chosen',
    ],
    body,
    'Funny Multi columns count all its visitors, not only those from the landing page.',
  );
}

/** The whole page below the period buttons. */
export function renderStats(summary: Summary, names: Record<string, string>): DocumentFragment {
  const rows = rowsOf(summary);
  const days = daysBetween(summary.from, summary.to);
  const views = total(rows, { e: 'hub_view' });
  const fragment = document.createDocumentFragment();

  fragment.append(
    tiles([
      ['Landing-page visits', views],
      ['Went on to Funny Multi', total(rows, { e: 'hub_click', t: 'fm' })],
      ['Went on to Funny One', total(rows, { e: 'hub_click', t: 'fo' })],
      ['Funny Multi visits, all', total(rows, { e: 'fm_view' })],
      ['Gift sheet opened, all', total(rows, { e: 'fm_support' })],
      ['Gift option chosen, all', total(rows, { e: 'fm_gift' })],
    ]),
  );

  fragment.append(
    section(
      'From the landing page to the gift sheet',
      funnelList(
        funnel([
          { label: 'Visited the landing page', count: views },
          { label: 'Clicked to play Funny Multi', count: total(rows, { e: 'hub_click', t: 'fm' }) },
          { label: 'Opened Funny Multi', count: total(rows, { e: 'fm_view', s: 'hub' }) },
          { label: 'Opened the gift sheet', count: total(rows, { e: 'fm_support', s: 'hub' }) },
          { label: 'Chose a gift option', count: total(rows, { e: 'fm_gift', s: 'hub' }) },
        ]),
      ),
      note(
        'Each step counts browser tabs that reached it. Between a click and an opened game some are lost: a tab closed while loading, or a browser that counts on one site and not the other. And a phone that scans one of the page’s QR codes opens the game without a click, so opened games can outnumber clicks.',
      ),
    ),
  );

  const sources = [
    ['From the landing page', { s: 'hub' }],
    ['From elsewhere', { s: 'direct' }],
    ['All', {}],
  ] as const;
  const fmRow = (label: string, e: string): Child[] => [
    label,
    ...sources.map(([, match]) => num(total(rows, { e, ...match }))),
  ];
  const fmRate = (label: string, part: string, whole: string): Child[] => [
    label,
    ...sources.map(([, match]) =>
      pct(rate(total(rows, { e: part, ...match }), total(rows, { e: whole, ...match }))),
    ),
  ];
  fragment.append(
    section(
      'Funny Multi, every visitor',
      table(
        ['', ...sources.map(([label]) => label)],
        [
          fmRow('Visits', 'fm_view'),
          fmRow('Opened the gift sheet', 'fm_support'),
          fmRow('Chose a gift option', 'fm_gift'),
          fmRate('Gift sheet opened, per visit', 'fm_support', 'fm_view'),
        ],
      ),
      h('h3', {}, 'The gift option chosen first'),
      table(
        ['Option', 'Chosen first'],
        Object.entries(GIFT_RAILS).map(([key, label]) => [
          label,
          num(total(rows, { e: 'fm_gift', t: key })),
        ]),
      ),
    ),
  );

  const arms = (['a', 'b'] as const).map((v) => ({
    v,
    visits: total(rows, { e: 'hub_view', v }),
    clicks: total(rows, { e: 'hub_click', t: 'fm', v }),
    opened: total(rows, { e: 'fm_view', s: 'hub', v }),
    sheet: total(rows, { e: 'fm_support', s: 'hub', v }),
    gifts: total(rows, { e: 'fm_gift', s: 'hub', v }),
  }));
  const [armA, armB] = arms;
  fragment.append(
    section(
      'Design A against design B',
      table(
        [
          'Design',
          'Visits',
          'Clicks to Funny Multi',
          'Click rate',
          'Opened Funny Multi',
          'Opened the gift sheet',
          'Chose a gift option',
        ],
        arms.map((arm) => [
          DESIGNS[arm.v],
          num(arm.visits),
          num(arm.clicks),
          pct(rate(arm.clicks, arm.visits)),
          num(arm.opened),
          num(arm.sheet),
          num(arm.gifts),
        ]),
      ),
      armA && armB ? h('p', { class: 'verdict' }, verdict(armA, armB)) : null,
      note(
        'Each new tab is shown one design at random and keeps it. Add ?v=a or ?v=b to the page address to see one on purpose.',
      ),
    ),
  );

  fragment.append(
    section(
      'Day by day',
      chart(days, [
        {
          label: 'Landing-page visits',
          color: '#db2777',
          dash: 'none',
          values: daily(rows, { e: 'hub_view' }, days),
        },
        {
          label: 'Funny Multi visits, all',
          color: '#0284c7',
          dash: '7 5',
          values: daily(rows, { e: 'fm_view' }, days),
        },
        {
          label: 'Gift sheet opened, all',
          color: '#b45309',
          dash: '2 4',
          values: daily(rows, { e: 'fm_support' }, days),
        },
      ]),
    ),
  );

  fragment.append(
    section(
      'Where the landing page’s visits came from',
      h(
        'div',
        { class: 'split' },
        shareTable(
          ['Came from', 'Visits', 'Share'],
          totalsBy(rows, { e: 'hub_view' }, 'r'),
          REFERRERS,
        ),
        shareTable(['Screen', 'Visits', 'Share'], totalsBy(rows, { e: 'hub_view' }, 'd'), DEVICES),
      ),
      note('Only the kind of site is kept, never its address.'),
    ),
  );

  fragment.append(section('By language', languageTable(rows, names)));

  fragment.append(
    section(
      'What was clicked on the landing page',
      table(
        ['Link', 'Clicks', 'Per visit'],
        Object.entries(HUB_TARGETS).map(([key, label]) => {
          const clicks = total(rows, { e: 'hub_click', t: key });
          return [label, num(clicks), pct(rate(clicks, views))];
        }),
      ),
    ),
  );

  fragment.append(
    section(
      'How the counting works',
      h(
        'ul',
        { class: 'stats-notes' },
        h(
          'li',
          {},
          'Views, not people: a browser tab counts once, so a reload is not a new visit and a new tab is.',
        ),
        h(
          'li',
          {},
          'Funny Multi counts each moment at most once per page load, gifts too: only the first gift option chosen counts, so no step can pass the one before it.',
        ),
        h(
          'li',
          {},
          'Nothing is counted from browsers that send Do Not Track or Global Privacy Control, from crawlers, or from Funny Multi’s Android app.',
        ),
        h(
          'li',
          {},
          'What is kept is a number per day for each combination of a few labels: no cookies, no IP addresses, no identifiers. Days older than 400 are dropped.',
        ),
      ),
    ),
  );
  return fragment;
}
