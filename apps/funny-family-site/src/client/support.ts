// SPDX-License-Identifier: AGPL-3.0-only

// Step 76: the header's Support Author ♥ and its gift sheet (the markup is
// render/support.ts). The rails come from the games' server — the answer
// Funny Multi's own ♥ reads, at /api/config through this host's proxy
// (deploy/caddy/Caddyfile) — so a deployment sets them in one place. They
// fill the sheet's rows; a rail that is not set loses its row, and with no
// rail at all, no answer or an answer that is not one, the ♥ goes, as in
// the game. Clicks are counted by track.ts, like every other `data-track`.

import type { SupportConfig } from '@funny/shared';

type Rail = keyof SupportConfig;

const RAILS: readonly Rail[] = [
  'payId',
  'payIdName',
  'sponsorsUrl',
  'lightningAddress',
  'kofiUrl',
  'bmcUrl',
  'donateUrl',
];
// The rails that open in a new tab: a web address or nothing.
const WEB_RAILS: readonly Rail[] = ['sponsorsUrl', 'kofiUrl', 'bmcUrl', 'donateUrl'];
// The rails with a row of their own; the bank's account name only adds to
// the PayID row.
const ROW_RAILS: readonly Rail[] = [
  'payId',
  'sponsorsUrl',
  'lightningAddress',
  'kofiUrl',
  'bmcUrl',
  'donateUrl',
];
// How long a copy button says "Copied!", as in the game.
const COPIED_MS = 1500;
const QR_PX = 148;
const SVG_NS = 'http://www.w3.org/2000/svg';

export type Rails = Partial<Record<Rail, string>>;

function isWebAddress(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * The rails worth showing in the server's answer (`{ support: SupportConfig }`):
 * those set to a non-empty string, a link only when it is a web address.
 */
export function usableRails(answer: unknown): Rails {
  const rails: Rails = {};
  const support =
    typeof answer === 'object' && answer !== null
      ? (answer as { support?: unknown }).support
      : undefined;
  if (typeof support !== 'object' || support === null) return rails;
  for (const rail of RAILS) {
    const value = (support as Record<string, unknown>)[rail];
    if (typeof value !== 'string' || value.trim() === '') continue;
    if (WEB_RAILS.includes(rail) && !isWebAddress(value.trim())) continue;
    rails[rail] = value.trim();
  }
  return rails;
}

/** Puts the rails in the sheet and takes out the rows of those not set. */
export function fillSheet(sheet: HTMLElement, rails: Rails): void {
  for (const row of sheet.querySelectorAll<HTMLElement>('[data-rail]')) {
    if (!rails[row.dataset.rail as Rail]) row.remove();
  }
  for (const element of sheet.querySelectorAll<HTMLElement>('[data-text]')) {
    element.textContent = rails[element.dataset.text as Rail] ?? '';
  }
  for (const link of sheet.querySelectorAll<HTMLAnchorElement>('a[data-link]')) {
    const value = rails[link.dataset.link as Rail];
    if (value) link.href = `${link.dataset.scheme ?? ''}${value}`;
  }
}

/**
 * Copies through the Clipboard API, or — where it is missing or refused —
 * through a selected textarea. The textarea goes inside the open dialog:
 * a modal dialog makes the rest of the page inert, and nothing inert can be
 * selected.
 */
async function copyText(win: Window, host: HTMLElement, text: string): Promise<void> {
  try {
    await win.navigator.clipboard.writeText(text);
    return;
  } catch {
    // Falls through to the textarea.
  }
  const doc = win.document;
  const area = doc.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  host.append(area);
  area.select();
  const copied = doc.execCommand('copy');
  area.remove();
  if (!copied) throw new Error('copy refused');
}

/** Draws `text` as a QR code into `box`, or takes the box away if it cannot. */
async function drawQr(box: HTMLElement, text: string): Promise<void> {
  try {
    const { qrPath } = await import('../qr.ts');
    const { size, d } = qrPath(text);
    const doc = box.ownerDocument;
    const svg = doc.createElementNS(SVG_NS, 'svg');
    // Two modules of white all round, the quiet zone a scanner looks for.
    svg.setAttribute('viewBox', `-2 -2 ${size + 4} ${size + 4}`);
    svg.setAttribute('width', String(QR_PX));
    svg.setAttribute('height', String(QR_PX));
    svg.setAttribute('shape-rendering', 'crispEdges');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const paper = doc.createElementNS(SVG_NS, 'rect');
    paper.setAttribute('x', '-2');
    paper.setAttribute('y', '-2');
    paper.setAttribute('width', String(size + 4));
    paper.setAttribute('height', String(size + 4));
    paper.setAttribute('fill', '#fff');
    const ink = doc.createElementNS(SVG_NS, 'path');
    ink.setAttribute('d', d);
    ink.setAttribute('fill', '#000');
    svg.append(paper, ink);
    box.replaceChildren(svg);
  } catch {
    box.remove();
  }
}

/**
 * Fetches the rails and, when there is one to show, brings the ♥ out and
 * makes it open the sheet. Resolves to whether the ♥ shows.
 */
export async function initSupport(win: Window): Promise<boolean> {
  const doc = win.document;
  const open = doc.querySelector<HTMLButtonElement>('button.support-open');
  const sheet = doc.querySelector<HTMLDialogElement>('dialog#support-sheet');
  if (!open || !sheet) return false;
  const hide = (): false => {
    open.hidden = true;
    return false;
  };
  // A browser without modal dialogs could open nothing.
  if (typeof sheet.showModal !== 'function') return hide();

  let answer: unknown;
  try {
    const response = await win.fetch('/api/config', { headers: { Accept: 'application/json' } });
    if (!response.ok) return hide();
    // A host that does not forward the path answers with a page, not JSON:
    // json() throws, and that is the same as no answer.
    answer = await response.json();
  } catch {
    return hide();
  }
  const rails = usableRails(answer);
  if (!ROW_RAILS.some((rail) => rails[rail])) return hide();
  fillSheet(sheet, rails);

  const root = doc.documentElement;
  const status = sheet.querySelector<HTMLElement>('[data-status]');
  let qrDrawn = false;
  open.addEventListener('click', () => {
    if (sheet.open) return;
    sheet.showModal();
    root.classList.add('sheet-open');
    if (!qrDrawn) {
      qrDrawn = true;
      for (const box of sheet.querySelectorAll<HTMLElement>('[data-qr]')) {
        const value = rails[box.dataset.qr as Rail];
        if (value) void drawQr(box, `lightning:${value}`);
      }
    }
  });
  sheet.addEventListener('close', () => {
    root.classList.remove('sheet-open');
    open.focus();
  });
  sheet.querySelector('.sheet-close')?.addEventListener('click', () => sheet.close());
  // A click on the dim backdrop closes the sheet too. The sheet's content
  // fills it edge to edge, so a click whose target is the dialog itself
  // landed outside it — unless it fell on the dialog's own border.
  sheet.addEventListener('click', (event) => {
    if (event.target !== sheet) return;
    const box = sheet.getBoundingClientRect();
    const inside =
      event.clientX >= box.left &&
      event.clientX <= box.right &&
      event.clientY >= box.top &&
      event.clientY <= box.bottom;
    if (!inside) sheet.close();
  });

  for (const button of sheet.querySelectorAll<HTMLButtonElement>('button[data-copy]')) {
    const value = rails[button.dataset.copy as Rail];
    if (!value) continue;
    const label = button.textContent ?? '';
    const copied = button.dataset.copied ?? label;
    let timer: number | undefined;
    button.addEventListener('click', () => {
      copyText(win, sheet, value).then(
        () => {
          button.textContent = copied;
          if (status) status.textContent = copied;
          win.clearTimeout(timer);
          timer = win.setTimeout(() => {
            button.textContent = label;
            if (status) status.textContent = '';
          }, COPIED_MS);
        },
        () => {
          // Nothing copied: the address is on screen to select by hand.
        },
      );
    });
  }

  delete open.dataset.state;
  return true;
}
