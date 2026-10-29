(function () {
  const navToggle = document.querySelector('.nav-toggle');
  const siteNav = document.querySelector('.site-nav');

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      siteNav.classList.toggle('is-open');
    });

    siteNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        siteNav.classList.remove('is-open');
      });
    });
  }

  const params = new URLSearchParams(window.location.search);
  const successEl = document.querySelector('.form-success');
  const errorEl = document.querySelector('.form-error');

  if (params.get('sent') === '1' && successEl) {
    successEl.classList.add('visible');
    successEl.textContent =
      'Thank you for reaching out. We will respond within 1–2 business days.';
  }

  if (params.get('error') === '1' && errorEl) {
    errorEl.classList.add('visible');
    errorEl.textContent =
      'Something went wrong sending your message. Please email alucardsilvaticus@gmail.com directly.';
  }

  const contactForm = document.querySelector('form[name="contact"]');
  if (contactForm && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();

      if (successEl) {
        successEl.classList.add('visible');
        successEl.textContent =
          'Thank you for reaching out. We will respond within 1–2 business days.';
      }

      contactForm.reset();
    });
  }

  // Safari/Chrome back-forward cache can show a frozen old page even with no-cache headers.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      location.reload();
    }
  });

  syncLiveSiteConfig();
})();

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getPromoIcon(id) {
  const icons = {
    'how-it-works': `<svg class="home-promo-card__icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="17" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="24" cy="24" r="9" stroke="currentColor" stroke-width="1.25" opacity="0.55"/>
      <path d="M24 7 L24 41 M7 24 L41 24" stroke="currentColor" stroke-width="1" opacity="0.35"/>
      <polygon points="24,15 31,28 17,28" stroke="currentColor" stroke-width="1.5" fill="rgba(201,169,98,0.12)"/>
    </svg>`,
    calculator: `<svg class="home-promo-card__icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2.5" stroke="currentColor" stroke-width="1.5"/>
      <rect x="26" y="9" width="13" height="13" rx="2.5" stroke="currentColor" stroke-width="1.5"/>
      <rect x="9" y="26" width="13" height="13" rx="2.5" stroke="currentColor" stroke-width="1.5"/>
      <rect x="26" y="26" width="13" height="13" rx="2.5" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="15.5" cy="15.5" r="2" fill="currentColor" opacity="0.7"/>
      <circle cx="32.5" cy="15.5" r="2" fill="currentColor" opacity="0.7"/>
      <circle cx="15.5" cy="32.5" r="2" fill="currentColor" opacity="0.7"/>
      <circle cx="32.5" cy="32.5" r="2" fill="currentColor" opacity="0.7"/>
    </svg>`,
    connections: `<svg class="home-promo-card__icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="16" cy="20" r="6" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="32" cy="20" r="6" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="24" cy="34" r="6" stroke="currentColor" stroke-width="1.5"/>
      <path d="M20.5 23.5 L21.5 29.5 M27.5 23.5 L26.5 29.5 M22 20 L26 20" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/>
    </svg>`,
  };

  return icons[id] || icons['how-it-works'];
}

function applyHomePromo(banners) {
  const root = document.querySelector('.home-promo-banners');
  if (!root || !Array.isArray(banners) || !banners.length) return;

  root.innerHTML = `<div class="home-promo-grid">${banners.map((banner) => {
    const featured = banner.featured ? ' home-promo-card--featured' : '';
    const btnClass = banner.primary ? 'btn-primary' : 'btn-outline';
    const icon = getPromoIcon(banner.id || 'how-it-works');

    return `<article class="home-promo-card${featured}">
      ${icon}
      <h3 class="home-promo-card__title">${escapeHtml(banner.title)}</h3>
      <p class="home-promo-card__copy">${escapeHtml(banner.text)}</p>
      <a href="${escapeHtml(banner.href)}" class="btn ${btnClass} home-promo-card__cta">${escapeHtml(banner.button)}</a>
    </article>`;
  }).join('')}</div>`;
}

function syncLiveSiteConfig() {
  if (location.protocol === 'file:') return;

  const homePromoRoot = document.querySelector('.home-promo-banners');
  if (!homePromoRoot) return;

  fetch(`api/site-config.php?_=${Date.now()}`, { cache: 'no-store', credentials: 'same-origin' })
    .then((response) => (response.ok ? response.json() : null))
    .then((config) => {
      if (!config) return;
      applyHomePromo(config.homePromo);
    })
    .catch(() => {});
}
