/**
 * Merged message tables: English base + per-locale overlays.
 */
import { LOCALES } from './i18n-locales.js';
import { EN } from './i18n-en.js';
import { TRANSLATIONS } from './i18n-translations.js';

function buildMessages() {
  /** @type {Record<string, Record<string, string>>} */
  const out = { en: { ...EN } };
  for (const { code } of LOCALES) {
    if (code === 'en') continue;
    out[code] = { ...EN, ...(TRANSLATIONS[code] || {}) };
  }
  return out;
}

/** @type {Record<string, Record<string, string>>} */
export const MESSAGES = buildMessages();
