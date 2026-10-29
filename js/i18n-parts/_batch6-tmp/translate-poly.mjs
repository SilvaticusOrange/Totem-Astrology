/**
 * Translate articles-en.json → haw/mi/sm JSON (+ ty from haw with glossary).
 * Protects brands + HTML tags.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { translate } from 'google-translate-api-x';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EN = JSON.parse(fs.readFileSync(path.join(ROOT, 'articles-en.json'), 'utf8'));

const BRANDS = [
  'TotemAstrology.com™',
  'TotemAstrology.com',
  'Totem Astrology™',
  'Totem Astrology',
  'Totem Connections',
  'Totem Animals Calculator',
  'Totem Calculator',
  'Four Pillars of Destiny',
  'Travis Barrett LeBlanc',
  'Earthly Wisdom for your Journey',
  'Winnie the Pooh',
  'Wizard of Oz',
  'Jade Emperor',
  'Nepal Time',
  'Values Triangles',
  'Sacred Roles',
  'Same-As-Me',
  'Values Trine',
  'Mirror Opposite',
];

const CACHE_PATH = path.join(__dirname, 'mt-cache.json');
let cache = {};
if (fs.existsSync(CACHE_PATH)) {
  try { cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')); } catch { cache = {}; }
}
function saveCache() {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache));
}

function protect(text) {
  const slots = [];
  let out = text;
  for (const b of BRANDS) {
    const re = new RegExp(b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    out = out.replace(re, () => {
      const i = slots.length;
      slots.push(b);
      return `⟦B${i}⟧`;
    });
  }
  out = out.replace(/<\/?[a-zA-Z][^>]*>/g, (m) => {
    const i = slots.length;
    slots.push(m);
    return `⟦T${i}⟧`;
  });
  out = out.replace(/`[^`]+`/g, (m) => {
    const i = slots.length;
    slots.push(m);
    return `⟦C${i}⟧`;
  });
  return { out, slots };
}

function restore(text, slots) {
  let out = text || '';
  for (let i = 0; i < slots.length; i++) {
    const patterns = [
      new RegExp(`⟦[BTCbtic]${i}⟧`, 'g'),
      new RegExp(`\\[\\[[BTCbtic]${i}\\]\\]`, 'g'),
      new RegExp(`⟦\\s*[BTCbtic]\\s*${i}\\s*⟧`, 'g'),
    ];
    for (const p of patterns) out = out.replace(p, slots[i]);
  }
  return out;
}

async function translateOne(text, to) {
  const key = `${to}::${text}`;
  if (cache[key]) return cache[key];
  if (!text.trim()) return text;
  if (/^Page build /.test(text) || text === 'Leave blank:' || /^[+\d\s().-]+$/.test(text)) {
    cache[key] = text;
    return text;
  }
  const { out, slots } = protect(text);
  let translated;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const r = await translate(out, { from: 'en', to, forceBatch: false });
      translated = restore(typeof r === 'string' ? r : r.text, slots);
      break;
    } catch (e) {
      console.error(`retry ${to} attempt ${attempt}:`, e.message || e);
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  if (translated == null) translated = text;
  cache[key] = translated;
  if (Object.keys(cache).length % 20 === 0) saveCache();
  return translated;
}

async function translateLocale(loc) {
  const outPath = path.join(__dirname, `${loc}.json`);
  let existing = {};
  if (fs.existsSync(outPath)) {
    existing = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  }
  // Also merge long-* overlays
  const longPath = path.join(__dirname, `long-${loc}.json`);
  if (fs.existsSync(longPath)) {
    Object.assign(existing, JSON.parse(fs.readFileSync(longPath, 'utf8')));
  }

  const keys = Object.keys(EN);
  let done = 0;
  for (const k of keys) {
    if (existing[k] && existing[k] !== EN[k]) {
      // keep non-English existing (from long maps or prior MT)
      // but re-translate if identical to EN and long
      if (!(existing[k] === EN[k] && EN[k].length > 30)) {
        done++;
        continue;
      }
    }
    existing[k] = await translateOne(EN[k], loc);
    done++;
    if (done % 25 === 0) {
      fs.writeFileSync(outPath, JSON.stringify(existing, null, 2));
      saveCache();
      console.log(`${loc}: ${done}/${keys.length}`);
    }
  }
  fs.writeFileSync(outPath, JSON.stringify(existing, null, 2) + '\n');
  saveCache();
  console.log(`WROTE ${loc} ${Object.keys(existing).length}`);
}

// Tahitian from Hawaiian with lexical swaps (closely related)
const HAW_TO_TY = [
  [/ʻŌnaehana/g, 'ʻōpuʻaraʻa'],
  [/Pehea e Hana ai/g, 'Nahea e rave'],
  [/Heluhelu/g, 'Taiʻo'],
  [/alakaʻi/gi, 'aratai'],
  [/Alakaʻi/g, 'Aratai'],
  [/holoholona/g, 'animala'],
  [/Holoholona/g, 'Animala'],
  [/ʻUhane/g, 'Vārua'],
  [/Noʻonoʻo/g, 'Manaʻo'],
  [/Naʻau/g, 'ʻĀʻau'],
  [/Kino/g, 'Tino'],
  [/Manaʻolana/g, 'Turaʻa'],
  [/hoʻomaopopo/g, 'ʻite'],
  [/Hoʻomaopopo/g, 'ʻIte'],
  [/ʻohana/g, 'utuafare'],
  [/ʻOhana/g, 'Utuafare'],
  [/kānaka/g, 'taata'],
  [/Kānaka/g, 'Taata'],
  [/makahiki/g, 'matahiti'],
  [/mahina/g, 'ʻavaʻe'],
  [/Manawa Nepal/g, 'Taime Nepal'],
  [/Manawa/g, 'Taime'],
  [/Huinakolu Waiwai/g, 'tapatoru faufaa'],
  [/Huinakolu/g, 'tapatoru'],
  [/Kuleana Kapu/g, 'tiʻaraʻa moʻa'],
  [/ʻImi/g, 'te ʻimi'],
  [/Kahuna/g, 'te tahuʻa'],
  [/Aliʻi/g, 'te ariʻi'],
  [/Wai,/g, 'Vai,'],
  [/Lāʻau,/g, 'Rāʻau,'],
  [/Ahi,/g, 'Auahi,'],
  [/Honua,/g, 'Fenua,'],
  [/Metala/g, 'Metara'],
  [/ʻIole lāʻau/g, 'ʻĪore rāʻau'],
  [/Pipi hihiu/g, 'Puaʻatoro'],
  [/Pōpoki/g, 'Pīni'],
  [/Nahesa/g, 'ʻŌphi'],
  [/Kekeko/g, 'Maki'],
  [/ʻĪlio hihiu/g, 'ʻUri'],
  [/Pea/g, 'Bea'],
  [/pou totem/g, 'pou totem'],
  [/kākou/g, 'tātou'],
  [/mākou/g, 'mātou'],
  [/ʻoe /g, 'ʻoe '],
  [/nā /g, 'te mau '],
  [/Nā /g, 'Te mau '],
];

function hawToTy(text) {
  let out = text;
  for (const [re, rep] of HAW_TO_TY) out = out.replace(re, rep);
  return out;
}

async function main() {
  for (const loc of ['haw', 'mi', 'sm']) {
    console.log('START', loc);
    await translateLocale(loc);
  }
  // Build ty from haw
  const haw = JSON.parse(fs.readFileSync(path.join(__dirname, 'haw.json'), 'utf8'));
  const longTy = fs.existsSync(path.join(__dirname, 'long-ty.json'))
    ? JSON.parse(fs.readFileSync(path.join(__dirname, 'long-ty.json'), 'utf8'))
    : {};
  const ty = {};
  for (const k of Object.keys(EN)) {
    ty[k] = longTy[k] || hawToTy(haw[k] || EN[k]);
  }
  fs.writeFileSync(path.join(__dirname, 'ty.json'), JSON.stringify(ty, null, 2) + '\n');
  console.log('WROTE ty', Object.keys(ty).length);
}

main().catch((e) => { console.error(e); process.exit(1); });
