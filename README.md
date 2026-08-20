# Funny Family — «Чепуха 37» (Funny Multi)

A 3–7 player party game for one screen per player, no free text: every answer is picked from a
curated, family-safe pool, and each finished story becomes an AI-generated cartoon. Web
client + real-time server; each round's cartoon is generated once and cached, so a repeated
story reveals instantly for everyone after the first time.

«Чепуха 37» is this game's product name; it ships under the «Семейная Чепуха» (Funny Family)
umbrella, which is planned to hold future games sharing this repo's rotation/pool engine.

## Deploy your own

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/oursharedcode/funny-one)

The button above deploys the game server from `render.yaml` (Render's free plan). It still
needs a Cloudflare Worker deployed separately for image generation — the Render service won't
generate cartoons until you point it at one. Full walkthrough, including the Worker: see
[DEPLOYMENT.md](DEPLOYMENT.md).

Prefer to self-host instead of Render? `docker compose up` works from a `.env` file — also
covered in DEPLOYMENT.md.

## Local development

```bash
npm install
npm run dev
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for the full command list, the six gates every commit
must pass, and conventions worth knowing before touching the code.

## AGPL, and what that means for you

This repo is licensed [AGPL-3.0-only](LICENSE). The repo _is_ the product: there are no
secrets baked into any deployment, no server-side-only feature, nothing withheld from a
self-hoster. If you deploy your own copy — modified or not — the AGPL requires you to make
your source available to your users, same as everyone else deploying this game.

Purchases (Phase 9, once shipped) buy convenience and support — a hosted instance you don't
have to run yourself, or unlimited cartoons on someone else's server — **not DRM**. A
self-hosted deployment gets every feature this repo has, license key or not. If you'd like to
support development, the only supported way is
[GitHub Sponsors](https://github.com/sponsors/oursharedcode) — the game client itself never
hardcodes a donation, payment, or sponsor URL. A deployer can optionally show their own
"Support this server" button via the `DEPLOYER_DONATE_URL` env var (see `.env.example`); that
donation goes to whoever runs that specific deployment, not to this project.

## Adding a language

See [LANGUAGES.md](LANGUAGES.md).

## Moderation and privacy posture

See [MODERATION.md](MODERATION.md). In short: there is no free-text input anywhere in this
game, so there is nothing to filter — every player choice is a validated pick from a curated
pool. No accounts, no analytics, no third-party requests from the client; room state is
in-memory and dies with the room.

## License

[AGPL-3.0-only](LICENSE).
