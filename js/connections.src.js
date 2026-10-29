import { authHeaders, fetchCurrentUser, getAuthToken } from './auth-client.js';
import { DEFAULT_CITY, initCityLookup, readBirthInput, renderProfileSummary } from './birth-form.js';
import { MATCH_TYPES, PILLAR_GUIDES } from './totem-canon.js';
import { formatElementAnimal, profileFromBirth } from './totem-chart.js';
import { scoreMatchType } from './totem-match.js';

const API_URL = 'api/connections.php';
const STORAGE_PROFILE = 'totemConnectionsProfile';
const ACCOUNT_URL = 'account.html';

const MATCH_LABEL_KEYS = {
  rainbow: 'match.rainbow.label',
  shadow: 'match.shadow.label',
  trine: 'match.trine.label',
  mirror: 'match.mirror.label',
  sameAsMe: 'match.sameAsMe.label',
};

const GUIDE_I18N_KEYS = {
  spirit: 'totem.guide.spirit',
  mental: 'totem.guide.mental',
  emotional: 'totem.guide.emotional',
  physical: 'totem.guide.physical',
};

function currentLocale() {
  return window.TotemI18n?.resolveInitialLocale?.() || 'en';
}

function tt(key, vars) {
  if (window.TotemI18n?.t) return window.TotemI18n.t(key, currentLocale(), vars);
  return key;
}

function matchTypeLabel(matchType) {
  const key = MATCH_LABEL_KEYS[matchType];
  if (key) return tt(key);
  return MATCH_TYPES[matchType]?.label || matchType;
}

function pillarGuideLabel(pillar) {
  const key = GUIDE_I18N_KEYS[pillar];
  if (key) return tt(key);
  return PILLAR_GUIDES[pillar] || pillar;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function loadStoredProfile() {
  try {
    const raw = sessionStorage.getItem(STORAGE_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredProfile(profile) {
  sessionStorage.setItem(STORAGE_PROFILE, JSON.stringify(profile));
}

function assertJoinResponse(data) {
  if (!data?.id) {
    throw new Error(tt('conn.error.saveFailed'));
  }
  return { id: data.id, status: data.status || 'pending' };
}

function showMessage(el, message, type = 'info') {
  if (!el) return;
  el.textContent = message;
  el.className = `form-message form-message--${type} visible`;
  el.hidden = false;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function readFormValue(form, name) {
  const control = form?.elements?.namedItem(name);
  if (!control) return '';
  return String('value' in control ? control.value : '').trim();
}

function isFormChecked(form, name) {
  const control = form?.elements?.namedItem(name);
  return Boolean(control && 'checked' in control && control.checked);
}

function hideMessage(el) {
  if (!el) return;
  el.hidden = true;
  el.textContent = '';
  el.className = 'form-message';
}

async function parseApiResponse(response, fallbackMessage) {
  const raw = await response.text();
  let data = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      if (response.status === 404) {
        throw new Error('Directory API not found. Upload the api/connections.php file to GoDaddy (public_html/api/).');
      }
    }
  }
  if (!response.ok) {
    throw new Error(data.error || fallbackMessage);
  }
  return data;
}

function directoryProfileToMatchProfile(entry) {
  return {
    spirit: entry.spirit,
    mental: entry.mental,
    emotional: entry.emotional,
    physical: entry.physical,
    elements: entry.elements ?? {},
  };
}

function renderMatchBadges(result, matchType) {
  const full = result.isFullMatch ? ' connection-card__score--full' : '';
  const label = matchTypeLabel(matchType || result.type) || result.label;
  return `<span class="connection-card__score${full}">${escapeHtml(label)} ${result.count}/${result.total}</span>`;
}

function renderPillarMatches(viewerProfile, entryProfile, result) {
  return result.pillars
    .filter((pillar) => pillar.matches)
    .map((pillar) => {
      const animalA = formatElementAnimal(viewerProfile, pillar.pillar);
      const animalB = formatElementAnimal(entryProfile, pillar.pillar);
      return `<li>${escapeHtml(pillarGuideLabel(pillar.pillar))}: ${escapeHtml(animalA)} ↔ ${escapeHtml(animalB)}${pillar.detail ? ` · ${escapeHtml(pillar.detail)}` : ''}</li>`;
    })
    .join('');
}

function renderMatchCard(viewerProfile, entry, matchType, minCount) {
  const profile = directoryProfileToMatchProfile(entry);
  const result = scoreMatchType(viewerProfile, profile, matchType);
  if (result.count < minCount) return '';

  const allResults = Object.keys(MATCH_TYPES).map((type) => {
    const scored = scoreMatchType(viewerProfile, profile, type);
    return { ...scored, type };
  });
  const badges = allResults.map((item) => renderMatchBadges(item, item.type)).join('');
  const active = result.pillars.filter((pillar) => pillar.matches);
  const pillarList = renderPillarMatches(viewerProfile, profile, result);
  const areaLabel = entry.location?.label
    ? `<p class="connection-card__area">${escapeHtml(entry.location.label)}${entry.distanceKm != null ? ` · ${escapeHtml(String(entry.distanceKm))} km` : ''}</p>`
    : '';
  const matchLabel = matchTypeLabel(matchType);
  const metaText = active.length === 1
    ? tt('conn.meta.pillars', { count: active.length, label: matchLabel })
    : tt('conn.meta.pillarsPlural', { count: active.length, label: matchLabel });
  const verifiedBadge = entry.birthVerified
    ? `<span class="connection-card__verified" title="${escapeHtml(tt('conn.verified.title'))}">${escapeHtml(tt('conn.verified.badge'))}</span>`
    : '';
  const timeVerifiedBadge = entry.birthTimeVerified
    ? `<span class="connection-card__verified connection-card__verified--time" title="${escapeHtml(tt('conn.timeVerified.title'))}">${escapeHtml(tt('conn.timeVerified.badge'))}</span>`
    : '';

  return `
    <article class="connection-card${entry.birthVerified ? ' connection-card--verified' : ''}${entry.birthTimeVerified ? ' connection-card--time-verified' : ''}">
      <div class="connection-card__header">
        <div>
          <h3 class="connection-card__name">${escapeHtml(entry.displayName)}${verifiedBadge}${timeVerifiedBadge}</h3>
          ${areaLabel}
          ${entry.intro ? `<p class="connection-card__intro">${escapeHtml(entry.intro)}</p>` : ''}
        </div>
        <div class="connection-card__badges">${badges}</div>
      </div>
      ${renderProfileSummary(profile)}
      ${entry.contactEmail ? `<p class="connection-card__contact"><a href="mailto:${escapeHtml(entry.contactEmail)}">${escapeHtml(tt('conn.emailLink', { name: entry.displayName }))}</a></p>` : ''}
      ${pillarList ? `<ul class="connection-card__matches">${pillarList}</ul>` : ''}
      <p class="connection-card__meta">${escapeHtml(metaText)}</p>
    </article>`;
}

async function fetchDirectory() {
  const response = await fetch(API_URL, {
    headers: { Accept: 'application/json' },
  });
  const data = await parseApiResponse(response, tt('conn.error.loadFailed'));
  return data.profiles ?? [];
}

function renderDirectory(viewerProfile, profiles, matchType, minCount, container, statusEl) {
  if (!viewerProfile) {
    container.innerHTML = `<p class="connection-empty">${escapeHtml(tt('conn.empty.needProfile'))}</p>`;
    showMessage(statusEl, tt('conn.status.needProfile'), 'info');
    return;
  }

  const cards = profiles
    .map((entry) => renderMatchCard(viewerProfile, entry, matchType, minCount))
    .filter(Boolean)
    .join('');

  if (!profiles.length) {
    container.innerHTML = `<p class="connection-empty">${escapeHtml(tt('conn.empty.noneListed'))}</p>`;
    showMessage(statusEl, tt('conn.status.loadedEmpty'), 'info');
    return;
  }

  if (!cards) {
    container.innerHTML = `<p class="connection-empty">${escapeHtml(tt('conn.empty.noFilters'))}</p>`;
    const statusMsg = profiles.length === 1
      ? tt('conn.status.loadedNoMatches', { count: profiles.length })
      : tt('conn.status.loadedNoMatchesPlural', { count: profiles.length });
    showMessage(statusEl, statusMsg, 'info');
    return;
  }

  container.innerHTML = cards;
  const showingMsg = profiles.length === 1
    ? tt('conn.status.showing', { count: profiles.length })
    : tt('conn.status.showingPlural', { count: profiles.length });
  showMessage(statusEl, showingMsg, 'success');
}

function renderProfileSummaryBlock(profile, hint) {
  return `
      <h3>${escapeHtml(tt('conn.profile.title'))}</h3>
      ${renderProfileSummary(profile)}
      <p class="form-hint">${escapeHtml(hint)}</p>`;
}

function initProfilePanel(root, onProfileReady) {
  const form = root.querySelector('#connections-birth-form');
  const summary = root.querySelector('#connections-profile-summary');
  const errorEl = root.querySelector('#connections-profile-error');
  if (!form) return;

  initCityLookup(form);

  let currentProfile = loadStoredProfile();
  const hintStored = () => tt('conn.profile.hintStored');
  const hintFresh = () => tt('conn.profile.hintFresh');
  let hintKey = 'stored';

  if (currentProfile) {
    summary.hidden = false;
    summary.innerHTML = renderProfileSummaryBlock(currentProfile, hintStored());
    onProfileReady(currentProfile);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideMessage(errorEl);

    try {
      const input = await readBirthInput(form);
      const { profile } = profileFromBirth(input);
      saveStoredProfile(profile);
      currentProfile = profile;
      hintKey = 'fresh';
      summary.hidden = false;
      summary.innerHTML = renderProfileSummaryBlock(profile, hintFresh());
      onProfileReady(profile);
      summary.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
      showMessage(errorEl, error.message || tt('calc.error.calculate'), 'error');
    }
  });

  window.addEventListener('totem:localechange', () => {
    if (!currentProfile || summary.hidden) return;
    const hint = hintKey === 'fresh' ? hintFresh() : hintStored();
    summary.innerHTML = renderProfileSummaryBlock(currentProfile, hint);
  });
}

function initDirectoryCityLookup(form) {
  const cityInput = form.querySelector('#directory-city');
  const suggestions = form.querySelector('#directory-city-suggestions');
  if (!cityInput || !suggestions) {
    form.getDirectoryLocation = () => null;
    return;
  }

  let resolved = null;
  let debounceTimer = null;
  let searchVersion = 0;

  const formatLabel = (place) => {
    const parts = [place.name];
    if (place.admin1 && place.admin1 !== place.name) parts.push(place.admin1);
    parts.push(place.country);
    return parts.join(', ');
  };

  const selectPlace = (place) => {
    if (place.latitude == null || place.longitude == null) return;
    resolved = {
      city: place.name,
      region: place.admin1 || '',
      country: place.country,
      lat: place.latitude,
      lon: place.longitude,
    };
    cityInput.value = formatLabel(place);
    suggestions.hidden = true;
    suggestions.innerHTML = '';
  };

  cityInput.addEventListener('input', () => {
    const query = cityInput.value.trim();
    resolved = null;
    clearTimeout(debounceTimer);
    if (query.length < 2) {
      suggestions.hidden = true;
      suggestions.innerHTML = '';
      return;
    }
    debounceTimer = setTimeout(async () => {
      const version = ++searchVersion;
      suggestions.innerHTML = `<li><span class="bazi-city-suggestion bazi-city-suggestion--empty">${tt('calc.city.searching')}</span></li>`;
      suggestions.hidden = false;
      try {
        const { searchCities } = await import('./timezones.js');
        const results = await searchCities(query);
        if (version !== searchVersion) return;
        if (!results.length) {
          suggestions.innerHTML = `<li><span class="bazi-city-suggestion bazi-city-suggestion--empty">${tt('conn.city.none')}</span></li>`;
          return;
        }
        suggestions.innerHTML = results.map((place, index) => `
          <li>
            <button type="button" class="bazi-city-suggestion" data-index="${index}">
              <span class="bazi-city-name">${formatLabel(place)}</span>
            </button>
          </li>
        `).join('');
        suggestions._places = results;
        suggestions.hidden = false;
      } catch {
        if (version !== searchVersion) return;
        suggestions.innerHTML = `<li><span class="bazi-city-suggestion bazi-city-suggestion--empty">${tt('conn.city.failed')}</span></li>`;
      }
    }, 250);
  });

  suggestions.addEventListener('click', (event) => {
    const button = event.target.closest('.bazi-city-suggestion');
    if (!button || button.dataset.index === undefined) return;
    const place = suggestions._places?.[Number(button.dataset.index)];
    if (place) selectPlace(place);
  });

  form.getDirectoryLocation = () => resolved;
}

async function requireSignedIn(messageEl) {
  if (!getAuthToken()) {
    const message = 'Sign in to your account first to manage a directory listing.';
    showMessage(messageEl, message, 'error');
    return null;
  }
  try {
    const user = await fetchCurrentUser();
    if (!user) {
      showMessage(
        messageEl,
        'Your session expired. Please sign in again on the Account page.',
        'error',
      );
      return null;
    }
    return user;
  } catch (error) {
    showMessage(messageEl, error.message || 'Could not verify your account.', 'error');
    return null;
  }
}

function ensureAuthBanner(root) {
  if (root.querySelector('#connections-auth-banner')) return;
  const banner = document.createElement('p');
  banner.id = 'connections-auth-banner';
  banner.className = 'form-hint';
  banner.innerHTML = `Directory join and remove now use your <a href="${ACCOUNT_URL}">Totem account</a>. Sign in first, then list or unlist yourself here.`;
  const joinForm = root.querySelector('#connections-join-form');
  joinForm?.parentElement?.insertBefore(banner, joinForm);
}

function initJoinPanel(root, getViewerProfile, refreshDirectory) {
  const form = root.querySelector('#connections-join-form');
  const birthForm = root.querySelector('#connections-birth-form');
  const profileErrorEl = root.querySelector('#connections-profile-error');
  const messageEl = root.querySelector('#connections-join-message');
  const submitButton = form?.querySelector('[type="submit"]');
  if (!form) return;

  initDirectoryCityLookup(form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideMessage(messageEl);

    const defaultLabel = tt('page.conn.join');

    try {
      const user = await requireSignedIn(messageEl);
      if (!user) return;

      let viewerProfile = getViewerProfile();
      if (!viewerProfile) {
        try {
          const input = await readBirthInput(birthForm);
          const { profile } = profileFromBirth(input);
          saveStoredProfile(profile);
          viewerProfile = profile;
        } catch (error) {
          showMessage(messageEl, error.message || tt('conn.error.needCalcJoin'), 'error');
          if (profileErrorEl) showMessage(profileErrorEl, error.message, 'error');
          return;
        }
      }

      const username = user.username || user.displayName || '';
      if (!username) {
        showMessage(messageEl, tt('conn.error.displayName'), 'error');
        return;
      }
      const usernameHint = form.querySelector('#connections-join-username');
      if (usernameHint) {
        usernameHint.hidden = false;
        usernameHint.textContent = tt('page.conn.joinAsUsername', { username });
      }
      if (!isFormChecked(form, 'consent')) {
        showMessage(messageEl, tt('conn.error.consent'), 'error');
        return;
      }

      const location = form.getDirectoryLocation?.() || null;
      const cityTyped = readFormValue(form, 'directoryCity');
      if (cityTyped && !location) {
        showMessage(messageEl, tt('conn.error.cityPick'), 'error');
        return;
      }

      const payload = {
        intro: readFormValue(form, 'intro'),
        contactEmail: readFormValue(form, 'contactEmail'),
        consent: true,
        ...viewerProfile,
      };
      if (location) payload.location = location;

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = tt('page.conn.joining');
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: authHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(payload),
      });
      const data = await parseApiResponse(response, tt('conn.error.addListing'));
      const submission = assertJoinResponse(data);

      showMessage(
        messageEl,
        submission.status === 'pending'
          ? tt('conn.success.pending')
          : tt('conn.success.live'),
        'success',
      );
      form.reset();
      if (submission.status !== 'pending') {
        await refreshDirectory();
      }
    } catch (error) {
      showMessage(messageEl, error.message || tt('conn.error.joinFailed'), 'error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = defaultLabel;
      }
    }
  });
}

function initRemovePanel(root, getViewerProfile, refreshDirectory) {
  const form = root.querySelector('#connections-remove-form');
  const messageEl = root.querySelector('#connections-remove-message');
  const submitButton = form?.querySelector('[type="submit"]');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideMessage(messageEl);

    const defaultLabel = tt('page.conn.removeSubmit');

    try {
      const user = await requireSignedIn(messageEl);
      if (!user) return;

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = tt('page.conn.removing');
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: authHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ action: 'remove-self' }),
      });
      await parseApiResponse(response, tt('conn.error.removeFailed'));

      form.reset();
      showMessage(messageEl, tt('conn.success.removed'), 'success');
      await refreshDirectory();
    } catch (error) {
      showMessage(messageEl, error.message || tt('conn.error.removeFailed'), 'error');
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = defaultLabel;
      }
    }
  });
}

function initDirectoryBrowser(root, getViewerProfile) {
  const filters = root.querySelector('#connections-filters');
  const results = root.querySelector('#connections-results');
  const statusEl = root.querySelector('#connections-directory-status');
  let profiles = [];

  const readFilters = () => ({
    matchType: filters?.matchType?.value || 'rainbow',
    minCount: Number(filters?.minCount?.value || 1),
  });

  const render = () => {
    const { matchType, minCount } = readFilters();
    renderDirectory(getViewerProfile(), profiles, matchType, minCount, results, statusEl);
  };

  const refreshDirectory = async () => {
    hideMessage(statusEl);
    results.innerHTML = `<p class="connection-empty">${escapeHtml(tt('conn.loading'))}</p>`;
    try {
      profiles = await fetchDirectory();
      render();
    } catch (error) {
      const detail = error.message || tt('conn.error.loadFailed');
      const hint = detail.includes('404') || /not found|api\/connections/i.test(detail)
        ? escapeHtml(tt('conn.error.hint404'))
        : escapeHtml(tt('conn.error.hintWritable'));
      results.innerHTML = `<p class="connection-empty">${escapeHtml(detail)}</p><p class="connection-empty">${hint}</p>`;
      showMessage(statusEl, detail, 'error');
    }
  };

  filters?.addEventListener('change', render);
  filters?.addEventListener('input', render);
  root.querySelector('#connections-refresh')?.addEventListener('click', (event) => {
    event.preventDefault();
    refreshDirectory();
  });

  window.addEventListener('totem:localechange', render);

  refreshDirectory();
  return { refreshDirectory, render };
}

function initConnectionsPage(root) {
  let viewerProfile = loadStoredProfile();
  ensureAuthBanner(root);

  const { refreshDirectory } = initDirectoryBrowser(root, () => viewerProfile);

  initProfilePanel(root, (profile) => {
    viewerProfile = profile;
    refreshDirectory();
  });

  initJoinPanel(root, () => viewerProfile, refreshDirectory);
  initRemovePanel(root, () => viewerProfile, refreshDirectory);
}

document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('[data-connections-page]');
  if (root) initConnectionsPage(root);
});

export { DEFAULT_CITY };
