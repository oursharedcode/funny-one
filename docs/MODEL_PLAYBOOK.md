# Model playbook — Claude Code on this repo

Pick the model per session with `/model` (slash commands can pin their own via `model:`
frontmatter — `/morning` and `/endsession` already do). Prices are Anthropic API rates per
1M tokens (input / output), as of 2026-08.

| Work | Model | Effort | Why |
|---|---|---|---|
| Session start: read state, pick the next task, plan (`/morning`) | `claude-opus-5` ($5/$25) | high | Planning quality compounds; runs once per session. |
| Hard architecture, cross-cutting audits, nasty bugs (socket races, RTL/i18n edge cases) | `claude-opus-5`, escalating to `claude-fable-5` ($10/$50) only if Opus stalls | xhigh | Fable is 2× Opus price — reserve it for what Opus can't crack. |
| Implementing a scoped task (T-x.y) with a clear spec | `claude-sonnet-5` ($3/$15; intro $2/$10 through 2026-08-31) | medium–high | Near-Opus on well-specified coding at ~60% of the price. |
| Mechanical chores: renames, moving doc blocks, i18n string fills, boilerplate tests from an existing pattern | `claude-haiku-4-5` ($1/$5) | low–medium | Cheapest tier; its 200K context is plenty for scoped chores. |
| Pre-commit review | `/code-review`, or `claude-opus-5` | high | A different (stronger) reviewer catches what the implementer missed. |
| End-of-session ritual (`/endsession`): log entry, tick tasks, commit message | `claude-sonnet-5` | medium | Clerical work; the owner confirms before commit anyway. |

Effort levels: low < medium < high < xhigh < max — higher means more thinking and more tool
calls per answer. Rule of thumb: for routine work lower the **effort** before lowering the
model tier; for hard work raise the **effort** before raising the tier.

## Session hygiene — where the credits actually go

- Every turn resends the whole session context (cached input rereads bill at ~10% of the
  input price, cache writes at ~125%). Small context ⇒ cheap turns.
- **One task per session.** Start fresh (new session or `/clear`) per task instead of one
  long mega-session — a long tail of stale context is rebilled on every turn.
- At session start read only what CLAUDE.md's "Where state lives" prescribes (a few KB),
  never whole steering docs.
- Never let a session search or read `docs/source_project/` (232 MB) unless the task
  explicitly cites SRC.
- Long idle gaps lose the prompt cache; when you return, the next turn re-writes it at
  125% — batch your back-and-forth when practical.
- Keep CLAUDE.md lean; it is loaded into **every** session.
