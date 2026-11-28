// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: /stats/ drawn from one summary (data.ts): the headline numbers,
// the funnel from the landing page to Funny Multi's gift sheet, the A/B test
// of the page's two designs, the days, and where the visits came from — by
// Step 79 their countries too, on a map of the page's own (worldMap.ts).
// Step 119: the Christmas 2026 edition's two buttons on the landing page go
// to Funny Multi too, so they count among its clicks, and /x26 among the
// referrers. Step 123: the edition's paying half — its pay card, its pay page
// by the door it was opened from, and the pay button by the way to pay.
// Built with DOM calls and text nodes only: nothing in the answer is ever
// parsed as HTML.

import {
  countryRows,
  daily,
  daysBetween,
  funnel,
  NOT_KNOWN,
  rate,
  rowsOf,
  total,
  totalsBy,
} from './data.ts';
import type { CountryRow, FunnelStep, Match, Row, Summary } from './data.ts';
import { DOTS, MAP_HEIGHT, MAP_WIDTH, OUTLINE, SHAPES } from './worldMap.ts';
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
  xmas: 'The /x26 address: a Christmas story’s QR code',
};
const DEVICES: Record<string, string> = { m: 'Phone-sized screen', d: 'Larger screen' };
// Step 76: the header's Support Author ♥ opens a gift sheet on the landing
// page itself; its rails count as the page's clicks too. Step 110: each
// game's card also has a Google Play badge.
const HUB_TARGETS: Record<string, string> = {
  fm: 'Funny Multi',
  'xm-top': 'Funny Multi: the Christmas button at the top',
  'xm-foot': 'Funny Multi: the Christmas button at the foot',
  fo: 'Funny One',
  'fm-gp': 'Funny Multi on Google Play',
  'fo-gp': 'Funny One on Google Play',
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

// The landing page's links to Funny Multi: its own, and from Step 119 the
// Christmas edition's two buttons, which lead to the same game.
const FM_LINKS = ['fm', 'xm-top', 'xm-foot'] as const;
const XMAS_BUTTONS = ['xm-top', 'xm-foot'] as const;

function clicksOn(rows: readonly Row[], targets: readonly string[], match: Match = {}): number {
  return targets.reduce((sum, t) => sum + total(rows, { ...match, e: 'hub_click', t }), 0);
}

/** The landing page's clicks on to Funny Multi, by any of its links. */
function fmClicks(rows: readonly Row[], match: Match = {}): number {
  return clicksOn(rows, FM_LINKS, match);
}

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

// Step 79: the map's shades, from one visit to the busiest country's, and the
// grey of a country with none.
const SHADES = ['#f9a8d4', '#db2777', '#831843'] as const;
const NO_VISITS = '#e5e7eb';
const regions =
  typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

/** A country's English name, or its code where the browser has none. */
function countryName(code: string): string {
  if (code === NOT_KNOWN) return 'Not known';
  if (!/^[A-Z]{2}$/.test(code)) return code;
  try {
    return regions?.of(code) ?? code;
  } catch {
    return code;
  }
}

/** The colour `t` of the way from one #rrggbb to another. */
function mix(from: string, to: string, t: number): string {
  let color = '#';
  for (let i = 1; i < 7; i += 2) {
    const a = parseInt(from.slice(i, i + 2), 16);
    const b = parseInt(to.slice(i, i + 2), 16);
    color += Math.round(a + (b - a) * t)
      .toString(16)
      .padStart(2, '0');
  }
  return color;
}

/** The shade of `count` visits when the busiest country has `max`: on a log scale, so a few still show. */
function shade(count: number, max: number): string {
  const t = max > 1 ? Math.min(1, Math.log(count) / Math.log(max)) : 1;
  return t < 0.5 ? mix(SHADES[0], SHADES[1], t * 2) : mix(SHADES[1], SHADES[2], t * 2 - 1);
}

function worldMap(rows: readonly CountryRow[]): HTMLElement {
  const visits = new Map(rows.map((row) => [row.code, row]));
  const max = Math.max(0, ...rows.filter((row) => row.code !== NOT_KNOWN).map((row) => row.all));
  const place = (tag: string, code: string, attrs: Record<string, string | number>): SVGElement => {
    const row = visits.get(code);
    const element = svg(tag, {
      ...attrs,
      'data-code': code,
      fill: row ? shade(row.all, max) : NO_VISITS,
    });
    element.append(
      svg(
        'title',
        {},
        row
          ? `${countryName(code)}: ${num(row.all)} ${row.all === 1 ? 'visit' : 'visits'} (landing page ${num(row.hub)}, Funny Multi ${num(row.fm)})`
          : `${countryName(code)}: no visits`,
      ),
    );
    return element;
  };

  const map = svg('svg', {
    viewBox: `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`,
    role: 'img',
    'aria-label':
      'A world map, each country shaded by its visits; the numbers are in the table below the map.',
  });
  const land = svg('g', { class: 'map-land' });
  for (const [code, d] of Object.entries(SHAPES)) land.append(place('path', code, { d }));
  // A country too small to see gets a dot as well, if it has visits.
  for (const [code, [cx, cy]] of Object.entries(DOTS)) {
    if (visits.has(code)) land.append(place('circle', code, { class: 'map-dot', cx, cy, r: 5 }));
  }
  map.append(svg('path', { class: 'map-sea', d: OUTLINE }), land);

  const key = (color: string): HTMLElement =>
    h('span', { class: 'map-key', style: `background: ${color}` });
  return h(
    'div',
    { class: 'chart map' },
    map,
    h(
      'ul',
      { class: 'legend' },
      h('li', {}, key(NO_VISITS), 'No visits'),
      max > 1
        ? h(
            'li',
            {},
            '1',
            h('span', {
              class: 'map-scale',
              style: `background: linear-gradient(90deg, ${SHADES.join(', ')})`,
            }),
            `${num(max)} visits`,
          )
        : null,
      max > 1 ? h('li', {}, 'Shaded on a log scale') : null,
      max === 1 ? h('li', {}, key(shade(1, 1)), '1 visit') : null,
    ),
  );
}

function countrySection(summary: Summary): HTMLElement {
  const title = 'Visits by country';
  const since = typeof summary.countriesSince === 'string' ? summary.countriesSince : null;
  if (since === null) return section(title, note('No visit’s country has been counted yet.'));
  const rows = countryRows(summary);
  const whole = rows.reduce((sum, row) => sum + row.all, 0);
  return section(
    title,
    worldMap(rows),
    h(
      'div',
      { class: 'countries' },
      table(
        ['Country', 'Visits, both sites', 'Landing page', 'Funny Multi', 'Share'],
        rows.map((row) => [
          countryName(row.code),
          num(row.all),
          num(row.hub),
          num(row.fm),
          pct(rate(row.all, whole)),
        ]),
      ),
    ),
    since > summary.from
      ? note(
          `Countries are counted from ${fullDate.format(dateOf(since))}: the visits before that day are missing here.`,
        )
      : null,
    note(
      'Each site counts its own visits, so a tab that goes from the landing page on to Funny Multi counts once on each. “Not known” is a visit from an address the database does not place.',
    ),
    h(
      'p',
      { class: 'stats-note' },
      'Our own server finds the country in a copy of DB-IP’s free database and keeps only the country, never the address. ',
      h('a', { href: 'https://db-ip.com' }, 'IP Geolocation by DB-IP'),
      ' (CC BY 4.0). Map: ',
      h('a', { href: 'https://www.naturalearthdata.com/' }, 'Natural Earth'),
      '.',
    ),
  );
}

function languageTable(rows: readonly Row[], names: Record<string, string>): HTMLElement {
  const columns: readonly ((l: string) => number)[] = [
    (l) => total(rows, { e: 'hub_view', l }),
    (l) => fmClicks(rows, { l }),
    (l) => total(rows, { e: 'fm_view', l }),
    (l) => total(rows, { e: 'fm_support', l }),
    (l) => total(rows, { e: 'fm_gift', l }),
  ];
  const codes = [...new Set([...Object.keys(names), ...rows.map((row) => row.l)])].filter(Boolean);
  const body = codes
    .map((code) => ({ code, sums: columns.map((column) => column(code)) }))
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
    'Funny Multi columns count all its visitors: from the landing page, from elsewhere and in its Android app.',
  );
}

// Step 117 (B-29, D2 A): the Christmas 2026 edition's funnel, per language.
// Website only, like every count but a visit: the Android app sends neither.
// Step 119: the landing page's part of it first, visits sent by /x26 and
// clicks on the edition's two buttons. Step 123: a second table for the
// paying half — the pay card, the pay page by its door, the pay button by
// its rail.
type Column = (match: Match) => number;

/**
 * A table's rows, one per language that has any of the columns' counts, under
 * a row of totals; the languages in the order of `order`, the columns to
 * compare by, first to last.
 */
function byLanguage(
  rows: readonly Row[],
  names: Record<string, string>,
  columns: readonly Column[],
  order: readonly number[],
): Child[][] {
  const sumsFor = (match: Match): number[] => columns.map((column) => column(match));
  const codes = [...new Set([...Object.keys(names), ...rows.map((row) => row.l)])].filter(Boolean);
  const body = codes
    .map((code) => ({ code, sums: sumsFor({ l: code }) }))
    .filter(({ sums }) => sums.some((value) => value > 0))
    .sort((a, b) => {
      for (const column of order) {
        const difference = (b.sums[column] ?? 0) - (a.sums[column] ?? 0);
        if (difference) return difference;
      }
      return 0;
    })
    .map(({ code, sums }): Child[] => [
      Object.hasOwn(names, code) ? (names[code] ?? code) : code,
      ...sums.map(num),
    ]);
  return [['All', ...sumsFor({}).map(num)], ...body];
}

function christmasSection(rows: readonly Row[], names: Record<string, string>): HTMLElement {
  const playing: readonly Column[] = [
    (match) => total(rows, { ...match, e: 'hub_view', r: 'xmas' }),
    (match) => clicksOn(rows, XMAS_BUTTONS, match),
    (match) => total(rows, { ...match, e: 'xm_game', t: 'on' }),
    (match) => total(rows, { ...match, e: 'xm_game', t: 'off' }),
    (match) => total(rows, { ...match, e: 'xm_bots' }),
    (match) => total(rows, { ...match, e: 'xm_gold' }),
  ];
  const paying: readonly Column[] = [
    (match) => total(rows, { ...match, e: 'xm_card' }),
    (match) => total(rows, { ...match, e: 'xm_page', t: 'card' }),
    (match) => total(rows, { ...match, e: 'xm_page', t: 'link' }),
    (match) => total(rows, { ...match, e: 'xm_pay', t: 'payid' }),
    (match) => total(rows, { ...match, e: 'xm_pay', t: 'sponsors' }),
    (match) => total(rows, { ...match, e: 'xm_giftpay' }),
  ];
  return section(
    'The Christmas 2026 edition',
    table(
      [
        'Language',
        'Landing visits from /x26',
        'Christmas buttons clicked',
        'Games with the Christmas stories',
        'Games with them switched off',
        'Of all those games, with bots',
        'Christmas cartoon seen',
      ],
      byLanguage(rows, names, playing, [2, 1, 5]),
    ),
    note(
      'Website only. Each player’s tab counts a game once, when its first round starts, with the host’s switch as it stood then; and a golden story’s cartoon once, in the reveal or the gallery. The language is the one each player’s screen is in. “With bots” counts those games, on or off, that had fewer than three players, bots taking the empty seats.',
    ),
    note(
      'The first two columns are the landing page’s: a visit sent there by the /x26 address (the QR code on a golden story’s download), and a click on one of the edition’s two buttons, in the page’s language. The buttons lead to Funny Multi, so their clicks count among its clicks above and below too. Once the pay page is live, /x26 leads to it and no longer to the landing page: its visits are then in the table below.',
    ),
    h('h3', {}, 'Paying for it'),
    table(
      [
        'Language',
        'Pay card shown',
        'Pay page opened from the card',
        'Pay page opened from /x26',
        'Pay pressed: PayID',
        'Pay pressed: GitHub Sponsors',
        'Gift pay pressed',
      ],
      byLanguage(rows, names, paying, [0, 2, 1]),
    ),
    note(
      'Website only. Each tab counts the pay card once, shown on the end screen after a free Christmas game; the pay page once, by the door it was first opened from, the card’s button or the /x26 address; and the first press of its pay button, by the way to pay. “Gift pay pressed” is the same button when the pack is bought for a friend (PayID only), and is not in the PayID column. A press is not a payment: payments are in the receipt log, not here.',
    ),
  );
}

// Step 135: the videos of a whole game, a Christmas game's and the rest apart.
function videoSection(rows: readonly Row[], names: Record<string, string>): HTMLElement {
  const columns: readonly Column[] = [
    (match) => total(rows, { ...match, e: 'fm_video', t: 'xm' }),
    (match) => total(rows, { ...match, e: 'fm_video', t: 'base' }),
  ];
  return section(
    'Videos of the whole game',
    table(
      ['Language', 'Of a Christmas game', 'Of an ordinary game'],
      byLanguage(rows, names, columns, [0, 1]),
    ),
    note(
      'Website only. Each tab counts the first whole-game video it makes, once the video is ready, whether or not it is then saved or shared. The language is the one the player’s screen is in.',
    ),
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
      ['Went on to Funny Multi', fmClicks(rows)],
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
          { label: 'Clicked to play Funny Multi', count: fmClicks(rows) },
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

  // Step 85: the Android app counts its visits and nothing else, since it
  // offers no gifts. Its gift cells are a dash, not a nought, and a rate per
  // visit is of the website's visits only.
  const sources: readonly (readonly [string, Match])[] = [
    ['From the landing page', { s: 'hub' }],
    ['From elsewhere', { s: 'direct' }],
    ['Android app', { s: 'app' }],
    ['All', {}],
  ];
  const appVisits = total(rows, { e: 'fm_view', s: 'app' });
  const webVisits = (match: Match): number =>
    total(rows, { e: 'fm_view', ...match }) - (match.s === undefined ? appVisits : 0);
  const fmRow = (label: string, e: string): Child[] => [
    label,
    ...sources.map(([, match]) =>
      match.s === 'app' && e !== 'fm_view' ? '—' : num(total(rows, { e, ...match })),
    ),
  ];
  const fmRate = (label: string, part: string): Child[] => [
    label,
    ...sources.map(([, match]) =>
      match.s === 'app' ? '—' : pct(rate(total(rows, { e: part, ...match }), webVisits(match))),
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
          fmRate('Gift sheet opened, per visit', 'fm_support'),
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

  fragment.append(christmasSection(rows, names));
  fragment.append(videoSection(rows, names));

  const arms = (['a', 'b'] as const).map((v) => ({
    v,
    visits: total(rows, { e: 'hub_view', v }),
    clicks: fmClicks(rows, { v }),
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

  fragment.append(countrySection(summary));

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
          'Nothing is counted from browsers that send Do Not Track or Global Privacy Control, or from crawlers. Funny Multi’s Android app counts its visits only, since October 2026: it offers no gifts.',
        ),
        h(
          'li',
          {},
          'A visit’s country is found from its IP address on our own server, in a copy of DB-IP’s free country database that the server downloads once a month. Only the country is kept, counted apart from every other label, so it cannot be joined to a language, a referrer or a gift.',
        ),
        h(
          'li',
          {},
          'What is kept is a number per day for each combination of a few labels, and one for each country: no cookies, no IP addresses, no identifiers. Days older than 400 are dropped.',
        ),
      ),
    ),
  );
  return fragment;
}
