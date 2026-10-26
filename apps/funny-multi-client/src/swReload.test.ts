// SPDX-License-Identifier: AGPL-3.0-only

import { afterEach, describe, expect, it, vi } from 'vitest';

type Listener = () => void;

async function install(controller: object | null) {
  const listeners: Listener[] = [];
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      controller,
      addEventListener: (_: string, fn: Listener) => listeners.push(fn),
    },
  });
  const reload = vi.fn();
  Object.defineProperty(window, 'location', { configurable: true, value: { reload } });
  vi.resetModules();
  const { installSwReloadListener, setReloadSafe } = await import('./swReload');
  installSwReloadListener();
  return { fire: () => listeners.forEach((fn) => fn()), reload, setReloadSafe };
}

describe('installSwReloadListener', () => {
  const location = window.location;
  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: location });
  });

  // Regression: the first clientsClaim on a first visit reloaded the page
  // and wiped the room being set up (fixed in Funny One first, Step 35).
  it('does not reload when the first service worker claims the page', async () => {
    const { fire, reload } = await install(null);
    fire();
    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads once when an update replaces an existing controller', async () => {
    const { fire, reload } = await install({});
    fire();
    fire();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  // B-26 (Step 94): an update that lands mid-game waits for Home.
  it('holds an update while a reload is not safe, then reloads once it is', async () => {
    const { fire, reload, setReloadSafe } = await install({});
    setReloadSafe(false);
    fire();
    expect(reload).not.toHaveBeenCalled();
    setReloadSafe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reloads a held update only once', async () => {
    const { fire, reload, setReloadSafe } = await install({});
    setReloadSafe(false);
    fire();
    fire();
    setReloadSafe(true);
    setReloadSafe(false);
    setReloadSafe(true);
    fire();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload on becoming safe when no update is held', async () => {
    const { reload, setReloadSafe } = await install({});
    setReloadSafe(false);
    setReloadSafe(true);
    expect(reload).not.toHaveBeenCalled();
  });

  it('does not hold the first claim for later either', async () => {
    const { fire, reload, setReloadSafe } = await install(null);
    setReloadSafe(false);
    fire();
    setReloadSafe(true);
    expect(reload).not.toHaveBeenCalled();
  });
});
