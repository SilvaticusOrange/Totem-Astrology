import {
  formatBirthDateISO,
  formatBirthTime24,
  parseBirthDate,
  parseBirthTime,
} from './parse-birth.js';
import {
  formatBirthPlaceLabel,
  NEPAL_IANA,
  searchCities,
} from './timezones.js';

export { formatBirthDateISO, formatBirthTime24, parseBirthDate, parseBirthTime };

function currentLocale() {
  return window.TotemI18n?.resolveInitialLocale?.() || 'en';
}

function tt(key, vars) {
  if (window.TotemI18n?.t) return window.TotemI18n.t(key, currentLocale(), vars);
  return key;
}

export const DEFAULT_CITY = {
  name: 'Kathmandu',
  admin1: 'Bagmati',
  country: 'Nepal',
  timezone: NEPAL_IANA,
};

function formatPlaceLabel(place) {
  const parts = [place.name];
  if (place.admin1 && place.admin1 !== place.name) parts.push(place.admin1);
  parts.push(place.country);
  return parts.join(', ');
}

function placeMatchesQuery(place, query) {
  const q = query.trim().toLowerCase();
  return place.name.toLowerCase() === q || formatPlaceLabel(place).toLowerCase() === q;
}

function pickBestCityMatch(results, query) {
  if (!results.length) return null;
  const q = query.trim().toLowerCase();
  const exact = results.find((place) => placeMatchesQuery(place, query));
  if (exact) return exact;

  const firstSegment = q.split(',')[0]?.trim();
  if (firstSegment) {
    const byName = results.find((place) => place.name.toLowerCase() === firstSegment);
    if (byName) return byName;
    const byPrefix = results.find((place) => place.name.toLowerCase().startsWith(firstSegment));
    if (byPrefix) return byPrefix;
  }

  const starts = results.find((place) => place.name.toLowerCase().startsWith(q));
  if (starts) return starts;
  if (results.length === 1) return results[0];
  return null;
}

function normalizePlace(result) {
  return {
    name: result.name,
    admin1: result.admin1,
    country: result.country,
    timezone: result.timezone,
  };
}

/**
 * @param {HTMLFormElement} form
 * @param {{
 *   cityInput?: string,
 *   suggestions?: string,
 *   timezoneDisplay?: string,
 *   requireSelection?: boolean,
 * }} [options]
 */
export function initCityLookup(form, options = {}) {
  const cityInput = form.querySelector(options.cityInput || '#birth-city');
  const suggestions = form.querySelector(options.suggestions || '#birth-city-suggestions');
  const timezoneDisplay = form.querySelector(options.timezoneDisplay || '#birth-city-timezone');
  let resolvedPlace = null;
  let debounceTimer = null;
  let searchVersion = 0;

  if (!cityInput || !suggestions) {
    form.getResolvedBirthPlace = () => resolvedPlace;
    form.resolveBirthCity = async () => resolvedPlace ?? DEFAULT_CITY;
    return;
  }

  const updateTimezoneDisplay = () => {
    if (!timezoneDisplay) return;
    if (!resolvedPlace) {
      timezoneDisplay.hidden = true;
      timezoneDisplay.textContent = '';
      return;
    }
    timezoneDisplay.textContent = formatBirthPlaceLabel(resolvedPlace, form.birthDate?.value);
    timezoneDisplay.hidden = false;
  };

  const selectPlace = (place) => {
    resolvedPlace = place;
    cityInput.value = formatPlaceLabel(place);
    updateTimezoneDisplay();
    suggestions.hidden = true;
    suggestions.innerHTML = '';
  };

  const renderSuggestions = (results, loading = false) => {
    if (loading) {
      suggestions.innerHTML = `<li><span class="bazi-city-suggestion bazi-city-suggestion--empty">${tt('calc.city.searching')}</span></li>`;
      suggestions.hidden = false;
      return;
    }
    if (!results.length) {
      suggestions.innerHTML = `<li><span class="bazi-city-suggestion bazi-city-suggestion--empty">${tt('calc.city.none')}</span></li>`;
      suggestions.hidden = false;
      return;
    }
    suggestions.innerHTML = results.map((place, index) => `
      <li>
        <button type="button" class="bazi-city-suggestion" data-index="${index}">
          <span class="bazi-city-name">${formatPlaceLabel(place)}</span>
          <span class="bazi-city-offset">${place.timezone.replace(/_/g, ' ')}</span>
        </button>
      </li>
    `).join('');
    suggestions._places = results;
    suggestions.hidden = false;
  };

  cityInput.addEventListener('input', () => {
    const query = cityInput.value.trim();
    if (resolvedPlace && cityInput.value === formatPlaceLabel(resolvedPlace)) return;

    resolvedPlace = null;
    updateTimezoneDisplay();
    clearTimeout(debounceTimer);

    if (query.length < 2) {
      suggestions.hidden = true;
      suggestions.innerHTML = '';
      return;
    }

    debounceTimer = setTimeout(async () => {
      const version = ++searchVersion;
      renderSuggestions([], true);
      try {
        const raw = await searchCities(query);
        if (version !== searchVersion) return;
        const results = raw.map(normalizePlace).filter((place) => place.timezone);
        renderSuggestions(results);
      } catch {
        if (version !== searchVersion) return;
        suggestions.innerHTML = `<li><span class="bazi-city-suggestion bazi-city-suggestion--empty">${tt('calc.city.failed')}</span></li>`;
        suggestions.hidden = false;
      }
    }, 250);
  });

  suggestions.addEventListener('click', (event) => {
    const button = event.target.closest('.bazi-city-suggestion');
    if (!button || button.dataset.index === undefined) return;
    const place = suggestions._places?.[Number(button.dataset.index)];
    if (place) selectPlace(place);
  });

  form.birthDate?.addEventListener('change', updateTimezoneDisplay);
  form.birthDate?.addEventListener('blur', () => {
    const parsed = parseBirthDate(form.birthDate.value);
    if (parsed) {
      form.birthDate.value = formatBirthDateISO(parsed);
      updateTimezoneDisplay();
    }
  });
  form.birthTime?.addEventListener('blur', () => {
    const parsed = parseBirthTime(form.birthTime.value);
    if (parsed) form.birthTime.value = formatBirthTime24(parsed);
  });

  form.getResolvedBirthPlace = () => resolvedPlace;
  form.resolveBirthCity = async () => {
    if (resolvedPlace) return resolvedPlace;
    const query = cityInput.value.trim();
    if (!query) return DEFAULT_CITY;
    const raw = await searchCities(query);
    const results = raw.map(normalizePlace).filter((place) => place.timezone);
    const match = pickBestCityMatch(results, query);
    if (match) selectPlace(match);
    return match;
  };
}

/**
 * @param {HTMLFormElement} form
 */
export async function readBirthInput(form) {
  const parsedDate = parseBirthDate(form.birthDate?.value ?? '');
  const parsedTime = parseBirthTime(form.birthTime?.value ?? '');

  if (!parsedDate) {
    throw new Error(tt('form.error.dateInvalid'));
  }
  if (!parsedTime) {
    throw new Error(tt('form.error.timeInvalid'));
  }

  form.birthDate.value = formatBirthDateISO(parsedDate);
  form.birthTime.value = formatBirthTime24(parsedTime);

  let birthPlace;
  try {
    birthPlace = await form.resolveBirthCity?.();
  } catch {
    throw new Error(tt('calc.error.cityLookup'));
  }
  if (!birthPlace?.timezone) {
    throw new Error(tt('calc.error.cityPickStep1'));
  }

  return {
    year: parsedDate.year,
    month: parsedDate.month,
    day: parsedDate.day,
    hour: parsedTime.hour,
    minute: parsedTime.minute,
    sourceTimeZone: birthPlace.timezone,
    birthPlace,
  };
}

import { formatElementAnimal } from './totem-chart.js';
import { PILLAR_KEYS } from './totem-canon.js';

const GUIDE_I18N_KEYS = {
  spirit: 'totem.guide.spirit',
  mental: 'totem.guide.mental',
  emotional: 'totem.guide.emotional',
  physical: 'totem.guide.physical',
};

export function renderProfileSummary(profile) {
  const rows = PILLAR_KEYS.map((pillar) => [
    tt(GUIDE_I18N_KEYS[pillar] || GUIDE_I18N_KEYS.spirit),
    formatElementAnimal(profile, pillar),
  ]);
  return `
    <dl class="connection-profile-animals">
      ${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}
    </dl>`;
}
