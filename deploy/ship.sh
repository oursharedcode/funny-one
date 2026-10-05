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
# FO_HOST, FO_APEX, SITE_HOST, SITE_APEX, TRUSTED_PROXY_HOPS=1 behind Caddy) —
# the secret never travels through this script. What it does, in order:
#   1. reads BASE_PATH from the remote .env, so the client is built with the
#      value the server will run under (they must agree — DEPLOYMENT.md);
#   2. builds the image with that build-arg, tagged with the git commit;
#   3. streams it over SSH (docker save | gzip | ssh docker load), ~80 MB;
#   4. copies docker-compose.yml and deploy/caddy/Caddyfile alongside .env,
#      and streams deploy/origin-root/funny37 (the privacy policy and
#      assetlinks.json, served by Caddy itself — B-1b) into
#      static/funny37-root, swapped in whole like Funny One's bundle;
#   5. `docker compose --profile caddy up -d` on the host, reloads Caddy (a
#      changed Caddyfile is not picked up by `up` alone), then checks
#      FM_HOST/health through Caddy, that the two origin-root files come from
#      Caddy rather than the game's index.html, and that the old
#      /funny37-game address on SITE_HOST forwards to FM_HOST.
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
# Funny One's two names as well: the Caddyfile copied below names all six, and
# Caddy refuses to load it with any of them empty.
for v in FM_HOST FM_APEX FO_HOST FO_APEX SITE_HOST SITE_APEX; do
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

# Before `up`: on a host without Funny One, Docker would otherwise create the
# ./static mount source itself, owned by root. tar, not scp: .well-known is a
# dot-directory and the swap needs the whole tree in one stream.
echo "==> stream deploy/origin-root/funny37 to $HOST:$REMOTE_DIR/static/funny37-root"
tar -C deploy/origin-root/funny37 -czf - . | ssh "$HOST" "set -e
  cd '$REMOTE_DIR' && mkdir -p static && cd static
  rm -rf funny37-root.new funny37-root.old && mkdir funny37-root.new
  tar -xzf - -C funny37-root.new
  if [ -d funny37-root ]; then mv funny37-root funny37-root.old; fi
  mv funny37-root.new funny37-root && rm -rf funny37-root.old"

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

# Both files must come from Caddy, not the container: its SPA fallback would
# answer either path 200 with index.html, so the status alone proves nothing.
# Google also refuses an assetlinks.json behind a redirect or of another type.
origin_ok=1
got="$(curl -s -o /dev/null -w '%{http_code} %{content_type}' --max-time 10 "https://$FM_HOST/.well-known/assetlinks.json" || true)"
echo "    https://$FM_HOST/.well-known/assetlinks.json -> $got"
case "$got" in "200 application/json"*) ;; *) origin_ok=0 ;; esac
got="$(curl -s --max-time 10 "https://$FM_HOST/privacy" || true)"
# Matched in the shell, not piped to `grep -q`: grep exits at the first match,
# and under pipefail the writer's broken pipe then fails a check that passed.
case "$got" in
  *'id="privacy-en"'*) echo "    https://$FM_HOST/privacy -> the policy" ;;
  *)
    echo "    https://$FM_HOST/privacy -> not the policy" >&2
    origin_ok=0
    ;;
esac
[ "$origin_ok" = 1 ] || { echo "    origin-root files not served by Caddy — check the Caddyfile and $REMOTE_DIR/static/funny37-root" >&2; exit 1; }

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
