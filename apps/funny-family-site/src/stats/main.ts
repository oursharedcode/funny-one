// SPDX-License-Identifier: AGPL-3.0-only

// Step 72: /stats/'s script. Fetches the counts for the chosen period from
// the games' server (through this site's /api proxy) and draws them; the
// period sits in the address (`?days=`) so a view can be bookmarked.

import '../styles/stats.css';
import { isSummary } from './data.ts';
import { periodText, renderStats } from './view.ts';

const PERIODS = [7, 30, 90, 365];
const DEFAULT_DAYS = 30;

const status = document.getElementById('stats-status');
const root = document.getElementById('stats-root');
const buttons = [...document.querySelectorAll<HTMLButtonElement>('.periods button[data-days]')];

function languageNames(): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(
      document.getElementById('language-names')?.textContent ?? '',
    );
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

const names = languageNames();
let latest = 0;

async function show(days: number): Promise<void> {
  if (!status || !root) return;
  const ticket = ++latest;
  for (const button of buttons) {
    button.setAttribute('aria-pressed', String(Number(button.dataset.days) === days));
  }
  status.textContent = 'Loading…';
  root.setAttribute('aria-busy', 'true');
  try {
    const response = await fetch(`/api/stats/summary?days=${days}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const summary: unknown = await response.json();
    if (!isSummary(summary)) throw new Error('not a summary');
    if (ticket !== latest) return;
    root.replaceChildren(renderStats(summary, names));
    status.textContent = periodText(summary);
  } catch {
    if (ticket !== latest) return;
    root.replaceChildren();
    status.textContent = 'The counts could not be loaded. Try again in a minute.';
  } finally {
    if (ticket === latest) root.removeAttribute('aria-busy');
  }
}

const asked = Number(new URLSearchParams(window.location.search).get('days'));
for (const button of buttons) {
  button.addEventListener('click', () => {
    const days = Number(button.dataset.days);
    const url = new URL(window.location.href);
    if (days === DEFAULT_DAYS) url.searchParams.delete('days');
    else url.searchParams.set('days', String(days));
    window.history.replaceState(null, '', url.pathname + url.search);
    void show(days);
  });
}
void show(PERIODS.includes(asked) ? asked : DEFAULT_DAYS);
