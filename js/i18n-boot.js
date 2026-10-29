import { initWebI18n } from './i18n.js';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWebI18n);
} else {
  initWebI18n();
}
