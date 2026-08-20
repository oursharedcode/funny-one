# Development

## Layout

npm-workspaces monorepo, Node 20, TypeScript.

- `apps/funny-multi-client` — React 18 + Vite + Tailwind + Framer Motion PWA
- `apps/funny-multi-server` — Node 20 + Fastify + Socket.IO, in-memory rooms
- `packages/shared` — rotation formula, answer pools, i18n (15 languages), schemas. The
  client and server both import the built output, so anything that touches `packages/shared`
  needs it rebuilt — the `predev`/`prebuild`/`pretest`/`pretypecheck` npm scripts do this
  automatically, so plain `npm run dev` / `build` / `test` / `typecheck` at the repo root
  always pick up shared changes.
- `cloudflare` — the Worker: `/generate`, `/i/<hash>`, `/stats` (R2 + KV). Deployed
  independently of the two apps above — see `DEPLOYMENT.md`.

## Setup

```bash
npm install
cp .env.example .env   # optional for local dev — image generation needs a deployed Worker;
                        # everything else runs without it
npm run dev             # client + server, concurrently
```

## Commands

- `npm run dev` — client + server concurrently, with hot reload
- `npm test` — all workspaces. **Run outside any sandbox** — the test suite opens real
  sockets (Socket.IO integration tests), which sandboxed/restricted-network environments
  block or hang on.
- `npm run typecheck` — `tsc --noEmit` across every workspace
- `npm run lint` — ESLint (`@typescript-eslint`, strict) over `.ts`/`.tsx`
- `npm run format:check` — Prettier, 100-char width, check-only
- `npm run format` — Prettier, write mode
- `npm run build` — shared → client → server, in that order

## Before any commit — six gates

1. `npm run typecheck`
2. `npm run lint`
3. `npm run format:check`
4. `npm test`
5. `npm audit` — 0 vulnerabilities
6. CI green (`.github/workflows/ci.yml`: checkout → setup-node → `npm ci` → typecheck → lint
   → test, on every push/PR to `main`)

CI runs typecheck + lint + test only — by design, there is no deploy automation in the
workflow (FM-ARC-5). Deploys are manual; see `DEPLOYMENT.md`.

## Conventions worth knowing before you touch the code

- Room state is in-memory only, one `Map<code, Room>` per Node process — no database, no
  Redis (FM-CORE-2). This is intentional, not a gap to fill in.
- There is no free-text input anywhere in the game. Every player choice is an id picked from
  a curated, pre-authored pool (`packages/shared/src/pools/`); this is what makes the privacy
  and moderation posture in `MODERATION.md` hold. If you're ever tempted to add a free-text
  field, read `FM-CPL-4` in `steering/requirements.md` first — it's a standing guard for
  exactly that case.
- Motion and mascot art are governed by the source `DESIGN_SYSTEM.md` conventions: only
  `scale`/`x`/`y`/`opacity`/`rotate` are animated (transform/opacity only, never a
  layout-or-paint-triggering CSS property) — this is what keeps the game smooth on mid-range
  phones without a dedicated animation profiling pass.
- The AI image prompt (`packages/shared/src/prompt.ts`) is built once in English regardless
  of the room's display language, so the same story in any of the 15 languages hits the same
  R2 cache entry. See `LANGUAGES.md` before adding pool content.
