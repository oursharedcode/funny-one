# Picture-library review for a Families audience (T-FO-8.2, FO-ID-1)

**Why.** Funny One's *From the Internet* option shows pictures from Funny Multi's pre-generated library
(10,000 AI cartoons drawn by Flux Schnell, made for a 12+ product, FM-ID-2). Funny One aims at Google
Play's Families program (FO-ID-1), so before the option can ship in a store app the library has to be
looked over for a general audience. Owner decision 2026-10-06: review the whole library, with free
automated tools, rather than leave the option out of the store app.

**Scope.** All 10⁴ pictures (4 visual slots × 10 options each). The 40 phrases that make the prompts
are family-friendly by construction (`packages/shared/src/pools/`); what is reviewed is what the model
*drew*. Nothing here certifies a rating: the owner's content-rating questionnaire and Google's own
review decide that. This is the evidence behind the owner's answers.

## Criteria

Taken from Google Play's Families policy (content "must be appropriate for children"; no violence,
gore, shocking content, glamorised alcohol/tobacco/substances, gambling) and the content-rating
questionnaire's categories (violence, blood, fear, sexuality/nudity, language, controlled
substances, gambling, crude humour), where the lowest rating allows "some violence in a comical or
fantasy context" but no bad language. Both pages were read on 2026-10-06 through a summarising fetch,
not word for word — re-read them before relying on a quotation.

| Class | A picture is… | Outcome |
| --- | --- | --- |
| **Fail** | nudity, or anything sexual or suggestive; blood, gore, wounds, dead or dying figures; a realistic weapon, or any weapon aimed at or used on a figure; alcohol, tobacco, drugs or gambling shown; shocking or disturbing imagery — body horror, a deformed or fused figure that reads as upsetting, a demonic or truly frightening face; a photographic (non-cartoon) human; hate symbols, real flags or brands; legible words that are profane, sexual or a real brand | **Blocklisted** — Funny One draws the built-in rig instead |
| **Watch** | a cartoon prop weapon held by a pirate or knight, not used; spooky mood inside the cartoon style (a glowing-eyed toaster, a gloomy hall); an angry animal; mildly odd anatomy (an extra limb) | Judged by eye: *comical* passes, *unsettling* fails |
| **Pass** | goofy cartoon in the intended style; garbled pseudo-text or a signature-like squiggle (a known, accepted artefact, `MODERATION.md`) | Kept |

## Method

1. `scripts/picture-review/manifest.mjs` — the 10⁴ keys, offline, computed the way Funny One does.
2. `scripts/picture-review/fetch.py` — each public `/i/<hash>.png`, kept as a 384 px thumbnail.
3. `scripts/picture-review/score.py` — CLIP embeddings once, then one text query per criterion above;
   a separate NSFW classifier; picture-to-own-prompt similarity (the lowest are where the model drifted);
   OCR on pictures that appear to contain text.
4. Flag rate per option and per pair of options, to trace a flag to the phrase behind it.
5. Contact sheets: every flagged picture, the lowest-similarity 100, and a random 10-per-option
   sample (400) to bound what the classifiers missed.
6. Remediation: `apps/funny-one-client/src/pictureBlocklist.ts` (option ids and hashes).

## Results

Run 2026-10-06/07 on the agent's PC (CPU only; the venv, thumbnails, embeddings and sheets live in
the ignored `.picture-review/` and are regenerable from the scripts).

**Fetched.** 10,000 keys from `manifest.mjs`, all distinct; 10,000 pictures fetched from the public
`/i/<hash>.png` route, 0 failed; 7,083,381,392 bytes moved (≈ 7.08 GB of Worker egress — the
pictures are ≈ 700 KB each, the re-encoding noted in the log would cut this tenfold).

**Scored.** CLIP ViT-B/32 zero-shot, one text query per criterion against safe-cartoon prompts, plus
`Falconsai/nsfw_image_detection` on every picture, plus picture-to-own-prompt similarity.
Pictures at or above 0.5 per criterion: weapon 241, blood/gore 116, nudity/sexual 13,
drugs/alcohol 3, gambling 3, scary 3, body horror 1, flag 1, photoreal 0, text/logo 0,
hate symbol 0. NSFW classifier: 147 at or above 0.5, 68 above 0.9 — all 147 viewed, all false
positives, driven by `where.gloomy-birthday`'s grey rooms (per-option mean 0.111; the next option
0.044); it found one red-splash picture (J below) the CLIP queries had not. The weapon score is almost entirely
`who.muddy-knight` (per-option mean 0.306; the next option 0.126); blood/gore is highest for
`where.messy-kitchen` and the knight. OCR was skipped — no tesseract on this PC; the top of the
text/logo query was viewed by eye instead.

**Viewed.** 44 contact sheets (the top 72 per criterion, every NSFW score ≥ 0.5, the 108 pictures
least like their own prompt, the 36 highest-weapon knight staring contests, and a random
10-per-option sample of 398 at seed 20261006): 1,491 tiles, **1,245 distinct pictures**, every one
looked at by the agent at 256 px, with larger copies pulled for the doubtful ones. The random sample bounds what the classifiers missed:
**0 fails in 398**.

What the flags turned out to be:

- *Weapons.* Knights carry a cartoon sword, dagger or shield as costume; pirates wear a
  skull-and-crossbones hat. In the staring-contest and cloud-castle pictures the knight sometimes
  points the prop at the partner (a fishbowl, a toaster, a robot, a goose) — comical, no contact,
  no injury, arguably within "some violence in a comical or fantasy context". The five clearest
  were put to the owner (E–I below).
- *Blood.* Red splatters are paint (`did.painting-polka-dots`), mud, sauce or spilled milk. Two
  pictures have an unexplained red puddle or splash (A, J).
- *Flags, symbols.* Red-and-yellow pennants in `where.snowy-mountain` scenes resemble Spain's
  flag only loosely; the one that reads as the flag was put to the owner (D). One red banner
  carries a dark cross-in-a-circle emblem (B). The retired superhero sometimes wears a
  Superman-like "S"; a style quotation, kept.
- *Text.* All pseudo-text is gibberish ("furting fam the size", "CAULDROKS", "BIRTHDAY HARY!");
  nothing legible is a word, a brand or profane — what `MODERATION.md` already allows. The one
  caption set like a title was put to the owner (C).
- *Nudity, drugs, gambling, scary, body horror, photoreal.* Nothing. What scored highest:
  the roller-skating grandma and tourists in shorts (nudity); the sock drawer's capsule-shaped
  socks and pancake stacks (drugs, gambling); the haunted toaster's glowing eyes and grin (scary);
  toasters spilling spaghetti and holes dug with spoons (body horror); photoreal never passed 0.18.

**Put to the owner — 10 of 10,000**, on one sheet (`.picture-review/sheets/borderline.png`,
regenerable). The agent recommended blocking A, B and J and keeping the rest; **the owner
blocked all ten (2026-10-07)** — the stricter line: anything a store reviewer could pause on
goes, since the rig costs nothing. All ten are in
`apps/funny-one-client/src/pictureBlocklist.ts`; the client draws the rig for them and never
requests the address.

| | Story (who · with · where · did) | Why |
| --- | --- | --- |
| A | retired-superhero · haunted-toaster · gloomy-birthday · staring-contest | an unexplained red puddle on the floor reads as blood |
| B | muddy-knight · professor-goat · snowy-mountain · stacking-chairs | a dark cross-in-circle emblem on a red banner — ambiguous |
| C | skating-grandma · riddle-robot · underwater-canyon · sorting-clouds | a gibberish caption set like a title ("furting fam the size") |
| D | muddy-knight · giant-snail · snowy-mountain · sorting-clouds | a red-and-yellow flag that reads as Spain's |
| E | muddy-knight · philosophical-goldfish · cloud-castle · staring-contest | the knight points a dagger at the goldfish bowl |
| F | muddy-knight · haunted-toaster · cloud-castle · staring-contest | the knight holds a sword up to the toaster |
| G | muddy-knight · riddle-robot · cloud-castle · staring-contest | the knight holds a dagger towards the robot |
| H | muddy-knight · angry-geese · cloud-castle · staring-contest | the knight holds a mallet facing the geese |
| I | muddy-knight · riddle-robot · gloomy-birthday · staring-contest | the knight holds a dagger towards the robot, in a dark hall |
| J | muddy-knight · giant-snail · gloomy-birthday · baking-giant-cake | a dark-red splash under the cake, in a dark room, reads as blood |

The ten stay in the library (Funny Multi, a 12+ product, still serves them); the block is
Funny One's alone. They need no regenerating: a blocked story draws the rig, which is the
product's own art. Regenerating would need the Workers AI plan back on (cancelled) and the same
prompt through `/generate`, which overwrites the same key — then the entry comes off the list.

**Verified.** Unit tests hold each blocklist entry to the key `buildPrompt` gives its options (a
prompt or pool change that moves a key fails the test rather than un-blocking the picture). A
phone-sized Chromium check against the real `worker.js` run locally over the 10⁴ real keys steered a
seven-seat game so one story was picture A and another its neighbour one option away: A drew the
rig with no request for its key, the neighbour and the other five stories showed library pictures,
all six requests answered 200, no console errors (`.screens/fo-blocklist-check.mjs`, ignored).

**Verdict.** The library is fit for a general audience with the ten pictures blocked. This is the
agent's reading of 1,245 pictures, the classifiers' reading of 10,000 and the owner's of the ten; the content-rating
questionnaire is still the owner's to answer, and anything a player reports goes on the blocklist
the same way.
