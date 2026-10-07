# SPDX-License-Identifier: AGPL-3.0-only
"""Steps 4-5 of the picture-library review (T-FO-8.2): trace flags to options, build contact sheets.

    python scripts/picture-review/analyze.py stats                 # score distributions + flag rate per option
    python scripts/picture-review/analyze.py sheets                # contact sheets of every set below
    python scripts/picture-review/analyze.py sheets --only scary   # one set

Reads .picture-review/scores.csv (score.py queries). Sheets go to .picture-review/sheets/ as
6x6 grids of 256 px tiles numbered 1-36, and sheets/index.csv maps (sheet, tile) back to the
picture, so a verdict can be written against a hash.
"""

import sys
from pathlib import Path

import numpy as np
import pandas as pd
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2] / ".picture-review"
SHEETS = ROOT / "sheets"
GRID, TILE = 6, 256
TOP_PER_CATEGORY = 72  # two sheets per criterion at most
NSFW_FLOOR = 0.2
DRIFT_N = 108
SAMPLE_PER_OPTION = 10
SEED = 20261006

CATEGORIES = [
    "nudity_sexual", "gore_blood", "weapon", "drugs_alcohol", "gambling", "scary",
    "body_horror", "photoreal", "text_logo", "hate_symbol", "flag",
]
OPTION_COLS = ["who", "with", "where", "did"]


def scores() -> pd.DataFrame:
    return pd.read_csv(ROOT / "scores.csv")


def stats() -> None:
    df = scores()
    pd.set_option("display.width", 200)
    cats = CATEGORIES + (["nsfw"] if "nsfw" in df else [])
    print("score quantiles (0.5 / 0.9 / 0.99 / 0.999 / max):")
    for c in cats:
        q = df[c].quantile([0.5, 0.9, 0.99, 0.999, 1.0]).round(3).tolist()
        print(f"  {c:14s} {q}   n>=0.5: {(df[c] >= 0.5).sum()}")
    print("\nper-option mean score, highest three options per criterion:")
    for c in cats:
        rows = []
        for col in OPTION_COLS:
            for opt, v in df.groupby(col)[c].mean().items():
                rows.append((v, opt))
        top = sorted(rows, reverse=True)[:3]
        print(f"  {c:14s} " + "  ".join(f"{o} {v:.3f}" for v, o in top))


def font(size: int):
    for name in ("arialbd.ttf", "arial.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def sheet_sets(df: pd.DataFrame) -> dict[str, pd.DataFrame]:
    rng = np.random.default_rng(SEED)
    sets: dict[str, pd.DataFrame] = {}
    for c in CATEGORIES:
        sets[c] = df.sort_values(c, ascending=False).head(TOP_PER_CATEGORY)
    if "nsfw" in df:
        sets["nsfw"] = df[df["nsfw"] >= NSFW_FLOOR].sort_values("nsfw", ascending=False).head(TOP_PER_CATEGORY)
    sets["drift"] = df.sort_values("prompt_resid").head(DRIFT_N)
    picks = []
    for col in OPTION_COLS:
        for opt, group in df.groupby(col):
            picks.append(group.sample(min(SAMPLE_PER_OPTION, len(group)), random_state=int(rng.integers(1 << 31))))
    sets["sample"] = pd.concat(picks).drop_duplicates("hash").reset_index(drop=True)
    return sets


def build_sheets(only: str | None) -> None:
    df = scores()
    SHEETS.mkdir(exist_ok=True)
    lab = font(22)
    index = []
    for name, part in sheet_sets(df).items():
        if only and name != only:
            continue
        part = part.reset_index(drop=True)
        for s in range(0, len(part), GRID * GRID):
            group = part.iloc[s : s + GRID * GRID]
            sheet = Image.new("RGB", (GRID * TILE, GRID * TILE), "white")
            draw = ImageDraw.Draw(sheet)
            for k, (_, row) in enumerate(group.iterrows()):
                tile = Image.open(ROOT / "thumbs" / f"{row['hash']}.jpg").convert("RGB").resize((TILE, TILE))
                x, y = (k % GRID) * TILE, (k // GRID) * TILE
                sheet.paste(tile, (x, y))
                draw.rectangle([x, y, x + 34, y + 26], fill="black")
                draw.text((x + 3, y + 1), str(k + 1), fill="yellow", font=lab)
                index.append({"sheet": f"{name}_{s // (GRID * GRID) + 1:02d}", "tile": k + 1,
                              "hash": row["hash"], "who": row["who"], "with": row["with"],
                              "where": row["where"], "did": row["did"]})
            sheet.save(SHEETS / f"{name}_{s // (GRID * GRID) + 1:02d}.png")
        print(f"{name}: {len(part)} pictures, {-(-len(part) // (GRID * GRID))} sheet(s)")
    out = SHEETS / ("index.csv" if not only else f"index_{only}.csv")
    pd.DataFrame(index).to_csv(out, index=False)


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "stats":
        stats()
    elif cmd == "sheets":
        build_sheets(sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None)
    else:
        sys.exit(f"unknown command {cmd}")
