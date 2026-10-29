#!/usr/bin/env python3
"""Fill one locale into shared cache (argv[1]=locale)."""
from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path

import translators as ts

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "articles-en.json"
CACHE = ROOT / "_batch7_cache.json"
LOCK = ROOT / "_batch7_cache.lock"

BRANDS = sorted(
    {
        "TotemAstrology.com™",
        "TotemAstrology.com",
        "Totem Astrology™",
        "Totem Astrology",
        "Totem Connections",
        "Totem Animals Calculator",
        "Totem Calculator",
        "Travis Barrett LeBlanc",
        "alucardsilvaticus@gmail.com",
        "4TotemAstrology",
        "@TotemAstrology",
        "Winnie the Pooh",
        "Wizard of Oz",
        "GoDaddy",
        "USPTO",
        "BaZi",
        "NPT",
        "UTC+5:45",
    },
    key=len,
    reverse=True,
)
TAG_RE = re.compile(r"</?[^>]+>")
MAX_CHUNK = 900
BING_TL = {"to": "to", "fj": "fj", "fil": "fil", "nl": "nl", "af": "af"}


def log(msg: str) -> None:
    print(msg, flush=True)


def protect(text: str) -> tuple[str, dict[str, str]]:
    mapping: dict[str, str] = {}
    out = text
    for i, tag in enumerate(TAG_RE.findall(out)):
        tok = f"ZZTAG{i}ZZ"
        mapping[tok] = tag
        out = out.replace(tag, tok, 1)
    for i, brand in enumerate(BRANDS):
        if brand in out:
            tok = f"ZZBRAND{i}ZZ"
            mapping[tok] = brand
            out = out.replace(brand, tok)
    return out, mapping


def unprotect(text: str, mapping: dict[str, str]) -> str:
    out = text
    for tok, val in sorted(mapping.items(), key=lambda kv: -len(kv[0])):
        out = out.replace(tok, val)
        out = out.replace(tok.replace("ZZ", " ZZ "), val)

    def fuzzy(m: re.Match) -> str:
        tok = f"ZZ{m.group(1).upper()}{m.group(2)}ZZ"
        return mapping.get(tok, m.group(0))

    out = re.sub(r"Z\s*Z\s*(TAG|BRAND)\s*(\d+)\s*Z\s*Z", fuzzy, out, flags=re.I)
    out = re.sub(r"\s+(</(?:em|strong|a|span|code|br)\s*/?>)", r"\1", out)
    out = re.sub(r"(<(?:em|strong|a|span|code)[^>]*>)\s+", r"\1", out)
    return out


def chunks(text: str) -> list[str]:
    if len(text) <= MAX_CHUNK:
        return [text]
    parts = re.split(r"(?<=[.!?])\s+", text)
    out: list[str] = []
    buf = ""
    for p in parts:
        if not p:
            continue
        if len(buf) + len(p) + 1 <= MAX_CHUNK:
            buf = f"{buf} {p}".strip()
        else:
            if buf:
                out.append(buf)
            if len(p) <= MAX_CHUNK:
                buf = p
            else:
                for i in range(0, len(p), MAX_CHUNK):
                    out.append(p[i : i + MAX_CHUNK])
                buf = ""
    if buf:
        out.append(buf)
    return out or [text]


def translate_one(text: str, loc: str) -> str:
    protected, mapping = protect(text)
    pieces = []
    for ch in chunks(protected):
        last_err = None
        for attempt in range(5):
            try:
                pieces.append(
                    str(
                        ts.translate_text(
                            ch,
                            translator="bing",
                            from_language="en",
                            to_language=BING_TL[loc],
                        )
                    )
                )
                last_err = None
                break
            except Exception as e:  # noqa: BLE001
                last_err = e
                time.sleep(1.5 * (attempt + 1))
        if last_err is not None:
            raise last_err
        time.sleep(0.05)
    return unprotect(" ".join(pieces), mapping)


def with_lock(fn):
    # simple file lock
    for _ in range(200):
        try:
            fd = os.open(str(LOCK), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.close(fd)
            try:
                return fn()
            finally:
                try:
                    LOCK.unlink()
                except FileNotFoundError:
                    pass
        except FileExistsError:
            time.sleep(0.05)
    raise RuntimeError("lock timeout")


import os  # noqa: E402


def save_key(loc: str, key: str, val: str) -> None:
    def _do():
        cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
        cache.setdefault(loc, {})
        cache[loc][key] = val
        CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")

    with_lock(_do)


def main() -> None:
    loc = sys.argv[1]
    en = json.loads(SRC.read_text(encoding="utf-8"))
    keys = list(en.keys())

    def load():
        return json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}

    cache = load()
    pending = [k for k in keys if k not in cache.get(loc, {}) or not cache.get(loc, {}).get(k)]
    log(f"[{loc}] pending {len(pending)}")
    for i, key in enumerate(pending, 1):
        val = translate_one(en[key], loc)
        save_key(loc, key, val)
        if i % 15 == 0:
            log(f"[{loc}] {i}/{len(pending)}")
        time.sleep(0.1)
    log(f"[{loc}] done")


if __name__ == "__main__":
    main()
