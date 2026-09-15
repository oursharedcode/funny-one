# Funny Family — «Чепуха 37» (Funny Multi)

A 3–7 player party game for one screen per player, no free text: every answer is picked from a
curated, family-safe pool, and each finished story becomes an AI-generated cartoon. Web
client + real-time server; each round's cartoon is generated once and cached, so a repeated
story reveals instantly for everyone after the first time.

«Чепуха 37» is this game's product name; it ships under the «Семейная Чепуха» (Funny Family)
umbrella, which is planned to hold future games sharing this repo's rotation/pool engine.

## Play it

**https://www.staging-oursharedcode.com/funny37-game/** — the reference deployment: a $0
Oracle Cloud _Always Free_ VM running this repo's Docker image behind Caddy. Open it on a
phone, create a room, and share the QR code.

## Deploy your own

Two pieces: a Cloudflare Worker (cartoon generation + cache) and the game server (which also
serves the client). The full walkthrough is [DEPLOYMENT.md](DEPLOYMENT.md) — it assumes
nothing beyond a Cloudflare account, a Linux host with Docker and a domain name. In short:

1. `cd cloudflare && npx wrangler deploy` (after creating the R2 bucket and the shared
   secret) gives you the Worker URL.
2. On the host, a six-line `.env` from `.env.example` (Worker URL + secret, `BASE_PATH`, site
   name).
3. From your PC, `deploy/ship.sh user@host` builds the image, streams it over SSH and starts
   it with Caddy in front for automatic HTTPS.

`docker compose up` alone gives you the container on `:3000` for a TLS proxy of your own.
There is no hosted or one-click option: the game keeps long-lived sockets open for the length
of a party, which free app platforms hibernate away.

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
[GitHub Sponsors](https://github.com/sponsors/oursharedcode) (the **Sponsor** button on this
repo, wired by `.github/FUNDING.yml`) — the game client itself never hardcodes a donation,
payment, or sponsor URL. A deployer can optionally show their own
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
