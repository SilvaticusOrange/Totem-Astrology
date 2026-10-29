import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateProfile } from './lib/birth';
import type { AppData, MeProfile, TotemProfile } from './types';

const STORAGE_KEY = 'totemConnect.v1';

const EMPTY: AppData = { me: null, circle: [] };

function profileNeedsElements(profile: TotemProfile): boolean {
  return !profile.elements || Object.values(profile.elements).every((value) => !value);
}

function refreshProfileFromBirth<T extends { birth: MeProfile['birth']; profile: TotemProfile }>(
  entry: T,
): T {
  if (!profileNeedsElements(entry.profile)) return entry;
  return { ...entry, profile: calculateProfile(entry.birth) };
}

function hydrateAppData(data: AppData): AppData {
  const me = data.me ? refreshProfileFromBirth(data.me) : null;
  const circle = data.circle.map((person) => refreshProfileFromBirth(person));
  return { me, circle };
}

export async function loadAppData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as AppData;
    const hydrated = hydrateAppData({
      me: parsed.me ?? null,
      circle: Array.isArray(parsed.circle) ? parsed.circle : [],
    });
    if (JSON.stringify(hydrated) !== JSON.stringify(parsed)) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(hydrated));
    }
    return hydrated;
  } catch {
    return { ...EMPTY };
  }
}

export async function saveAppData(data: AppData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
