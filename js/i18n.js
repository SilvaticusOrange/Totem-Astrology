/**
 * In-site i18n: language bar + data-i18n application (no off-site bounce).
 */
import {
  DEFAULT_LOCALE,
  getLocaleInfo,
  I18N_STORAGE_KEY,
  isSupportedLocale,
  LOCALES,
  normalizeLocaleTag,
} from './i18n-locales.js';
import { MESSAGES } from './i18n-messages.js';

export {
  DEFAULT_LOCALE,
  getLocaleInfo,
  I18N_STORAGE_KEY,
  isSupportedLocale,
  LOCALES,
  MESSAGES,
  normalizeLocaleTag,
};

const NAV_HREF_KEYS = {
  'index.html': 'nav.home',
  'how-it-works.html': 'nav.howItWorks',
  'calculator.html': 'nav.calculator',
  'connections.html': 'nav.connections',
  'about.html': 'nav.about',
  'services.html': 'nav.services',
  'faq.html': 'nav.faq',
  'account.html': 'nav.account',
  'contact.php': 'nav.contact',
  'contact.html': 'nav.contact',
  'terms.html': 'nav.terms',
};

/**
 * @param {string} key
 * @param {string} [locale]
 * @param {Record<string, string|number>} [vars]
 */
export function t(key, locale = DEFAULT_LOCALE, vars) {
  const table = MESSAGES[locale] || MESSAGES[DEFAULT_LOCALE];
  let value = table[key] ?? MESSAGES[DEFAULT_LOCALE][key] ?? key;
  if (vars) {
    value = String(value).replace(/\{(\w+)\}/g, (_, name) =>
      vars[name] != null ? String(vars[name]) : `{${name}}`,
    );
  }
  return value;
}

export function detectBrowserLocale() {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;
  const candidates = [...(navigator.languages || []), navigator.language].filter(Boolean);
  for (const raw of candidates) {
    const code = normalizeLocaleTag(raw);
    if (code) return code;
  }
  return DEFAULT_LOCALE;
}

export function readStoredLocale() {
  try {
    const stored = localStorage.getItem(I18N_STORAGE_KEY);
    if (stored && isSupportedLocale(stored)) return stored;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeStoredLocale(code) {
  try {
    localStorage.setItem(I18N_STORAGE_KEY, code);
  } catch {
    /* ignore */
  }
}

export function resolveInitialLocale() {
  return readStoredLocale() || detectBrowserLocale();
}

function setText(el, value) {
  if (el.dataset.i18nHtml === 'true') {
    el.innerHTML = value.replace(/\n/g, '<br>');
    return;
  }
  el.textContent = value;
}

function hrefFile(href) {
  if (!href) return '';
  try {
    const url = new URL(href, 'https://totemastrology.com/');
    return (url.pathname.split('/').pop() || '').toLowerCase();
  } catch {
    return String(href).split('?')[0].split('/').pop()?.toLowerCase() || '';
  }
}

export function applyChromeTranslations(locale) {
  document.querySelectorAll('a.skip-link').forEach((el) => {
    if (!el.getAttribute('data-i18n')) setText(el, t('skip', locale));
  });
  document.querySelectorAll('.nav-toggle').forEach((el) => {
    if (!el.getAttribute('data-i18n-aria')) {
      el.setAttribute('aria-label', t('nav.toggle', locale));
    }
  });
  document.querySelectorAll('#site-nav a, .site-nav a, .footer-nav a').forEach((el) => {
    if (el.getAttribute('data-i18n')) return;
    const key = NAV_HREF_KEYS[hrefFile(el.getAttribute('href'))];
    if (key) setText(el, t(key, locale));
  });
  document.querySelectorAll('.footer-brand').forEach((el) => {
    if (!el.getAttribute('data-i18n')) setText(el, t('footer.brand', locale));
  });
  document.querySelectorAll('.footer-copy').forEach((el) => {
    if (el.getAttribute('data-i18n')) return;
    const termsLink = el.querySelector('a[href*="terms"]');
    const href = termsLink?.getAttribute('href') || 'terms.html';
    el.replaceChildren();
    el.append(document.createTextNode(`${t('footer.copy', locale)} · `));
    const a = document.createElement('a');
    a.href = href;
    a.textContent = t('nav.terms', locale);
    el.append(a);
  });
  document.querySelectorAll('.site-nav').forEach((el) => {
    el.setAttribute('aria-label', t('nav.main', locale));
  });
  document.querySelectorAll('.footer-nav').forEach((el) => {
    el.setAttribute('aria-label', t('footer.nav', locale));
  });
}

export function applyTranslations(locale) {
  const info = getLocaleInfo(locale);
  document.documentElement.lang = locale;
  document.documentElement.dir = info.dir === 'rtl' ? 'rtl' : 'ltr';

  applyChromeTranslations(locale);

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) setText(el, t(key, locale));
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    if (key) el.setAttribute('aria-label', t(key, locale));
  });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (key) el.setAttribute('title', t(key, locale));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) el.setAttribute('placeholder', t(key, locale));
  });
  document.querySelectorAll('.lang-flag').forEach((button) => {
    const active = button.dataset.lang === locale;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  const label = document.querySelector('.lang-bar-label');
  if (label) setText(label, t('lang.label', locale));
  syncLangBarToggle(locale);
}

function syncLangBarToggle(locale) {
  const info = getLocaleInfo(locale);
  const toggle = document.querySelector('.lang-bar-toggle');
  if (!toggle) return;
  const emoji = toggle.querySelector('.lang-bar-toggle__emoji');
  const code = toggle.querySelector('.lang-bar-toggle__code');
  const name = toggle.querySelector('.lang-bar-toggle__name');
  if (emoji) emoji.textContent = info.flag;
  if (code) code.textContent = info.code.toUpperCase();
  if (name) name.textContent = info.nativeName;
  toggle.setAttribute(
    'aria-label',
    `${t('lang.label', locale)}: ${info.name} — ${info.nativeName}`,
  );
  toggle.setAttribute('title', `${info.name} — ${info.nativeName}`);
}

function setLangBarOpen(open) {
  const bar = document.getElementById('site-lang-bar');
  const toggle = document.querySelector('.lang-bar-toggle');
  const menu = document.getElementById('lang-bar-menu');
  if (!bar || !toggle || !menu) return;
  bar.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  menu.hidden = !open;
}

export function ensureLanguageBar() {
  let bar = document.getElementById('site-lang-bar');
  if (bar) return bar;
  const header = document.querySelector('.site-header');
  if (!header) return null;
  header.classList.add('site-header--with-lang');
  bar = document.createElement('div');
  bar.id = 'site-lang-bar';
  bar.className = 'lang-bar';
  bar.setAttribute('role', 'navigation');
  bar.setAttribute('aria-label', 'Language');
  header.appendChild(bar);
  return bar;
}

export function renderLanguageBar(target) {
  if (!target) return;
  const initial = resolveInitialLocale();
  const current = getLocaleInfo(initial);
  target.innerHTML = `
    <div class="container lang-bar-inner">
      <button
        type="button"
        class="lang-bar-toggle"
        aria-expanded="false"
        aria-controls="lang-bar-menu"
        aria-label="${t('lang.label', initial)}: ${current.name} — ${current.nativeName}"
        title="${current.name} — ${current.nativeName}"
      >
        <span class="lang-bar-toggle__emoji" aria-hidden="true">${current.flag}</span>
        <span class="lang-bar-toggle__code">${current.code.toUpperCase()}</span>
        <span class="lang-bar-toggle__name">${current.nativeName}</span>
        <span class="lang-bar-toggle__chevron" aria-hidden="true"></span>
      </button>
      <div id="lang-bar-menu" class="lang-bar-menu" hidden>
        <span class="lang-bar-label" data-i18n="lang.label">Language</span>
        <div class="lang-flags" role="group" aria-label="Language">
          ${LOCALES.map(
            (locale) => `
            <button
              type="button"
              class="lang-flag"
              data-lang="${locale.code}"
              title="${locale.name} — ${locale.nativeName}"
              aria-label="${locale.name}"
              aria-pressed="false"
            >
              <span class="lang-flag__emoji" aria-hidden="true">${locale.flag}</span>
              <span class="lang-flag__code">${locale.code.toUpperCase()}</span>
            </button>
          `,
          ).join('')}
        </div>
      </div>
    </div>
  `;

  const toggle = target.querySelector('.lang-bar-toggle');
  toggle?.addEventListener('click', (event) => {
    event.stopPropagation();
    setLangBarOpen(!target.classList.contains('is-open'));
  });

  target.querySelectorAll('.lang-flag').forEach((button) => {
    button.addEventListener('click', () => {
      const code = button.dataset.lang;
      if (!code || !isSupportedLocale(code)) return;
      writeStoredLocale(code);
      applyTranslations(code);
      setLangBarOpen(false);
      window.dispatchEvent(new CustomEvent('totem:localechange', { detail: { locale: code } }));
    });
  });

  document.addEventListener('click', (event) => {
    if (!target.classList.contains('is-open')) return;
    if (target.contains(event.target)) return;
    setLangBarOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && target.classList.contains('is-open')) {
      setLangBarOpen(false);
      toggle?.focus();
    }
  });
}

export function initWebI18n() {
  ensureUserProfileButton();
  const bar = ensureLanguageBar();
  if (bar) renderLanguageBar(bar);
  const locale = resolveInitialLocale();
  applyTranslations(locale);
}

function ensureUserProfileButton() {
  const actions = document.querySelector('.header-actions');
  if (!actions) return;

  // Prefer a dedicated right-side button over a buried nav item.
  document.querySelectorAll('#site-nav a[href="account.html"]').forEach((link) => {
    link.closest('li')?.remove();
  });

  let button = actions.querySelector('.user-profile-btn');
  if (!button) {
    button = document.createElement('a');
    button.className = 'user-profile-btn';
    button.href = 'account.html';
    actions.appendChild(button);
  }
  button.setAttribute('data-i18n', 'nav.account');
  button.textContent = 'User Profile';
  if (/\/account\.html(?:$|\?)/i.test(location.pathname + location.search) || /account\.html$/i.test(location.pathname)) {
    button.setAttribute('aria-current', 'page');
  }
}

if (typeof window !== 'undefined') {
  window.TotemI18n = {
    t,
    resolveInitialLocale,
    applyTranslations,
    writeStoredLocale,
    LOCALES,
    MESSAGES,
  };
}
