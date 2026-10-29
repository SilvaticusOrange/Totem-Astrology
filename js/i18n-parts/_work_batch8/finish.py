#!/usr/bin/env python3
"""Finish remaining zu/ga/sr keys and write articles-batch-8.js."""
import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeout
from pathlib import Path

import translators as ts
from deep_translator import GoogleTranslator

ROOT = Path('/Users/travisleblanc/Projects/totem-astrology')
EN_PATH = ROOT / 'js/i18n-parts/articles-en.json'
OUT_PATH = ROOT / 'js/i18n-parts/articles-batch-8.js'
CACHE_DIR = ROOT / 'js/i18n-parts/_work_batch8'

BRANDS = [
    'TotemAstrology.com™', 'TotemAstrology.com', 'Totem Astrology™', 'Totem Astrology',
    'Totem Animals Calculator', 'Totem Connections Directory', 'Totem Connections',
    'Totem Calculator', 'Travis Barrett LeBlanc', 'Earthly Wisdom for your Journey',
    'WhatsApp', 'Telegram', 'Facebook', 'Instagram', 'GoDaddy', 'USPTO', 'TESS', 'BaZi',
    'alucardsilvaticus@gmail.com', 'totem-details.js', 'totem-element-lore.js',
]
HTML_TAG_RE = re.compile(r'</?[a-zA-Z][^>]*>')
EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
URL_RE = re.compile(r'https?://[^\s<"\']+|mailto:[^\s<"\']+')
CODE_RE = re.compile(r'`[^`]+`')
PHONE_RE = re.compile(r'\+1\s*\(808\)\s*378-6377')


def protect(text):
    ph = []
    def store(m):
        ph.append(m.group(0))
        return f'⟦P{len(ph)-1}⟧'
    text = HTML_TAG_RE.sub(store, text)
    text = CODE_RE.sub(store, text)
    text = URL_RE.sub(store, text)
    text = EMAIL_RE.sub(store, text)
    text = PHONE_RE.sub(store, text)
    for brand in BRANDS:
        if brand not in text:
            continue
        parts = text.split(brand)
        out = []
        for i, part in enumerate(parts):
            out.append(part)
            if i < len(parts) - 1:
                ph.append(brand)
                out.append(f'⟦P{len(ph)-1}⟧')
        text = ''.join(out)
    return text, ph


def restore(text, ph):
    for i, val in enumerate(ph):
        for token in (f'⟦P{i}⟧', f'[[P{i}]]', f'[P{i}]'):
            text = text.replace(token, val)
    return text


def split_chunks(s, limit=900):
    if len(s) <= limit:
        return [s]
    parts = re.split(r'(?<=[.!?])\s+', s)
    chunks, buf = [], ''
    for p in parts:
        if buf and len(buf) + len(p) + 1 > limit:
            chunks.append(buf)
            buf = p
        else:
            buf = (buf + ' ' + p).strip() if buf else p
    if buf:
        chunks.append(buf)
    return chunks or [s]


def call_with_timeout(fn, timeout=12):
    with ThreadPoolExecutor(max_workers=1) as ex:
        fut = ex.submit(fn)
        return fut.result(timeout=timeout)


def translate_chunk(locale, chunk):
    def do():
        if locale in ('zu', 'ga'):
            return ts.translate_text(chunk, translator='bing', from_language='en', to_language=locale)
        # sr via deep_translator Google (Cyrillic)
        return GoogleTranslator(source='en', target='sr').translate(chunk)
    for attempt in range(3):
        try:
            out = call_with_timeout(do, timeout=15)
            if out:
                return out
        except Exception as e:
            print(f'  retry {attempt+1} {locale}: {type(e).__name__} {str(e)[:80]}', flush=True)
            time.sleep(1.5 * (attempt + 1))
    return chunk  # leave protected English as last resort (still better than hang)


def translate_one(locale, text):
    if not text or not text.strip():
        return text
    protected, ph = protect(text)
    if not protected.strip() or re.fullmatch(r'(⟦P\d+⟧|\s)+', protected):
        return text
    parts = [translate_chunk(locale, c) for c in split_chunks(protected)]
    time.sleep(0.15)
    return restore(' '.join(parts), ph)


def load(locale):
    p = CACHE_DIR / f'{locale}.json'
    return json.loads(p.read_text(encoding='utf-8')) if p.exists() else {}


def save(locale, data):
    (CACHE_DIR / f'{locale}.json').write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8'
    )


def finish_locale(locale, en, keys):
    cache = load(locale)
    pending = [k for k in keys if not cache.get(k)]
    print(f'\n=== {locale}: pending {len(pending)} ===', flush=True)
    for i, key in enumerate(pending):
        cache[key] = translate_one(locale, en[key])
        if (i + 1) % 5 == 0:
            save(locale, cache)
            print(f'  {i+1}/{len(pending)}', flush=True)
    save(locale, cache)
    missing = [k for k in keys if not cache.get(k)]
    print(f'  done missing={len(missing)}', flush=True)
    return missing


def write_batch(en_keys):
    locales = ['el', 'he', 'zu', 'sr', 'ga']
    batch = {}
    for loc in locales:
        cache = load(loc)
        missing = [k for k in en_keys if not cache.get(k)]
        if missing:
            raise SystemExit(f'{loc} missing {len(missing)}')
        batch[loc] = {k: cache[k] for k in en_keys}

    lines = ['export const BATCH = {']
    for li, loc in enumerate(locales):
        lines.append(f'  "{loc}": {{')
        items = list(batch[loc].items())
        for i, (k, v) in enumerate(items):
            comma = ',' if i < len(items) - 1 else ''
            lines.append(f'    {json.dumps(k, ensure_ascii=False)}: {json.dumps(v, ensure_ascii=False)}{comma}')
        comma = ',' if li < len(locales) - 1 else ''
        lines.append(f'  }}{comma}')
    lines.append('};')
    lines.append('')
    OUT_PATH.write_text('\n'.join(lines), encoding='utf-8')
    print(f'Wrote {OUT_PATH} ({OUT_PATH.stat().st_size} bytes)', flush=True)


def main():
    en = json.loads(EN_PATH.read_text(encoding='utf-8'))
    keys = list(en.keys())
    for loc in ['zu', 'ga', 'sr']:
        finish_locale(loc, en, keys)
    write_batch(keys)


if __name__ == '__main__':
    main()
