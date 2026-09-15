# Acceptance test — «Чепуха 37» on production

The script for the owner's single device session (T-8.2 + Gate 7's device legs), run against
**https://www.staging-oursharedcode.com/funny37-game/**. Adapted from SRC spec §19 (free-text
answers → combobox picks from the answer pools; base64 pictures → URL images served by the
Worker's `/i/<hash>`; 7 rounds, unchanged). Extras from design §13: disconnect-mid-game → bot,
the daily image cap, and a cache-hit replay.

**Devices (owner decision 2026-09-15):** two desktop Chrome tabs + one Android phone. No iPhone
is available, so the iPhone install leg (A1) is recorded as *deferred*, not failed; Gate 7 stays
open on that one leg until an iPhone is borrowed.

**Roles:** A = host on desktop 1, B = desktop 2, C = the Android phone. The agent is on the
call for the two server flips (Part C) — each is one `.env` edit on the VM plus a container
restart (~1 minute); the game state is in memory, so a restart ends the current room and the
flow after each flip starts with a fresh room.

Fill in the template at the end as you go. Record the app commit shown in the page footer /
`git rev-parse --short HEAD` of what `deploy/ship.sh` shipped.

---

## Part A — Gate 7 device legs

| #   | Check                                                                                                                                                                                                                                                                                                                                                                       | Pass when                                                                                                           |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| A1  | **iPhone install** (Safari → Share → Add to Home Screen).                                                                                                                                                                                                                                                                                                                   | Icon on the home screen, opens full-screen at `/funny37-game/`. _Deferred this session — no iPhone._                |
| A2  | **Android install** (Chrome → ⋮ → Install app / the install banner) on C.                                                                                                                                                                                                                                                                                                   | Installs; the launcher icon opens the app standalone (no browser chrome) at `/funny37-game/`.                       |
| A3  | **Maskable-icon clip check** on C: look at the launcher icon and the app-switcher tile.                                                                                                                                                                                                                                                                                     | The mascot's ears/hair are not cut off by the round/squircle mask. If clipped, note it — the art sits near the edge. |
| A4  | **Jank check** on C during a full game: the timer bar's final 10 s, the submit-confirm mascot, the picture flourish on reveal, the gallery swipe.                                                                                                                                                                                                                            | Animations are smooth to the eye — no stutter, no dropped frames you can notice, no layout jumps.                   |

## Part B — SRC §19 checklist, adapted

Use the installed app on C (from A2) for the whole of Part B; A and B use desktop Chrome.

| #   | Step                                                                                                                                                                                                                   | Pass when                                                                                                                                                                                                                                                                     |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | A opens the production URL, enters a nickname, **Create room** with story language English.                                                                                                                            | Lobby shows a 6-character room code, **Copy link**, and a QR code captioned _Scan to join_. Home screen showed _Up to N cartoons per day_ and _Open rooms_ before creating.                                                                                                    |
| B2  | C scans the QR with the phone camera; B pastes the copied link. Both type nicknames (≥ 3 characters — a 2-letter one is rejected with _Invalid nickname_).                                                             | All three see each other in the lobby; A is marked _Host_; **Start Game** is disabled until the third player arrives (_Need at least 3 players to start_).                                                                                                                    |
| B3  | A taps **Start Game**.                                                                                                                                                                                                 | All three see _Round 1 of 7_, the question **Who?**, a combobox of answers and a 60-second timer bar.                                                                                                                                                                         |
| B4  | **Combobox — pick and filter.** In round 1 pick by tapping an item from the list. In round 2 type a few letters to filter the list, then pick. In round 3 try **Submit** with nothing picked.                          | Tap-pick and type-to-filter both select an answer; **Submit** stays disabled with _Pick an answer first_ until something is picked; after submit the button reads _Submitted_ and the submit-confirm mascot plays.                                                            |
| B5  | **Timer expiry.** In round 4, C does not submit. Wait out the 60 s.                                                                                                                                                    | Round advances for everyone; C's slot is auto-filled (no error on C). In rounds 5–7 everyone submits — the round advances as soon as the last player submits, without waiting for the timer.                                                                                  |
| B6  | Play through all 7 rounds (Who? · And who else? · Where? · When? · What did they do? · What for? · What happened in the end?).                                                                                          | The _Waiting on others_ screen shows _n / 3 submitted_ between rounds; no player is stuck.                                                                                                                                                                                    |
| B7  | **Reveal.** After round 7.                                                                                                                                                                                             | Each player sees _Here's your story_: prose with the 7 picked phrases highlighted, and the spinner _Summoning chaos…_ starts on its own (no "Generate" button in this game — generation is automatic).                                                                         |
| B8  | **Picture arrives.**                                                                                                                                                                                                   | Within ~15 s a goofy cartoon fades in with the flourish. It is an `<img>` loaded from the Worker's `/i/<hash>` URL (long-press on C → image URL, or DevTools on A/B) — not a `data:` URL. Each player's picture matches their own story.                                       |
| B9  | **Gallery.** Everyone taps **Continue** → the end screen reads _Rounds are over_. A (host) taps **Share the room's pictures**. | _Room gallery_ appears for all three with every story and picture, _n / 3_ counter, Previous/Next work, **Share** and the **Download** buttons function on C (the 5-second video download completes). |
| B10 | **End screen — roles.** | A sees **One more game** + **Finish Game**. B and C see the _I'm ready for a new game_ toggle and _Waiting for host…_. |
| B11 | **Restart.** B and C tap Ready (button reads _Ready ✓_). A taps **One more game**.                                                                                                                                     | All return to _Round 1 of 7_ in the same room (same code), with fresh stories.                                                                                                                                                                                                |
| B12 | **Cache-hit replay.** In this second game every player picks **exactly the same answers as in game 1** (write them down in game 1). Before A starts game 2 the agent reads the Worker's `/stats` counter; again after. | The three stories are identical to game 1; each reveal's picture appears **instantly** (no _Summoning chaos…_ wait beyond a moment); the `/stats` generated-today counter is **unchanged** (R2 cache hit, FM-TIER-1).                                                          |
| B13 | **Finish.** Reach the end screen; A taps **Finish Game**.                                                                                                                                                              | All three see _Game is over_ with the end-screen art. The footer's _Source on GitHub_ link and the content notice are present.                                                                                                                                                |
| B14 | **Disconnect → bot.** New room, start a game. Mid-round-2 B closes the tab (do not reopen).                                                                                                                             | Within ~65 s (60 s recovery window + 5 s grace) A sees the _B exited_ notice with **Ignore, continue the game** / **Create a new room**; A picks _Ignore_. B shows in the player list as a bot (🤖, dimmed). The game completes through reveal with B's answers auto-filled.   |
| B15 | **Reconnect within the window.** New room, start a game. Mid-round C locks the phone / switches app for ~20 s, then returns.                                                                                           | C is back in the same round with the timer still running; no _exited_ notice on A; C is not a bot.                                                                                                                                                                            |
| B16 | **Russian room.** A switches the UI language (tap the language control on the home screen) to Russian and creates a room with story language Russian; B and C join.                                                    | The wordmark reads **Чепуха 37**; all UI strings, questions, answer pools and the reveal prose are Russian and the declined phrases read grammatically; the cartoon still reflects the story. (The prompt sent to the Worker is Russian text — nothing to check on the phone.) |
| B17 | **RTL sanity.** A switches the UI language to Hebrew, opens the home screen and the lobby.                                                                                                                             | Layout mirrors (text right-aligned, controls flip), nothing overflows or overlaps. Switch back to English.                                                                                                                                                                    |

_Dropped from SRC §19:_ item 5 (profane answer → stand-in) — this game has no free-text
answers; every pick comes from the vetted answer pools, so there is nothing to filter. Item 7's
"Generate Picture" button — generation is automatic on reveal here.

## Part C — server-side flows (agent flips the VM, then restores)

Each flip: the agent edits `~/funny/.env` on the VM over SSH, restarts the app container
(`docker compose --profile caddy up -d`), and confirms `/health`. The in-memory counter and
rooms reset with the restart, so **start a fresh room after each flip**.

| #   | Flip                                                                                                                                                                                                                                 | Step                                                                                                                                                | Pass when                                                                                                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | **Daily cap.** Agent sets `MAX_IMAGES_PER_DAY=1`, restarts.                                                                                                                                                                          | New English room, full game, **with picks different from any earlier game** (so no cache hit). Reach reveal.                                        | Exactly one player gets a cartoon; the other two see _The cartoon oven is full. New cartoons in ~N hours._ with **no** _Try again_ button and no blank screen; the gallery shows _No picture for this story_ for those two. Then open the home screen / create another room: the lobby shows the _Picture generation is unavailable…_ notice. |
| C2  | **Dead Worker.** Agent restores `MAX_IMAGES_PER_DAY` (remove the line → default 25) and sets `CLOUDFLARE_WORKER_SECRET` to a wrong value, restarts.                                                                                  | New room, full game with fresh picks. Reach reveal.                                                                                                 | Each player sees _Generation failed. Try again._ with a **Try again** button and the error mascot; tapping it retries and fails again gracefully; **Continue** still leads to the gallery (_No picture for this story_). Nothing crashes.                                                                                                     |
| C3  | **Restore.** Agent puts the real secret back (from `~/.cloudflare/worker-secret`), restarts, confirms `/health` and one scripted generation from this PC.                                                                            | A creates one more room; play to a reveal (fresh picks).                                                                                            | Pictures generate normally again — production is back to its shipped configuration.                                                                                                                                                                                                                                                       |

---

## Results

| Field            | Value                                            |
| ---------------- | ------------------------------------------------ |
| Date             | 2026-09-15 → 2026-09-16 (one session, crossed UTC midnight) |
| App commit       | 3548b56, plus the `icon-512-maskable.png` change made and deployed mid-session (Step 15) |
| URL              | https://www.staging-oursharedcode.com/funny37-game/ |
| A (host)         | desktop Chrome — Windows 10 (owner's PC)         |
| B                | desktop Chrome — second tab/window on the same PC |
| C                | Android phone — owner's (model not recorded)     |
| Tester(s)        | owner (all three seats); agent drove Part C's VM flips |

| #   | Result (pass / fail / deferred) | Note                     |
| --- | ------------------------------- | ------------------------ |
| A1  | deferred                        | no iPhone this session   |
| A2  | pass                            | Installed, opens standalone. **Flag:** Google Play Protect showed "Unsafe app blocked — built for an older version of Android" on both install attempts; "Install anyway" was needed. Every real installer will see this — investigate separately (post-session). |
| A3  | pass                            | Full-bleed art survived the squircle mask, but the ears/hair sat at the edge; owner asked for headroom. Fixed mid-session: dedicated `icon-512-maskable.png` (art at 80 %, padded in its own background pink), redeployed, re-installed, confirmed. |
| A4  | pass                            | No stutter noticed during the full playthrough on C (timer bar, submit mascot, reveal flourish). Not instrumented — eye check only. |
| B1  | pass                            |                          |
| B2  | pass                            |                          |
| B3  | pass                            |                          |
| B4  | pass                            | Tap-pick and Submit-disabled confirmed. Type-to-filter **waived** (owner decision 2026-09-16, "not needed"). |
| B5  | pass                            |                          |
| B6  | pass                            |                          |
| B7  | pass                            |                          |
| B8  | pass                            |                          |
| B9  | pass                            | Story and picture downloads worked. |
| B10 | pass                            |                          |
| B11 | pass                            |                          |
| B12 | skipped                         | Owner decision 2026-09-16. The "cache hit costs no slot" path is unit-tested on the server (`image.test.ts`); the live end-to-end `/stats` counter check was not run. |
| B13 | pass                            |                          |
| B14 | pass                            |                          |
| B15 | skipped                         | Owner decision 2026-09-16. |
| B16 | skipped                         | Owner decision 2026-09-16. |
| B17 | pass                            |                          |
| C1  | pass                            | Agent set `MAX_IMAGES_PER_DAY=1` over SSH. |
| C2  | pass                            | Owner swapped the secret by hand — the agent harness refuses writes to `*_SECRET=` lines. Try again failed gracefully; Continue → gallery "No picture for this story". |
| C3  | pass                            | Secret restored from `~/.cloudflare/worker-secret` (scp'd from the owner's PC to the VM first — it had never been on the VM). `/health` OK; a fresh room generated normally. |

**Sign-off:** T-8.2 passes when every B and C row is _pass_. Gate 7 closes when A2–A4 pass and
A1 is later run on a borrowed iPhone. Gate 8 additionally needs the "stranger self-deploys from
README alone" judgement, made against `DEPLOYMENT.md` after this session.
