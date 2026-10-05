# Acceptance test — «Одна Чепуха: по кругу» on production

The script for the owner's device session (T-FO-7.1, Gate FO), run against
**https://www.funny1.oursharedcode.com/** (its own host since Step 60, 2026-10-05; the former
address `https://www.staging-oursharedcode.com/funny1-game/` forwards there). Modelled on
`docs/ACCEPTANCE.md` (Funny Multi's session). Funny One has no server, so no agent is needed
on the call.

**Devices:** one Android phone. No iPhone is available, so the iPhone install leg (A1) is
recorded as _deferred_, not failed.

**Headless pre-check (Step 39, 2026-09-27):** all 15 languages played a full game against the
then-live URL (the former address) in a 360 px phone-sized Chromium —
`node scripts/funny-one-screens.mjs <15 langs> --url <live URL> --out .screens/live`
— 0 overflow, 0 console errors, `he` reports `dir=rtl`. The phone pass below only confirms what
a real device changes: system fonts, touch, install, airplane mode.

Record the version shown in the page footer (e.g. `v0.1.0 · 2026-09-26`).

---

## Part A — install

| #   | Check                                                                                  | Pass when                                                                                                   |
| --- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| A1  | **iPhone install** (Safari → Share → Add to Home Screen).                              | Icon on the home screen, opens full-screen at the host's root. _Deferred — no iPhone._                        |
| A2  | **Android install** (Chrome → ⋮ → Install app / the install banner).                   | Installs; the launcher icon opens the app standalone (no browser chrome) at the host's root. A Play Protect warning is known (B-8) — note it, tap _Install anyway_. |
| A3  | **Maskable-icon clip check**: the launcher icon and the app-switcher tile.             | _Deferred until real icons_ — the current icons are placeholders (owner decision 2026-09-27).               |
| A4  | **Jank check** during Part B's game: handoff screen, the rig picture's reveal, the gallery arrows. | Smooth to the eye — no stutter or layout jumps.                                                    |

## Part B — one full game (Russian, online)

Use the installed app from A2.

| #   | Step                                                                                                   | Pass when                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| B1  | Open the app. Pick Russian in the language list if it is not already selected.                         | Home shows the title, the rules card, the seat list (_Player 1_ + _Bot 1_), **add player** / **add bot** and **start**.           |
| B2  | Add one more player, rename both human seats (tap the name field). Tap **start**.                      | A handoff screen asks you to pass the phone to the first player.                                                                  |
| B3  | Play all 7 questions for every human seat: tap an answer, tap **submit**, then pass on at the handoff. | Each round shows _Question n of 7_, the question and a list of answers; submit is disabled until you pick. The bot's turn shows a short "thinking" screen and moves on by itself. |
| B4  | After the last answer.                                                                                 | End screen: a gallery with one story per seat — the composited picture and the prose with the picked phrases highlighted; arrows and _1 / 3_. |
| B5  | Page through every story, then tap **download** on one.                                                | The picture saves to the phone and opens in the gallery app with its story text.                                                 |
| B6  | Tap **play again**, then **change players**.                                                          | _Play again_ starts a new game with the same seats; _change players_ returns to home.                        |

## Part C — offline

| #   | Check                                                                                                                  | Pass when                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| C1  | **Full game in airplane mode.**                                                                                        | **Pass, 2026-09-26 (Step 38)** — Samsung phone, Russian, full game to the end screen, story exported. Counted for Gate FO (owner decision 2026-09-27). |
| C2  | Re-confirm: airplane mode on, **force-close** the app, open it from the launcher, play one game in any other language. | Opens with no network error, plays to the end screen, pictures render.                                |

## Part E — pictures from the Internet (D-10, added 2026-10-05)

The start screen now offers **Pictures: Built in / From the Internet**. Built in is the
default and is what Parts B–D exercise. Do Part E online, in any language.

| #   | Check                                                                                                              | Pass when                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | On home, look at the **Pictures** choice.                                                                          | Two options; _Built in_ is selected on a first visit; the hint under them says no Internet is needed.                                 |
| E2  | Pick **From the Internet**, play one game to the end screen.                                                       | Each story shows a full cartoon (a square picture, not the layered built-in drawing) after a short placeholder; the footer note names the picture library. |
| E3  | Tap **download** on a story whose cartoon is showing.                                                              | The saved picture carries that cartoon, the story text and the QR code.                                                               |
| E4  | Still on _From the Internet_: turn on airplane mode, tap **play again**, play to the end.                          | No error: every story shows the built-in drawing instead.                                                                             |
| E5  | Airplane mode off. Close the app and open it again.                                                                | Home opens with _From the Internet_ still selected. Switch back to _Built in_ if you prefer it — that is remembered too.              |

## Part D — languages on the phone

Headless covered all 15 (above). On the phone, check these six: on home, open the language
list and pick the language, then play one game (airplane mode is fine) and look at home, a
round and the end screen. The other nine pass on the headless screenshots.

| #   | Language            | Look for                                                                                                                               |
| --- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | `ru` Russian        | Already covered by Part B — tick if B passed.                                                                                           |
| D2  | `en` English        | Baseline: nothing clipped, all text in English except player names.                                                                     |
| D3  | `he` Hebrew         | Whole layout mirrors: text right-aligned, the question counter on the right, answers read naturally right-to-left. Exported picture's Hebrew text renders LTR — **known, deferred**, note only. |
| D4  | `ta` Tamil          | The longest strings: title wraps onto two lines, the **add bot** button wraps inside its box, nothing cut off at the right edge.        |
| D5  | `ja` / `ko` / `zh`  | One of the three is enough; do all three if quick. Real CJK glyphs everywhere — no empty boxes (tofu) and no mixed-font jumps inside a line. |
| D6  | `de` German         | Long compound words in buttons wrap or fit — none cut off mid-word.                                                                     |

Known in every language, not a failure: the default seat names _Player 1_ / _Bot 1_ stay in
English (they are editable), and every `home.title` except `en`/`ru` awaits native-speaker
review.

---

## Results

| Field     | Value |
| --------- | ----- |
| Date      |       |
| Version   |       |
| Phone     |       |
| Tester    | owner |

| #   | Result (pass / fail / deferred) | Note                      |
| --- | ------------------------------- | ------------------------- |
| A1  | deferred                        | no iPhone                 |
| A2  |                                 |                           |
| A3  | deferred                        | placeholder icons         |
| A4  |                                 |                           |
| B1  |                                 |                           |
| B2  |                                 |                           |
| B3  |                                 |                           |
| B4  |                                 |                           |
| B5  |                                 |                           |
| B6  |                                 |                           |
| C1  | pass                            | Step 38, 2026-09-26       |
| C2  |                                 |                           |
| E1  |                                 |                           |
| E2  |                                 |                           |
| E3  |                                 |                           |
| E4  |                                 |                           |
| E5  |                                 |                           |
| D1  |                                 |                           |
| D2  |                                 |                           |
| D3  |                                 |                           |
| D4  |                                 |                           |
| D5  |                                 |                           |
| D6  |                                 |                           |

**Sign-off:** T-FO-7.1 passes when A2, A4 and every B, C, D and E row is _pass_. Gate FO then
closes once the six gates are clean on the commit that records the results. Deferred, not
blocking Gate FO (owner decision 2026-09-27): A1 (iPhone), A3 (real icons, still required
before any announcement), the Hebrew export's LTR text, and native review of the `home.title`s.
