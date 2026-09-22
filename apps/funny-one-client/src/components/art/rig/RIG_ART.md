# Funny One rig art — spec (T-FO-4.1)

Status: **all 40 assets drawn.** Started as a 4-asset vertical slice to validate the style before
drawing the rest (see "Draft 4" below); the remaining 36 followed the same conventions. Governed
by `DESIGN_SYSTEM.md` §5 (mascot construction rules) — rig art is drawn in the same hand, so both
products read as one family.

## The 40

Exactly 4 pool slots are visual (`packages/shared/src/pools/options.ts`), 10 options each:
`who` (slot 0), `with` (slot 1), `where` (slot 2), `did` (slot 4) → 10⁴ = 10,000 scene
combinations from 40 assets. `when`/`why`/`end` (slots 3/5/6) are prose-only and have no art.

## File / id mapping

`rig/<slot>/<PascalCase of the id's slug>.tsx`, e.g. pool id `where.messy-kitchen` →
`rig/where/MessyKitchen.tsx`. Default export, `className` prop only — no other props, same
contract as the existing mascots (`BotAvatar.tsx` etc.) — the future compositor (T-FO-4.2) sizes
everything by parent class, never by props.

**No registry yet.** A `rigIndex.ts` mapping id → component is T-FO-4.2's job, once all 40 exist;
building a lookup table for a 4/40 set is premature.

## Canvas conventions

| Slot                  | viewBox       | Role in the composited scene                                                                  |
| --------------------- | ------------- | --------------------------------------------------------------------------------------------- |
| `where` (background)  | `0 0 400 300` | Full-bleed, `preserveAspectRatio="xMidYMid slice"`. z-index 0.                                |
| `who` (character)     | `0 0 100 100` | Stage-left third, bottom-anchored (standing "in" the scene, not floating). z-index 1.         |
| `with` (co-character) | `0 0 100 100` | Stage-right third, bottom-anchored. z-index 2.                                                |
| `did` (prop)          | `0 0 100 100` | Foreground, roughly centered, bridging `who`/`with` so the action reads as shared. z-index 3. |

400×300 (4:3) picked as a plain "picture" frame — nothing in `funny-one-design.md` locks an
aspect ratio yet, so this is a draft convention, not a hard gate; revisit if T-FO-4.2's real
compositor layout wants something else.

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
