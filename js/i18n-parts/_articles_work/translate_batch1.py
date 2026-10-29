#!/usr/bin/env python3
"""Translate articles-en.json -> locale JSON caches via MyMemory (local assemble later)."""
from __future__ import annotations

import hashlib
import json
import pathlib
import random
import re
import sys
import time

from deep_translator import MyMemoryTranslator

ROOT = pathlib.Path(__file__).resolve().parents[3]
EN_PATH = ROOT / "js/i18n-parts/articles-en.json"
CACHE_DIR = pathlib.Path("/tmp/articles-batch-1/cache")
OUT_DIR = pathlib.Path("/tmp/articles-batch-1")

MM_CODES = {
    "zh": ("en-GB", "zh-CN"),
    "yue": ("en-GB", "zh-TW"),
    "hi": ("en-GB", "hi-IN"),
    "es": ("en-GB", "es-ES"),
    "ar": ("en-GB", "ar-SA"),
}

BRANDS = [
    "TotemAstrology.com",
    "Totem Astrology™",
    "Totem Astrology",
    "Totem Connections",
    "Totem Calculator",
    "Totem Animals Calculator",
]

YUE_REPLACEMENTS = [
    (r"他們", "佢哋"),
    (r"她們", "佢哋"),
    (r"它們", "佢哋"),
    (r"我們", "我哋"),
    (r"你們", "你哋"),
    (r"這個", "呢個"),
    (r"那個", "嗰個"),
    (r"這裡", "呢度"),
    (r"這裏", "呢度"),
    (r"那裡", "嗰度"),
    (r"那裏", "嗰度"),
    (r"這樣", "噉"),
    (r"那麼", "咁"),
    (r"什麼", "咩"),
    (r"怎麼", "點樣"),
    (r"怎樣", "點樣"),
    (r"為什麼", "點解"),
    (r"為甚麼", "點解"),
    (r"現在", "而家"),
    (r"沒有", "冇"),
    (r"還沒", "仲未"),
    (r"還是", "定係"),
    (r"還有", "仲有"),
    (r"還", "仲"),
    (r"喜歡", "鍾意"),
    (r"看見", "睇見"),
    (r"看看", "睇睇"),
    (r"看", "睇"),
    (r"告訴", "話畀"),
    (r"給", "畀"),
    (r"來", "嚟"),
    (r"和", "同"),
    (r"與", "同"),
    (r"但是", "但係"),
    (r"只是", "淨係"),
    (r"只有", "淨係"),
    (r"不是", "唔係"),
    (r"不會", "唔會"),
    (r"不要", "唔好"),
    (r"不能", "唔可以"),
    (r"不同", "唔同"),
    (r"不太", "唔太"),
    (r"不多", "唔多"),
    (r"不", "唔"),
    (r"這", "呢"),
    (r"那", "嗰"),
    (r"他", "佢"),
    (r"她", "佢"),
    (r"它", "佢"),
    (r"是", "係"),
    (r"在", "喺"),
    (r"的", "嘅"),
    (r"了", "咗"),
    (r"嗎", "呀"),
    (r"著", "住"),
    (r"很", "好"),
]


def protect(text: str):
    tokens = {}
    i = 0

    def store(s: str) -> str:
        nonlocal i
        key = f"XTOK{i:04d}X"
        tokens[key] = s
        i += 1
        return key

    text = re.sub(r"<[^>]+>", lambda m: store(m.group(0)), text)
    for b in BRANDS:
        if b in text:
            text = text.replace(b, store(b))
    text = re.sub(r"\{[a-zA-Z0-9_]+\}", lambda m: store(m.group(0)), text)
    return text, tokens


def unprotect(text: str, tokens: dict) -> str:
    for k in sorted(tokens.keys(), key=len, reverse=True):
        v = tokens[k]
        text = text.replace(k, v)
        text = re.sub(re.escape(k), v, text, flags=re.I)
    return text


def split_chunks(text: str, limit: int = 450):
    if len(text) <= limit:
        return [text]
    parts = re.split(r"(?<=[.!?。；;:])\s+", text)
    chunks, cur = [], ""
    for p in parts:
        if not p:
            continue
        if len(p) > limit:
            if cur:
                chunks.append(cur)
                cur = ""
            for i in range(0, len(p), limit):
                chunks.append(p[i : i + limit])
            continue
        if len(cur) + len(p) + 1 <= limit:
            cur = (cur + " " + p).strip() if cur else p
        else:
            if cur:
                chunks.append(cur)
            cur = p
    if cur:
        chunks.append(cur)
    return chunks


def to_yue(text: str) -> str:
    parts = re.split(r"(<[^>]+>)", text)
    out = []
    for part in parts:
        if part.startswith("<") and part.endswith(">"):
            out.append(part)
            continue
        brand_map = {}
        for j, b in enumerate(BRANDS):
            if b in part:
                tok = f"__BRAND{j}__"
                brand_map[tok] = b
                part = part.replace(b, tok)
        for pat, repl in YUE_REPLACEMENTS:
            part = re.sub(pat, repl, part)
        for tok, b in brand_map.items():
            part = part.replace(tok, b)
        out.append(part)
    return "".join(out)


def cache_path(loc: str, key: str, en_val: str) -> pathlib.Path:
    h = hashlib.sha1(f"{loc}:{key}:{en_val}".encode()).hexdigest()
    return CACHE_DIR / f"{loc}_{h}.txt"


def main():
    locales = sys.argv[1:] or ["zh", "yue", "hi", "es", "ar"]
    en = json.loads(EN_PATH.read_text(encoding="utf-8"))
    keys = list(en.keys())
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    translators = {}

    def get_translator(loc: str):
        if loc not in translators:
            src, tgt = MM_CODES[loc]
            translators[loc] = MyMemoryTranslator(source=src, target=tgt)
        return translators[loc]

    def translate_text(loc: str, text: str) -> str:
        t = get_translator(loc)
        prot, tokens = protect(text)
        chunks = split_chunks(prot, 450)
        outs = []
        for ch in chunks:
            for attempt in range(8):
                try:
                    outs.append(t.translate(ch))
                    break
                except Exception as e:
                    if "Length" in type(e).__name__ or "length" in str(e).lower():
                        half = max(150, len(ch) // 2)
                        sub = [ch[:half], ch[half:]]
                        sub_outs = []
                        for s in sub:
                            if not s:
                                continue
                            sub_outs.append(get_translator(loc).translate(s))
                            time.sleep(0.4)
                        outs.append("".join(sub_outs))
                        break
                    wait = 2 + attempt * 2 + random.random()
                    print(f"    retry {attempt} {e} wait {wait:.1f}", flush=True)
                    time.sleep(wait)
                    translators.pop(loc, None)
                    t = get_translator(loc)
            else:
                raise RuntimeError(f"failed chunk for {loc}")
            time.sleep(0.4)
        if loc == "es":
            joined = " ".join(o.strip() for o in outs)
        else:
            joined = "".join(outs)
        val = unprotect(joined, tokens)
        if loc == "yue":
            val = to_yue(val)
        return val

    for loc in locales:
        print(f"\n=== {loc} ===", flush=True)
        d = {}
        pending = []
        for key in keys:
            p = cache_path(loc, key, en[key])
            if p.exists():
                d[key] = p.read_text(encoding="utf-8")
            else:
                pending.append(key)
        print(f"  cached={len(d)} pending={len(pending)}", flush=True)

        for i, key in enumerate(pending):
            try:
                val = translate_text(loc, en[key])
            except Exception as e:
                print(f"  FAIL {key}: {e}", flush=True)
                time.sleep(6)
                val = translate_text(loc, en[key])
            cache_path(loc, key, en[key]).write_text(val, encoding="utf-8")
            d[key] = val
            if (i + 1) % 20 == 0:
                print(f"  {len(d)}/{len(keys)}", flush=True)
                # checkpoint
                (OUT_DIR / f"{loc}.json").write_text(
                    json.dumps({k: d[k] for k in keys if k in d}, ensure_ascii=False),
                    encoding="utf-8",
                )
                time.sleep(1.2)

        missing = [k for k in keys if k not in d]
        (OUT_DIR / f"{loc}.json").write_text(
            json.dumps({k: d[k] for k in keys if k in d}, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print(f"  DONE keys={len(d)} missing={len(missing)}", flush=True)
        time.sleep(2)

    print("COMPLETE", flush=True)


if __name__ == "__main__":
    main()
