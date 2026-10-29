import fs from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { listRequiredTotemImages } from '../js/totem-manifest.js';

const SRC = '/Users/travisleblanc/.cursor/projects/Users-travisleblanc-Projects-totem-astrology/assets';
const DEST = path.resolve(import.meta.dirname, '../assets/images/totems/composited');

await fs.mkdir(DEST, { recursive: true });

let installed = 0;
const missing = [];

for (const { filename } of listRequiredTotemImages()) {
  const src = path.join(SRC, filename);
  const dest = path.join(DEST, filename);
  try {
    await fs.access(src);
    await fs.copyFile(src, dest);
    execSync(`sips -Z 512 "${dest}" >/dev/null 2>&1`);
    installed += 1;
  } catch {
    missing.push(filename);
  }
}

console.log(`Installed ${installed} painterly totem images to ${DEST}`);
if (missing.length) {
  console.log(`Missing ${missing.length}: ${missing.join(', ')}`);
}
