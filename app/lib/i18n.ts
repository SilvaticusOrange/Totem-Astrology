import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_LOCALE,
  getLocaleInfo,
  I18N_STORAGE_KEY,
  isSupportedLocale,
  LOCALES,
  normalizeLocaleTag,
} from '../../js/i18n-locales.js';
import { MESSAGES } from '../../js/i18n-messages.js';

export {
  DEFAULT_LOCALE,
  getLocaleInfo,
  I18N_STORAGE_KEY,
  isSupportedLocale,
  LOCALES,
  MESSAGES,
};

export function t(
  key: string,
  locale: string = DEFAULT_LOCALE,
  vars?: Record<string, string | number>,
): string {
  const table = MESSAGES[locale] || MESSAGES[DEFAULT_LOCALE];
  let value = table[key] ?? MESSAGES[DEFAULT_LOCALE][key] ?? key;
  if (vars) {
    value = String(value).replace(/\{(\w+)\}/g, (_, name: string) =>
      vars[name] != null ? String(vars[name]) : `{${name}}`,
    );
  }
  return value;
}

export function detectDeviceLocale(): string {
  try {
    const raw =
      (typeof Intl !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().locale) || '';
    const code = normalizeLocaleTag(raw);
    if (code) return code;
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

export async function readStoredLocale(): Promise<string | null> {
  try {
    const stored = await AsyncStorage.getItem(I18N_STORAGE_KEY);
    if (stored && isSupportedLocale(stored)) return stored;
  } catch {
    /* ignore */
  }
  return null;
}

export async function writeStoredLocale(code: string): Promise<void> {
  try {
    await AsyncStorage.setItem(I18N_STORAGE_KEY, code);
  } catch {
    /* ignore */
  }
}

export async function resolveInitialLocale(): Promise<string> {
  return (await readStoredLocale()) || detectDeviceLocale();
}
