import { calculateBaziChart } from '@openfate/bazi-engine';
import { CHART_PILLAR_KEYS } from './totem-canon.js';
import {
  NEPAL_IANA,
  NEPAL_OFFSET_MINUTES,
  utcMsToFixedOffsetParts,
  zonedTimeToUtcMs,
} from './timezones.js';

const NEPAL_LONGITUDE = 85.324;
const NEPAL_TIMEZONE = 5.75;

const TOTEM_ANIMALS = {
  '子': 'Squirrel',
  '丑': 'Buffalo',
  '寅': 'Tiger',
  '卯': 'Cat',
  '辰': 'Dragon',
  '巳': 'Snake',
  '午': 'Horse',
  '未': 'Deer',
  '申': 'Monkey',
  '酉': 'Phoenix',
  '戌': 'Wolf',
  '亥': 'Bear',
};

const STEM_ELEMENTS = {
  '甲': 'Wood',
  '乙': 'Wood',
  '丙': 'Fire',
  '丁': 'Fire',
  '戊': 'Earth',
  '己': 'Earth',
  '庚': 'Metal',
  '辛': 'Metal',
  '壬': 'Water',
  '癸': 'Water',
};

/**
 * @typedef {import('./totem-match.js').TotemProfile} TotemProfile
 */

/**
 * @typedef {Object} BirthInput
 * @property {number} year
 * @property {number} month
 * @property {number} day
 * @property {number} hour
 * @property {number} minute
 * @property {string} sourceTimeZone IANA timezone for birth place
 */

function convertToNepalTime(year, month, day, hour, minute, sourceTimeZone) {
  const utcMs = zonedTimeToUtcMs(year, month, day, hour, minute, sourceTimeZone);
  const nepal = utcMsToFixedOffsetParts(utcMs, NEPAL_OFFSET_MINUTES);
  return { utcMs, nepal, shifted: sourceTimeZone !== NEPAL_IANA, sourceTimeZone };
}

/**
 * Compute a BaZi chart using Totem Astrology rules (Nepal time, true solar time).
 * @param {BirthInput} input
 */
export function computeTotemChart(input) {
  const conversion = convertToNepalTime(
    input.year,
    input.month,
    input.day,
    input.hour,
    input.minute,
    input.sourceTimeZone,
  );
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

  return { chart, conversion, input };
}

/**
 * Extract the four totem animals from a BaZi chart.
 * @param {{ pillars: Record<string, { branch: string }> }} chart
 * @returns {TotemProfile}
 */
export function profileFromChart(chart) {
  /** @type {TotemProfile} */
  const profile = {
    spirit: '',
    mental: '',
    emotional: '',
    physical: '',
    elements: {
      spirit: '',
      mental: '',
      emotional: '',
      physical: '',
    },
  };

  for (const [chartKey, profileKey] of Object.entries(CHART_PILLAR_KEYS)) {
    const pillar = chart.pillars?.[chartKey];
    const branch = pillar?.branch;
    const animal = branch ? TOTEM_ANIMALS[branch] : undefined;
    if (!animal) {
      throw new Error(`Missing or unknown branch for ${chartKey} pillar`);
    }
    profile[profileKey] = animal;
    profile.elements[profileKey] = pillar?.stem ? (STEM_ELEMENTS[pillar.stem] ?? '') : '';
  }

  return profile;
}

/**
 * @param {TotemProfile} profile
 * @param {'spirit' | 'mental' | 'emotional' | 'physical'} pillar
 */
export function formatElementAnimal(profile, pillar) {
  const animal = profile[pillar];
  const element = profile.elements?.[pillar];
  return element ? `${element} ${animal}` : animal;
}

/**
 * Birth data → totem profile in one step.
 * @param {BirthInput} input
 * @returns {{ profile: TotemProfile, chart: object, conversion: object }}
 */
export function profileFromBirth(input) {
  const { chart, conversion } = computeTotemChart(input);
  return {
    profile: profileFromChart(chart),
    chart,
    conversion,
  };
}

export { TOTEM_ANIMALS };
