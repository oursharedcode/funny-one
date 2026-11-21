# SPDX-License-Identifier: AGPL-3.0-only
"""The pack batch's image work (B-29, design §4.4): WebP encoding and review sheets.

Called by `cloudflare/packbatch.mjs`, which owns the prompts, the keys and the bucket;
this file only touches pixels. Run with the picture-review venv (Pillow with WebP):

    .picture-review/venv/Scripts/python.exe -I scripts/picture-review/packimages.py encode IN.jpg OUT.webp
    .picture-review/venv/Scripts/python.exe -I scripts/picture-review/packimages.py crop IN.webp OUT.webp
    .picture-review/venv/Scripts/python.exe -I scripts/picture-review/packimages.py keep IN.webp OUT.webp
    .picture-review/venv/Scripts/python.exe -I scripts/picture-review/packimages.py sheets MANIFEST.json OUTDIR [--only S001,A03] [--name flagged]

`encode`, `crop` and `keep` print {"width", "height", "bytes"} as JSON. `crop` cuts the bottom
tenth away, where a picture still signed after its redraws carries the signature, and half as
much from each side, then scales back to the picture's size. `keep` copies a WebP draw byte for
byte, so an earlier draw is stored without a second lossy encode. `sheets` writes, per review group,
a 5-column grid of whole pictures and a sheet of their bottom strips at half size, where
Flux Schnell's fake signatures sit (Step 114: about 1 picture in 4).
"""

import argparse
import json
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, features

# B-29 (2026-11-05): WebP, not the model's ≈ 700 KB JPEG. Quality 82 measured on Step 114's
# test pictures: indistinguishable from the JPEG at full size, ≈ 6× smaller (85-215 KB).
QUALITY = 82
METHOD = 6  # libwebp's slowest, smallest; ≈ 1 s a picture
# Owner decision A (2026-11-21): the last resort for a picture still signed after its
# redraws. A tenth took every signature of three test pictures and kept their scenes.
CROP_BOTTOM = 0.10

THUMB = 320
COLUMNS = 5
LABEL_FONT = 22
STRIP_FRACTION = 0.2  # the bottom fifth of the picture
STRIP_SCALE = 0.5
STRIP_COLUMNS = 2


def encode(src: Path, dst: Path, quality: int, bottom: float = 0.0) -> dict:
    if not features.check("webp"):
        raise SystemExit("this Pillow has no WebP support")
    with Image.open(src) as im:
        im.load()
        width, height = im.size
        rgb = im.convert("RGB")
    if bottom:
        cut = round(height * bottom)
        side = cut // 2  # so a square picture stays square, as the game shows it
        rgb = rgb.crop((side, 0, width - side, height - cut)).resize((width, height), Image.LANCZOS)
    dst.parent.mkdir(parents=True, exist_ok=True)
    tmp = dst.with_suffix(".tmp")
    rgb.save(tmp, "WEBP", quality=quality, method=METHOD)
    tmp.replace(dst)
    return {"width": width, "height": height, "bytes": dst.stat().st_size}


def keep(src: Path, dst: Path) -> dict:
    with Image.open(src) as im:
        if im.format != "WEBP":
            raise SystemExit(f"{src} is not a WebP draw")
        width, height = im.size
    dst.parent.mkdir(parents=True, exist_ok=True)
    tmp = dst.with_suffix(".tmp")
    shutil.copyfile(src, tmp)
    tmp.replace(dst)
    return {"width": width, "height": height, "bytes": dst.stat().st_size}


def label(draw: ImageDraw.ImageDraw, xy, text: str, font) -> None:
    x, y = xy
    left, top, right, bottom = draw.textbbox((x, y), text, font=font)
    draw.rectangle((left - 4, top - 3, right + 4, bottom + 3), fill=(0, 0, 0))
    draw.text((x, y), text, fill=(255, 255, 255), font=font)


def grid(items: list, root: Path, font):
    rows = (len(items) + COLUMNS - 1) // COLUMNS
    sheet = Image.new("RGB", (COLUMNS * THUMB, rows * THUMB), "white")
    draw = ImageDraw.Draw(sheet)
    for i, item in enumerate(items):
        x, y = (i % COLUMNS) * THUMB, (i // COLUMNS) * THUMB
        with Image.open(root / item["file"]) as im:
            sheet.paste(im.convert("RGB").resize((THUMB, THUMB), Image.LANCZOS), (x, y))
        label(draw, (x + 6, y + 6), item["n"], font)
    return sheet


def strips(items: list, root: Path, font):
    cells = []
    for item in items:
        with Image.open(root / item["file"]) as im:
            w, h = im.size
            strip = im.convert("RGB").crop((0, int(h * (1 - STRIP_FRACTION)), w, h))
            cells.append(strip.resize((int(w * STRIP_SCALE), int(strip.height * STRIP_SCALE))))
    cw = max(c.width for c in cells)
    ch = max(c.height for c in cells)
    gap = 6
    rows = (len(cells) + STRIP_COLUMNS - 1) // STRIP_COLUMNS
    sheet = Image.new("RGB", (STRIP_COLUMNS * (cw + gap), rows * (ch + gap)), (60, 60, 60))
    draw = ImageDraw.Draw(sheet)
    for i, (cell, item) in enumerate(zip(cells, items)):
        x, y = (i % STRIP_COLUMNS) * (cw + gap), (i // STRIP_COLUMNS) * (ch + gap)
        sheet.paste(cell, (x, y))
        label(draw, (x + cw // 2 - 20, y + 4), item["n"], font)
    return sheet


def sheets(manifest_path: Path, out: Path, only: set | None, name: str | None) -> list:
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    root = manifest_path.parent
    items = [it for it in manifest["items"] if it.get("file") and (root / it["file"]).exists()]
    if only is not None:
        items = [it for it in items if it["n"] in only]
        groups = {name or "picked": items}
    else:
        groups = {}
        for it in items:
            groups.setdefault(it["sheet"], []).append(it)
    font = ImageFont.load_default(size=LABEL_FONT)
    out.mkdir(parents=True, exist_ok=True)
    written = []
    for group, members in groups.items():
        if not members:
            continue
        for kind, make in (("grid", grid), ("strips", strips)):
            path = out / f"{group}.{kind}.jpg"
            make(members, root, font).save(path, "JPEG", quality=85)
            written.append(str(path))
    return written


def main(argv: list) -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd", required=True)
    enc = sub.add_parser("encode")
    enc.add_argument("src", type=Path)
    enc.add_argument("dst", type=Path)
    enc.add_argument("--quality", type=int, default=QUALITY)
    cr = sub.add_parser("crop")
    cr.add_argument("src", type=Path)
    cr.add_argument("dst", type=Path)
    cr.add_argument("--quality", type=int, default=QUALITY)
    kp = sub.add_parser("keep")
    kp.add_argument("src", type=Path)
    kp.add_argument("dst", type=Path)
    sh = sub.add_parser("sheets")
    sh.add_argument("manifest", type=Path)
    sh.add_argument("out", type=Path)
    sh.add_argument("--only", default=None)
    sh.add_argument("--name", default=None)
    args = parser.parse_args(argv)
    if args.cmd == "encode":
        print(json.dumps(encode(args.src, args.dst, args.quality)))
    elif args.cmd == "crop":
        print(json.dumps(encode(args.src, args.dst, args.quality, bottom=CROP_BOTTOM)))
    elif args.cmd == "keep":
        print(json.dumps(keep(args.src, args.dst)))
    else:
        only = set(args.only.split(",")) if args.only else None
        print(json.dumps(sheets(args.manifest, args.out, only, args.name)))


if __name__ == "__main__":
    main(sys.argv[1:])
