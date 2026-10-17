// SPDX-License-Identifier: AGPL-3.0-only

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { fillSheet, initSupport, usableRails } from './support.ts';
import { qrPath } from '../qr.ts';
import { supportButton, supportSheet } from '../render/support.ts';
import { SUPPORT_STRINGS } from '../supportStrings.ts';

const RAILS = {
  payId: 'gifts@example.com',
  payIdName: 'A. Person',
  sponsorsUrl: 'https://github.com/sponsors/someone',
  lightningAddress: 'someone@example.com',
  kofiUrl: 'https://ko-fi.com/someone',
  bmcUrl: 'https://buymeacoffee.com/someone',
  donateUrl: 'https://example.com/donate',
};

const NONE = {
  payId: null,
  payIdName: null,
  sponsorsUrl: null,
  lightningAddress: null,
  kofiUrl: null,
  bmcUrl: null,
  donateUrl: null,
};

const t = SUPPORT_STRINGS.en;

beforeAll(() => {
  // jsdom has <dialog> and its `open`, but neither of the methods.
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.open) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});

afterAll(() => {
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  Reflect.deleteProperty(document, 'execCommand');
});

/** What the server answers: `ok` with a body, or a page that is not JSON. */
function answer(body: unknown, ok = true): () => Promise<Response> {
  return async () =>
    ({
      ok,
      json: async () => {
        if (body instanceof Error) throw body;
        return body;
      },
    }) as unknown as Response;
}

interface SetUpOptions {
  reply?: () => Promise<Response>;
  clipboard?: { writeText(text: string): Promise<void> };
}

/** The landing page's ♥ and sheet, and a window that fetches `reply`. */
function setUp(options: SetUpOptions = {}) {
  document.documentElement.className = '';
  document.body.innerHTML = `<header>${supportButton('en')}</header>${supportSheet('en')}`;
  const fetch = vi.fn((_url: string, _init?: RequestInit) =>
    (options.reply ?? answer({ support: RAILS }))(),
  );
  const win = {
    document,
    fetch,
    navigator: { clipboard: options.clipboard },
    setTimeout: (handler: () => void, ms: number) => setTimeout(handler, ms),
    clearTimeout: (id: number) => clearTimeout(id),
  } as unknown as Window;
  return {
    win,
    fetch,
    open: document.querySelector<HTMLButtonElement>('button.support-open')!,
    sheet: document.querySelector<HTMLDialogElement>('dialog#support-sheet')!,
  };
}

function rows(sheet: HTMLElement): (string | undefined)[] {
  return [...sheet.querySelectorAll<HTMLElement>('[data-rail]')].map((row) => row.dataset.rail);
}

describe('usableRails', () => {
  it('keeps every rail that is set, trimmed', () => {
    expect(usableRails({ support: RAILS })).toEqual(RAILS);
    expect(usableRails({ support: { ...NONE, payId: '  gifts@example.com\n' } })).toEqual({
      payId: 'gifts@example.com',
    });
  });

  it('drops rails that are empty, not text, or a link that is not a web address', () => {
    expect(usableRails({ support: NONE })).toEqual({});
    expect(
      usableRails({
        support: {
          payId: '',
          payIdName: '   ',
          lightningAddress: 42,
          sponsorsUrl: 'http://example.com/sponsor',
          kofiUrl: 'javascript:alert(1)',
          bmcUrl: 'ftp://example.com/',
          donateUrl: 'not a link',
        },
      }),
    ).toEqual({ sponsorsUrl: 'http://example.com/sponsor' });
  });

  it('finds nothing in something that is not an answer', () => {
    for (const value of [null, undefined, 'x', 1, [], {}, { support: null }, { support: 'x' }])
      expect(usableRails(value)).toEqual({});
  });
});

describe('fillSheet', () => {
  it('fills in every rail when all are set', () => {
    const { sheet } = setUp();
    fillSheet(sheet, RAILS);
    expect(rows(sheet)).toEqual([
      'payId',
      'payIdName',
      'sponsorsUrl',
      'lightningAddress',
      'kofiUrl',
      'bmcUrl',
      'donateUrl',
    ]);
    expect(sheet.querySelector('code[data-text="payId"]')?.textContent).toBe(RAILS.payId);
    expect(sheet.querySelector('[data-rail="payIdName"]')?.textContent).toBe(
      t.payIdBankNote.replace('{{name}}', RAILS.payIdName),
    );
    const link = (rail: string) => sheet.querySelector<HTMLAnchorElement>(`a[data-link="${rail}"]`);
    expect(link('sponsorsUrl')?.getAttribute('href')).toBe(RAILS.sponsorsUrl);
    expect(link('sponsorsUrl')?.textContent).toBe(RAILS.sponsorsUrl);
    expect(link('lightningAddress')?.getAttribute('href')).toBe(
      `lightning:${RAILS.lightningAddress}`,
    );
    expect(link('lightningAddress')?.textContent).toBe(RAILS.lightningAddress);
    expect(link('kofiUrl')?.getAttribute('href')).toBe(RAILS.kofiUrl);
    expect(link('bmcUrl')?.getAttribute('href')).toBe(RAILS.bmcUrl);
    expect(link('donateUrl')?.getAttribute('href')).toBe(RAILS.donateUrl);
  });

  it('takes out the rows of the rails that are not set', () => {
    const { sheet } = setUp();
    fillSheet(sheet, { payId: RAILS.payId, kofiUrl: RAILS.kofiUrl });
    expect(rows(sheet)).toEqual(['payId', 'kofiUrl']);
    expect(sheet.querySelector('[data-qr]')).toBeNull();
  });
});

describe('initSupport', () => {
  it('asks the server for the rails, then shows the ♥ with only their rows', async () => {
    const { win, fetch, open, sheet } = setUp({
      reply: answer({ support: { ...NONE, payId: RAILS.payId, kofiUrl: RAILS.kofiUrl } }),
    });
    expect(open.dataset.state).toBe('pending');
    await expect(initSupport(win)).resolves.toBe(true);
    expect(fetch).toHaveBeenCalledWith('/api/config', {
      headers: { Accept: 'application/json' },
    });
    expect(open.dataset.state).toBeUndefined();
    expect(open.hidden).toBe(false);
    expect(rows(sheet)).toEqual(['payId', 'kofiUrl']);
  });

  it('takes the ♥ away when no rail is set', async () => {
    for (const support of [NONE, { ...NONE, payIdName: RAILS.payIdName }]) {
      const { win, open } = setUp({ reply: answer({ support }) });
      await expect(initSupport(win)).resolves.toBe(false);
      expect(open.hidden).toBe(true);
    }
  });

  it('takes the ♥ away without an answer, or with one that is not JSON', async () => {
    const replies = [
      () => Promise.reject(new TypeError('Failed to fetch')),
      answer({ support: RAILS }, false),
      answer(new SyntaxError('Unexpected token <')),
      answer({}),
    ];
    for (const reply of replies) {
      const { win, open } = setUp({ reply });
      await expect(initSupport(win)).resolves.toBe(false);
      expect(open.hidden).toBe(true);
    }
  });

  it('takes the ♥ away, asking nothing, in a browser without modal dialogs', async () => {
    const { win, fetch, open, sheet } = setUp();
    Object.defineProperty(sheet, 'showModal', { value: undefined });
    await expect(initSupport(win)).resolves.toBe(false);
    expect(open.hidden).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('opens the sheet, and its × or the backdrop closes it, handing focus back', async () => {
    const { win, open, sheet } = setUp();
    await initSupport(win);
    const root = document.documentElement;

    open.click();
    expect(sheet.open).toBe(true);
    expect(root.classList.contains('sheet-open')).toBe(true);
    sheet.querySelector<HTMLButtonElement>('.sheet-close')?.click();
    expect(sheet.open).toBe(false);
    expect(root.classList.contains('sheet-open')).toBe(false);
    expect(document.activeElement).toBe(open);

    // The dialog's own box is the sheet; a click on the dialog beyond it is
    // on the backdrop.
    vi.spyOn(sheet, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      right: 400,
      top: 50,
      bottom: 600,
    } as DOMRect);
    const clickAt = (target: Element, clientX: number, clientY: number) =>
      target.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX, clientY }));
    open.click();
    clickAt(sheet, 120, 60);
    clickAt(sheet.querySelector('.sheet-intro')!, 20, 20);
    expect(sheet.open).toBe(true);
    clickAt(sheet, 20, 20);
    expect(sheet.open).toBe(false);
    expect(document.activeElement).toBe(open);
  });

  it('draws the Lightning address as a QR code when the sheet first opens', async () => {
    const { win, open, sheet } = setUp();
    await initSupport(win);
    const box = sheet.querySelector('[data-qr]')!;
    expect(box.childElementCount).toBe(0);
    open.click();
    await vi.waitFor(() => expect(box.querySelector('svg')).not.toBeNull());
    const svg = box.querySelector('svg')!;
    const { size, d } = qrPath(`lightning:${RAILS.lightningAddress}`);
    expect(svg.getAttribute('viewBox')).toBe(`-2 -2 ${size + 4} ${size + 4}`);
    expect(svg.querySelector('path')?.getAttribute('d')).toBe(d);
    expect(svg.getAttribute('aria-hidden')).toBe('true');

    sheet.close();
    open.click();
    await Promise.resolve();
    expect(box.querySelector('svg')).toBe(svg);
  });

  it('copies an address, says so for a moment, then puts the button back', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn((_text: string) => Promise.resolve());
    const { win, open, sheet } = setUp({ clipboard: { writeText } });
    await initSupport(win);
    open.click();
    const copy = sheet.querySelector<HTMLButtonElement>('button[data-copy="payId"]')!;
    const status = sheet.querySelector('[data-status]')!;

    copy.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(writeText).toHaveBeenCalledWith(RAILS.payId);
    expect(copy.textContent).toBe(t.copied);
    expect(status.textContent).toBe(t.copied);

    // A second copy starts the moment again.
    await vi.advanceTimersByTimeAsync(1000);
    copy.click();
    await vi.advanceTimersByTimeAsync(1000);
    expect(copy.textContent).toBe(t.copied);
    await vi.advanceTimersByTimeAsync(500);
    expect(copy.textContent).toBe(t.copy);
    expect(status.textContent).toBe('');
  });

  it('copies through a selected text in the sheet when the clipboard refuses', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn(() => Promise.reject(new DOMException('denied', 'NotAllowedError')));
    const { win, open, sheet } = setUp({ clipboard: { writeText } });
    let selected = '';
    const execCommand = vi.fn((command: string) => {
      selected = sheet.querySelector('textarea')?.value ?? '';
      return command === 'copy';
    });
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });
    await initSupport(win);
    open.click();
    const copy = sheet.querySelector<HTMLButtonElement>('button[data-copy="lightningAddress"]')!;

    copy.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(selected).toBe(RAILS.lightningAddress);
    expect(sheet.querySelector('textarea')).toBeNull();
    expect(copy.textContent).toBe(t.copied);
  });

  it('leaves the button alone when nothing could be copied', async () => {
    vi.useFakeTimers();
    const { win, open, sheet } = setUp();
    Object.defineProperty(document, 'execCommand', { value: () => false, configurable: true });
    await initSupport(win);
    open.click();
    const copy = sheet.querySelector<HTMLButtonElement>('button[data-copy="payId"]')!;
    copy.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(copy.textContent).toBe(t.copy);
    expect(sheet.querySelector('[data-status]')?.textContent).toBe('');
  });
});
