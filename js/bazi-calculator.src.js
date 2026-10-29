import { calculateBaziChart } from '@openfate/bazi-engine';
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
  '子': 'Rat',
  '丑': 'Ox',
  '寅': 'Tiger',
  '卯': 'Rabbit',
  '辰': 'Dragon',
  '巳': 'Snake',
  '午': 'Horse',
  '未': 'Goat',
  '申': 'Monkey',
  '酉': 'Rooster',
  '戌': 'Dog',
  '亥': 'Pig',
};

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatDateTime(parts) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)} ${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function convertToNepalTime(year, month, day, hour, minute, sourceTimeZone, birthPlace) {
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

export function computeChart({ year, month, day, hour, minute, sourceTimeZone, birthPlace }) {
  const conversion = convertToNepalTime(year, month, day, hour, minute, sourceTimeZone, birthPlace);
  const { nepal } = conversion;

  const chart = calculateBaziChart({
    year: nepal.year,
    month: nepal.month,
    day: nepal.day,
    hour: nepal.hour,
    minute: nepal.minute,
    gender: 'female',
    longitude: NEPAL_LONGITUDE,
    timezone: NEPAL_TIMEZONE,
    enableTrueSolarTime: true,
    dayBoundaryMode: 'ZI_HOUR_23',
  });

  return { chart, conversion, input: { year, month, day, hour, minute } };
}

function labelStem(stem) {
  const info = STEM_LABELS[stem];
  if (!info) return stem;
  return `${stem} ${info.name}${info.polarity}${info.element}`;
}

function labelBranch(branch) {
  const animal = BRANCH_LABELS[branch];
  return animal ? `${branch} ${animal}` : branch;
}

function renderPillarCell(pillar) {
  if (!pillar) {
    return '<td class="bazi-cell bazi-cell--empty">—</td>';
  }

  return `
    <td class="bazi-cell">
      <span class="bazi-hanzi">${pillar.stem}</span>
      <span class="bazi-label">${labelStem(pillar.stem)}</span>
      <span class="bazi-hanzi">${pillar.branch}</span>
      <span class="bazi-label">${labelBranch(pillar.branch)}</span>
    </td>
  `;
}

function readBirthTime(form) {
  const timeInput = form.querySelector('#birth-time');
  if (!timeInput?.value) {
    return { hour: Number.NaN, minute: Number.NaN };
  }
  const match = timeInput.value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return { hour: Number.NaN, minute: Number.NaN };
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return { hour: Number.NaN, minute: Number.NaN };
  return { hour, minute };
}

export function initBaziCalculator(root) {
  const form = root.querySelector('#bazi-form');
  const results = root.querySelector('#bazi-results');
  const timezoneInput = form.querySelector('#birth-timezone');

  initCityLookup(form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const [year, month, day] = form.birthDate.value.split('-').map(Number);
    const { hour, minute } = readBirthTime(form);

    if (!year || Number.isNaN(hour) || Number.isNaN(minute)) {
      return;
    }

    let birthPlace = form.getResolvedBirthPlace?.();
    if (!birthPlace) {
      birthPlace = await form.resolveBirthCity?.();
    }
    if (!birthPlace || !timezoneInput.value) {
      return;
    }

    const { chart, conversion, input } = computeChart({
      year,
      month,
      day,
      hour,
      minute,
      sourceTimeZone: timezoneInput.value,
      birthPlace,
    });

    const inputLabel = formatDateTime({
      year: input.year,
      month: input.month,
      day: input.day,
      hour: input.hour,
      minute: input.minute,
    });
    const nepalLabel = formatDateTime(conversion.nepal);
    const sourceLabel = formatBirthPlaceLabel(birthPlace, form.birthDate.value);

    results.hidden = false;
    results.innerHTML = `
      <div class="bazi-summary card">
        <h3>Time Conversion</h3>
        <p><strong>Birth time entered:</strong> ${inputLabel}</p>
        <p><strong>Birth city:</strong> ${sourceLabel}</p>
        <p><strong>Converted to Nepal Time (NPT):</strong> ${nepalLabel}${conversion.shifted ? '' : ' — no change needed'}</p>
        ${chart.solarTimeInfo ? `<p><strong>True solar time (Kathmandu):</strong> ${chart.solarTimeInfo.trueSolarTime} on ${chart.solarTimeInfo.solarDate}</p>` : ''}
        <p class="form-note">The chart is calculated from Nepal local time using Kathmandu longitude (${NEPAL_LONGITUDE}°E) and UTC+5:45.</p>
      </div>

      <div class="bazi-chart card">
        <h3>Four Pillars</h3>
        <div class="bazi-table-wrap">
          <table class="bazi-table">
            <thead>
              <tr>
                <th>Hour</th>
                <th>Day</th>
                <th>Month</th>
                <th>Year</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                ${renderPillarCell(chart.pillars.hour)}
                ${renderPillarCell(chart.pillars.day)}
                ${renderPillarCell(chart.pillars.month)}
                ${renderPillarCell(chart.pillars.year)}
              </tr>
            </tbody>
          </table>
        </div>
        <p><strong>Day Master:</strong> ${labelStem(chart.dayMaster.char)}</p>
      </div>
    `;

    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('[data-bazi-calculator]');
  if (root) initBaziCalculator(root);
});
