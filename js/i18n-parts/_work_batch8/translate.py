#!/usr/bin/env python3
"""Translate articles-en.json -> articles-batch-8.js for el, he, zu, sr, ga.

Resumes from per-locale JSON caches. Protects HTML tags, URLs, emails, brands.
"""
import json
import re
import sys
import time
from pathlib import Path

from deep_translator import GoogleTranslator

ROOT = Path('/Users/travisleblanc/Projects/totem-astrology')
EN_PATH = ROOT / 'js/i18n-parts/articles-en.json'
OUT_PATH = ROOT / 'js/i18n-parts/articles-batch-8.js'
CACHE_DIR = ROOT / 'js/i18n-parts/_work_batch8'

LOCALES = {
    'el': 'el',
    'he': 'iw',
    'zu': 'zu',
    'sr': 'sr',
    'ga': 'ga',
}

BRANDS = [
    'TotemAstrology.com™',
    'TotemAstrology.com',
    'Totem Astrology™',
    'Totem Astrology',
    'Totem Animals Calculator',
    'Totem Connections Directory',
    'Totem Connections',
    'Totem Calculator',
    'Travis Barrett LeBlanc',
    'Earthly Wisdom for your Journey',
    'WhatsApp',
    'Telegram',
    'Facebook',
    'Instagram',
    'GoDaddy',
    'USPTO',
    'TESS',
    'BaZi',
    'alucardsilvaticus@gmail.com',
    'totem-details.js',
    'totem-element-lore.js',
]

HTML_TAG_RE = re.compile(r'</?[a-zA-Z][^>]*>')
EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
URL_RE = re.compile(r'https?://[^\s<"\']+|mailto:[^\s<"\']+')
CODE_RE = re.compile(r'`[^`]+`')
PHONE_RE = re.compile(r'\+1\s*\(808\)\s*378-6377')


def protect(text):
    placeholders = []

    def store(match):
        placeholders.append(match.group(0))
        return f'⟦P{len(placeholders)-1}⟧'

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
                placeholders.append(brand)
                out.append(f'⟦P{len(placeholders)-1}⟧')
        text = ''.join(out)

    return text, placeholders


def restore(text, placeholders):
    for i, val in enumerate(placeholders):
        for token in (f'⟦P{i}⟧', f'[[P{i}]]', f'[P{i}]', f'⟦P{i}⟧'):
            text = text.replace(token, val)
    return text


def split_chunks(protected, limit=3500):
    if len(protected) <= limit:
        return [protected]
    parts = re.split(r'(?<=[.!?])\s+', protected)
    chunks, buf = [], ''
    for p in parts:
        if buf and len(buf) + len(p) + 1 > limit:
            chunks.append(buf)
            buf = p
        else:
            buf = (buf + ' ' + p).strip() if buf else p
    if buf:
        chunks.append(buf)
    return chunks or [protected]


def translate_one(translator, text, retries=4):
    if not text or not text.strip():
        return text
    protected, ph = protect(text)
    if not protected.strip() or re.fullmatch(r'(⟦P\d+⟧|\s)+', protected):
        return text

    out_chunks = []
    for chunk in split_chunks(protected):
        translated = None
        for attempt in range(retries):
            try:
                translated = translator.translate(chunk)
                if translated is None:
                    raise RuntimeError('None result')
                break
            except Exception as e:
                msg = str(e)
                wait = 15.0 * (attempt + 1) if 'too many requests' in msg.lower() else 3.0 * (attempt + 1)
                print(f'  retry {attempt+1} wait={wait}s: {msg[:120]}', file=sys.stderr, flush=True)
                time.sleep(wait)
        out_chunks.append(translated if translated is not None else chunk)
        time.sleep(0.35)
    return restore(' '.join(out_chunks), ph)


def load_cache(locale):
    p = CACHE_DIR / f'{locale}.json'
    if p.exists():
        return json.loads(p.read_text(encoding='utf-8'))
    return {}


def save_cache(locale, data):
    p = CACHE_DIR / f'{locale}.json'
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def translate_locale(locale, gcode, en, keys):
    print(f'\n=== {locale} ({gcode}) ===', flush=True)
    cache = load_cache(locale)
    translator = GoogleTranslator(source='en', target=gcode)
    pending = [k for k in keys if not cache.get(k)]
    print(f'  cached={len(keys)-len(pending)} pending={len(pending)}', flush=True)

    for i, key in enumerate(pending):
        try:
            cache[key] = translate_one(translator, en[key])
        except Exception as e:
            print(f'ERROR {key}: {e}', file=sys.stderr, flush=True)
            cache[key] = en[key]
        if (i + 1) % 10 == 0:
            save_cache(locale, cache)
            print(f'  {i+1}/{len(pending)} (total {len(cache)})', flush=True)

    save_cache(locale, cache)
    table = {k: cache.get(k, en[k]) for k in keys}
    missing = [k for k in keys if k not in cache or cache[k] is None]
    print(f'  complete={len(table)} missing={len(missing)}', flush=True)
    return table


def write_batch(batch, locales_order):
    lines = ['export const BATCH = {']
    for li, locale in enumerate(locales_order):
        lines.append(f'  "{locale}": {{')
        items = list(batch[locale].items())
        for i, (k, v) in enumerate(items):
            jk = json.dumps(k, ensure_ascii=False)
            jv = json.dumps(v, ensure_ascii=False)
            comma = ',' if i < len(items) - 1 else ''
            lines.append(f'    {jk}: {jv}{comma}')
        comma = ',' if li < len(locales_order) - 1 else ''
        lines.append(f'  }}{comma}')
    lines.append('};')
    lines.append('')
    OUT_PATH.write_text('\n'.join(lines), encoding='utf-8')
    print(f'\nWrote {OUT_PATH}', flush=True)


def main():
    only = sys.argv[1:]  # optional locale filter
    en = json.loads(EN_PATH.read_text(encoding='utf-8'))
    keys = list(en.keys())
    print(f'EN keys: {len(keys)}', flush=True)

    locales = {k: v for k, v in LOCALES.items() if not only or k in only}
    batch = {}
    for locale, gcode in locales.items():
        batch[locale] = translate_locale(locale, gcode, en, keys)

    # If only subset, merge with existing caches for full write when all present
    if only:
        full = {}
        for locale in LOCALES:
            cache = load_cache(locale)
            if len(cache) >= len(keys):
                full[locale] = {k: cache[k] for k in keys}
            elif locale in batch:
                full[locale] = batch[locale]
        if len(full) == len(LOCALES):
            write_batch(full, list(LOCALES))
            for locale in LOCALES:
                missing = [k for k in keys if k not in full[locale]]
                print(f'{locale}: keys={len(full[locale])} missing={len(missing)}')
        else:
            print('Partial run; not writing final batch yet. Have:', list(full), flush=True)
    else:
        write_batch(batch, list(LOCALES))
        for locale in LOCALES:
            missing = [k for k in keys if k not in batch[locale]]
            print(f'{locale}: keys={len(batch[locale])} missing={len(missing)}')


if __name__ == '__main__':
    main()
