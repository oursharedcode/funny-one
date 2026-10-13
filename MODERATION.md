# Moderation

This document replaces most of the source project's `MODERATION.md`. The posture changed
because the input surface changed: earlier versions of this game took free-text answers and
needed a moderation _filter_ (profanity check, translation, per-language re-validation) to
keep that text safe. This game has no free-text input anywhere. Safety is achieved **by
construction**, not by filtering.

## How safety is achieved

- **Every player choice is an id picked from a curated pool.** `packages/shared/src/pools/`
  is hand-authored (English, Russian) or machine-drafted-then-flagged-for-review (the other
  13 languages, see `LANGUAGES.md`), and reviewed for being family-friendly and absurd —
  never referencing real people or brands (FM-POOL-6). The server validates every submitted
  option id against the room's active pool and rejects anything else (`INVALID_OPTION`,
  FM-ANS-2) — there is no code path from a player's keyboard to stored or transmitted text.
- **The image prompt is deterministic**, built server-side from the same pre-authored
  fragments (`packages/shared/src/prompt.ts`), never from anything a player typed.
- **A locked style suffix** (`STYLE_SUFFIX` in `prompt.ts`, carried over verbatim from the
  source project — spec §22 lock) steers every generated image away from photorealism. This
  is a content-safety measure, not a stylistic default: photoreal output of arbitrary
  pool-generated scenes is the risk this exists to close off, and the suffix is not meant to
  be edited per-deployment.
- **No user-generated text ever reaches storage, an AI model, or another room** (FM-CPL-2).
  The only durable artifacts this game produces are AI images derived entirely from
  pre-authored pool content, plus anonymous usage counters and the website's anonymous daily
  visit counts. No accounts, no third-party analytics or per-visitor tracking, no third-party
  requests from the client.

## What operators are still responsible for

Curated pools remove the _input_ moderation problem, not every moderation problem. As the
operator of a deployment:

- **The output artefact is what you're serving.** Cloudflare Workers AI's Flux Schnell model
  occasionally renders a hallucinated signature-like squiggle in a corner of an image. This is
  a known, accepted artefact of the underlying model — not a bug in this repo — and is not
  filtered out.
- **The in-game source footer** (`SourceFooter.tsx`, spec §27) that credits the underlying
  project and links to its source is kept intentionally — this is an AGPL project and that
  attribution is part of the license posture, not decoration to remove.
- **Adding a language's pool content is a human review obligation**, not something
  `pools.test.ts` can check. The test suite enforces structure (every slot has enough
  options, grammar invariants per language) — it cannot judge whether a sentence is actually
  family-friendly or absurd rather than, say, unintentionally suggestive. Review any pool
  content you author or accept a contribution for.

## Standing guard

**FM-CPL-4**: if free text is ever reintroduced anywhere in this game — a custom nickname
field, a "write your own" round variant, anything a player types that reaches another
player, storage, or an AI model — the removal of input moderation described here must be
re-evaluated first. This document's "safety by construction" claim depends on there being no
free-text path; adding one without re-adding a filter breaks that claim silently.
