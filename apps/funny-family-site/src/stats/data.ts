// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: the counts behind /stats/, as the games' server sends them
// (GET /api/stats/summary, apps/funny-multi-server's analytics.ts), turned
// into rows and summed. Pure functions, no DOM: view.ts draws the result.

/** The summary route's answer. */
export interface Summary {
  /** First and last UTC day covered, inclusive (YYYY-MM-DD). */
  from: string;
  to: string;
  /** The labels each key holds after the event, in order. */
  fields: readonly string[];
  /** day → key → count; days with no events are absent. */
  days: Record<string, Record<string, number>>;
}

/** One stored count: a day, an event, its labels ('' where it has none). */
export interface Row {
  day: string;
  e: string;
  v: string;
  l: string;
  s: string;
  t: string;
  r: string;
  d: string;
  n: number;
}

export type Label = Exclude<keyof Row, 'day' | 'n'>;
export type Match = Partial<Record<Label, string>>;

const LABELS: readonly Label[] = ['v', 'l', 's', 't', 'r', 'd'];

/** Whether a value is the summary route's answer, as far as this page relies on it. */
export function isSummary(value: unknown): value is Summary {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.from === 'string' &&
    typeof record.to === 'string' &&
    Array.isArray(record.fields) &&
    typeof record.days === 'object' &&
    record.days !== null
  );
}

/** Every count in the summary as a row; a key's labels are read by `fields`. */
export function rowsOf(summary: Summary): Row[] {
  const rows: Row[] = [];
  for (const [day, counts] of Object.entries(summary.days)) {
    for (const [key, n] of Object.entries(counts)) {
      if (!Number.isFinite(n) || n <= 0) continue;
      const [e = '', ...values] = key.split('|');
      const row: Row = { day, e, v: '', l: '', s: '', t: '', r: '', d: '', n };
      summary.fields.forEach((field, i) => {
        if ((LABELS as readonly string[]).includes(field)) row[field as Label] = values[i] ?? '';
      });
      rows.push(row);
    }
  }
  return rows;
}

function matches(row: Row, match: Match): boolean {
  for (const [label, value] of Object.entries(match)) {
    if (row[label as Label] !== value) return false;
  }
  return true;
}

/** The sum of the rows that carry every label in `match`. */
export function total(rows: readonly Row[], match: Match): number {
  let sum = 0;
  for (const row of rows) if (matches(row, match)) sum += row.n;
  return sum;
}

/** The sums of the matching rows by one label's value, largest first. */
export function totalsBy(rows: readonly Row[], match: Match, by: Label): Map<string, number> {
  const sums = new Map<string, number>();
  for (const row of rows) {
    if (matches(row, match)) sums.set(row[by], (sums.get(row[by]) ?? 0) + row.n);
  }
  return new Map([...sums].sort((a, b) => b[1] - a[1]));
}

/** Every UTC day from `from` to `to`, inclusive. */
export function daysBetween(from: string, to: string): string[] {
  const days: string[] = [];
  const end = Date.parse(`${to}T00:00:00Z`);
  for (let at = Date.parse(`${from}T00:00:00Z`); at <= end; at += 86_400_000) {
    days.push(new Date(at).toISOString().slice(0, 10));
  }
  return days;
}

/** The matching rows' sum on each of `days`, in that order. */
export function daily(rows: readonly Row[], match: Match, days: readonly string[]): number[] {
  const sums = new Map<string, number>();
  for (const row of rows) {
    if (matches(row, match)) sums.set(row.day, (sums.get(row.day) ?? 0) + row.n);
  }
  return days.map((day) => sums.get(day) ?? 0);
}

/** `part` of `whole`, or null when there is no whole to take a part of. */
export function rate(part: number, whole: number): number | null {
  return whole > 0 ? part / whole : null;
}

export interface FunnelStep {
  label: string;
  count: number;
  /** Of the step before; null for the first step or after an empty one. */
  ofPrevious: number | null;
  /** Of the first step; null when the first step is empty. */
  ofFirst: number | null;
}

export function funnel(steps: readonly { label: string; count: number }[]): FunnelStep[] {
  const first = steps[0]?.count ?? 0;
  return steps.map((step, i) => ({
    label: step.label,
    count: step.count,
    ofPrevious: i === 0 ? null : rate(step.count, steps[i - 1]?.count ?? 0),
    ofFirst: rate(step.count, first),
  }));
}
