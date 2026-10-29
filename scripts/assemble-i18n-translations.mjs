/**
 * Merge js/i18n-parts/batch-*.js into js/i18n-translations.js
 * and verify every non-English LOCALES entry has full coverage vs EN.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { LOCALES } from '../js/i18n-locales.js';
import { EN } from '../js/i18n-en.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const partsDir = path.join(root, 'js/i18n-parts');

const files = fs
  .readdirSync(partsDir)
  .filter(
    (name) =>
      name.endsWith('.js') &&
      (name.startsWith('batch-') || name.startsWith('articles-batch-')),
  )
  .sort();

/** @type {Record<string, Record<string, string>>} */
const TRANSLATIONS = {};

for (const name of files) {
  const mod = await import(pathToFileURL(path.join(partsDir, name)).href);
  const batch = mod.BATCH || {};
  for (const [code, table] of Object.entries(batch)) {
    TRANSLATIONS[code] = { ...(TRANSLATIONS[code] || {}), ...table };
  }
}

const enKeys = Object.keys(EN);
const report = [];

for (const { code } of LOCALES) {
  if (code === 'en') continue;
  const table = TRANSLATIONS[code] || {};
  const missing = enKeys.filter((key) => !(key in table));
  const extra = Object.keys(table).filter((key) => !(key in EN));
  report.push({ code, keys: Object.keys(table).length, missing: missing.length, extra: extra.length });
  if (missing.length) {
    console.error(`${code} missing ${missing.length}:`, missing.slice(0, 12).join(', '));
  }
}

const outPath = path.join(root, 'js/i18n-translations.js');
fs.writeFileSync(
  outPath,
  `/** Auto-assembled locale overlays (non-English). */\nexport const TRANSLATIONS = ${JSON.stringify(TRANSLATIONS)};\n`,
);

const incomplete = report.filter((row) => row.missing > 0);
console.log(
  JSON.stringify(
    {
      batches: files,
      locales: report.length,
      incomplete: incomplete.map((row) => row.code),
      report,
      out: outPath,
      bytes: fs.statSync(outPath).size,
    },
    null,
    2,
  ),
);

if (incomplete.length) process.exit(1);
