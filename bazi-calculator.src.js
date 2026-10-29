import { calculateBaziChart } from '@openfate/bazi-engine';

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

const TIMEZONES = [
  { id: 'npt', label: 'Nepal Time (NPT, UTC+5:45)', offset: 5.75 },
  { id: 'ist', label: 'India (IST, UTC+5:30)', offset: 5.5 },
  { id: 'btt', label: 'Bhutan (BTT, UTC+6)', offset: 6 },
  { id: 'cst-cn', label: 'China (CST, UTC+8)', offset: 8 },
  { id: 'jst', label: 'Japan (JST, UTC+9)', offset: 9 },
  { id: 'pst', label: 'US Pacific (UTC-8)', offset: -8 },
  { id: 'est', label: 'US Eastern (UTC-5)', offset: -5 },
  { id: 'gmt', label: 'UK (GMT, UTC+0)', offset: 0 },
  { id: 'cet', label: 'Central Europe (UTC+1)', offset: 1 },
  { id: 'utc', label: 'UTC', offset: 0 },
];

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatDateTime(parts) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)} ${pad(parts.hour)}:${pad(parts.minute)}`;
}

function civilToUtcMs(year, month, day, hour, minute, timezoneOffset) {
  return Date.UTC(year, month - 1, day, hour, minute) - timezoneOffset * 3600000;
}

function utcMsToCivil(ms, timezoneOffset) {
  const adjusted = ms + timezoneOffset * 3600000;
  const date = new Date(adjusted);

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
  };
}

export function convertToNepalTime(year, month, day, hour, minute, sourceTimezoneOffset) {
  const utcMs = civilToUtcMs(year, month, day, hour, minute, sourceTimezoneOffset);
  const nepal = utcMsToCivil(utcMs, NEPAL_TIMEZONE);

  return {
    utcMs,
    nepal,
    shifted: sourceTimezoneOffset !== NEPAL_TIMEZONE,
  };
}

export function computeChart({ year, month, day, hour, minute, gender, sourceTimezoneOffset }) {
  const conversion = convertToNepalTime(year, month, day, hour, minute, sourceTimezoneOffset);
  const { nepal } = conversion;

  const chart = calculateBaziChart({
    year: nepal.year,
    month: nepal.month,
    day: nepal.day,
    hour: nepal.hour,
    minute: nepal.minute,
    gender,
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

function renderLuckCycles(cycles) {
  return cycles.slice(0, 10).map((cycle) => `
    <div class="bazi-luck-item">
      <span class="bazi-luck-age">${cycle.startAge} – ${cycle.startAge + 9}</span>
      <span class="bazi-hanzi">${cycle.stem}${cycle.branch}</span>
      <span class="bazi-label">${labelStem(cycle.stem).split(' ').slice(1).join(' ')} · ${labelBranch(cycle.branch).split(' ').slice(1).join(' ')}</span>
    </div>
  `).join('');
}

export function initBaziCalculator(root) {
  const form = root.querySelector('#bazi-form');
  const results = root.querySelector('#bazi-results');
  const timezoneSelect = root.querySelector('#birth-timezone');

  TIMEZONES.forEach((zone) => {
    const option = document.createElement('option');
    option.value = String(zone.offset);
    option.textContent = zone.label;
    if (zone.id === 'npt') option.selected = true;
    timezoneSelect.appendChild(option);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const gender = form.gender.value;
    const [year, month, day] = form.birthDate.value.split('-').map(Number);
    const [hour, minute] = form.birthTime.value.split(':').map(Number);
    const sourceTimezoneOffset = Number(form.birthTimezone.value);

    if (!year || Number.isNaN(hour)) {
      return;
    }

    const { chart, conversion, input } = computeChart({
      year,
      month,
      day,
      hour,
      minute: minute || 0,
      gender,
      sourceTimezoneOffset,
    });

    const sourceZone = TIMEZONES.find((zone) => zone.offset === sourceTimezoneOffset);
    const inputLabel = formatDateTime({
      year: input.year,
      month: input.month,
      day: input.day,
      hour: input.hour,
      minute: input.minute,
    });
    const nepalLabel = formatDateTime(conversion.nepal);

    results.hidden = false;
    results.innerHTML = `
      <div class="bazi-summary card">
        <h3>Time Conversion</h3>
        <p><strong>Birth time entered:</strong> ${inputLabel} (${sourceZone?.label ?? 'custom timezone'})</p>
        <p><strong>Nepal Time (NPT):</strong> ${nepalLabel}${conversion.shifted ? '' : ' — already in Nepal timezone'}</p>
        ${chart.solarTimeInfo ? `<p><strong>True solar time (Kathmandu):</strong> ${chart.solarTimeInfo.trueSolarTime} on ${chart.solarTimeInfo.solarDate}</p>` : ''}
        <p class="form-note">Charts are calculated from Nepal local time using Kathmandu longitude (${NEPAL_LONGITUDE}°E) and UTC+5:45.</p>
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

      <div class="bazi-luck card">
        <h3>Major Luck Cycles (10-year)</h3>
        <div class="bazi-luck-grid">
          ${renderLuckCycles(chart.daYun.cycles)}
        </div>
      </div>
    `;

    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('[data-bazi-calculator]');
  if (root) initBaziCalculator(root);
});
