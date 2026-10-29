
import json,sys
from pathlib import Path
TMP=Path(__file__).parent
chunk=json.load(open(sys.argv[1]))
for loc in ("haw","mi","ty","sm"):
    path=TMP/f"long-{loc}.json"
    d=json.load(open(path)) if path.exists() else {}
    for k,v in chunk.items():
        d[k]=v[loc]
    json.dump(d, open(path,"w"), ensure_ascii=False, indent=2)
    print(loc, len(d))
