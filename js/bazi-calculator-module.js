import { calculateBaziChart } from 'https://esm.sh/@openfate/bazi-engine@1.0.0';
import {
  initCityLookup,
  formatBirthPlaceLabel,
  zonedTimeToUtcMs,
  utcMsToFixedOffsetParts,
  NEPAL_IANA,
  NEPAL_OFFSET_MINUTES,
} from './timezones.js';

const NEPAL_LONGITUDE = 85.324;
const NEPAL_TIMEZONE = 5.75;

const STEM_LABELS = {
  '甲': { name: 'Jia', polarity: '+', element: 'Wood' },
  '乙': { name: 'Yi', polarity: '-', element: 'Wood' },
  '丙': { name: 'Bing', polarity: '+', element: 'Fire' },
  '丁': { name: 'Ding', polarity: '-', element: 'Fire' },
  '戊': { name: 'Wu', polarity: '+', element: 'Earth' },
  '己': { name: 'Ji', polarity: '-', element: 'Earth' },
  '庚': { name: 'Geng', polarity: '+', element: 'Metal' },
  '辛': { name: 'Xin', polarity: '-', element: 'Metal' },
  '壬': { name: 'Ren', polarity: '+', element: 'Water' },
  '癸': { name: 'Gui', polarity: '-', element: 'Water' },
};

const BRANCH_LABELS = {
  '子': 'Rat', '丑': 'Ox', '寅': 'Tiger', '卯': 'Rabbit',
  '辰': 'Dragon', '巳': 'Snake', '午': 'Horse', '未': 'Goat',
  '申': 'Monkey', '酉': 'Rooster', '戌': 'Dog', '亥': 'Pig',
};

function pad(value) {
  return String(value).padStart(2, '0');
}

function parseBirthTime(value) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

function formatDateTime(parts) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)} ${pad(parts.hour)}:${pad(parts.minute)}`;
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

function labelStem(stem) {
  const info = STEM_LABELS[stem];
  return info ? `${stem} ${info.name}${info.polarity}${info.element}` : stem;
}

function labelBranch(branch) {
  const animal = BRANCH_LABELS[branch];
  return animal ? `${branch} ${animal}` : branch;
}

function renderPillarCard(name, pillar) {
  if (!pillar) {
    return `<div class="bazi-pillar bazi-pillar--empty">
      <span class="bazi-pillar-name">${name}</span>
      <span class="bazi-pillar-empty">—</span>
    </div>`;
  }
  return `<div class="bazi-pillar">
    <span class="bazi-pillar-name">${name}</span>
    <div class="bazi-pillar-stem">
      <span class="bazi-hanzi">${pillar.stem}</span>
      <span class="bazi-label">${labelStem(pillar.stem)}</span>
    </div>
    <div class="bazi-pillar-branch">
      <span class="bazi-hanzi">${pillar.branch}</span>
      <span class="bazi-label">${labelBranch(pillar.branch)}</span>
    </div>
  </div>`;
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

function initBaziCalculator(root) {
  const form = root.querySelector('#bazi-form');
  const results = root.querySelector('#bazi-results');
  const timezoneInput = form.querySelector('#birth-timezone');

  initCityLookup(form, { onClearError: clearError });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearError();

    const [year, month, day] = form.birthDate.value.split('-').map(Number);
    const birthTime = form.birthTime?.value ?? form.querySelector('#birth-time')?.value;

    if (!form.birthDate.value) {
      showError('Please enter your birth date.');
      return;
    }
    if (!birthTime?.trim()) {
      showError('Please enter your birth time.');
      return;
    }
    const parsedTime = parseBirthTime(birthTime);
    if (!parsedTime) {
      showError('Please enter birth time in 24-hour format, e.g. 14:30.');
      return;
    }
    const { hour, minute } = parsedTime;

    let birthPlace = form.getResolvedBirthPlace?.();
    if (!birthPlace) {
      try {
        birthPlace = await form.resolveBirthCity?.();
      } catch (error) {
        showError('Could not look up that city. Check your connection and try again.');
        return;
      }
    }
    if (!birthPlace || !timezoneInput.value) {
      showError('Please select your birth city from the suggestions.');
      return;
    }

    try {
      const { chart, conversion, input } = computeChart({
        year, month, day, hour, minute,
        sourceTimeZone: timezoneInput.value,
        birthPlace,
      });

      const inputLabel = formatDateTime(input);
      const nepalLabel = formatDateTime(conversion.nepal);
      const sourceLabel = formatBirthPlaceLabel(birthPlace, form.birthDate.value);

      results.hidden = false;
      results.innerHTML = `
        <div class="bazi-result-block bazi-summary">
          <span class="section-label">Conversion</span>
          <h3>Time &amp; Location</h3>
          <dl class="bazi-detail-list">
            <div><dt>Birth time entered</dt><dd>${inputLabel}</dd></div>
            <div><dt>Birth city</dt><dd>${sourceLabel}</dd></div>
            <div><dt>Nepal Time (NPT)</dt><dd>${nepalLabel}${conversion.shifted ? '' : ' <span class="bazi-tag">no change</span>'}</dd></div>
            ${chart.solarTimeInfo ? `<div><dt>True solar time</dt><dd>${chart.solarTimeInfo.trueSolarTime} on ${chart.solarTimeInfo.solarDate}</dd></div>` : ''}
          </dl>
          <p class="bazi-footnote">Calculated from Nepal local time · Kathmandu ${NEPAL_LONGITUDE}°E · UTC+5:45</p>
        </div>
        <div class="bazi-result-block bazi-chart">
          <span class="section-label">BaZi</span>
          <h3>Four Pillars</h3>
          <div class="bazi-pillars-grid">
            ${renderPillarCard('Hour', chart.pillars.hour)}
            ${renderPillarCard('Day', chart.pillars.day)}
            ${renderPillarCard('Month', chart.pillars.month)}
            ${renderPillarCard('Year', chart.pillars.year)}
          </div>
          <div class="bazi-day-master">
            <span class="bazi-day-master-label">Day Master</span>
            <span class="bazi-day-master-value">${labelStem(chart.dayMaster.char)}</span>
          </div>
        </div>`;

      results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      showError('Could not calculate chart. Check your entries and try again.');
      console.error(error);
    }
  });
}

const root = document.querySelector('[data-bazi-calculator]');
if (root) initBaziCalculator(root);
