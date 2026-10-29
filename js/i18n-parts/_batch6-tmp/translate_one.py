#!/usr/bin/env python3
import json, re, time, sys
from pathlib import Path
from deep_translator import GoogleTranslator

ROOT = Path('/Users/travisleblanc/Projects/totem-astrology/js/i18n-parts')
en = json.load(open(ROOT/'articles-en.json'))
out_dir = ROOT/'_batch6-tmp'
loc = sys.argv[1]
cache = out_dir / f'{loc}.json'
progress = out_dir / f'{loc}.partial.json'

BRANDS = [
  'Totem Connections', 'TotemAstrology.com', 'Totem Astrology™', 'Totem Astrology',
  'Totem Animals Calculator', 'Totem Calculator', 'Four Pillars of Destiny',
  'Nepal Time', 'NPT', 'UTC+5:45', 'BaZi', 'Jade Emperor', 'Winnie the Pooh',
  'Wizard of Oz', 'Travis Barrett LeBlanc', 'USPTO', 'TESS', 'GoDaddy',
  'WhatsApp', 'Telegram', 'Facebook', 'Instagram', 'Earthly Wisdom for your Journey',
]
TAG_RE = re.compile(r'(<[^>]+>)')

def protect(text):
    protected = text
    brand_map = {}
    for bi, b in enumerate(sorted(BRANDS, key=len, reverse=True)):
        token = f'[[B{bi}]]'
        if b in protected:
            protected = protected.replace(b, token)
            brand_map[token] = b
    tag_map = {}
    def repl(m):
        token = f'[[T{len(tag_map)}]]'
        tag_map[token] = m.group(1)
        return token
    protected = TAG_RE.sub(repl, protected)
    return protected, brand_map, tag_map

def unprotect(text, brand_map, tag_map):
    if text is None:
        return ''
    for t, v in tag_map.items():
        text = text.replace(t, v)
        # MT sometimes adds spaces
        text = text.replace(t.replace('[[','[ [').replace(']]','] ]'), v)
    for t, v in brand_map.items():
        text = text.replace(t, v)
    return text

keys = list(en.keys())
d = {}
if progress.exists():
    d = json.load(open(progress))
    print(f'resume {loc} from {len(d)}', flush=True)
elif cache.exists():
    d = json.load(open(cache))
    if len(d)==619:
        print(f'skip {loc}', flush=True)
        sys.exit(0)

translator = GoogleTranslator(source='en', target=loc)
done = 0
for i,k in enumerate(keys):
    if k in d and d[k]:
        continue
    t = en[k]
    if t.startswith('Page build ') or t in ('Leave blank:',) or re.fullmatch(r'[+\d\s().-]+', t):
        d[k]=t
    else:
        protected, brand_map, tag_map = protect(t)
        try:
            if len(protected) > 4500:
                chunks = re.split(r'(?<=[.!?])\s+', protected)
                outs=[]; buf=''
                for c in chunks:
                    if len(buf)+len(c) < 4000:
                        buf=(buf+' '+c).strip()
                    else:
                        if buf:
                            outs.append(translator.translate(buf)); time.sleep(0.05)
                        buf=c
                if buf:
                    outs.append(translator.translate(buf)); time.sleep(0.05)
                translated=' '.join(outs)
            else:
                translated = translator.translate(protected)
                time.sleep(0.04)
            d[k]=unprotect(translated, brand_map, tag_map)
        except Exception as e:
            print(f'FAIL {loc} {i} {e}', flush=True)
            time.sleep(1.5)
            try:
                translated = translator.translate(protected)
                d[k]=unprotect(translated, brand_map, tag_map)
            except Exception as e2:
                print(f'FAIL2 {loc} {i} {e2}', flush=True)
                d[k]=t
    done += 1
    if done % 20 == 0:
        json.dump(d, open(progress,'w'), ensure_ascii=False)
        print(f'{loc}: {len(d)}/{len(keys)}', flush=True)

json.dump(d, open(cache,'w'), ensure_ascii=False, indent=2)
if progress.exists():
    progress.unlink()
print(f'Wrote {loc} {len(d)}', flush=True)
