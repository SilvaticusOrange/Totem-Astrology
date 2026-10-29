import { profileFromBirth } from '../../js/totem-chart.js';
import { DEFAULT_CITY } from '../../js/birth-form.js';
import { parseBirthDate, parseBirthTime } from '../../js/parse-birth.js';
import { formatPlaceLabel, searchCities } from '../../js/timezones.js';
import type { BirthData, BirthPlace, TotemProfile } from '../types';

export { DEFAULT_CITY, formatPlaceLabel, parseBirthDate, parseBirthTime, searchCities };

export function normalizePlace(result: {
  name: string;
  admin1?: string;
  country: string;
  timezone: string;
}): BirthPlace {
  return {
    name: result.name,
    admin1: result.admin1,
    country: result.country,
    timezone: result.timezone,
  };
}

export function calculateProfile(birth: BirthData): TotemProfile {
  const { profile } = profileFromBirth({
    year: birth.year,
    month: birth.month,
    day: birth.day,
    hour: birth.hour,
    minute: birth.minute,
    // BaZi engine requires gender; totem animal pillars are unaffected.
    gender: 'female',
    sourceTimeZone: birth.birthPlace.timezone,
  });
  return profile;
}

export function birthDataToForm(birth: BirthData) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    name: '',
    birthDate: `${birth.year}-${pad(birth.month)}-${pad(birth.day)}`,
    birthTime: `${pad(birth.hour)}:${pad(birth.minute)}`,
    cityQuery: formatPlaceLabel(birth.birthPlace),
    birthPlace: birth.birthPlace,
  };
}

export function defaultBirthForm() {
  return {
    name: '',
    birthDate: '',
    birthTime: '',
    cityQuery: formatPlaceLabel(DEFAULT_CITY),
    birthPlace: DEFAULT_CITY as BirthPlace,
  };
}
