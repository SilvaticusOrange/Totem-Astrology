#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const builtAt = new Date().toLocaleString('en-US', {
  timeZone: 'America/Denver',
  dateStyle: 'medium',
  timeStyle: 'short',
});
let template = fs.readFileSync(path.join(root, 'calculator.template.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'js/calculator.js'), 'utf8');
template = template.replace('<!-- BUILD_STAMP -->', `<!-- Built ${builtAt} MT -->`);
// Use a replacer function so `$&`, `$1`, etc. in the bundle are not interpreted.
const output = template.replace(
  '<!-- INLINE_CALCULATOR_SCRIPT -->',
  () => `<script>\n${script}\n</script>`,
);
fs.writeFileSync(path.join(root, 'calculator.html'), output);
console.log(`Wrote calculator.html (standalone) — ${builtAt} MT`);
