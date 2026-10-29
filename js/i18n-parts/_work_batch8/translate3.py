#!/usr/bin/env python3
"""Finish remaining article locales: zu/ga via Bing, sr via Google (subprocess)."""
import json
import re
import subprocess
import sys
import time
from pathlib import Path

import translators as ts

ROOT = Path('/Users/travisleblanc/Projects/totem-astrology')
EN_PATH = ROOT / 'js/i18n-parts/articles-en.json'
OUT_PATH = ROOT / 'js/i18n-parts/articles-batch-8.js'
CACHE_DIR = ROOT / 'js/i18n-parts/_work_batch8'

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
        for token in (f'⟦P{i}⟧', f'[[P{i}]]', f'[P{i}]'):
            text = text.replace(token, val)
    return text


def split_chunks(protected, limit=1000):
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


def translate_bing(to_lang, chunk, retries=4):
    for attempt in range(retries):
        try:
            out = ts.translate_text(chunk, translator='bing', from_language='en', to_language=to_lang)
            if out:
                return out
        except Exception as e:
            wait = 3.0 * (attempt + 1)
            print(f'  bing retry {attempt+1}: {str(e)[:100]}', file=sys.stderr, flush=True)
            time.sleep(wait)
    return None


def translate_google_subprocess(to_lang, chunk):
    """Isolate Google translator in a fresh process to avoid language-map pollution."""
    script = (
        'import json,sys,translators as ts\n'
        'text=sys.stdin.read()\n'
        f'out=ts.translate_text(text, translator="google", from_language="en", to_language="{to_lang}")\n'
        'sys.stdout.write(out or "")\n'
    )
    for attempt in range(4):
        try:
            proc = subprocess.run(
                [sys.executable, '-c', script],
                input=chunk.encode('utf-8'),
                capture_output=True,
                timeout=90,
            )
            if proc.returncode == 0 and proc.stdout:
                return proc.stdout.decode('utf-8')
            err = proc.stderr.decode('utf-8', errors='replace')[-200:]
            print(f'  google-sub retry {attempt+1}: rc={proc.returncode} {err}', file=sys.stderr, flush=True)
        except Exception as e:
            print(f'  google-sub retry {attempt+1}: {e}', file=sys.stderr, flush=True)
        time.sleep(3.0 * (attempt + 1))
    return None


def translate_one(engine, to_lang, text):
    if not text or not text.strip():
        return text
    protected, ph = protect(text)
    if not protected.strip() or re.fullmatch(r'(⟦P\d+⟧|\s)+', protected):
        return text
    out_chunks = []
    for chunk in split_chunks(protected):
        if engine == 'bing':
            translated = translate_bing(to_lang, chunk)
        else:
            translated = translate_google_subprocess(to_lang, chunk)
        out_chunks.append(translated if translated else chunk)
        time.sleep(0.25)
    return restore(' '.join(out_chunks), ph)


def load_cache(locale):
    p = CACHE_DIR / f'{locale}.json'
    if p.exists():
        return json.loads(p.read_text(encoding='utf-8'))
    return {}


def save_cache(locale, data):
    p = CACHE_DIR / f'{locale}.json'
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def translate_locale(locale, engine, to_lang, en, keys):
    print(f'\n=== {locale} via {engine}->{to_lang} ===', flush=True)
    cache = load_cache(locale)
    pending = [k for k in keys if not cache.get(k)]
    print(f'  cached={len(keys)-len(pending)} pending={len(pending)}', flush=True)
    for i, key in enumerate(pending):
        try:
            cache[key] = translate_one(engine, to_lang, en[key])
        except Exception as e:
            print(f'ERROR {key}: {e}', file=sys.stderr, flush=True)
            cache[key] = en[key]
        if (i + 1) % 5 == 0:
            save_cache(locale, cache)
            print(f'  {i+1}/{len(pending)} (total {len(cache)})', flush=True)
    save_cache(locale, cache)
    missing = [k for k in keys if not cache.get(k)]
    print(f'  complete={len(keys)} missing={len(missing)}', flush=True)
    return {k: cache.get(k, en[k]) for k in keys}


def write_batch(en_keys):
    locales = ['el', 'he', 'zu', 'sr', 'ga']
    batch = {}
    for locale in locales:
        cache = load_cache(locale)
        batch[locale] = {k: cache[k] for k in en_keys}
        missing = [k for k in en_keys if not cache.get(k)]
        print(f'{locale}: keys={len(batch[locale])} missing={len(missing)}', flush=True)
        if missing:
            raise SystemExit(f'{locale} still missing {len(missing)}')

    lines = ['export const BATCH = {']
    for li, locale in enumerate(locales):
        lines.append(f'  "{locale}": {{')
        items = list(batch[locale].items())
        for i, (k, v) in enumerate(items):
            jk = json.dumps(k, ensure_ascii=False)
            jv = json.dumps(v, ensure_ascii=False)
            comma = ',' if i < len(items) - 1 else ''
            lines.append(f'    {jk}: {jv}{comma}')
        comma = ',' if li < len(locales) - 1 else ''
        lines.append(f'  }}{comma}')
    lines.append('};')
    lines.append('')
    OUT_PATH.write_text('\n'.join(lines), encoding='utf-8')
    print(f'Wrote {OUT_PATH} ({OUT_PATH.stat().st_size} bytes)', flush=True)


def main():
    only = sys.argv[1:]
    en = json.loads(EN_PATH.read_text(encoding='utf-8'))
    keys = list(en.keys())
    plan = {
        'zu': ('bing', 'zu'),
        'ga': ('bing', 'ga'),
        'sr': ('google', 'sr'),
    }
    if only:
        plan = {k: v for k, v in plan.items() if k in only}
    for locale, (engine, to_lang) in plan.items():
        translate_locale(locale, engine, to_lang, en, keys)

    # Write if all ready
    ready = all(all(load_cache(loc).get(k) for k in keys) for loc in ['el', 'he', 'zu', 'sr', 'ga'])
    if ready:
        write_batch(keys)
    else:
        print('Not all locales ready yet.', flush=True)
        for loc in ['el', 'he', 'zu', 'sr', 'ga']:
            c = load_cache(loc)
            print(f'  {loc}: {sum(1 for k in keys if c.get(k))}/{len(keys)}', flush=True)


if __name__ == '__main__':
    main()
