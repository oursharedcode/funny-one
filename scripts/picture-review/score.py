# SPDX-License-Identifier: AGPL-3.0-only
"""Step 3 of the picture-library review (T-FO-8.2): score every thumbnail against the rubric.

    venv/Scripts/python.exe scripts/picture-review/score.py embed     # CLIP embeddings, once (~10-20 min on CPU)
    venv/Scripts/python.exe scripts/picture-review/score.py nsfw      # NSFW classifier, once   (~20-30 min on CPU)
    venv/Scripts/python.exe scripts/picture-review/score.py queries   # rubric queries -> scores.csv (seconds)

`embed` and `nsfw` are resumable (chunk files). `queries` is cheap and re-runnable: the rubric
lives in CATEGORIES below, so tuning a criterion never re-reads a picture.

Each category is scored as a zero-shot contrast: softmax over the category's own prompts plus a
shared set of "ordinary goofy cartoon" prompts, summed over the category's prompts. A score near 1
means CLIP finds the picture closer to the category than to an ordinary cartoon; most of the
library sits near 0, so what matters is the ranking and the outliers, not the absolute number.
"""

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / ".picture-review"
os.environ.setdefault("HF_HOME", str(ROOT / "hf"))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
import torch  # noqa: E402
from PIL import Image  # noqa: E402

torch.set_num_threads(4)

CHUNK = 500
BATCH = 50
CLIP_MODEL, CLIP_WEIGHTS = "ViT-B-32", "openai"
NSFW_MODEL = "Falconsai/nsfw_image_detection"
STYLE_CUT = ", in a goofy cartoon style"  # STYLE_SUFFIX starts here; the review compares the subject only

# The rubric of docs/PICTURE_REVIEW.md as CLIP text queries. Edit freely; `queries` re-runs in seconds.
SAFE = [
    "a goofy cartoon illustration",
    "a children's book illustration",
    "a colorful hand-drawn doodle of funny characters",
    "a silly cartoon with googly eyes",
    "a funny cartoon scene with two characters",
    "a cartoon animal",
]
CATEGORIES = {
    "nudity_sexual": [
        "a naked person",
        "nudity",
        "a sexually suggestive cartoon",
        "an erotic image",
        "a cartoon character with exposed skin in a suggestive pose",
    ],
    "gore_blood": [
        "a bloody scene",
        "blood and gore",
        "a wounded or injured character",
        "a dead body",
        "a cartoon with blood splatter",
    ],
    "weapon": [
        "a gun",
        "a character pointing a gun at someone",
        "a character stabbing someone with a knife",
        "a sword fight",
        "a realistic weapon",
    ],
    "drugs_alcohol": [
        "a person drinking alcohol",
        "a beer bottle",
        "a cigarette",
        "a person smoking",
        "a bottle of wine",
        "illegal drugs",
    ],
    "gambling": [
        "a casino with slot machines",
        "playing cards and poker chips",
        "gambling",
    ],
    "scary": [
        "a terrifying monster",
        "a horror movie scene",
        "a creepy demon face",
        "a scary dark nightmare",
        "a haunted house with ghosts",
    ],
    "body_horror": [
        "a deformed body with extra limbs",
        "two bodies fused together",
        "a distorted disturbing face",
        "melting flesh",
    ],
    "photoreal": [
        "a photograph of a real person",
        "a realistic photo",
        "a studio portrait photo of a human face",
        "a photorealistic image",
    ],
    "text_logo": [
        "an image with clearly legible words",
        "a logo",
        "a watermark",
        "a brand name written on a sign",
    ],
    "hate_symbol": [
        "a swastika",
        "a hate symbol",
    ],
    "flag": [
        "a national flag",
        "a flag on a pole",
    ],
}


def manifest() -> pd.DataFrame:
    rows = [json.loads(line) for line in (ROOT / "manifest.jsonl").read_text().splitlines()]
    df = pd.DataFrame(rows)
    df[["who", "with", "where", "did"]] = pd.DataFrame(df["ids"].tolist(), index=df.index)
    df["subject"] = df["prompt"].str.split(STYLE_CUT, regex=False).str[0]
    return df


def chunks(df: pd.DataFrame):
    for start in range(0, len(df), CHUNK):
        yield start // CHUNK, df.iloc[start : start + CHUNK]


def load_images(hashes):
    return [Image.open(ROOT / "thumbs" / f"{h}.jpg").convert("RGB") for h in hashes]


def embed() -> None:
    import open_clip

    out = ROOT / "emb"
    out.mkdir(exist_ok=True)
    model, _, preprocess = open_clip.create_model_and_transforms(CLIP_MODEL, pretrained=CLIP_WEIGHTS)
    model.eval()
    df = manifest()
    for n, part in chunks(df):
        target = out / f"chunk_{n:03d}.npy"
        if target.exists():
            continue
        missing = [h for h in part["hash"] if not (ROOT / "thumbs" / f"{h}.jpg").exists()]
        if missing:
            sys.exit(f"{len(missing)} thumbnails missing in chunk {n}; finish fetch.py first")
        vecs = []
        for b in range(0, len(part), BATCH):
            imgs = load_images(part["hash"].iloc[b : b + BATCH])
            batch = torch.stack([preprocess(im) for im in imgs])
            with torch.no_grad():
                v = model.encode_image(batch)
                v = v / v.norm(dim=-1, keepdim=True)
            vecs.append(v.numpy())
        np.save(target, np.concatenate(vecs))
        print(f"embedded chunk {n + 1}/{len(df) // CHUNK}", flush=True)


def nsfw() -> None:
    from transformers import AutoModelForImageClassification, ViTImageProcessor

    out = ROOT / "nsfw"
    out.mkdir(exist_ok=True)
    processor = ViTImageProcessor.from_pretrained(NSFW_MODEL)
    model = AutoModelForImageClassification.from_pretrained(NSFW_MODEL).eval()
    label_ids = {v.lower(): k for k, v in model.config.id2label.items()}
    bad = label_ids["nsfw"]
    df = manifest()
    for n, part in chunks(df):
        target = out / f"chunk_{n:03d}.npy"
        if target.exists():
            continue
        probs = []
        for b in range(0, len(part), BATCH):
            imgs = load_images(part["hash"].iloc[b : b + BATCH])
            with torch.no_grad():
                logits = model(**processor(images=imgs, return_tensors="pt")).logits
            probs.append(torch.softmax(logits, dim=-1)[:, bad].numpy())
        np.save(target, np.concatenate(probs))
        print(f"nsfw chunk {n + 1}/{len(df) // CHUNK}", flush=True)


def queries() -> None:
    import open_clip

    df = manifest()
    img = np.concatenate([np.load(f) for f in sorted((ROOT / "emb").glob("chunk_*.npy"))])
    if len(img) != len(df):
        sys.exit(f"{len(img)} embeddings for {len(df)} pictures; run `embed` to the end")
    model, _, _ = open_clip.create_model_and_transforms(CLIP_MODEL, pretrained=CLIP_WEIGHTS)
    model.eval()
    tok = open_clip.get_tokenizer(CLIP_MODEL)

    def encode(texts):
        out = []
        for b in range(0, len(texts), 100):
            with torch.no_grad():
                v = model.encode_text(tok(texts[b : b + 100]))
                out.append((v / v.norm(dim=-1, keepdim=True)).numpy())
        return np.concatenate(out)

    scale = float(model.logit_scale.exp())
    safe = encode(SAFE)
    for name, prompts in CATEGORIES.items():
        pos = encode(prompts)
        logits = scale * img @ np.concatenate([pos, safe]).T
        e = np.exp(logits - logits.max(axis=1, keepdims=True))
        df[name] = (e / e.sum(axis=1, keepdims=True))[:, : len(prompts)].sum(axis=1)

    # How well the picture matches the prompt it was drawn from, minus what the four options
    # alone predict: the lowest residuals are where the model drifted from its instructions.
    sim = (img * encode(df["subject"].tolist())).sum(axis=1)
    df["prompt_sim"] = sim
    expected = sum(df.groupby(col)["prompt_sim"].transform("mean") for col in ["who", "with", "where", "did"])
    df["prompt_resid"] = sim - (expected - 3 * sim.mean())

    nsfw_dir = ROOT / "nsfw"
    if nsfw_dir.exists() and len(list(nsfw_dir.glob("chunk_*.npy"))) == len(df) // CHUNK:
        df["nsfw"] = np.concatenate([np.load(f) for f in sorted(nsfw_dir.glob("chunk_*.npy"))])
    df.drop(columns=["ids", "prompt"]).to_csv(ROOT / "scores.csv", index=False)
    print(f"scores.csv written: {len(df)} rows, categories {list(CATEGORIES)}"
          f"{', nsfw' if 'nsfw' in df else ' (no nsfw yet)'}")


if __name__ == "__main__":
    {"embed": embed, "nsfw": nsfw, "queries": queries}[sys.argv[1]]()
