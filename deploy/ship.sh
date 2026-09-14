#!/usr/bin/env bash
# Funny Family «Чепуха 37» — ship the game to a Docker host over SSH (T-8.1,
# requirements D-5). Production is a 1 GB Oracle Always-Free VM, too small to
# build the image on, so the image is built here and streamed across; there is
# no registry in the loop.
#
#   deploy/ship.sh ubuntu@152.69.166.212            # default remote dir ~/funny
#   deploy/ship.sh ubuntu@152.69.166.212 /srv/funny
#
# Assumes the remote directory already holds a filled-in .env (see
# .env.example: CLOUDFLARE_WORKER_URL/SECRET, BASE_PATH, SITE_HOST, SITE_APEX,
# TRUSTED_PROXY_HOPS=1 behind Caddy) — the secret never travels through this
# script. What it does, in order:
#   1. reads BASE_PATH from the remote .env, so the client is built with the
#      value the server will run under (they must agree — DEPLOYMENT.md);
#   2. builds the image with that build-arg, tagged with the git commit;
#   3. streams it over SSH (docker save | gzip | ssh docker load), ~80 MB;
#   4. copies docker-compose.yml and deploy/caddy/Caddyfile alongside .env;
#   5. `docker compose --profile caddy up -d` on the host, then checks
#      BASE_PATH/health through Caddy.
set -euo pipefail

HOST="${1:?usage: deploy/ship.sh user@host [remote-dir]}"
REMOTE_DIR="${2:-funny}"
# Git Bash rewrites arguments that look like POSIX paths ("/funny37-game"
# becomes "C:/Program Files/Git/funny37-game"); this stops it. No effect
# elsewhere.
export MSYS_NO_PATHCONV=1

cd "$(dirname "$0")/.."
COMMIT="$(git rev-parse --short HEAD)"
IMAGE="funny-multi"

echo "==> remote .env"
REMOTE_ENV="$(ssh "$HOST" "cat '$REMOTE_DIR/.env'")"
get() { printf '%s\n' "$REMOTE_ENV" | sed -n "s/^$1=//p" | tail -1; }
BASE_PATH="$(get BASE_PATH)"
SITE_HOST="$(get SITE_HOST)"
[ -n "$SITE_HOST" ] || { echo "SITE_HOST missing in $HOST:$REMOTE_DIR/.env" >&2; exit 1; }
echo "    BASE_PATH=${BASE_PATH:-/}  SITE_HOST=$SITE_HOST"

echo "==> build $IMAGE:$COMMIT (BASE_PATH=${BASE_PATH:-/})"
docker build --build-arg "BASE_PATH=${BASE_PATH:-/}" -t "$IMAGE:$COMMIT" -t "$IMAGE:latest" . >/dev/null

echo "==> stream image to $HOST"
docker save "$IMAGE:$COMMIT" "$IMAGE:latest" | gzip | ssh "$HOST" 'gunzip | docker load' | tail -1

echo "==> copy compose file + Caddyfile"
ssh "$HOST" "mkdir -p '$REMOTE_DIR/deploy/caddy'"
scp -q docker-compose.yml "$HOST:$REMOTE_DIR/docker-compose.yml"
scp -q deploy/caddy/Caddyfile "$HOST:$REMOTE_DIR/deploy/caddy/Caddyfile"

echo "==> compose up (profile caddy)"
ssh "$HOST" "cd '$REMOTE_DIR' && docker compose --profile caddy up -d --no-build --remove-orphans && docker image prune -f >/dev/null"

echo "==> health via Caddy"
URL="https://$SITE_HOST${BASE_PATH:-}/health"
for i in $(seq 1 30); do
  if curl -fsS --max-time 5 "$URL" >/dev/null 2>&1; then
    echo "    $URL -> $(curl -s --max-time 5 "$URL")"
    exit 0
  fi
  sleep 2
done
echo "    $URL not healthy after 60 s — check: ssh $HOST 'cd $REMOTE_DIR && docker compose logs --tail 50'" >&2
exit 1
