/**
 * Shared birth date/time parsing for typeable form fields.
 * Accepts YYYY-MM-DD and US-style MM/DD/YYYY (slashes or dashes).
 */

/**
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @returns {{ year: number, month: number, day: number } | null}
 */
function validateCalendarDate(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (year < 1900 || year > 2100) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(year, month - 1, day);
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return null;
  return { year, month, day };
}

/**
 * @param {string} value
 * @returns {{ year: number, month: number, day: number } | null}
 */
export function parseBirthDate(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  let match = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (match) {
    return validateCalendarDate(Number(match[1]), Number(match[2]), Number(match[3]));
  }

  // US-style month/day/year — avoids the mobile date-picker year scroll.
  match = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (match) {
    return validateCalendarDate(Number(match[3]), Number(match[1]), Number(match[2]));
  }

  return null;
}

/**
 * @param {{ year: number, month: number, day: number }} parts
 * @returns {string}
 */
export function formatBirthDateISO(parts) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

/**
 * @param {{ hour: number, minute: number }} parts
 * @returns {string}
 */
export function formatBirthTime24(parts) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(parts.hour)}:${pad(parts.minute)}`;
}

/**
 * Accepts 24-hour (14:30) or 12-hour with AM/PM (2:30 PM, 2:30pm, 2 PM).
 * @param {string} value
 * @returns {{ hour: number, minute: number } | null}
 */
export function parseBirthTime(value) {
  const raw = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (!raw) return null;

  // 12-hour with AM/PM — e.g. 2:30 PM, 2:30pm, 2 PM, 12:05 a.m.
  let match = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*([AaPp])\.?[Mm]\.?$/);
  if (match) {
    let hour = Number(match[1]);
    const minute = Number(match[2] ?? '0');
    const meridiem = match[3].toUpperCase();
    if (hour < 1 || hour > 12 || minute > 59) return null;
    if (meridiem === 'A') {
      hour = hour === 12 ? 0 : hour;
    } else {
      hour = hour === 12 ? 12 : hour + 12;
    }
    return { hour, minute };
  }

  // 24-hour — e.g. 14:30 or 9:05
  match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}
