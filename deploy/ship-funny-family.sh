#!/usr/bin/env bash
# Funny Family «Семейная Чепуха» — ship the landing page to the Docker host
# over SSH (Step 72). The page is static files: Caddy, already running for
# the games (deploy/ship.sh), serves them at the root of HUB_HOST and passes
# the page's visit counts on to Funny Multi's server, which keeps them. No
# image, no container, no secret.
#
#   deploy/ship-funny-family.sh ubuntu@152.69.166.212            # remote dir ~/funny
#   deploy/ship-funny-family.sh ubuntu@152.69.166.212 /srv/funny
#
# Assumes the remote directory already holds the .env deploy/ship.sh uses,
# with HUB_HOST and HUB_APEX (the page's host and its bare name) among its
# eight host names, and a game server that keeps visit counts (Step 72 or
# later, shipped by deploy/ship.sh). What the script does, in order:
#   1. builds apps/funny-family-site: one page per language, /stats/,
#      404.html and sitemap.xml;
#   2. streams dist/ over SSH into static/funny-family.new, then swaps it in
#      for static/funny-family — a reader sees the old pages or the new ones,
#      never a half-copied mix;
#   3. copies docker-compose.yml and deploy/caddy/Caddyfile, brings the caddy
#      service up and reloads the Caddyfile, as deploy/ship-funny-one.sh does;
#   4. checks through Caddy the English and Russian pages, /stats/, a missing
#      path (404 with the page that says so), the trailer, the visit-count
#      summary (which crosses to the game's server), the bare-name redirect,
#      and that Funny Multi's /health still answers.
set -euo pipefail

HOST="${1:?usage: deploy/ship-funny-family.sh user@host [remote-dir]}"
REMOTE_DIR="${2:-funny}"
# Git Bash rewrites arguments that look like POSIX paths; see deploy/ship.sh.
export MSYS_NO_PATHCONV=1

cd "$(dirname "$0")/.."

echo "==> remote .env"
REMOTE_ENV="$(ssh "$HOST" "cat '$REMOTE_DIR/.env'")"
get() { printf '%s\n' "$REMOTE_ENV" | sed -n "s/^$1=//p" | tail -1; }
HUB_HOST="$(get HUB_HOST)"
HUB_APEX="$(get HUB_APEX)"
FM_HOST="$(get FM_HOST)"
# All eight before anything is copied: Caddy refuses a Caddyfile with an
# empty site name, and it is the same Caddy that serves both games.
for v in FM_HOST FM_APEX FO_HOST FO_APEX SITE_HOST SITE_APEX HUB_HOST HUB_APEX; do
  [ -n "$(get "$v")" ] || { echo "$v missing in $HOST:$REMOTE_DIR/.env" >&2; exit 1; }
done
echo "    HUB_HOST=$HUB_HOST  HUB_APEX=$HUB_APEX"

echo "==> build funny-family-site"
npm run build -w packages/shared >/dev/null
npm run build -w apps/funny-family-site >/dev/null
DIST="apps/funny-family-site/dist"
for f in index.html ru/index.html stats/index.html 404.html sitemap.xml media/clip.mp4; do
  [ -f "$DIST/$f" ] || { echo "build produced no $f" >&2; exit 1; }
done

echo "==> stream $DIST to $HOST:$REMOTE_DIR/static/funny-family"
tar -C "$DIST" -czf - . | ssh "$HOST" "set -e
  cd '$REMOTE_DIR' && mkdir -p static && cd static
  rm -rf funny-family.new funny-family.old && mkdir funny-family.new
  tar -xzf - -C funny-family.new
  if [ -d funny-family ]; then mv funny-family funny-family.old; fi
  mv funny-family.new funny-family && rm -rf funny-family.old"

echo "==> copy compose file + Caddyfile, reload caddy"
ssh "$HOST" "mkdir -p '$REMOTE_DIR/deploy/caddy'"
scp -q docker-compose.yml "$HOST:$REMOTE_DIR/docker-compose.yml"
scp -q deploy/caddy/Caddyfile "$HOST:$REMOTE_DIR/deploy/caddy/Caddyfile"
# The reload is retried: when `up` has just recreated Caddy its admin API is
# not answering yet.
ssh "$HOST" "cd '$REMOTE_DIR' && docker compose --profile caddy up -d --no-build caddy && for i in 1 2 3 4 5; do
  docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile && exit 0
  sleep 2
done; exit 1"

echo "==> verify via Caddy"
ORIGIN="https://$HUB_HOST"
check() { # url expected ("status" or "status redirect-url")
  local got
  got="$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' --max-time 10 "$1" || true)"
  got="${got% }"
  printf '    %s -> %s\n' "$1" "$got"
  [ "$got" = "$2" ]
}
# The body into a variable, then matched in the shell: `curl | grep -q` fails
# under pipefail when grep finds the text and exits while curl still writes.
has() { # url text
  local body
  body="$(curl -s --max-time 10 "$1" || true)"
  case "$body" in
    *"$2"*) return 0 ;;
    *)
      echo "    $1 does not contain $2" >&2
      return 1
      ;;
  esac
}
ok=1
# Patient: on the first run Caddy has to fetch the new host's certificate.
for i in $(seq 1 30); do
  ok=1
  check "$ORIGIN/" 200 || ok=0
  [ "$ok" = 1 ] && break
  sleep 2
done
has "$ORIGIN/" 'data-code="en"' || ok=0
check "$ORIGIN/ru/" 200 || ok=0
has "$ORIGIN/ru/" 'data-code="ru"' || ok=0
check "$ORIGIN/stats/" 200 || ok=0
check "$ORIGIN/no-such-page" 404 || ok=0
has "$ORIGIN/no-such-page" 'noindex' || ok=0
got="$(curl -s -o /dev/null -w '%{http_code} %{content_type}' --max-time 10 "$ORIGIN/media/clip.mp4" || true)"
echo "    $ORIGIN/media/clip.mp4 -> $got"
case "$got" in "200 video/mp4"*) ;; *) ok=0 ;; esac
# The summary comes from the game's server: this proves the forward to it.
check "$ORIGIN/api/stats/summary?days=1" 200 || ok=0
has "$ORIGIN/api/stats/summary?days=1" '"days":' || ok=0
check "https://$HUB_APEX/" "301 $ORIGIN/" || ok=0
check "https://$FM_HOST/health" 200 || ok=0
[ "$ok" = 1 ] || { echo "verification failed — check: ssh $HOST 'cd $REMOTE_DIR && docker compose logs --tail 50 caddy'" >&2; exit 1; }
echo "    live: $ORIGIN/"
