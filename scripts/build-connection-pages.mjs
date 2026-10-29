#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MATCH_TYPES, MATCH_TYPE_ORDER } from '../js/totem-canon.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PAGE_VERSION = '20260903';
const STYLES_VERSION = '20260903';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function splitDescription(description) {
  return String(description)
    .split(/\n\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function renderOtherTypes(currentId) {
  const links = MATCH_TYPE_ORDER.filter((id) => id !== currentId).map((id) => {
    const meta = MATCH_TYPES[id];
    return `<li><a href="${escapeHtml(meta.page)}?v=${PAGE_VERSION}">${escapeHtml(meta.label)}</a></li>`;
  });

  return `
          <h3>Other connection types</h3>
          <ul class="connection-type-links">
            ${links.join('\n            ')}
          </ul>`;
}

function renderConnectionPage(id) {
  const meta = MATCH_TYPES[id];
  const paragraphs = splitDescription(meta.description);
  const body = paragraphs.map((part) => `<p>${escapeHtml(part)}</p>`).join('\n          ');
  const title = `${meta.label} Connection — TotemAstrology.com`;

  return `<!DOCTYPE html>
<!-- page rev ${PAGE_VERSION} — ${meta.label} connection type -->
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <meta name="page-version" content="${PAGE_VERSION}">
  <script>
    (function () {
      var PAGE_VERSION = '${PAGE_VERSION}';
      var params = new URLSearchParams(location.search);
      if (params.get('v') !== PAGE_VERSION) {
        params.set('v', PAGE_VERSION);
        location.replace(location.pathname + '?' + params.toString() + location.hash);
      }
    })();
  </script>
  <meta name="description" content="${escapeHtml(meta.summary)}">
  <link rel="canonical" href="https://totemastrology.com/${escapeHtml(meta.page)}">
  <title>${escapeHtml(title)}</title>
  <link rel="icon" href="assets/images/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Source+Sans+3:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/styles.css?v=${STYLES_VERSION}">
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to content</a>
  <div class="page-wrap">
    <header class="site-header">
      <div class="container header-inner">
        <a href="index.html" class="logo">
          <svg class="logo-icon" viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <circle cx="18" cy="18" r="16" stroke="currentColor" stroke-width="1.5"/>
            <path d="M18 6 L18 30 M6 18 L30 18" stroke="currentColor" stroke-width="1.5" opacity="0.5"/>
            <circle cx="18" cy="10" r="2" fill="currentColor"/>
            <circle cx="26" cy="18" r="1.5" fill="currentColor" opacity="0.7"/>
            <circle cx="12" cy="24" r="1.5" fill="currentColor" opacity="0.7"/>
          </svg>
          TotemAstrology.com
        </a>
        <button class="nav-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="Toggle navigation">
          <span></span><span></span><span></span>
        </button>
        <div class="header-actions">
        <nav id="site-nav" class="site-nav" aria-label="Main navigation">
          <ul>
            <li><a href="index.html">Home</a></li>
            <li><a href="how-it-works.html">How It Works</a></li>
            <li><a href="calculator.html">Totem Animals Calculator</a></li>
            <li><a href="connections.html">Connections</a></li>
            <li><a href="about.html">About</a></li>
            <li><a href="services.html">Services</a></li>
            <li><a href="faq.html">FAQ</a></li>
            <li><a href="contact.php">Contact</a></li>
          </ul>
        </nav>
        </div>
      </div>
    </header>

    <main id="main-content">
      <section class="page-hero">
        <div class="container">
          <span class="section-label">Connection Type</span>
          <h1>${escapeHtml(meta.label)}</h1>
          <p>${escapeHtml(meta.summary)}</p>
        </div>
      </section>

      <section class="section section--learn">
        <div class="container learn-prose">
          <p>
            <a href="connections.html?v=${PAGE_VERSION}">&larr; Totem Connections</a>
          </p>
          ${body}
          ${renderOtherTypes(id)}
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="cta-band">
            <h2>Find ${escapeHtml(meta.label)} Matches</h2>
            <p>Calculate your four totem animals, then browse the opt-in directory for people who share this connection type with you.</p>
            <a href="connections.html?v=${PAGE_VERSION}" class="btn btn-primary">Totem Connections Directory</a>
            <a href="calculator.html" class="btn btn-outline">Totem Animals Calculator</a>
          </div>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <div class="container footer-inner">
        <span class="footer-brand">Totem Astrology&trade;</span>
        <nav class="footer-nav" aria-label="Footer navigation">
          <a href="how-it-works.html">How It Works</a>
          <a href="calculator.html">Totem Animals Calculator</a>
          <a href="connections.html">Connections</a>
          <a href="about.html">About</a>
          <a href="services.html">Services</a>
          <a href="faq.html">FAQ</a>
          <a href="terms.html">Terms &amp; IP</a>
          <a href="contact.php">Contact</a>
        </nav>
        <p class="footer-copy">&copy; 2026 Travis Barrett LeBlanc / TotemAstrology.com. Totem Astrology&trade;. All rights reserved. <a href="terms.html">Terms &amp; IP</a></p>
      </div>
    </footer>
  </div>
  <script src="js/stars.js?v=20260618"></script>
  <script src="js/main.js?v=20260901"></script>
  <script type="module" src="js/i18n-boot.js?v=20260903"></script>
</body>
</html>
`;
}

export function renderConnectionModeCards(pageVersion = PAGE_VERSION) {
  return MATCH_TYPE_ORDER.map((id) => {
    const meta = MATCH_TYPES[id];
    return `            <a href="${escapeHtml(meta.page)}?v=${pageVersion}" class="card connection-mode-card">
              <h3>${escapeHtml(meta.label)}</h3>
              <p>${escapeHtml(meta.summary)}</p>
              <span class="connection-mode-card__cta">Read more</span>
            </a>`;
  }).join('\n');
}

export function buildConnectionPages() {
  for (const id of MATCH_TYPE_ORDER) {
    const meta = MATCH_TYPES[id];
    const html = renderConnectionPage(id);
    fs.writeFileSync(path.join(root, meta.page), html);
    console.log(`Wrote ${meta.page}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildConnectionPages();
}
