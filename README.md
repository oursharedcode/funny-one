# Funny Family — «Чепуха 37» (Funny Multi)

A 3–7 player party game for one screen per player, no free text: every answer is picked from a
curated, family-safe pool, and each finished story becomes an AI-generated cartoon. Web
client + real-time server; each round's cartoon is generated once and cached, so a repeated
story reveals instantly for everyone after the first time.

«Чепуха 37» is this game's product name; it ships under the «Семейная Чепуха» (Funny Family)
umbrella, which is planned to hold future games sharing this repo's rotation/pool engine.

## Play it

**https://www.funny37.oursharedcode.com/** — the reference deployment: a $0
Oracle Cloud _Always Free_ VM running this repo's Docker image behind Caddy. Open it on a
phone, create a room, and share the QR code.

## Deploy your own

Two pieces: a Cloudflare Worker (cartoon generation + cache) and the game server (which also
serves the client). The full walkthrough is [DEPLOYMENT.md](DEPLOYMENT.md) — it assumes
nothing beyond a Cloudflare account, a Linux host with Docker and a domain name. In short:

1. `cd cloudflare && npx wrangler deploy` (after creating the R2 bucket and the shared
   secret, and uncommenting `[ai]` in `wrangler.toml` so the Worker may generate) gives you
   the Worker URL.
2. On the host, a short `.env` from `.env.example` (Worker URL + secret, the host names).
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

This repo is licensed [AGPL-3.0-only](LICENSE).

The flag pictures in each app's `public/flags/` are [Twemoji](https://github.com/twitter/twemoji)
© Twitter, Inc. and other contributors, licensed under
[CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/). The Fredoka font is under the SIL Open
Font License (`public/fonts/OFL.txt`). The repo _is_ the product: there are no
secrets baked into any deployment, no server-side-only feature, nothing withheld from a
self-hoster. If you deploy your own copy — modified or not — the AGPL requires you to make
your source available to your users, same as everyone else deploying this game.

There is nothing to buy: no premium tier, no license keys, no paywall. A self-hosted
deployment gets every feature this repo has — a gift is support, never a key to anything.

## Support

The game is free to play. If you'd like to say thanks, the official deployment has a
**Support** screen — the ♥ in the corner of the Home screen, or _Support this server_ on the
end screen — for voluntary gifts: nothing is owed, nothing is unlocked. It offers three
rails:

- **PayID/Osko** (Australian banks): tap to copy the PayID. The screen also shows the account
  name your bank will display, so you can check it before you confirm.
- **GitHub Sponsors**: choose a _one-time_ tier — the Sponsors flow defaults to monthly. The
  **Sponsor** button on this repo is the same account, wired by `.github/FUNDING.yml`.
- **Bitcoin Lightning**: tap to copy the address, open it as a `lightning:` link in your
  wallet app, or scan its QR code from another device.

On your own deployment the addresses are yours. None are in the code: set `DEPLOYER_PAYID`
and `DEPLOYER_PAYID_NAME`, `DEPLOYER_SPONSORS_URL`, `DEPLOYER_LIGHTNING_ADDRESS` (and, if
you like, the older single-link `DEPLOYER_DONATE_URL`) in the server's `.env`, and gifts go
to whoever runs the server. Leave them all unset and neither the ♥ nor the screen appears.
See [DEPLOYMENT.md](DEPLOYMENT.md#optional-the-support-screen).

### Why no card payments

No card checkout — not Stripe, PayPal, Ko-fi or Buy Me a Coffee, nor any other card-based
merchant of record. On those, a single disputed $1 gift costs the recipient $15–30 in
dispute fees, which is a bet a small project cannot take. Only chargeback-free rails are
offered: a PayID transfer is a push from the payer's own bank; on GitHub Sponsors GitHub is
the merchant of record, so a dispute is not debited from the recipient's account; a
Lightning payment is final.

## Adding a language

See [LANGUAGES.md](LANGUAGES.md).

## Moderation and privacy posture

See [MODERATION.md](MODERATION.md). In short: there is no free-text input anywhere in this
game, so there is nothing to filter — every player choice is a validated pick from a curated
pool. No accounts, no third-party analytics or tracking, no third-party requests from the
client (fonts are self-hosted); room state is in-memory and dies with the room. The website
keeps only anonymous daily visit counts — no IP address, no cookie, none in the Android app or
when the browser sends Do Not Track or Global Privacy Control.

The privacy policy players read, in all 20 languages, is
[deploy/origin-root/funny37/privacy.html](deploy/origin-root/funny37/privacy.html), served by
Caddy at `https://<FM_HOST>/privacy`. Change it in the same commit as any change to what the
game collects, keeps or sends.

## License

[AGPL-3.0-only](LICENSE).
