# Funny One rig art — spec (T-FO-4.1)

Status: **40 scene assets + 22 `when` badges + 22 `why` bubbles drawn; `end` overlays pending
(T-FO-4.2c).** Started as a 4-asset vertical slice to validate the style before drawing the
rest (see "Draft 4" below); everything since followed the same conventions. Governed by
`DESIGN_SYSTEM.md` §5 (mascot construction rules) — rig art is drawn in the same hand, so both
products read as one family.

## The 40 (scene) + 66 (overlays)

Four pool slots are scene art (`packages/shared/src/pools/options.ts`), 10 options each: `who`
(slot 0), `with` (slot 1), `where` (slot 2), `did` (slot 4) → 10⁴ = 10,000 scene combinations
from 40 assets.

Owner decision 2026-09-22 (FO-IMG-1 amended): the three prose slots — `when` (3), `why` (5),
`end` (6), 22 options each — get overlay art too, so every answer in a story is on the picture:
`when` as a badge, `why` as a thought bubble, `end` as a stamp. One gated sub-step per slot
(T-FO-4.2a/b/c). Full set: 106 assets, 10⁴ × 22³ ≈ 1.06 × 10⁸ distinct pictures.

## File / id mapping

`rig/<slot>/<PascalCase of the id's slug>.tsx`, e.g. pool id `where.messy-kitchen` →
`rig/where/MessyKitchen.tsx`. Default export, `className` prop only — no other props, same
contract as the existing mascots (`BotAvatar.tsx` etc.) — the future compositor (T-FO-4.2) sizes
everything by parent class, never by props.

Registry: `rigIndex.ts` (T-FO-4.2) maps every id above to its component; `rigIndex.test.ts`
keeps it bijective with the pools it covers.

## Canvas conventions

| Slot                  | viewBox       | Role in the composited scene                                                                  |
| --------------------- | ------------- | --------------------------------------------------------------------------------------------- |
| `where` (background)  | `0 0 400 300` | Full-bleed, `preserveAspectRatio="xMidYMid slice"`. z-index 0.                                |
| `who` (character)     | `0 0 100 100` | Stage-left third, bottom-anchored (standing "in" the scene, not floating). z-index 1.         |
| `with` (co-character) | `0 0 100 100` | Stage-right third, bottom-anchored. z-index 2.                                                |
| `did` (prop)          | `0 0 100 100` | Foreground, roughly centered, bridging `who`/`with` so the action reads as shared. z-index 3. |
| `when` (badge)        | `0 0 100 100` | Sticker pinned top-left (22% × 30% of the frame), drops in from above. z-index 4.             |
| `why` (bubble)        | `0 0 100 100` | Thought bubble over `who`'s head, just inboard of the badge (22% × 30%). z-index 5.           |
| `end` (stamp)         | `0 0 100 100` | Stamp top-right, slightly rotated. z-index 6. _Pending T-FO-4.2c._                            |

400×300 (4:3) is locked (owner, 2026-09-22): the compositor layout fits it and there's no reason
to redraw. Every `when` badge draws on the shared `when/Plate.tsx` sticker (hard ink shadow under a
wobbly cream card) so the 22 read as one set over any background; the icon stays inside roughly
x 16–84 / y 18–80 of the plate.

Every `why` overlay does the same on `why/Bubble.tsx`: a scalloped cream cloud over a hard ink
shadow, with two trailing dots down-left — toward `who`'s head, which is why the layer sits where
it does. Icons stay inside roughly x 22–82 / y 16–64, tighter at the corners, so nothing collides
with the scallops.

## Style rules (DESIGN_SYSTEM §5, applied to rig art)

- **Eyes are mandatory and exaggerated** on anything with a face (characters, co-characters —
  backgrounds and most props are unfaced). At least one eye misaligned by 1–3px at design size.
- **Outlines are visible**: `stroke="#1f2937"` `stroke-width="2.5"` on filled shapes.
- **Hand-drawn imperfection**: wobbly Bezier curves, no perfectly straight edges except
  intentional geometric elements (counters, tile grids).
- **Fill palette is restricted** to the brand tokens (`DESIGN_SYSTEM.md` §2: `#ec4899` pink,
  `#fef3c7` cream, `#1f2937` ink, `#facc15` mascot-yellow, `#60a5fa` mascot-blue, plus state
  colors `#f59e0b`/`#ef4444`/`#10b981` where a narrative reason fits).
- **No gradients.** Flat fills only.

## Not this file's concern

Random pick, dedup (FO-IMG-4) and same-slot exclusion already live in the game logic
(FO-BOT-1's existing pattern) — the rig art itself has no selection logic.

## Draft 4

The original 4-asset slice, drawn first to validate the style before the other 36:

| id                      | file                       | note                                          |
| ----------------------- | -------------------------- | --------------------------------------------- |
| `where.messy-kitchen`   | `where/MessyKitchen.tsx`   | counters, hanging pots, flour cloud           |
| `who.grumpy-pirate`     | `who/GrumpyPirate.tsx`     | huge feathered hat, V eyebrows                |
| `with.angry-geese`      | `with/AngryGeese.tsx`      | three geese, wings spread, honking            |
| `did.juggling-pancakes` | `did/JugglingPancakes.tsx` | pancake stack + flying discs with motion arcs |

Note: `AngryGeese.tsx` originally clipped the third goose's beak past its own viewBox — a real
coordinate bug, not a CSS issue — fixed by pulling the goose transforms back inside bounds. Worth
double-checking on any new asset with off-center elements.

## The other 36

| slot    | id                              | file                              |
| ------- | ------------------------------- | --------------------------------- |
| `where` | `where.cheese-factory`          | `where/CheeseFactory.tsx`         |
| `where` | `where.underwater-canyon`       | `where/UnderwaterCanyon.tsx`      |
| `where` | `where.cookbook-library`        | `where/CookbookLibrary.tsx`       |
| `where` | `where.giant-sock-drawer`       | `where/GiantSockDrawer.tsx`       |
| `where` | `where.gloomy-birthday`         | `where/GloomyBirthday.tsx`        |
| `where` | `where.cramped-elevator`        | `where/CrampedElevator.tsx`       |
| `where` | `where.cloud-castle`            | `where/CloudCastle.tsx`           |
| `where` | `where.snowy-mountain`          | `where/SnowyMountain.tsx`         |
| `where` | `where.jungle-treehouse`        | `where/JungleTreehouse.tsx`       |
| `who`   | `who.sleepy-llama`              | `who/SleepyLlama.tsx`             |
| `who`   | `who.confused-penguin`          | `who/ConfusedPenguin.tsx`         |
| `who`   | `who.overconfident-raccoon`     | `who/OverconfidentRaccoon.tsx`    |
| `who`   | `who.tiny-dragon`               | `who/TinyDragon.tsx`              |
| `who`   | `who.cats-in-a-trench-coat`     | `who/CatsInATrenchCoat.tsx`       |
| `who`   | `who.retired-superhero`         | `who/RetiredSuperhero.tsx`        |
| `who`   | `who.skating-grandma`           | `who/SkatingGrandma.tsx`          |
| `who`   | `who.time-traveling-accountant` | `who/TimeTravelingAccountant.tsx` |
| `who`   | `who.muddy-knight`              | `who/MuddyKnight.tsx`             |
| `with`  | `with.haunted-toaster`          | `with/HauntedToaster.tsx`         |
| `with`  | `with.philosophical-goldfish`   | `with/PhilosophicalGoldfish.tsx`  |
| `with`  | `with.riddle-robot`             | `with/RiddleRobot.tsx`            |
| `with`  | `with.professor-goat`           | `with/ProfessorGoat.tsx`          |
| `with`  | `with.lost-tourist`             | `with/LostTourist.tsx`            |
| `with`  | `with.giant-snail`              | `with/GiantSnail.tsx`             |
| `with`  | `with.tuba-frog`                | `with/TubaFrog.tsx`               |
| `with`  | `with.talking-mailbox`          | `with/TalkingMailbox.tsx`         |
| `with`  | `with.opera-walrus`             | `with/OperaWalrus.tsx`            |
| `did`   | `did.baking-giant-cake`         | `did/BakingGiantCake.tsx`         |
| `did`   | `did.painting-polka-dots`       | `did/PaintingPolkaDots.tsx`       |
| `did`   | `did.sorting-clouds`            | `did/SortingClouds.tsx`           |
| `did`   | `did.dancing-tango`             | `did/DancingTango.tsx`            |
| `did`   | `did.stacking-chairs`           | `did/StackingChairs.tsx`          |
| `did`   | `did.staring-contest`           | `did/StaringContest.tsx`          |
| `did`   | `did.flying-kites`              | `did/FlyingKites.tsx`             |
| `did`   | `did.eating-spaghetti`          | `did/EatingSpaghetti.tsx`         |
| `did`   | `did.digging-with-spoons`       | `did/DiggingWithSpoons.tsx`       |

Implementer-drafted, designer-reviewed (same standing as the mascot library, DESIGN_SYSTEM §5):
launch criterion is "it exists and it's goofy," not "it's final." All 40 rendered and reviewed
together (composed grid screenshot) before this note was written — no clipping or off-palette
fills found beyond the one already noted above.

## The 22 `when` badges (T-FO-4.2a)

| id                           | file                           | on the plate                             |
| ---------------------------- | ------------------------------ | ---------------------------------------- |
| `when.small-earthquake`      | `when/SmallEarthquake.tsx`     | tilted house over a zigzag crack         |
| `when.solar-eclipse`         | `when/SolarEclipse.tsx`        | ink moon sliding over a sun, corona      |
| `when.after-breakfast`       | `when/AfterBreakfast.tsx`      | fried egg, toast, fork                   |
| `when.someone-elses-wedding` | `when/SomeoneElsesWedding.tsx` | interlocked rings, hearts                |
| `when.wrong-feeling-tuesday` | `when/WrongFeelingTuesday.tsx` | calendar, circled day, question mark     |
| `when.clocks-stopped`        | `when/ClocksStopped.tsx`       | bent-hand clock, popped spring, crack    |
| `when.three-in-the-morning`  | `when/ThreeInTheMorning.tsx`   | crescent moon, stars, clock at three     |
| `when.hat-festival`          | `when/HatFestival.tsx`         | sombrero + top hat + party cone, bunting |
| `when.internet-outage`       | `when/InternetOutage.tsx`      | wifi arcs struck through, sad base dot   |
| `when.seagull-decision`      | `when/SeagullDecision.tsx`     | smug seagull under a lit bulb            |
| `when.last-day-of-summer`    | `when/LastDayOfSummer.tsx`     | sun sinking into waves, falling leaf     |
| `when.thunderstorm`          | `when/Thunderstorm.tsx`        | grumpy cloud, bolt, rain                 |
| `when.first-snow`            | `when/FirstSnow.tsx`           | three flakes onto a fresh mound          |
| `when.school-holidays`       | `when/SchoolHolidays.tsx`      | tossed backpack, sun, flying book        |
| `when.full-moon`             | `when/FullMoon.tsx`            | cratered sleepy moon, stars, cloud wisp  |
| `when.power-cut`             | `when/PowerCut.tsx`            | crossed-out bulb, lit candle             |
| `when.just-before-dinner`    | `when/JustBeforeDinner.tsx`    | steaming pot, clock nudging six          |
| `when.longest-lesson`        | `when/LongestLesson.tsx`       | squiggle chalkboard, drooping clock      |
| `when.day-before-birthday`   | `when/DayBeforeBirthday.tsx`   | wrapped present, hourglass               |
| `when.rush-hour`             | `when/RushHour.tsx`            | three honking cars nose to tail          |
| `when.while-everyone-slept`  | `when/WhileEveryoneSlept.tsx`  | blanket lump, one foot out, snores       |
| `when.exactly-noon`          | `when/ExactlyNoon.tsx`         | sun overhead, both hands straight up     |

Question marks and snores are drawn as paths, not `<text>`, so nothing in the art breaks under
the 15 languages. All 22 rendered as a grid plus one composed scene (`when.hat-festival` over the
Draft 4 kitchen) and reviewed before this table was written.

## The 22 `why` bubbles (T-FO-4.2b)

| id                         | file                         | in the bubble                             |
| -------------------------- | ---------------------------- | ----------------------------------------- |
| `why.made-sense-then`      | `why/MadeSenseThen.tsx`      | lit bulb, green tick, one pink doubt curl |
| `why.impress-a-pigeon`     | `why/ImpressAPigeon.tsx`     | unimpressed blue pigeon, heart            |
| `why.warranty-forbade-it`  | `why/WarrantyForbadeIt.tsx`  | document under a red prohibition sign     |
| `why.one-grape`            | `why/OneGrape.tsx`           | a single grape on a plinth, sparkling     |
| `why.never-back-down`      | `why/NeverBackDown.tsx`      | raised fist, thumb clamped across         |
| `why.pointless-point`      | `why/PointlessPoint.tsx`     | hand pointing at a dotted circle          |
| `why.for-science`          | `why/ForScience.tsx`         | flask of green, bubbling                  |
| `why.pure-stubbornness`    | `why/PureStubbornness.tsx`   | mule, lids half down, two hmph puffs      |
| `why.horoscope-said-so`    | `why/HoroscopeSaidSo.tsx`    | crystal ball with a star inside           |
| `why.bet-with-themselves`  | `why/BetWithThemselves.tsx`  | two fists and the coin between them       |
| `why.to-keep-warm`         | `why/ToKeepWarm.tsx`         | campfire on crossed logs                  |
| `why.because-tuesday`      | `why/BecauseTuesday.tsx`     | calendar, one day filled, sweat drop      |
| `why.for-a-sticker`        | `why/ForASticker.tsx`        | gold star on peeling backing              |
| `why.avoid-homework`       | `why/AvoidHomework.tsx`      | notebook crossed out, pencil down         |
| `why.everyone-else-did`    | `why/EveryoneElseDid.tsx`    | three identical people, same arrow        |
| `why.world-record`         | `why/WorldRecord.tsx`        | trophy, pink star on the cup              |
| `why.simply-hungry`        | `why/SimplyHungry.tsx`       | empty plate, fork and knife, rumble       |
| `why.impress-grandma`      | `why/ImpressGrandma.tsx`     | grandma, big glasses, verdict pending     |
| `why.forgot-the-plan`      | `why/ForgotThePlan.tsx`      | clipboard whose lines fade to dots        |
| `why.instructions-said-so` | `why/InstructionsSaidSo.tsx` | open manual, one huge exclamation         |
| `why.test-a-theory`        | `why/TestATheory.tsx`        | apple leaving a branch, down-arrow        |
| `why.no-reason`            | `why/NoReason.tsx`           | full-body shrug, palms up                 |

Same review as the badges: all 22 as a grid plus two composed scenes (`why.impress-a-pigeon` over
the Draft 4 kitchen, `why.simply-hungry` over the cloud castle). The fist and the pointing hand
were redrawn after that pass — both read as yellow lumps at badge size first time round.
