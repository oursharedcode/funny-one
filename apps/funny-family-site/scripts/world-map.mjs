// SPDX-License-Identifier: AGPL-3.0-only
//
// Draws the world map /stats/ shades by visits (Step 79, B-20) and writes it
// to src/stats/worldMap.ts. Its shapes come from Natural Earth's Admin 0 –
// Countries, v5.1.2 (public domain; geojson/ in
// https://github.com/nvkelso/natural-earth-vector). Those files are not in
// the repo; the map is, so the build needs no download. Run again only to
// change the map, then Prettier on what it wrote:
//
//   node apps/funny-family-site/scripts/world-map.mjs \
//     ne_110m_admin_0_countries.geojson ne_50m_admin_0_countries.geojson
//
// The projection is Equal Earth (Šavrič, Patterson and Jenny, 2018): areas
// are true, so no country looks bigger than it is. The 1:110m shapes are
// drawn, cut down to what shows at 1,000 units wide, Antarctica left out. A
// country too small to see there, or not in that file at all, also gets a
// dot, at its 1:50m label point; the few places neither file has get the
// points in EXTRA_DOTS. Every place is keyed by the two-letter code DB-IP
// gives a visit from it (ISO 3166-1, and XK for Kosovo), so some shapes are
// cut or joined to match: French Guiana and Svalbard have codes of their own
// and are cut out of France and Norway; Northern Cyprus and Somaliland have
// none and join Cyprus and Somalia.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const [FILE_110M, FILE_50M] = process.argv.slice(2);
if (!FILE_110M || !FILE_50M) {
  console.error('usage: world-map.mjs <ne_110m_admin_0_countries.geojson> <ne_50m_…geojson>');
  process.exit(1);
}
const OUT = fileURLToPath(new URL('../src/stats/worldMap.ts', import.meta.url));

const WIDTH = 1000;
/** Room round the globe's edge for its stroke. */
const PAD = 2;
/** The map's bottom edge: nothing but Antarctica lies further south. */
const SOUTH = -60;
/** Douglas–Peucker's tolerance, in map units: about a pixel at full width. */
const TOLERANCE = 0.5;
/** A shape narrower and shorter than this, in map units, gets a dot too. */
const SMALL = 8;

/** Places neither file draws, by DB-IP's code: [latitude, longitude]. */
const EXTRA_DOTS = {
  BQ: [12.18, -68.25], // Bonaire, Sint Eustatius and Saba (at Bonaire)
  BV: [-54.42, 3.36], // Bouvet Island
  CC: [-12.17, 96.84], // Cocos (Keeling) Islands
  CX: [-10.49, 105.62], // Christmas Island
  GI: [36.14, -5.35], // Gibraltar
  GP: [16.25, -61.58], // Guadeloupe
  MQ: [14.64, -61.02], // Martinique
  RE: [-21.12, 55.54], // Réunion
  TK: [-9.2, -171.85], // Tokelau
  UM: [19.28, 166.65], // US Minor Outlying Islands (at Wake Island)
  YT: [-12.83, 45.17], // Mayotte
};

/** Parts of a country with a code of their own: a polygon all of whose outer ring passes the test. */
const SPLITS = {
  FR: [['GF', ([lon]) => lon < -20]],
  NO: [['SJ', ([, lat]) => lat > 74]],
};

/** Shapes with no code of their own, by Natural Earth's NAME, and the code they join. */
const JOINS = { 'N. Cyprus': 'CY', Somaliland: 'SO' };

/** Left out: Antarctica, below the map's edge. */
const LEFT_OUT = new Set(['AQ']);

function codeOf(properties) {
  for (const value of [properties.ISO_A2_EH, properties.ISO_A2]) {
    if (/^[A-Z]{2}$/.test(value)) return value;
  }
  return JOINS[properties.NAME] ?? null;
}

// Equal Earth, on the unit sphere.
const A1 = 1.340264;
const A2 = -0.081106;
const A3 = 0.000893;
const A4 = 0.003796;
const M = Math.sqrt(3) / 2;

function project([lon, lat]) {
  const lambda = (lon * Math.PI) / 180;
  const theta = Math.asin(M * Math.sin((lat * Math.PI) / 180));
  const t2 = theta * theta;
  const t6 = t2 * t2 * t2;
  const x = (lambda * Math.cos(theta)) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)));
  const y = theta * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
  return [x, y];
}

const X_MAX = project([180, 0])[0];
const TOP = project([0, 90])[1];
const SCALE = (WIDTH - 2 * PAD) / (2 * X_MAX);
const HEIGHT = Math.ceil((TOP - project([0, SOUTH])[1]) * SCALE + 2 * PAD);

/** A [longitude, latitude] as a point on the map, y down. */
function toMap(point) {
  const [x, y] = project(point);
  return [PAD + (x + X_MAX) * SCALE, PAD + (TOP - y) * SCALE];
}

function distance([x, y], [x1, y1], [x2, y2]) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / length)) : 0;
  return Math.hypot(x - x1 - t * dx, y - y1 - t * dy);
}

/** Douglas–Peucker: the points that keep the line within `tolerance` of itself. */
function simplify(points, tolerance) {
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    let farthest = -1;
    let max = tolerance;
    for (let i = first + 1; i < last; i++) {
      const d = distance(points[i], points[first], points[last]);
      if (d > max) {
        max = d;
        farthest = i;
      }
    }
    if (farthest !== -1) {
      keep[farthest] = 1;
      stack.push([first, farthest], [farthest, last]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** A ring on the map in whole units, or null when nothing of it is left. */
function mapRing(ring, tolerance) {
  const points = [];
  for (const [x, y] of simplify(ring.map(toMap), tolerance)) {
    const point = [Math.round(x), Math.round(y)];
    const last = points.at(-1);
    if (!last || last[0] !== point[0] || last[1] !== point[1]) points.push(point);
  }
  const first = points[0];
  const last = points.at(-1);
  if (points.length > 1 && first[0] === last[0] && first[1] === last[1]) points.pop();
  let area = 0;
  points.forEach(([x, y], i) => {
    const [nx, ny] = points[(i + 1) % points.length];
    area += x * ny - nx * y;
  });
  return points.length >= 3 && Math.abs(area) >= 2 ? points : null;
}

/** Rings as an SVG path: each starts absolute and goes on in relative steps. */
function pathOf(rings) {
  let d = '';
  for (const ring of rings) {
    d += `M${ring[0][0]} ${ring[0][1]}l`;
    let start = true;
    for (let i = 1; i < ring.length; i++) {
      for (const step of [ring[i][0] - ring[i - 1][0], ring[i][1] - ring[i - 1][1]]) {
        d += start || step < 0 ? String(step) : ` ${step}`;
        start = false;
      }
    }
    d += 'z';
  }
  return d;
}

function polygonsOf(geometry) {
  return geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
}

const read = (file) => JSON.parse(readFileSync(file, 'utf8')).features;

// The shapes, 1:110m.
const rings = new Map();
let pointsIn = 0;
for (const { properties, geometry } of read(FILE_110M)) {
  const code = codeOf(properties);
  if (!code) {
    console.warn(`no code, left out: ${properties.NAME}`);
    continue;
  }
  if (LEFT_OUT.has(code)) continue;
  for (const polygon of polygonsOf(geometry)) {
    const split = (SPLITS[code] ?? []).find(([, test]) => polygon[0].every(test));
    const place = split ? split[0] : code;
    for (const ring of polygon) {
      pointsIn += ring.length;
      const points = mapRing(ring, TOLERANCE);
      if (!points) continue;
      if (!rings.has(place)) rings.set(place, []);
      rings.get(place).push(points);
    }
  }
}

// The label points, 1:50m: the most populous feature of each code.
const labels = new Map();
for (const { properties } of read(FILE_50M)) {
  const code = codeOf(properties);
  if (!code || LEFT_OUT.has(code)) continue;
  const known = labels.get(code);
  if (known && known.population >= properties.POP_EST) continue;
  labels.set(code, {
    population: properties.POP_EST,
    point: [properties.LABEL_X, properties.LABEL_Y],
  });
}
for (const [code, [lat, lon]] of Object.entries(EXTRA_DOTS)) {
  if (labels.has(code) || rings.has(code)) console.warn(`${code} is in the files after all`);
  labels.set(code, { population: 0, point: [lon, lat] });
}

const shapes = [...rings].sort(([a], [b]) => a.localeCompare(b));
const dots = [];
for (const code of new Set([...rings.keys(), ...labels.keys()])) {
  const shape = rings.get(code);
  if (shape) {
    const xs = shape.flat().map(([x]) => x);
    const ys = shape.flat().map(([, y]) => y);
    const wide = Math.max(...xs) - Math.min(...xs);
    const tall = Math.max(...ys) - Math.min(...ys);
    if (wide >= SMALL || tall >= SMALL) continue;
  }
  const label = labels.get(code);
  if (label) dots.push([code, toMap(label.point).map(Math.round)]);
  else console.warn(`${code} is too small to see and has no label point: no dot`);
}
dots.sort(([a], [b]) => a.localeCompare(b));

// The globe's edge: the meridians at ±180°, joined by the straight parallels
// at the top and bottom.
const edge = [];
for (let lat = 90; lat >= SOUTH; lat -= 2.5) edge.push(toMap([-180, lat]));
for (let lat = SOUTH; lat <= 90; lat += 2.5) edge.push(toMap([180, lat]));
const outline = `M${simplify(edge, 0.1)
  .map(([x, y]) => `${+x.toFixed(1)} ${+y.toFixed(1)}`)
  .join('L')}z`;

const source = `// SPDX-License-Identifier: AGPL-3.0-only

// Step 79 (B-20): the world map /stats/ shades by visits, in the Equal Earth
// projection, from Natural Earth's country shapes (public domain). Written by
// scripts/world-map.mjs: run that again rather than edit this by hand.

/** The map's size, in the units of its paths and dots. */
export const MAP_WIDTH = ${WIDTH};
export const MAP_HEIGHT = ${HEIGHT};

/** The globe's edge, cut at ${-SOUTH}° south. */
export const OUTLINE = '${outline}';

/** Each country's shape, keyed by the code DB-IP gives a visit from it. */
export const SHAPES: Readonly<Record<string, string>> = {
${shapes.map(([code, shape]) => `  ${code}: '${pathOf(shape)}',`).join('\n')}
};

/** A dot for each place too small to see, or with no shape: its centre. */
export const DOTS: Readonly<Record<string, readonly [number, number]>> = {
${dots.map(([code, [x, y]]) => `  ${code}: [${x}, ${y}],`).join('\n')}
};
`;
writeFileSync(OUT, source);
const pointsOut = shapes.reduce((sum, [, shape]) => sum + shape.flat().length, 0);
console.log(
  `${WIDTH}×${HEIGHT}: ${shapes.length} shapes, ${pointsIn} → ${pointsOut} points; ${dots.length} dots; ${source.length} bytes → ${OUT}`,
);
