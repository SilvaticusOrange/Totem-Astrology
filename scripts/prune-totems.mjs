import fs from 'node:fs/promises';
import path from 'node:path';
import { listRequiredTotemImages } from '../js/totem-manifest.js';

const COMPOSITED_DIR = path.resolve(import.meta.dirname, '../assets/images/totems/composited');
const required = new Set(listRequiredTotemImages().map((item) => item.filename));

const entries = await fs.readdir(COMPOSITED_DIR);
let removed = 0;

for (const entry of entries) {
  if (!entry.endsWith('.png') || required.has(entry)) continue;
  await fs.unlink(path.join(COMPOSITED_DIR, entry));
  removed += 1;
}

console.log(`Removed ${removed} unused totem images. Keeping ${required.size} required images.`);
