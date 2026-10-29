#!/usr/bin/env python3
import json, re, sys, time
from pathlib import Path
import translators as ts

loc = sys.argv[1]
ROOT = Path(__file__).resolve().parent
en = json.loads((ROOT/'articles-en.json').read_text(encoding='utf-8'))
keys = list(en.keys())
outp = ROOT / f'_batch7_{loc}.json'
data = json.loads(outp.read_text(encoding='utf-8')) if outp.exists() else {}

BRANDS = sorted([
 "TotemAstrology.com™","TotemAstrology.com","Totem Astrology™","Totem Astrology",
 "Totem Connections","Totem Animals Calculator","Totem Calculator",
 "Travis Barrett LeBlanc","alucardsilvaticus@gmail.com","4TotemAstrology","@TotemAstrology",
 "Winnie the Pooh","Wizard of Oz","GoDaddy","USPTO","BaZi","NPT","UTC+5:45",
], key=len, reverse=True)
TAG_RE = re.compile(r'</?[^>]+>')
BING = {"to":"to","fj":"fj","fil":"fil","nl":"nl","af":"af"}
MAX=900

def protect(text):
    mapping={}
    out=text
    for i,tag in enumerate(TAG_RE.findall(out)):
        tok=f"ZZTAG{i}ZZ"; mapping[tok]=tag; out=out.replace(tag,tok,1)
    for i,b in enumerate(BRANDS):
        if b in out:
            tok=f"ZZBRAND{i}ZZ"; mapping[tok]=b; out=out.replace(b,tok)
    return out, mapping

def unprotect(text, mapping):
    out=text
    for tok,val in sorted(mapping.items(), key=lambda kv:-len(kv[0])):
        out=out.replace(tok,val)
        out=out.replace(tok.replace("ZZ"," ZZ "),val)
    def fuzzy(m):
        tok=f"ZZ{m.group(1).upper()}{m.group(2)}ZZ"
        return mapping.get(tok, m.group(0))
    out=re.sub(r"Z\s*Z\s*(TAG|BRAND)\s*(\d+)\s*Z\s*Z", fuzzy, out, flags=re.I)
    return out

def chunks(text):
    if len(text)<=MAX: return [text]
    parts=re.split(r'(?<=[.!?])\s+', text)
    out=[]; buf=''
    for p in parts:
        if not p: continue
        if len(buf)+len(p)+1<=MAX: buf=(buf+' '+p).strip()
        else:
            if buf: out.append(buf)
            if len(p)<=MAX: buf=p
            else:
                for i in range(0,len(p),MAX): out.append(p[i:i+MAX])
                buf=''
    if buf: out.append(buf)
    return out or [text]

def translate_one(text):
    prot, mapping = protect(text)
    pieces=[]
    for ch in chunks(prot):
        for attempt in range(6):
            try:
                pieces.append(str(ts.translate_text(ch, translator='bing', from_language='en', to_language=BING[loc])))
                break
            except Exception as e:
                time.sleep(1.5*(attempt+1))
                if attempt==5: raise
        time.sleep(0.05)
    return unprotect(' '.join(pieces), mapping)

pending=[k for k in keys if k not in data or not data[k]]
print(f'[{loc}] pending {len(pending)}', flush=True)
for i,k in enumerate(pending,1):
    data[k]=translate_one(en[k])
    if i%10==0 or i==len(pending):
        outp.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
        print(f'[{loc}] {i}/{len(pending)}', flush=True)
    time.sleep(0.15)
print(f'[{loc}] done {len(data)}', flush=True)
