import fs from 'node:fs/promises';
import path from 'node:path';
import { listRequiredTotemImages } from '../js/totem-manifest.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUTPUT = path.join(ROOT, 'assets/images/totems/MIDJOURNEY_PROMPTS.csv');

const STYLE = [
  'cute Pokemon-style painterly illustration',
  'single unified painting',
  'animal fully integrated into the environment not pasted on top',
  'soft brushstrokes',
  'children\'s mystical game card art',
  'square composition',
  'no text',
  'no watermark',
].join(', ');

const SCENES = {
  'yang-water': 'deep ocean underwater scene, rich deep blues, sun rays through water, sea floor details',
  'yin-water': 'gentle rain scene, soft pastel blue sky, visible raindrops, light mist, puddles',
  'yang-wood': 'dark oak and pine forest with tall oak trees and pine trees only, dramatic deep forest greens, dry forest floor, no bamboo no vines no rivers or water',
  'yin-wood': 'pale bamboo and vine forest with bamboo stalks and hanging vines only, soft gentle daylight, dry forest floor, no oak no pine no rivers or water',
  'yang-fire': 'intense forest fire with flames surrounding the scene, blazing orange and red, bright sun in sky',
  'yin-fire': 'cozy night scene with glowing paper lantern, rich fiery oranges and reds, warm amber and crimson glow, distinctly fire themed',
  'yang-earth': 'majestic rocky mountain peak landscape, towering mountain, earthy browns and stone grays',
  'yin-earth': 'gentle golden valley full of grain fields and wheat, warm yellow and amber harvest tones, rolling hills',
  'yang-metal': 'sharp angular metallic scene with gleaming steel sword, cool silver and steel blue tones',
  'yin-metal': 'sparkling crystal cave with gemstones and sharp crystal formations, lavender and silver light',
};

const ANIMAL_DESCRIPTIONS = {
  squirrel: 'cute chibi squirrel',
  buffalo: 'cute chibi buffalo with small horns',
  tiger: 'cute chibi tiger with stripes',
  cat: 'cute chibi cat',
  dragon: 'cute chibi dragon with small wings',
  snake: 'cute chibi snake clearly a snake coiled naturally',
  horse: 'cute chibi horse',
  deer: 'cute chibi deer with small antlers',
  monkey: 'cute chibi monkey',
  phoenix: 'cute chibi Eastern fenghuang phoenix bird, colorful iridescent feathers',
  wolf: 'cute chibi wolf',
  bear: 'cute chibi bear',
};

const MJ_SUFFIX = '--ar 1:1 --style raw --s 250';

function csvEscape(value) {
  return `"${value.replace(/"/g, '""')}"`;
}

const rows = [['filename', 'theme', 'animal', 'prompt', 'midjourney_suffix']];

for (const { theme, animal, filename } of listRequiredTotemImages()) {
  const scene = SCENES[theme];
  const animalDesc = ANIMAL_DESCRIPTIONS[animal];
  const prompt = `${STYLE}, ${animalDesc} naturally living in ${scene}`;
  rows.push([filename, theme, animal, prompt, MJ_SUFFIX]);
}

const body = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
await fs.writeFile(OUTPUT, `${body}\n`);
console.log(`Wrote ${rows.length - 1} prompts to ${OUTPUT}`);
