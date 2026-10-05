#!/usr/bin/env bash
# Funny One «Одна Чепуха: по кругу» — ship the static bundle to the Docker
# host over SSH (T-FO-6.2, requirements D-5; its own host since Step 60).
# Funny One has no server: Caddy, already running for Funny Multi
# (deploy/ship.sh), serves the files itself at the root of FO_HOST. No image,
# no container, no secret.
#
#   deploy/ship-funny-one.sh ubuntu@152.69.166.212            # remote dir ~/funny
#   deploy/ship-funny-one.sh ubuntu@152.69.166.212 /srv/funny
#
# Assumes the remote directory already holds the .env deploy/ship.sh uses.
# Read from it here: FO_HOST and FO_APEX (the game's host and its bare name),
# SITE_HOST (the older shared host, whose /funny1-game forwards here), FM_HOST
# (for the final health check of Funny Multi) and CLOUDFLARE_WORKER_URL — the
# picture library's public address, baked into the bundle as VITE_PICTURES_URL
# so the start screen can offer pictures from the Internet (D-10). Set
# VITE_PICTURES_URL yourself to override it; set it empty to build without
# that option. What the script does, in order:
#   1. builds apps/funny-one-client at the root (BASE_PATH unset = "/"), the
#      mount point the Caddyfile gives it;
#   2. streams dist/ over SSH into static/funny-one.new, then swaps it in
#      for static/funny-one — a reader sees the old build or the new one,
#      never a half-copied mix; the same for deploy/origin-root/funny1 (the
#      privacy policy and assetlinks.json) into static/funny1-root and for
#      deploy/origin-root/funny1-retired (the service worker the former
#      address answers with) into static/funny1-retired;
#   3. copies docker-compose.yml and deploy/caddy/Caddyfile, brings the caddy
#      service up (recreated only if its compose config changed, which
#      briefly drops Funny Multi's open sockets; they reconnect) and reloads
#      the Caddyfile, which `up` alone would not do for a changed file;
#   4. checks the game, its service worker and the origin-root files through
#      Caddy, that the former address forwards and retires its service
#      worker, and that Funny Multi's /health still answers.
set -euo pipefail

HOST="${1:?usage: deploy/ship-funny-one.sh user@host [remote-dir]}"
REMOTE_DIR="${2:-funny}"
OLD_PATH="/funny1-game"
# Git Bash rewrites arguments that look like POSIX paths; see deploy/ship.sh.
export MSYS_NO_PATHCONV=1

cd "$(dirname "$0")/.."

echo "==> remote .env"
REMOTE_ENV="$(ssh "$HOST" "cat '$REMOTE_DIR/.env'")"
get() { printf '%s\n' "$REMOTE_ENV" | sed -n "s/^$1=//p" | tail -1; }
FO_HOST="$(get FO_HOST)"
FO_APEX="$(get FO_APEX)"
SITE_HOST="$(get SITE_HOST)"
FM_HOST="$(get FM_HOST)"
# All of them before anything is copied: Caddy refuses a Caddyfile with an
# empty site name, and it is the same Caddy that serves Funny Multi.
for v in FO_HOST FO_APEX SITE_HOST; do
  [ -n "$(get "$v")" ] || { echo "$v missing in $HOST:$REMOTE_DIR/.env" >&2; exit 1; }
done
PICTURES_URL="${VITE_PICTURES_URL-$(get CLOUDFLARE_WORKER_URL)}"
if [ -n "$PICTURES_URL" ]; then pictures="set"; else pictures="not set — the build offers built-in pictures only"; fi
echo "    FO_HOST=$FO_HOST  SITE_HOST=$SITE_HOST  picture library: $pictures"

echo "==> build funny-one-client (at the root)"
npm run build -w packages/shared >/dev/null
env -u BASE_PATH VITE_PICTURES_URL="$PICTURES_URL" npm run build -w apps/funny-one-client >/dev/null
DIST="apps/funny-one-client/dist"
[ -f "$DIST/index.html" ] && [ -f "$DIST/sw.js" ] || { echo "build produced no index.html/sw.js" >&2; exit 1; }

# tar, not scp: .well-known is a dot-directory and the swap needs the whole
# tree in one stream.
stream() { # local-dir name-under-static
  echo "==> stream $1 to $HOST:$REMOTE_DIR/static/$2"
  tar -C "$1" -czf - . | ssh "$HOST" "set -e
    cd '$REMOTE_DIR' && mkdir -p static && cd static
    rm -rf '$2.new' '$2.old' && mkdir '$2.new'
    tar -xzf - -C '$2.new'
    if [ -d '$2' ]; then mv '$2' '$2.old'; fi
    mv '$2.new' '$2' && rm -rf '$2.old'"
}
stream "$DIST" funny-one
stream deploy/origin-root/funny1 funny1-root
stream deploy/origin-root/funny1-retired funny1-retired

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
ORIGIN="https://$FO_HOST"
OLD="https://$SITE_HOST$OLD_PATH"
check() { # url expected ("status" or "status redirect-url")
  local got
  got="$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' --max-time 10 "$1" || true)"
  got="${got% }"
  printf '    %s -> %s\n' "$1" "$got"
  [ "$got" = "$2" ]
}
ok=1
# Patient: on the first run Caddy has to fetch the new host's certificate.
for i in $(seq 1 30); do
  ok=1
  check "$ORIGIN/" 200 || ok=0
  [ "$ok" = 1 ] && break
  sleep 2
done
check "$ORIGIN/sw.js" 200 || ok=0
check "$ORIGIN/manifest.webmanifest" 200 || ok=0
curl -fsS --max-time 10 "$ORIGIN/" | grep -q '"/assets/' \
  || { echo "    index.html does not reference /assets/ — wrong build?" >&2; ok=0; }
check "https://$FO_APEX/" "301 $ORIGIN/" || ok=0

# Both must come from the origin-root blocks, not the game's SPA fallback,
# which would answer either path 200 with index.html. Google also refuses an
# assetlinks.json behind a redirect or of another type.
got="$(curl -s -o /dev/null -w '%{http_code} %{content_type}' --max-time 10 "$ORIGIN/.well-known/assetlinks.json" || true)"
echo "    $ORIGIN/.well-known/assetlinks.json -> $got"
case "$got" in "200 application/json"*) ;; *) ok=0 ;; esac
# Into a variable, then matched in the shell: `curl | grep -q` fails under
# pipefail when grep finds the id and exits while curl is still writing.
got="$(curl -s --max-time 10 "$ORIGIN/privacy" || true)"
case "$got" in
  *'id="privacy-en"'*) echo "    $ORIGIN/privacy -> the policy" ;;
  *)
    echo "    $ORIGIN/privacy -> not the policy" >&2
    ok=0
    ;;
esac

# The former address: every path forwards, except the service worker's script
# — a browser that has the old game asks only for that, and must be handed the
# worker that retires it (a redirect there would be ignored).
check "$OLD/" "301 $ORIGIN/" || ok=0
check "$OLD" "301 $ORIGIN/" || ok=0
got="$(curl -s -o /dev/null -w '%{http_code} %{content_type}' --max-time 10 "$OLD/sw.js" || true)"
echo "    $OLD/sw.js -> $got"
case "$got" in "200 text/javascript"* | "200 application/javascript"*) ;; *) ok=0 ;; esac
curl -s --max-time 10 "$OLD/sw.js" | grep -q 'registration.unregister' \
  || { echo "    $OLD/sw.js is not the retiring service worker" >&2; ok=0; }

if [ -n "$FM_HOST" ]; then check "https://$FM_HOST/health" 200 || ok=0; fi
[ "$ok" = 1 ] || { echo "verification failed — check: ssh $HOST 'cd $REMOTE_DIR && docker compose logs --tail 50 caddy'" >&2; exit 1; }
echo "    live: $ORIGIN/"
