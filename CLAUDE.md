# Funny Family — «Чепуха 37» (Funny Multi)

3–7 player party game: web client + Socket.IO server; each finished story becomes an AI cartoon
(Cloudflare Worker → Flux Schnell → R2). npm-workspaces monorepo, Node 20, TypeScript.

## Layout

- `apps/funny-multi-client` — React 18 + Vite + Tailwind + Framer Motion PWA
- `apps/funny-multi-server` — Node 20 + Fastify + Socket.IO, in-memory rooms
- `packages/shared` — rotation formula, answer pools, i18n (15 languages), schemas. Other
  workspaces need it built; the pre-scripts handle that automatically.
- `cloudflare` — Worker: `/generate`, `/i/<hash>`, `/stats` (R2 + KV)

## Commands

- `npm run dev` — client + server concurrently
- `npm test` — all workspaces; run outside the sandbox (real-socket tests)
- `npm run typecheck` / `npm run lint` / `npm run format:check`

## Where state lives — read only this at session start

1. `docs/IMPLEMENTATION_LOG.md` — the RESUME HERE note at the foot names the next step.
2. `steering/tasks.md` — lean, active phases only; read the **current phase section**.
   Closed phases live in `steering/tasks-done.md` — grep it only when history matters.
3. `steering/requirements.md` (FM-\* ids) and `steering/design.md` (DD-\*, §N) — grep for the
   specific id a task cites; never read either file whole.
4. `docs/archive/` — superseded inputs. Do not read.

## Hard rules

- `docs/source_project/` (SRC) is a 232 MB read-only reference copy with its own `.git`.
  NEVER Glob/Grep/read under it unless the current task explicitly cites SRC. Copy, never edit.
- Six gates before any commit: typecheck, lint, format:check, `npm test`, `npm audit`, CI green.
- Phases strictly in order; verify the phase gate before moving on.
- RU product names are binding: «Чепуха 37» (this game), «Одна Чепуха: по кругу» (Funny One,
  D-9), umbrella «Семейная Чепуха».
- Commit style: `Step N (task X): title` for one step, `Steps N–M: summary` for several —
  per the /endsession ritual (owner decision 2026-08-20; earlier history used conventional
  commits). Push only after the owner confirms.
