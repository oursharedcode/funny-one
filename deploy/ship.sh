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
# .env.example: CLOUDFLARE_WORKER_URL/SECRET, BASE_PATH, FM_HOST, FM_APEX,
# SITE_HOST, SITE_APEX, TRUSTED_PROXY_HOPS=1 behind Caddy) — the secret never
# travels through this script. What it does, in order:
#   1. reads BASE_PATH from the remote .env, so the client is built with the
#      value the server will run under (they must agree — DEPLOYMENT.md);
#   2. builds the image with that build-arg, tagged with the git commit;
#   3. streams it over SSH (docker save | gzip | ssh docker load), ~80 MB;
#   4. copies docker-compose.yml and deploy/caddy/Caddyfile alongside .env;
#   5. `docker compose --profile caddy up -d` on the host, reloads Caddy (a
#      changed Caddyfile is not picked up by `up` alone), then checks
#      FM_HOST/health through Caddy and that the old /funny37-game address
#      on SITE_HOST forwards to FM_HOST.
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
FM_HOST="$(get FM_HOST)"
SITE_HOST="$(get SITE_HOST)"
for v in FM_HOST FM_APEX SITE_HOST SITE_APEX; do
  [ -n "$(get "$v")" ] || { echo "$v missing in $HOST:$REMOTE_DIR/.env" >&2; exit 1; }
done
# The Caddyfile mounts the game at FM_HOST's root, so a sub-path here would
# build a client Caddy cannot reach.
case "${BASE_PATH:-/}" in /) ;; *) echo "BASE_PATH must be / (or unset) behind this Caddyfile, got $BASE_PATH" >&2; exit 1 ;; esac
echo "    BASE_PATH=${BASE_PATH:-/}  FM_HOST=$FM_HOST  SITE_HOST=$SITE_HOST"

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

# `up` leaves a running Caddy on its old Caddyfile when only that file changed
# (the bind mount is read at start); reloading is a no-op otherwise.
echo "==> reload caddy"
# Retried: when `up` has just recreated Caddy its admin API is not answering yet.
ssh "$HOST" "cd '$REMOTE_DIR' && for i in 1 2 3 4 5; do
  docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile && exit 0
  sleep 2
done; exit 1"

echo "==> health via Caddy"
URL="https://$FM_HOST/health"
healthy=0
for i in $(seq 1 30); do
  if curl -fsS --max-time 5 "$URL" >/dev/null 2>&1; then
    echo "    $URL -> $(curl -s --max-time 5 "$URL")"
    healthy=1
    break
  fi
  sleep 2
done
[ "$healthy" = 1 ] || { echo "    $URL not healthy after 60 s — check: ssh $HOST 'cd $REMOTE_DIR && docker compose logs --tail 50'" >&2; exit 1; }

# The old address must forward, not serve: one container, one room registry.
OLD="https://$SITE_HOST/funny37-game/?room=CHECK"
# Retried, and `|| true` so a failed curl cannot end the script silently under `set -e`:
# right after a reload the old host can answer slowly for a moment.
got=""
for i in 1 2 3 4 5; do
  got="$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' --max-time 10 "$OLD" || true)"
  [ "$got" = "301 https://$FM_HOST/?room=CHECK" ] && break
  sleep 2
done
echo "    $OLD -> $got"
[ "$got" = "301 https://$FM_HOST/?room=CHECK" ] || { echo "    the old address does not forward to https://$FM_HOST/ — check the Caddyfile" >&2; exit 1; }
