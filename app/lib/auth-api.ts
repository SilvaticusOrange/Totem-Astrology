import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DirectoryProfile } from './connections-api';

export const AUTH_API_URL = 'https://totemastrology.com/api/auth.php';
const TOKEN_KEY = 'totemConnect.authToken';

let memoryToken = '';

export type BirthVerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

export type AccountUser = {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  phone?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  birthName?: string;
  birthDate?: string;
  birthTime?: string;
  birthVerificationStatus?: BirthVerificationStatus;
  birthVerificationNote?: string;
  birthIdUploaded?: boolean;
  birthVerifiedAt?: number | null;
  birthTimeVerificationStatus?: BirthVerificationStatus;
  birthTimeVerificationNote?: string;
  birthTimeIdUploaded?: boolean;
  birthTimeVerifiedAt?: number | null;
  createdAt?: number;
  directoryListed?: boolean;
  listing?: (DirectoryProfile & { status?: string }) | null;
};

type AuthResponse = {
  ok?: boolean;
  token?: string;
  user?: AccountUser;
  message?: string;
  error?: string;
};

export async function getAuthToken(): Promise<string> {
  if (memoryToken) return memoryToken;
  try {
    return (await AsyncStorage.getItem(TOKEN_KEY)) || '';
  } catch {
    return '';
  }
}

export async function setAuthToken(token: string | null, staySignedIn = true): Promise<void> {
  memoryToken = token || '';
  try {
    if (token && staySignedIn) await AsyncStorage.setItem(TOKEN_KEY, token);
    else await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export async function authHeaders(extra: Record<string, string> = {}): Promise<Record<string, string>> {
  const headers: Record<string, string> = { Accept: 'application/json', ...extra };
  const token = await getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function authFetch(input: RequestInfo, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Could not reach Totem Astrology. Check your connection and try again.');
    }
    throw new Error('Could not reach Totem Astrology. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }
}

async function parseAuth(response: Response, fallback: string): Promise<AuthResponse> {
  let data: AuthResponse = {};
  try {
    data = (await response.json()) as AuthResponse;
  } catch {
    throw new Error('Could not reach Totem Astrology. Check your connection and try again.');
  }
  if (!response.ok) {
    throw new Error(data.error || fallback);
  }
  return data;
}

export async function registerAccount(input: {
  email?: string;
  phone?: string;
  password: string;
  username?: string;
  birthName?: string;
  staySignedIn?: boolean;
}): Promise<AuthResponse> {
  const staySignedIn = input.staySignedIn !== false;
  const response = await authFetch(AUTH_API_URL, {
    method: 'POST',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ action: 'register', ...input, staySignedIn }),
  });
  const data = await parseAuth(response, 'Could not create your account.');
  if (data.token) await setAuthToken(data.token, staySignedIn);
  return data;
}

export async function loginAccount(input: {
  identifier: string;
  password: string;
  staySignedIn?: boolean;
}): Promise<AuthResponse> {
  const staySignedIn = input.staySignedIn !== false;
  const response = await authFetch(AUTH_API_URL, {
    method: 'POST',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ action: 'login', ...input, staySignedIn }),
  });
  const data = await parseAuth(response, 'Could not sign in.');
  if (data.token) await setAuthToken(data.token, staySignedIn);
  return data;
}

export async function requestPasswordReset(identifier: string): Promise<AuthResponse> {
  const response = await authFetch(AUTH_API_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'forgot-password', identifier }),
  });
  return parseAuth(response, 'Could not send a reset link.');
}

export async function logoutAccount(): Promise<void> {
  try {
    await fetch(AUTH_API_URL, {
      method: 'POST',
      headers: await authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ action: 'logout' }),
    });
  } catch {
    /* ignore */
  }
  await setAuthToken(null);
}

export async function fetchCurrentUser(): Promise<AccountUser | null> {
  const token = await getAuthToken();
  if (!token) return null;
  const response = await fetch(AUTH_API_URL, {
    method: 'GET',
    headers: await authHeaders(),
  });
  if (response.status === 401) {
    await setAuthToken(null);
    return null;
  }
  const data = await parseAuth(response, 'Could not load your account.');
  return data.user ?? null;
}

export async function updateAccount(input: {
  email?: string;
  phone?: string;
}): Promise<AuthResponse> {
  const response = await fetch(AUTH_API_URL, {
    method: 'POST',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ action: 'update', ...input }),
  });
  return parseAuth(response, 'Could not update your account.');
}

export async function saveBirthDetails(input: {
  birthDate?: string;
  birthTime?: string;
  birthName?: string;
}): Promise<AuthResponse> {
  const response = await fetch(AUTH_API_URL, {
    method: 'POST',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      action: 'save-birth-details',
      birthDate: input.birthDate || '',
      birthTime: input.birthTime || '',
      birthName: input.birthName || '',
    }),
  });
  return parseAuth(response, 'Could not save birth details.');
}
