// SPDX-License-Identifier: AGPL-3.0-only

// Shared Playwright driver for apps/funny-one-client: plays one full game from
// the home screen to the end screen. Used by funny-one-screens.mjs (every
// screen, every language) and funny-one-offline.mjs (FO-IMG-2 airplane-mode
// playthrough), so both exercise the game the same way.
//
// Selectors come from the language's own catalog, so the driver works for
// every language and fails loudly if a key renders differently from the JSON.

/** `{{name}}` interpolation, the same way i18next does it. */
export function fill(text, vars = {}) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ''));
}

/**
 * From a loaded home screen: adds a second human seat, starts, and answers
 * every round until the end screen shows. `onScreen(name)` fires once per
 * screen type the first time it appears ('1-home', '2-handoff', '3-thinking',
 * '4-round'); await it to screenshot. Throws if the end screen never shows.
 * `botName` is the virtual seat's name, for a caller that renames it on
 * '1-home' (store-screens.mjs).
 */
export async function playToEnd(page, cat, onScreen = async () => {}, { botName = 'Bot 1' } = {}) {
  await page.getByText(cat.home.subtitle).waitFor();
  // A second human so the seat list shows both row kinds and the game shows
  // a real handoff between two people.
  await page.getByRole('button', { name: cat.home.addPlayer, exact: true }).click();
  await onScreen('1-home');

  await page.getByRole('button', { name: cat.home.start, exact: true }).click();
  const seen = new Set();
  const first = async (name) => {
    if (seen.has(name)) return;
    seen.add(name);
    await onScreen(name);
  };
  // Default seat names are "Player 1", "Player 2", "Bot 1" (HomeScreen.tsx).
  const thinking = page.getByText(fill(cat.thinking.title, { name: botName }));
  const endTitle = page.getByText(cat.end.title);
  // Only while unsubmitted: after a pick the button reads round.submitted
  // until the next seat's screen replaces the round.
  const submit = page.getByRole('button', { name: cat.round.submit, exact: true });
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline && !(await endTitle.isVisible())) {
    if (await thinking.isVisible()) {
      await first('3-thinking');
      await page.waitForTimeout(200);
    } else if (await submit.isVisible()) {
      await page.getByRole('radio').first().click();
      await first('4-round');
      await submit.click();
    } else if (await page.getByText(cat.handoff.subtitle).isVisible()) {
      await first('2-handoff');
      await page.getByRole('button').first().click();
    } else {
      await page.waitForTimeout(100);
    }
  }
  if (!(await endTitle.isVisible())) throw new Error('never reached the end screen');
}
