#!/usr/bin/env python3
"""Merge locale chunk JSON files into locale.json, then emit articles-batch-1.js."""
from __future__ import annotations

import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
WORK = pathlib.Path(__file__).resolve().parent
EN = json.loads((ROOT / "articles-en.json").read_text(encoding="utf-8"))
KEYS = list(EN.keys())
LOCALES = ["zh", "yue", "hi", "es", "ar"]


def merge_locale(loc: str) -> dict:
    d = {}
    main = WORK / f"{loc}.json"
    if main.exists():
        d.update(json.loads(main.read_text(encoding="utf-8")))
    for p in sorted(WORK.glob(f"{loc}-chunk-*.json")):
        d.update(json.loads(p.read_text(encoding="utf-8")))
    for p in sorted(WORK.glob(f"{loc}-remain-*.json")):
        d.update(json.loads(p.read_text(encoding="utf-8")))
    # also accept partial
    partial = WORK / f"{loc}-partial.json"
    if partial.exists():
        d.update(json.loads(partial.read_text(encoding="utf-8")))
    return d


def verify(batch: dict):
    report = {}
    for loc in LOCALES:
        data = batch.get(loc, {})
        missing = [k for k in KEYS if k not in data]
        report[loc] = {"keys": len(data), "missing": len(missing), "missing_sample": missing[:5]}
    return report


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "status":
        batch = {loc: merge_locale(loc) for loc in LOCALES}
        print(json.dumps(verify(batch), indent=2, ensure_ascii=False))
        return
    if cmd == "write":
        batch = {loc: merge_locale(loc) for loc in LOCALES}
        report = verify(batch)
        print(json.dumps(report, indent=2, ensure_ascii=False))
        for loc, info in report.items():
            if info["missing"] != 0:
                raise SystemExit(f"Refusing to write: {loc} missing={info['missing']}")
        # ordered keys
        ordered = {loc: {k: batch[loc][k] for k in KEYS} for loc in LOCALES}
        out = ROOT / "articles-batch-1.js"
        body = json.dumps(ordered, ensure_ascii=False, indent=2)
        out.write_text(f"export const BATCH = {body};\n", encoding="utf-8")
        print("wrote", out, "bytes", out.stat().st_size)
        return
    raise SystemExit(f"unknown cmd {cmd}")


if __name__ == "__main__":
    main()
