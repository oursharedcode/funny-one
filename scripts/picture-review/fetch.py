# SPDX-License-Identifier: AGPL-3.0-only
"""Step 2 of the picture-library review (T-FO-8.2): fetch every library picture and keep a thumbnail.

    .picture-review/venv/Scripts/python.exe scripts/picture-review/fetch.py [--limit N]

Reads .picture-review/manifest.jsonl, GETs the public `<library>/i/<hash>.png` (no secret),
shrinks it to 384 px and writes .picture-review/thumbs/<hash>.jpg. The ~730 KB originals
are not kept. Resumable: a thumbnail that exists is skipped, so a stopped run picks up
where it left off. Four requests at a time, the same ceiling as pregenerate.mjs.
"""

import io
import json
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests
from PIL import Image

LIBRARY = "https://funny-multi-image.oursharedcode.workers.dev"
ROOT = Path(__file__).resolve().parents[2] / ".picture-review"
THUMBS = ROOT / "thumbs"
CONCURRENCY = 4
ATTEMPTS = 5
SIZE = 384

lock = threading.Lock()
stats = {"done": 0, "skipped": 0, "fetched": 0, "failed": 0, "bytes": 0}
started = time.time()


def fetch_one(session: requests.Session, row: dict, total: int) -> None:
    out = THUMBS / f"{row['hash']}.jpg"
    if out.exists():
        with lock:
            stats["skipped"] += 1
            stats["done"] += 1
        return
    url = f"{LIBRARY}/i/{row['hash']}.png"
    problem = ""
    for attempt in range(ATTEMPTS):
        try:
            r = session.get(url, timeout=60)
            if r.status_code == 200:
                img = Image.open(io.BytesIO(r.content)).convert("RGB")
                img.thumbnail((SIZE, SIZE), Image.LANCZOS)
                tmp = out.with_suffix(".tmp")
                img.save(tmp, "JPEG", quality=85)
                tmp.replace(out)
                with lock:
                    stats["fetched"] += 1
                    stats["bytes"] += len(r.content)
                break
            problem = f"HTTP {r.status_code}"
            if r.status_code not in (429, 500, 502, 503, 504):
                break
        except Exception as e:  # network or decode error: retry
            problem = repr(e)
        time.sleep(min(2**attempt, 30))
    else:
        pass
    if not out.exists():
        with lock:
            stats["failed"] += 1
            with open(ROOT / "fetch-failures.txt", "a") as f:
                f.write(f"{row['i']}\t{row['hash']}\t{problem}\n")
    with lock:
        stats["done"] += 1
        if stats["done"] % 250 == 0 or stats["done"] == total:
            mb = stats["bytes"] / 1e6
            print(
                f"{stats['done']}/{total} · fetched {stats['fetched']} · skipped {stats['skipped']}"
                f" · failed {stats['failed']} · {mb:.0f} MB in {time.time() - started:.0f}s",
                flush=True,
            )


def main() -> None:
    limit = int(sys.argv[sys.argv.index("--limit") + 1]) if "--limit" in sys.argv else None
    rows = [json.loads(line) for line in (ROOT / "manifest.jsonl").read_text().splitlines()]
    if limit:
        rows = rows[:limit]
    THUMBS.mkdir(exist_ok=True)
    with requests.Session() as session, ThreadPoolExecutor(CONCURRENCY) as pool:
        for _ in pool.map(lambda row: fetch_one(session, row, len(rows)), rows):
            pass
    print("final:", stats, flush=True)
    if stats["failed"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
