export const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';
export const NEPAL_IANA = 'Asia/Kathmandu';
export const NEPAL_OFFSET_MINUTES = 345;

export function formatPlaceLabel(place) {
  const parts = [place.name];
  if (place.admin1 && place.admin1 !== place.name) parts.push(place.admin1);
  parts.push(place.country);
  return parts.join(', ');
}

export function getTimezoneOffsetLabel(timeZone, date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    });
    const part = formatter.formatToParts(date).find((p) => p.type === 'timeZoneName');
    return part?.value?.replace(/^UTC/, 'GMT') ?? '';
  } catch {
    return '';
  }
}

export function formatBirthPlaceLabel(place, birthDate) {
  let date = new Date();
  if (birthDate) {
    const [year, month, day] = birthDate.split('-').map(Number);
    date = new Date(year, month - 1, day, 12, 0);
  }
  const offset = getTimezoneOffsetLabel(place.timezone, date);
  const zoneName = place.timezone.replace(/_/g, ' ');
  return offset ? `${formatPlaceLabel(place)} · ${offset} (${zoneName})` : `${formatPlaceLabel(place)} · ${zoneName}`;
}

export async function searchCities(query) {
  if (!query || query.trim().length < 2) return [];
  const url = `${GEOCODING_API}?name=${encodeURIComponent(query.trim())}&count=6&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('City search failed');
  const data = await response.json();
  return data.results ?? [];
}

function partsFromFormatter(formatter, date) {
  const values = {};
  formatter.formatToParts(date).forEach((part) => {
    if (part.type !== 'literal') values[part.type] = part.value;
  });
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
}

export function zonedTimeToUtcMs(year, month, day, hour, minute, timeZone) {
  const targetMs = Date.UTC(year, month - 1, day, hour, minute);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  let utcMs = targetMs;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = partsFromFormatter(formatter, new Date(utcMs));
    const actualMs = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
    const diff = targetMs - actualMs;
    if (diff === 0) break;
    utcMs += diff;
  }
  return utcMs;
}

export function utcMsToFixedOffsetParts(utcMs, offsetMinutes) {
  const localMs = utcMs + offsetMinutes * 60 * 1000;
  const date = new Date(localMs);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
  };
}

export function initCityLookup(form, { onClearError } = {}) {
  const cityInput = form.querySelector('#birth-city');
  const suggestions = form.querySelector('#birth-city-suggestions');
  const timezoneDisplay = form.querySelector('#birth-city-timezone');
  const timezoneInput = form.querySelector('#birth-timezone');
  let resolvedPlace = null;
  let debounceTimer = null;
  let searchVersion = 0;

  const updateTimezoneDisplay = () => {
    if (!resolvedPlace) return;
    timezoneDisplay.textContent = formatBirthPlaceLabel(resolvedPlace, form.birthDate?.value);
    timezoneDisplay.hidden = false;
  };

  const clearResolved = () => {
    resolvedPlace = null;
    timezoneInput.value = '';
    timezoneDisplay.hidden = true;
    timezoneDisplay.textContent = '';
  };

  const selectPlace = (place) => {
    resolvedPlace = place;
    cityInput.value = formatPlaceLabel(place);
    timezoneInput.value = place.timezone;
    updateTimezoneDisplay();
    suggestions.hidden = true;
    suggestions.innerHTML = '';
    onClearError?.();
  };

  cityInput.addEventListener('input', () => {
    const query = cityInput.value.trim();
    if (resolvedPlace && query === formatPlaceLabel(resolvedPlace)) return;

    clearResolved();
    clearTimeout(debounceTimer);
    if (query.length < 2) {
      suggestions.hidden = true;
      suggestions.innerHTML = '';
      return;
    }
    debounceTimer = setTimeout(async () => {
      const version = ++searchVersion;
      try {
        const results = await searchCities(query);
        if (version !== searchVersion) return;
        if (!results.length) {
          suggestions.innerHTML = '<li><span class="bazi-city-suggestion bazi-city-suggestion--empty">No cities found — try another spelling</span></li>';
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
      } catch (error) {
        if (version !== searchVersion) return;
        suggestions.innerHTML = '<li><span class="bazi-city-suggestion bazi-city-suggestion--empty">City lookup unavailable — check your connection</span></li>';
        suggestions.hidden = false;
        console.error(error);
      }
    }, 300);
  });

  suggestions.addEventListener('mousedown', (event) => {
    const button = event.target.closest('.bazi-city-suggestion[data-index]');
    if (!button || !suggestions._places) return;
    event.preventDefault();
    selectPlace(suggestions._places[Number(button.dataset.index)]);
  });

  cityInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') suggestions.hidden = true;
  });

  cityInput.addEventListener('blur', () => {
    setTimeout(() => { suggestions.hidden = true; }, 200);
  });

  form.birthDate?.addEventListener('change', updateTimezoneDisplay);

  form.getResolvedBirthPlace = () => resolvedPlace;
  form.resolveBirthCity = async () => {
    if (resolvedPlace) return resolvedPlace;
    const query = cityInput.value.trim();
    if (!query) return null;
    const results = await searchCities(query);
    if (!results.length) return null;
    const exact = results.find((place) => formatPlaceLabel(place).toLowerCase() === query.toLowerCase());
    const match = exact ?? (results.length === 1 ? results[0] : null);
    if (match) selectPlace(match);
    return match;
  };

  selectPlace({
    name: 'Kathmandu',
    country: 'Nepal',
    admin1: 'Bagmati Province',
    timezone: NEPAL_IANA,
  });
}
