#!/usr/bin/env bash
# Funny One «Одна Чепуха: по кругу» — ship the static bundle to the Docker
# host over SSH (T-FO-6.2, requirements D-5). Funny One has no server: Caddy,
# already running for Funny Multi (deploy/ship.sh), serves the files itself
# under /funny1-game. No image, no container, no secret.
#
#   deploy/ship-funny-one.sh ubuntu@152.69.166.212            # remote dir ~/funny
#   deploy/ship-funny-one.sh ubuntu@152.69.166.212 /srv/funny
#
# Assumes the remote directory already holds the .env deploy/ship.sh uses
# (SITE_HOST — the host Funny One lives on — and FM_HOST, for the final
# health check of Funny Multi, are read here). What it does, in order:
#   1. builds apps/funny-one-client with BASE_PATH=/funny1-game — the path the
#      Caddyfile hardcodes, baked into the bundle and its service worker;
#   2. streams dist/ over SSH into static/funny-one.new, then swaps it in
#      for static/funny-one — a reader sees the old build or the new one,
#      never a half-copied mix;
#   3. copies docker-compose.yml and deploy/caddy/Caddyfile, brings the caddy
#      service up (recreated only if its compose config changed — the first
#      run adds the ./static mount, which briefly drops Funny Multi's open
#      sockets; they reconnect) and reloads the Caddyfile, which `up` alone
#      would not do for a changed file;
#   4. checks the game, its service worker and the redirect through Caddy,
#      and that Funny Multi's /health still answers.
set -euo pipefail

HOST="${1:?usage: deploy/ship-funny-one.sh user@host [remote-dir]}"
REMOTE_DIR="${2:-funny}"
BASE_PATH="/funny1-game"
# Git Bash rewrites arguments that look like POSIX paths; see deploy/ship.sh.
export MSYS_NO_PATHCONV=1

cd "$(dirname "$0")/.."

echo "==> remote .env"
REMOTE_ENV="$(ssh "$HOST" "cat '$REMOTE_DIR/.env'")"
get() { printf '%s\n' "$REMOTE_ENV" | sed -n "s/^$1=//p" | tail -1; }
SITE_HOST="$(get SITE_HOST)"
FM_HOST="$(get FM_HOST)"
[ -n "$SITE_HOST" ] || { echo "SITE_HOST missing in $HOST:$REMOTE_DIR/.env" >&2; exit 1; }
echo "    SITE_HOST=$SITE_HOST"

echo "==> build funny-one-client (BASE_PATH=$BASE_PATH)"
npm run build -w packages/shared >/dev/null
BASE_PATH="$BASE_PATH" npm run build -w apps/funny-one-client >/dev/null
DIST="apps/funny-one-client/dist"
[ -f "$DIST/index.html" ] && [ -f "$DIST/sw.js" ] || { echo "build produced no index.html/sw.js" >&2; exit 1; }

echo "==> stream $DIST to $HOST:$REMOTE_DIR/static/funny-one"
tar -C "$DIST" -czf - . | ssh "$HOST" "set -e
  cd '$REMOTE_DIR' && mkdir -p static && cd static
  rm -rf funny-one.new funny-one.old && mkdir funny-one.new
  tar -xzf - -C funny-one.new
  if [ -d funny-one ]; then mv funny-one funny-one.old; fi
  mv funny-one.new funny-one && rm -rf funny-one.old"

echo "==> copy compose file + Caddyfile, reload caddy"
ssh "$HOST" "mkdir -p '$REMOTE_DIR/deploy/caddy'"
scp -q docker-compose.yml "$HOST:$REMOTE_DIR/docker-compose.yml"
scp -q deploy/caddy/Caddyfile "$HOST:$REMOTE_DIR/deploy/caddy/Caddyfile"
ssh "$HOST" "cd '$REMOTE_DIR' && docker compose --profile caddy up -d --no-build caddy \
  && docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile"

echo "==> verify via Caddy"
ORIGIN="https://$SITE_HOST"
check() { # url expected-status
  local got
  got="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$1")"
  printf '    %s -> %s\n' "$1" "$got"
  [ "$got" = "$2" ]
}
ok=1
for i in $(seq 1 15); do
  ok=1
  check "$ORIGIN$BASE_PATH/" 200 || ok=0
  [ "$ok" = 1 ] && break
  sleep 2
done
check "$ORIGIN$BASE_PATH/sw.js" 200 || ok=0
check "$ORIGIN$BASE_PATH/manifest.webmanifest" 200 || ok=0
check "$ORIGIN$BASE_PATH" 301 || ok=0
curl -fsS --max-time 10 "$ORIGIN$BASE_PATH/" | grep -q "$BASE_PATH/assets/" \
  || { echo "    index.html does not reference $BASE_PATH/assets/ — wrong build?" >&2; ok=0; }
if [ -n "$FM_HOST" ]; then check "https://$FM_HOST/health" 200 || ok=0; fi
[ "$ok" = 1 ] || { echo "verification failed — check: ssh $HOST 'cd $REMOTE_DIR && docker compose logs --tail 50 caddy'" >&2; exit 1; }
echo "    live: $ORIGIN$BASE_PATH/"
