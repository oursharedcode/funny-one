#!/usr/bin/env bash
# Funny Family landing page — re-encode the trailer into the files the page
# serves from public/media (Step 72). The source clip is not in the repo
# (local_docs/ holds the owner's working files); the encoded files are, so
# the build needs no ffmpeg. Run again only when the trailer changes:
#
#   apps/funny-family-site/scripts/encode-media.sh local_docs/tests/video_148514.mp4
#
# Writes, from the 6 s 864×496 source:
#   clip.mp4    variant A's click-to-play trailer: H.264 + AAC with the sound
#               lifted 16 dB (the source sits near -34 LUFS, far too quiet
#               beside any other video), moov atom first so it starts while
#               it downloads.
#   loop.webm   variant B's silent background loop, VP9 — the smaller file,
#   loop.mp4    and its H.264 fallback for browsers without VP9; no sound track.
#   poster.webp the frame both variants show before (or instead of) playing —
#               3.0 s, the giraffe and the dog on their cloud.
#   og.jpg      the same frame at 1200×630 for link previews (Open Graph);
#               cropped from the top so no ear is lost.
set -euo pipefail

SRC="${1:?usage: encode-media.sh path/to/trailer.mp4}"
FFMPEG="${FFMPEG:-ffmpeg}"
OUT="$(cd "$(dirname "$0")/../public/media" && pwd)"
POSTER_AT=3.0

run() { "$FFMPEG" -hide_banner -loglevel error -y "$@"; }

run -i "$SRC" -map 0:v:0 -map 0:a:0 \
  -c:v libx264 -preset veryslow -crf 23 -profile:v high -pix_fmt yuv420p \
  -af "volume=16dB" -c:a aac -b:a 96k \
  -movflags +faststart "$OUT/clip.mp4"

run -i "$SRC" -map 0:v:0 -an \
  -c:v libvpx-vp9 -crf 38 -b:v 0 -row-mt 1 -deadline good -cpu-used 1 -pix_fmt yuv420p \
  "$OUT/loop.webm"

run -i "$SRC" -map 0:v:0 -an \
  -c:v libx264 -preset veryslow -crf 27 -profile:v high -pix_fmt yuv420p \
  -movflags +faststart "$OUT/loop.mp4"

run -ss "$POSTER_AT" -i "$SRC" -frames:v 1 -c:v libwebp -quality 80 "$OUT/poster.webp"

# 864×496 is wider than 1200×630 is tall: keep the full width, the top 454
# rows (864 / (1200/630)), then scale up.
run -ss "$POSTER_AT" -i "$SRC" -frames:v 1 \
  -vf "crop=864:454:0:0,scale=1200:630:flags=lanczos" -q:v 3 "$OUT/og.jpg"

ls -l "$OUT"
