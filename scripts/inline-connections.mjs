#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildConnectionPages, renderConnectionModeCards } from './build-connection-pages.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PAGE_VERSION = '20260807';
const builtAt = new Date().toLocaleString('en-US', {
  timeZone: 'America/Denver',
  dateStyle: 'medium',
  timeStyle: 'short',
});
let template = fs.readFileSync(path.join(root, 'connections.template.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'js/connections.js'), 'utf8');
template = template.replace('<!-- BUILD_STAMP -->', `<!-- Built ${builtAt} MT -->`);
template = template.replace('<!-- CONNECTION_MODE_CARDS -->', renderConnectionModeCards(PAGE_VERSION));
// Use a replacer function so `$&`, `$1`, etc. in the bundle are not interpreted.
const output = template.replace(
  '<!-- INLINE_CONNECTIONS_SCRIPT -->',
  () => `<script>\n${script}\n</script>`,
);
fs.writeFileSync(path.join(root, 'connections.html'), output);
buildConnectionPages();
console.log(`Wrote connections.html (standalone) — ${builtAt} MT`);
