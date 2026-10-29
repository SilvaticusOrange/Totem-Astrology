import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { listRequiredTotemImages } from '../js/totem-manifest.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const SCENES_DIR = path.join(ROOT, 'assets/images/totems/scenes');
const ANIMALS_DIR = path.join(ROOT, 'assets/images/totems');
const OUTPUT_DIR = path.join(ROOT, 'assets/images/totems/composited');

const SIZE = 512;
const ANIMAL_HEIGHT_RATIO = 0.56;
const BOTTOM_PADDING_RATIO = 0.05;

async function buildShadowLayer(animalBuffer, width, height) {
  const shadowSvg = Buffer.from(
    `<svg width="${width}" height="${height}">
      <rect x="8" y="8" width="${width - 16}" height="${height - 16}" rx="18" fill="black" opacity="0.35"/>
    </svg>`,
  );

  return sharp(animalBuffer)
    .ensureAlpha()
    .composite([{ input: shadowSvg, blend: 'multiply' }])
    .blur(6)
    .toBuffer();
}

async function compositeCard(theme, animal) {
  const scenePath = path.join(SCENES_DIR, `${theme}.png`);
  const animalPath = path.join(ANIMALS_DIR, `${animal}.png`);
  const outputPath = path.join(OUTPUT_DIR, `${theme}-${animal}.png`);

  const animalHeight = Math.round(SIZE * ANIMAL_HEIGHT_RATIO);
  const animalBuffer = await sharp(animalPath)
    .resize({ height: animalHeight, fit: 'inside' })
    .toBuffer();
  const { width: animalWidth, height: animalHeightActual } = await sharp(animalBuffer).metadata();

  const left = Math.round((SIZE - animalWidth) / 2);
  const top = SIZE - animalHeightActual - Math.round(SIZE * BOTTOM_PADDING_RATIO);
  const shadowBuffer = await buildShadowLayer(animalBuffer, animalWidth, animalHeightActual);
  const shadowTop = top + 6;

  await sharp(scenePath)
    .resize(SIZE, SIZE, { fit: 'cover' })
    .composite([
      { input: shadowBuffer, left, top: shadowTop, blend: 'over' },
      { input: animalBuffer, left, top, blend: 'over' },
    ])
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

const required = listRequiredTotemImages();
await fs.mkdir(OUTPUT_DIR, { recursive: true });

let count = 0;
for (const { theme, animal } of required) {
  await compositeCard(theme, animal);
  count += 1;
  process.stdout.write(`\rComposited ${count}/${required.length}`);
}

process.stdout.write('\nDone.\n');
