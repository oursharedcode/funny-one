---
name: run-funny-one
description: Launch Funny One (apps/funny-one-client) in a headless phone-sized browser, play a full game per UI language and screenshot every screen. Use to verify a Funny One UI change in the real app, check RTL (he) or text overflow (de, ta), or eyeball a translation.
---

# Run Funny One in a browser

One command. It starts its own Vite dev server in-process (no `npm run dev` needed),
plays a whole game (2 humans + 1 bot, first option every time) and writes
screenshots to `.screens/` (gitignored):

```
npm run build -w packages/shared        # only if packages/shared changed
node scripts/funny-one-screens.mjs he de ta ru      # any language codes; default: en
node scripts/funny-one-screens.mjs --width 320 ta   # narrower phone; default 360
```

Per language it prints `dir=`, an overflow count, and console/page errors. Exit code 1 on
any error or a game that never reaches the end screen (then see `<lang>-stuck.png`).

Screenshots per language: `<lang>-1-home`, `-2-handoff`, `-3-thinking`, `-4-round`,
`-5-end` (end is taken ~2.5 s in, after the first story's reveal settles).

## Reading the results

- Overflow detection only catches content wider than its box (clipped text, horizontal
  page scroll). Wrapping onto more lines is not flagged, so look at the screenshots too.
- For RTL (`he`), check that mirrored elements point the right way. Flex order flips
  automatically, but glyphs like ◀ ▶ don't; they need `rtl:-scale-x-100`.
- Buttons are found by each language's own catalog text (`exact: true`), so a failed
  click usually means the catalog and the rendered string disagree. That is a real finding.
- Default seat names ("Player 1", "Bot 1") are hard-coded English in `HomeScreen.tsx`,
  not catalog strings.
- Run it outside the sandbox, the same as `npm test`.
