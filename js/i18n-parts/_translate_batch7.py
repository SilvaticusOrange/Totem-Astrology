#!/usr/bin/env python3
"""Finish remaining articles-batch-7 translations via Bing."""
from __future__ import annotations

import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import translators as ts

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "articles-en.json"
OUT = ROOT / "articles-batch-7.js"
CACHE = ROOT / "_batch7_cache.json"

LOCALE_ORDER = ["to", "fj", "fil", "nl", "af"]
BING_TL = {"to": "to", "fj": "fj", "fil": "fil", "nl": "nl", "af": "af"}

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


def bing_raw(text: str, loc: str) -> str:
    return str(
        ts.translate_text(
            text,
            translator="bing",
            from_language="en",
            to_language=BING_TL[loc],
        )
    )


def translate_one(text: str, loc: str) -> str:
    protected, mapping = protect(text)
    pieces = []
    for ch in chunks(protected):
        last_err = None
        for attempt in range(4):
            try:
                pieces.append(bing_raw(ch, loc))
                last_err = None
                break
            except Exception as e:  # noqa: BLE001
                last_err = e
                time.sleep(1.2 * (attempt + 1))
        if last_err is not None:
            raise last_err
        time.sleep(0.05)
    return unprotect(" ".join(pieces), mapping)


def load_cache() -> dict:
    if CACHE.exists():
        return json.loads(CACHE.read_text(encoding="utf-8"))
    return {loc: {} for loc in LOCALE_ORDER}


def save_cache(cache: dict) -> None:
    CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")


def write_output(en: dict, cache: dict) -> None:
    lines = ["export const BATCH = {\n"]
    for li, loc in enumerate(LOCALE_ORDER):
        lines.append(f'  "{loc}": {{\n')
        keys = list(en.keys())
        for i, key in enumerate(keys):
            comma = "," if i < len(keys) - 1 else ""
            lines.append(
                f"    {json.dumps(key, ensure_ascii=False)}: {json.dumps(cache[loc][key], ensure_ascii=False)}{comma}\n"
            )
        lines.append("  }" + ("," if li < len(LOCALE_ORDER) - 1 else "") + "\n")
    lines.append("};\n")
    OUT.write_text("".join(lines), encoding="utf-8")


def fill_locale(en: dict, cache: dict, loc: str) -> None:
    keys = list(en.keys())
    pending = [k for k in keys if k not in cache[loc] or not cache[loc][k]]
    log(f"=== {loc}: pending {len(pending)}")
    done = 0
    for key in pending:
        try:
            cache[loc][key] = translate_one(en[key], loc)
        except Exception as e:  # noqa: BLE001
            log(f"FAIL {loc} {key}: {e}")
            # last resort: leave empty for final pass
            time.sleep(1)
            continue
        done += 1
        if done % 20 == 0:
            save_cache(cache)
            log(f"  {loc} {done}/{len(pending)}")
        time.sleep(0.12)
    save_cache(cache)


def main() -> None:
    en = json.loads(SRC.read_text(encoding="utf-8"))
    keys = list(en.keys())
    cache = load_cache()
    for loc in LOCALE_ORDER:
        cache.setdefault(loc, {})

    # Fill remaining locales sequentially (Bing is sensitive to parallel abuse)
    for loc in LOCALE_ORDER:
        fill_locale(en, cache, loc)

    # Final gap fill with chunking
    for loc in LOCALE_ORDER:
        for key in keys:
            if key not in cache[loc] or not cache[loc][key]:
                try:
                    cache[loc][key] = translate_one(en[key], loc)
                    log(f"filled {loc} {key}")
                    time.sleep(0.2)
                except Exception as e:  # noqa: BLE001
                    log(f"FINAL FAIL {loc} {key}: {e}")
                    raise SystemExit(2)

    write_output(en, cache)
    save_cache(cache)

    log(f"OUT {OUT}")
    for loc in LOCALE_ORDER:
        miss = [k for k in keys if k not in cache[loc] or not cache[loc][k]]
        log(f"{loc}: keys={len(keys) - len(miss)} missing={len(miss)}")


if __name__ == "__main__":
    main()
