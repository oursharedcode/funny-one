// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: visit and click counts for the Funny Family landing page (the hub,
// apps/funny-family-site) and for the funnel that runs from it into Funny
// Multi and on to the gift sheet. The hub's /stats/ page reads them back.
//
// Not stats.ts, which is the live room/picture counter the Home screen shows.
//
// What is kept is a count per UTC day per combination of a few coarse,
// allow-listed labels — the event, the hub variant, the language, where the
// visit came from — and nothing else: no IP address, no user agent, no
// identifier, nothing finer than the day. That is what lets the game stay
// cookie-free and banner-free, and lets the summary route be public. A label
// outside its allowlist rejects the whole event, so nobody can write free text
// into the file and the key space is closed (73 combinations per language a
// day at most).
//
// Step 79 (B-20): a visit — hub_view or fm_view, not a click or a gift — also
// adds one to its country's daily total, which /stats/ draws as a world map.
// That total is a tally of its own, never joined to the labels above: tied to
// a language, a referrer or a gift, a country could single out the one person
// who came from it. geo.ts finds the country from the visit's address, which
// goes no further; a visit it cannot place counts as `ZZ`. Two events by some
// 250 codes keep this key space closed too.
//
// Persistence is one JSON file (STATS_FILE; docker-compose.yml mounts a volume
// for it), written whole and atomically when something changed, at most every
// FLUSH_MS and once more on close. Without STATS_FILE (dev, tests) the counts
// live in memory only.

import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { LANGUAGES } from '@funny/shared';

export const STAT_EVENTS = ['hub_view', 'hub_click', 'fm_view', 'fm_support', 'fm_gift'] as const;
export type StatEvent = (typeof STAT_EVENTS)[number];

/** The labels an event can carry, in key order after the event itself. */
export const STAT_FIELDS = ['v', 'l', 's', 't', 'r', 'd'] as const;
type Field = (typeof STAT_FIELDS)[number];

const VARIANTS = ['a', 'b'] as const;
const LANGUAGE_CODES: readonly string[] = LANGUAGES.map((option) => option.code);
// Where a Funny Multi visit came from: the hub's "Play" link, or anywhere else.
const SOURCES = ['hub', 'direct'] as const;
// Step 85 (B-23): a visit may also come from the Android app. Only the visit:
// the app offers no gifts, so a support or gift event from it is refused.
const VISIT_SOURCES = [...SOURCES, 'app'] as const;
// A hub visit's referrer, classified in the browser (no URL is ever sent).
const REFERRERS = ['direct', 'search', 'social', 'oursharedcode', 'games', 'other'] as const;
// Phone-sized screen or not.
const DEVICES = ['m', 'd'] as const;
// Which gift rail was used on a support sheet — Funny Multi's, or (Step 76)
// the hub's own.
const GIFT_TARGETS = ['payid', 'sponsors', 'lightning', 'kofi', 'bmc', 'donate'] as const;
// What was clicked on the hub: either game, the source code, the video, the
// author's site, and (Step 76) its Support Author ♥ and the gift rails on the
// sheet that opens.
const HUB_TARGETS = ['fm', 'fo', 'gh', 'video', 'root', 'support', ...GIFT_TARGETS] as const;

// Each event's own labels. Every one listed is required, except that a Funny
// Multi event carries `v` only when it came through the hub — a visit that did
// not has no variant to report.
const SPEC: Record<StatEvent, Partial<Record<Field, readonly string[]>>> = {
  hub_view: { v: VARIANTS, l: LANGUAGE_CODES, r: REFERRERS, d: DEVICES },
  hub_click: { v: VARIANTS, l: LANGUAGE_CODES, t: HUB_TARGETS },
  fm_view: { v: VARIANTS, l: LANGUAGE_CODES, s: VISIT_SOURCES },
  fm_support: { v: VARIANTS, l: LANGUAGE_CODES, s: SOURCES },
  fm_gift: { v: VARIANTS, l: LANGUAGE_CODES, s: SOURCES, t: GIFT_TARGETS },
};

/** Step 79: the events whose country is counted — the visits. */
export const GEO_EVENTS: readonly StatEvent[] = ['hub_view', 'fm_view'];
/** DB-IP's code for space no country holds; here, any visit not placed. */
const NOT_KNOWN = 'ZZ';

function isStatEvent(value: unknown): value is StatEvent {
  return typeof value === 'string' && (STAT_EVENTS as readonly string[]).includes(value);
}

/**
 * The storage key of a valid event — `e|v|l|s|t|r|d`, an absent label empty —
 * or null when anything about it is off: an unknown event or field, a label
 * the event does not take, a value outside its allowlist, a missing label.
 */
export function statKey(input: unknown): string | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return null;
  const record = input as Record<string, unknown>;
  const event = record.e;
  if (!isStatEvent(event)) return null;
  for (const name of Object.keys(record)) {
    if (name !== 'e' && !(STAT_FIELDS as readonly string[]).includes(name)) return null;
  }
  const spec = SPEC[event];
  const viaHub = event.startsWith('hub_') || record.s === 'hub';
  const parts: string[] = [event];
  for (const name of STAT_FIELDS) {
    const allowed = spec[name];
    const value = record[name];
    const wanted = allowed !== undefined && (name !== 'v' || viaHub);
    if (!wanted) {
      if (value !== undefined) return null;
      parts.push('');
      continue;
    }
    if (typeof value !== 'string' || !allowed.includes(value)) return null;
    parts.push(value);
  }
  return parts.join('|');
}

/**
 * Crawlers, link previews and scripts: their visits are not people's. Not
 * "telegram" or "discord": their bots already say "bot", and Telegram's
 * in-app browser names itself in a person's user agent.
 */
const BOT_AGENT =
  /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|embedly|whatsapp|vkshare|curl|wget|python|httpclient|okhttp|go-http|node-fetch|axios|java\/|phantom|selenium|puppeteer|playwright/i;

export function isBotAgent(userAgent: string | undefined): boolean {
  if (!userAgent) return true;
  // CUBOT is a phone maker: its model names would otherwise read as "bot".
  return BOT_AGENT.test(userAgent.replace(/cubot/gi, ''));
}

export interface StatsSummary {
  /** First and last UTC day covered, inclusive (YYYY-MM-DD). */
  from: string;
  to: string;
  /** The labels each key holds after the event, in order. */
  fields: readonly string[];
  /** day → key → count; days with no events are absent. */
  days: Record<string, Record<string, number>>;
  /**
   * Step 79: event → country → visits over the days covered, for the
   * GEO_EVENTS only; `ZZ` is a visit whose country is not known.
   */
  countries: Record<string, Record<string, number>>;
  /** The first day a country was counted on, of the days kept; null for none. */
  countriesSince: string | null;
}

export interface StatsStore {
  /**
   * Counts one event. False when the event is not one this module accepts.
   * A visit's `country` (two capital letters; null when it is not known) goes
   * to the country tally as well; left out, as with no lookup, it does not.
   */
  record(input: unknown, country?: string | null): boolean;
  /** The counts of the last `days` UTC days, today included. */
  summary(days: number): StatsSummary;
  /** Writes the file now if anything changed since the last write. */
  flush(): void;
  /** Stops the flush timer and writes what is pending. */
  stop(): void;
}

export interface StatsStoreOptions {
  /** The JSON file the counts persist to; null keeps them in memory only. */
  file: string | null;
  flushMs?: number;
  /** Days older than this are dropped. */
  retentionDays?: number;
  /** Clock injection point for tests. */
  now?: () => Date;
  /** Where a failed read or write is reported; the counting never stops for it. */
  onError?: (err: unknown) => void;
}

export const FLUSH_MS = 15_000;
export const RETENTION_DAYS = 400;
export const SUMMARY_DEFAULT_DAYS = 30;

const DAY_MS = 86_400_000;

function utcDay(at: Date): string {
  return at.toISOString().slice(0, 10);
}

/** day → key → count. */
type Tally = Record<string, Record<string, number>>;

interface StatsFile {
  version: 1;
  days: Tally;
  /** Step 79: day → `event|CC` → count. A file from before has none. */
  countries: Tally;
}

/** A tally from the file: its well-formed days, keys and counts only. */
function readTally(raw: unknown, keyPattern = /^/): Tally {
  const tally: Tally = {};
  if (typeof raw !== 'object' || !raw) return tally;
  for (const [day, counts] of Object.entries(raw)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || typeof counts !== 'object' || !counts) continue;
    const kept: Record<string, number> = {};
    for (const [key, n] of Object.entries(counts)) {
      if (keyPattern.test(key) && typeof n === 'number' && Number.isSafeInteger(n) && n > 0) {
        kept[key] = n;
      }
    }
    tally[day] = kept;
  }
  return tally;
}

function readFile(file: string, onError: (err: unknown) => void): Omit<StatsFile, 'version'> {
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch (err) {
    // No file yet is the normal first start; anything else is worth a line.
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') onError(err);
    return { days: {}, countries: {} };
  }
  try {
    const parsed = JSON.parse(text) as Partial<StatsFile>;
    return {
      days: readTally(parsed.days),
      countries: readTally(parsed.countries, /^[a-z_]+\|[A-Z]{2}$/),
    };
  } catch (err) {
    // Keep the unreadable file for a look rather than overwrite it at the
    // first flush.
    onError(err);
    try {
      renameSync(file, `${file}.corrupt`);
    } catch {
      // Nothing more to do: counting starts over either way.
    }
    return { days: {}, countries: {} };
  }
}

export function createStatsStore(options: StatsStoreOptions): StatsStore {
  const {
    file,
    flushMs = FLUSH_MS,
    retentionDays = RETENTION_DAYS,
    now = () => new Date(),
    onError = () => {},
  } = options;
  const { days, countries }: Omit<StatsFile, 'version'> = file
    ? readFile(file, onError)
    : { days: {}, countries: {} };
  let dirty = false;

  function prune(): void {
    const oldest = utcDay(new Date(now().getTime() - (retentionDays - 1) * DAY_MS));
    for (const tally of [days, countries]) {
      for (const day of Object.keys(tally)) {
        if (day < oldest) delete tally[day];
      }
    }
  }
  prune();

  function record(input: unknown, country?: string | null): boolean {
    const key = statKey(input);
    if (!key) return false;
    const day = utcDay(now());
    let counts = days[day];
    if (!counts) {
      counts = {};
      days[day] = counts;
      prune();
    }
    counts[key] = (counts[key] ?? 0) + 1;
    const event = (input as { e: StatEvent }).e;
    if (country !== undefined && GEO_EVENTS.includes(event)) {
      const place = `${event}|${country && /^[A-Z]{2}$/.test(country) ? country : NOT_KNOWN}`;
      let places = countries[day];
      if (!places) {
        places = {};
        countries[day] = places;
      }
      places[place] = (places[place] ?? 0) + 1;
    }
    dirty = true;
    return true;
  }

  function summary(span: number): StatsSummary {
    const today = now();
    const from = utcDay(new Date(today.getTime() - (span - 1) * DAY_MS));
    const to = utcDay(today);
    const slice: StatsSummary['days'] = {};
    for (const [day, counts] of Object.entries(days)) {
      if (day >= from && day <= to) slice[day] = { ...counts };
    }
    // The map shows the whole span, so the countries come summed over it.
    const places: StatsSummary['countries'] = {};
    let since: string | null = null;
    for (const [day, counts] of Object.entries(countries)) {
      if (since === null || day < since) since = day;
      if (day < from || day > to) continue;
      for (const [place, n] of Object.entries(counts)) {
        const [event, code] = place.split('|');
        let byCode = places[event];
        if (!byCode) {
          byCode = {};
          places[event] = byCode;
        }
        byCode[code] = (byCode[code] ?? 0) + n;
      }
    }
    return {
      from,
      to,
      fields: STAT_FIELDS,
      days: slice,
      countries: places,
      countriesSince: since,
    };
  }

  function flush(): void {
    if (!file || !dirty) return;
    // Cleared before the write: an event counted while a write fails is
    // retried with the next one, and a write that fails leaves the old file
    // whole (tmp + rename).
    dirty = false;
    const tmp = `${file}.tmp`;
    try {
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(tmp, JSON.stringify({ version: 1, days, countries } satisfies StatsFile));
      renameSync(tmp, file);
    } catch (err) {
      dirty = true;
      onError(err);
    }
  }

  // unref() so an idle timer never holds the process (or a test runner) open.
  const timer = file ? setInterval(flush, flushMs) : null;
  timer?.unref?.();

  return {
    record,
    summary,
    flush,
    stop() {
      if (timer) clearInterval(timer);
      flush();
    },
  };
}

/** `?days=` of the summary route: a whole number of days, 1 to RETENTION_DAYS. */
export function summaryDays(raw: unknown): number {
  const n = typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : SUMMARY_DEFAULT_DAYS;
  return Math.min(RETENTION_DAYS, Math.max(1, n));
}
