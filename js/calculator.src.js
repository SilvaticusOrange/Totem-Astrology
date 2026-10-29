import { calculateBaziChart } from '@openfate/bazi-engine';
import {
  formatBirthDateISO,
  formatBirthTime24,
  parseBirthDate,
  parseBirthTime,
} from './parse-birth.js';
import { renderTotemAnimalArt } from './totem-animal-art.js';
import { initTotemDetailModal } from './totem-detail-modal.js';

const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';
const NEPAL_IANA = 'Asia/Kathmandu';
const NEPAL_OFFSET_MINUTES = 345;
const NEPAL_LONGITUDE = 85.324;
const NEPAL_TIMEZONE = 5.75;

const GUIDE_I18N_KEYS = {
  year: 'totem.guide.spirit',
  month: 'totem.guide.mental',
  day: 'totem.guide.emotional',
  hour: 'totem.guide.physical',
};

function currentLocale() {
  return window.TotemI18n?.resolveInitialLocale?.() || 'en';
}

function tt(key, vars) {
  if (window.TotemI18n?.t) return window.TotemI18n.t(key, currentLocale(), vars);
  return key;
}

function guideLabel(pillarKey) {
  return tt(GUIDE_I18N_KEYS[pillarKey] || GUIDE_I18N_KEYS.year);
}

function animalName(englishName) {
  const key = `totem.animal.${String(englishName).toLowerCase()}`;
  const translated = tt(key);
  return translated === key ? englishName : translated;
}

function elementName(englishName) {
  const key = `totem.element.${String(englishName).toLowerCase()}`;
  const translated = tt(key);
  return translated === key ? englishName : translated;
}

const DEFAULT_CITY = {
  name: 'Kathmandu',
  admin1: 'Bagmati',
  country: 'Nepal',
  timezone: 'Asia/Kathmandu',
};

const STEM_INFO = {
  '甲': { name: 'Oak', element: 'Wood', polarity: 'yang', emoji: '🌳' },
  '乙': { name: 'Vine', element: 'Wood', polarity: 'yin', emoji: '🌿' },
  '丙': { name: 'Sun', element: 'Fire', polarity: 'yang', emoji: '☀️' },
  '丁': { name: 'Candle', element: 'Fire', polarity: 'yin', emoji: '🕯️' },
  '戊': { name: 'Mountain', element: 'Earth', polarity: 'yang', emoji: '🏔️' },
  '己': { name: 'Valley', element: 'Earth', polarity: 'yin', emoji: '🏞️' },
  '庚': { name: 'Sword', element: 'Metal', polarity: 'yang', emoji: '🗡️' },
  '辛': { name: 'Crystal', element: 'Metal', polarity: 'yin', emoji: '💎' },
  '壬': { name: 'Sea', element: 'Water', polarity: 'yang', emoji: '🌊' },
  '癸': { name: 'Rain', element: 'Water', polarity: 'yin', emoji: '🌧️' },
};

const PHOENIX_ICON = `<svg class="bazi-totem-icon bazi-totem-icon--phoenix" viewBox="0 0 36 28" aria-hidden="true"><path d="M2 16c3-3 6-2 9-5 1 4 4 6 7 8-4 1-7 0-10 3" fill="#4a9fd8"/><path d="M4 14c3-3 6-1 9-4 1 3 3 5 6 6-3 0-6-1-8 2" fill="#e85d4c"/><path d="M6 18c2-2 5-1 7-3 1 2 2 4 5 4-2 1-4 0-6 1" fill="#c9a962"/><path d="M13 11c-3-6 2-8 6-4-1 3-2 5-6 4" fill="#d4a84b"/><path d="M23 11c3-6-2-8-6-4 1 3 2 5 6 4" fill="#b8862d"/><ellipse cx="18" cy="14.5" rx="4" ry="6" fill="#f0b429"/><circle cx="18" cy="7.5" r="3.2" fill="#f5d67b"/><path d="M16 5.2 17 2.2 17.8 5.4" fill="#e85d4c"/><path d="M17.5 5 18.8 2.5 19.2 5.5" fill="#7b4bb8"/><path d="M19 5.3 20.5 3.2 20 6" fill="#4a9fd8"/><circle cx="19.1" cy="7.6" r="0.75" fill="#1a1510"/><path d="M20.4 8.1 23.2 8.6 20.5 9.3z" fill="#d45d3a"/></svg>`;

const TOTEM_ANIMALS = {
  '子': { name: 'Squirrel', emoji: '🐿️' },
  '丑': { name: 'Buffalo', emoji: '🐃' },
  '寅': { name: 'Tiger', emoji: '🐯' },
  '卯': { name: 'Cat', emoji: '🐱' },
  '辰': { name: 'Dragon', emoji: '🐉' },
  '巳': { name: 'Snake', emoji: '🐍' },
  '午': { name: 'Horse', emoji: '🐴' },
  '未': { name: 'Deer', emoji: '🦌' },
  '申': { name: 'Monkey', emoji: '🐵' },
  '酉': { name: 'Phoenix', icon: PHOENIX_ICON },
  '戌': { name: 'Wolf', emoji: '🐺' },
  '亥': { name: 'Bear', emoji: '🐻' },
};

function pad(value) {
  return String(value).padStart(2, '0');
}

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

function getTimezoneOffsetLabel(timeZone, date = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' });
    const part = formatter.formatToParts(date).find((p) => p.type === 'timeZoneName');
    return part?.value?.replace(/^UTC/, 'GMT') ?? '';
  } catch {
    return '';
  }
}

function formatBirthPlaceLabel(place, birthDate) {
  let date = new Date();
  if (birthDate) {
    const [year, month, day] = birthDate.split('-').map(Number);
    date = new Date(year, month - 1, day, 12, 0);
  }
  const offset = getTimezoneOffsetLabel(place.timezone, date);
  const zoneName = place.timezone.replace(/_/g, ' ');
  return offset ? `${formatPlaceLabel(place)} · ${offset} (${zoneName})` : `${formatPlaceLabel(place)} · ${zoneName}`;
}

function formatDateTime(parts) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)} ${pad(parts.hour)}:${pad(parts.minute)}`;
}

function normalizePlace(result) {
  return {
    name: result.name,
    admin1: result.admin1,
    country: result.country,
    timezone: result.timezone,
  };
}

async function searchCities(query) {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `${GEOCODING_API}?name=${encodeURIComponent(q)}&count=10&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('City search failed');
  const data = await response.json();
  return (data.results ?? []).map(normalizePlace).filter((place) => place.timezone);
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

function zonedTimeToUtcMs(year, month, day, hour, minute, timeZone) {
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

function utcMsToFixedOffsetParts(utcMs, offsetMinutes) {
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

function convertToNepalTime(year, month, day, hour, minute, sourceTimeZone, birthPlace) {
  const utcMs = zonedTimeToUtcMs(year, month, day, hour, minute, sourceTimeZone);
  const nepal = utcMsToFixedOffsetParts(utcMs, NEPAL_OFFSET_MINUTES);
  return {
    utcMs,
    nepal,
    shifted: sourceTimeZone !== NEPAL_IANA,
    sourceTimeZone,
    birthPlace,
  };
}

function computeChart({ year, month, day, hour, minute, sourceTimeZone, birthPlace }) {
  const conversion = convertToNepalTime(year, month, day, hour, minute, sourceTimeZone, birthPlace);
  const { nepal } = conversion;
  const chart = calculateBaziChart({
    year: nepal.year, month: nepal.month, day: nepal.day,
    hour: nepal.hour, minute: nepal.minute,
    gender: 'female',
    longitude: NEPAL_LONGITUDE, timezone: NEPAL_TIMEZONE,
    enableTrueSolarTime: true, dayBoundaryMode: 'ZI_HOUR_23',
  });
  return { chart, conversion, input: { year, month, day, hour, minute } };
}

function formatPolarityLabel(polarity) {
  return polarity === 'yang' ? tt('totem.polarity.yang') : tt('totem.polarity.yin');
}

function renderPolaritySign(polarity) {
  const sign = polarity === 'yang' ? '+' : '-';
  return `<span class="bazi-polarity-sign">(${sign})</span>`;
}

function renderTotemVisual(info) {
  if (info.icon) return info.icon;
  if (info.emoji) return `<span class="bazi-totem-emoji" aria-hidden="true">${info.emoji}</span>`;
  return '';
}

function renderTotemPart(info, name) {
  return `<span class="bazi-totem-part">${renderTotemVisual(info)} ${name}</span>`;
}

function renderGuideLineHTML(guideName, pillar) {
  const stemInfo = STEM_INFO[pillar.stem];
  const animalInfo = TOTEM_ANIMALS[pillar.branch];
  if (!stemInfo || !animalInfo) {
    return `<div class="bazi-pillar-text">
      <p class="bazi-pillar-line bazi-pillar-line--guide">${guideName}</p>
      <p class="bazi-pillar-line bazi-pillar-line--empty">—</p>
    </div>`;
  }
  const elementLabel = elementName(stemInfo.element);
  const animalLabel = `${elementLabel} ${animalName(animalInfo.name)}`;
  return `<div class="bazi-pillar-text">
    <p class="bazi-pillar-line bazi-pillar-line--guide">${guideName}</p>
    <p class="bazi-pillar-line bazi-pillar-line--polarity">
      ${renderPolaritySign(stemInfo.polarity)}${formatPolarityLabel(stemInfo.polarity)} <span class="bazi-element-name">${elementLabel}</span>
    </p>
    <p class="bazi-pillar-line bazi-pillar-line--totems">
      ${renderTotemPart(stemInfo, stemInfo.name)}
      ${renderTotemPart(animalInfo, animalLabel)}
    </p>
  </div>`;
}

function getPillarDetailMeta(pillar) {
  const stemInfo = STEM_INFO[pillar.stem];
  const animalInfo = TOTEM_ANIMALS[pillar.branch];
  if (!stemInfo || !animalInfo) return null;
  return {
    animal: animalInfo.name,
    element: stemInfo.element,
    polarity: stemInfo.polarity,
    stemName: stemInfo.name,
  };
}

function renderPillarCard(guideName, pillar) {
  const guideForAria = guideName.replace(/\u00a0/g, ' ');
  if (!pillar) {
    return `<div class="bazi-pillar bazi-pillar--empty">
      <div class="bazi-pillar-text">
        <p class="bazi-pillar-line bazi-pillar-line--guide">${guideName}</p>
        <p class="bazi-pillar-line bazi-pillar-line--empty">—</p>
      </div>
    </div>`;
  }
  const stemInfo = STEM_INFO[pillar.stem];
  const animalInfo = TOTEM_ANIMALS[pillar.branch];
  const meta = getPillarDetailMeta(pillar);
  const art = (stemInfo && animalInfo)
    ? renderTotemAnimalArt(animalInfo.name, stemInfo.element)
    : '';
  const polarityLabel = stemInfo ? formatPolarityLabel(stemInfo.polarity) : '';
  const elementLabel = meta ? elementName(meta.element) : '';
  const animalLabel = meta ? animalName(meta.animal) : '';
  const ariaLabel = meta
    ? tt('calc.aria.viewDetails', {
      polarity: polarityLabel,
      element: elementLabel,
      animal: animalLabel,
      guide: guideForAria,
    })
    : guideForAria;
  const dataAttrs = meta
    ? ` data-animal="${meta.animal}" data-element="${meta.element}" data-polarity="${meta.polarity}" data-stem="${meta.stemName}" data-guide="${guideForAria}"`
    : '';
  return `<button type="button" class="bazi-pillar bazi-pillar--interactive"${dataAttrs} aria-label="${ariaLabel}">
    ${art}
    ${renderGuideLineHTML(guideName, pillar)}
    <span class="bazi-pillar-cta">${tt('calc.pillar.clickDetails')}</span>
  </button>`;
}

function showError(message) {
  const el = document.getElementById('bazi-form-error');
  if (!el) return;
  el.textContent = message;
  el.classList.add('visible');
  el.hidden = false;
}

function clearError() {
  const el = document.getElementById('bazi-form-error');
  if (!el) return;
  el.classList.remove('visible');
  el.hidden = true;
}

function pickBestCityMatch(results, query) {
  if (!results.length) return null;
  const q = query.trim().toLowerCase();
  const exact = results.find((place) => placeMatchesQuery(place, query));
  if (exact) return exact;
  const starts = results.find((place) => place.name.toLowerCase().startsWith(q));
  if (starts) return starts;
  if (results.length === 1) return results[0];
  return null;
}

function initCityLookup(form) {
  const cityInput = form.querySelector('#birth-city');
  const suggestions = form.querySelector('#birth-city-suggestions');
  const timezoneDisplay = form.querySelector('#birth-city-timezone');
  let resolvedPlace = null;
  let debounceTimer = null;
  let searchVersion = 0;

  const updateTimezoneDisplay = () => {
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
    clearError();
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

    renderSuggestions([], true);
    debounceTimer = setTimeout(async () => {
      const version = ++searchVersion;
      try {
        const results = await searchCities(query);
        if (version !== searchVersion) return;
        renderSuggestions(results);
      } catch (error) {
        if (version !== searchVersion) return;
        suggestions.innerHTML = `<li><span class="bazi-city-suggestion bazi-city-suggestion--empty">${tt('calc.city.unavailable')}</span></li>`;
        suggestions.hidden = false;
        console.error(error);
      }
    }, 200);
  });

  cityInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      suggestions.hidden = true;
      return;
    }
    if (event.key === 'Enter' && suggestions._places?.length) {
      event.preventDefault();
      selectPlace(suggestions._places[0]);
    }
  });

  suggestions.addEventListener('mousedown', (event) => {
    const button = event.target.closest('.bazi-city-suggestion[data-index]');
    if (!button || !suggestions._places) return;
    event.preventDefault();
    selectPlace(suggestions._places[Number(button.dataset.index)]);
  });

  cityInput.addEventListener('blur', () => {
    setTimeout(() => { suggestions.hidden = true; }, 200);
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
    const results = await searchCities(query);
    const match = pickBestCityMatch(results, query);
    if (match) selectPlace(match);
    return match;
  };
}

function renderResultsHTML({ chart, conversion, inputLabel, nepalLabel, sourceLabel }) {
  return `
        <div class="bazi-result-block bazi-summary">
          <span class="section-label">${tt('calc.results.conversion')}</span>
          <h3>${tt('calc.results.timeLocation')}</h3>
          <dl class="bazi-detail-list">
            <div><dt>${tt('calc.results.birthTimeEntered')}</dt><dd>${inputLabel}</dd></div>
            <div><dt>${tt('form.birthCity')}</dt><dd>${sourceLabel}</dd></div>
            <div><dt>${tt('calc.results.nepalTime')}</dt><dd>${nepalLabel}${conversion.shifted ? '' : ` <span class="bazi-tag">${tt('calc.results.noChange')}</span>`}</dd></div>
            ${chart.solarTimeInfo ? `<div><dt>${tt('calc.results.trueSolarTime')}</dt><dd>${chart.solarTimeInfo.trueSolarTime} on ${chart.solarTimeInfo.solarDate}</dd></div>` : ''}
          </dl>
          <p class="bazi-footnote">${tt('calc.results.footnote', { lon: NEPAL_LONGITUDE })}</p>
        </div>
        <div class="bazi-result-block bazi-chart">
          <span class="section-label">${tt('calc.results.sectionLabel')}</span>
          <h3>${tt('calc.results.heading')}</h3>
          <p class="bazi-chart-hint"><strong>${tt('calc.results.chartHintLead')}</strong> ${tt('calc.results.chartHint')}</p>
          <div class="bazi-pillars-grid">
            ${renderPillarCard(guideLabel('year'), chart.pillars.year)}
            ${renderPillarCard(guideLabel('month'), chart.pillars.month)}
            ${renderPillarCard(guideLabel('day'), chart.pillars.day)}
            ${renderPillarCard(guideLabel('hour'), chart.pillars.hour)}
          </div>
        </div>`;
}

function initBaziCalculator(root) {
  const form = root.querySelector('#bazi-form');
  const results = root.querySelector('#bazi-results');
  let lastResultPayload = null;

  initCityLookup(form);
  initTotemDetailModal(results);

  const paintResults = (payload) => {
    lastResultPayload = payload;
    results.hidden = false;
    results.innerHTML = renderResultsHTML(payload);
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearError();

    const parsedDate = parseBirthDate(form.birthDate.value);
    const parsedTime = parseBirthTime(form.birthTime?.value ?? '');

    if (!parsedDate) {
      showError(tt('form.error.dateInvalid'));
      return;
    }
    if (!parsedTime) {
      showError(tt('form.error.timeInvalid'));
      return;
    }

    form.birthDate.value = formatBirthDateISO(parsedDate);
    form.birthTime.value = formatBirthTime24(parsedTime);
    const { year, month, day } = parsedDate;
    const { hour, minute } = parsedTime;

    let birthPlace;
    try {
      birthPlace = await form.resolveBirthCity?.();
    } catch {
      showError(tt('calc.error.cityLookup'));
      return;
    }
    if (!birthPlace?.timezone) {
      showError(tt('calc.error.cityPick'));
      return;
    }

    try {
      const { chart, conversion, input } = computeChart({
        year, month, day, hour, minute,
        sourceTimeZone: birthPlace.timezone,
        birthPlace,
      });

      const inputLabel = formatDateTime(input);
      const nepalLabel = formatDateTime(conversion.nepal);
      const sourceLabel = formatBirthPlaceLabel(birthPlace, form.birthDate.value);

      paintResults({ chart, conversion, inputLabel, nepalLabel, sourceLabel });
      results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      showError(tt('calc.error.calculate'));
      console.error(error);
    }
  });

  window.addEventListener('totem:localechange', () => {
    if (lastResultPayload) paintResults(lastResultPayload);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('[data-bazi-calculator]');
  if (root) initBaziCalculator(root);
  window.__baziCalculatorReady = true;
});
