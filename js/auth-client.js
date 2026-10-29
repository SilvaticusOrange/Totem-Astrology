/**
 * Totem user account client (Bearer token in localStorage).
 */
const AUTH_API_URL = 'api/auth.php';
const AUTH_TOKEN_KEY = 'totem-user-token';

export function getAuthToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setAuthToken(token, staySignedIn = true) {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    if (!token) return;
    const store = staySignedIn ? localStorage : sessionStorage;
    store.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearAuthToken() {
  setAuthToken('');
}

export function authHeaders(extra = {}) {
  const headers = { Accept: 'application/json', ...extra };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function parseAuthResponse(response, fallback) {
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  if (!response.ok) {
    throw new Error(data.error || fallback);
  }
  return data;
}

export async function registerAccount({
  email,
  phone,
  password,
  username,
  birthDate,
  birthTime,
  birthPlace,
  birthName,
  staySignedIn = true,
}) {
  const response = await fetch(AUTH_API_URL, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      action: 'register',
      email,
      phone,
      password,
      username,
      birthDate: birthDate || '',
      birthTime: birthTime || '',
      birthPlace: birthPlace || '',
      birthName: birthName || '',
      staySignedIn,
    }),
  });
  const data = await parseAuthResponse(response, 'Could not create your account.');
  if (data.token) setAuthToken(data.token, staySignedIn);
  return data;
}

export async function loginAccount({ identifier, username, password, staySignedIn = true }) {
  const response = await fetch(AUTH_API_URL, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      action: 'login',
      identifier: identifier || username || '',
      password,
      staySignedIn,
    }),
  });
  const data = await parseAuthResponse(response, 'Could not sign in.');
  if (data.token) setAuthToken(data.token, staySignedIn);
  return data;
}

export async function requestPasswordReset(identifier) {
  const response = await fetch(AUTH_API_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'forgot-password', identifier }),
  });
  return parseAuthResponse(response, 'Could not send a reset link.');
}

export async function resetPassword({ token, password }) {
  const response = await fetch(AUTH_API_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reset-password', token, password }),
  });
  return parseAuthResponse(response, 'Could not reset your password.');
}

export async function logoutAccount() {
  try {
    await fetch(AUTH_API_URL, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ action: 'logout' }),
    });
  } catch {
    /* ignore network errors on logout */
  }
  clearAuthToken();
}

export async function fetchCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;
  const response = await fetch(AUTH_API_URL, {
    method: 'GET',
    headers: authHeaders(),
  });
  if (response.status === 401) {
    clearAuthToken();
    return null;
  }
  const data = await parseAuthResponse(response, 'Could not load your account.');
  return data.user || null;
}

export async function updateAccount({ email, phone } = {}) {
  const payload = { action: 'update' };
  if (email !== undefined) payload.email = email;
  if (phone !== undefined) payload.phone = phone;
  const response = await fetch(AUTH_API_URL, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  return parseAuthResponse(response, 'Could not update your account.');
}

export async function saveBirthDetails({ birthDate, birthTime, birthPlace, birthName }) {
  const response = await fetch(AUTH_API_URL, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      action: 'save-birth-details',
      birthDate: birthDate || '',
      birthTime: birthTime || '',
      birthPlace: birthPlace || '',
      birthName: birthName || '',
    }),
  });
  return parseAuthResponse(response, 'Could not save birth details.');
}

const CONNECTIONS_API_URL = 'api/connections.php';

export async function updateDirectoryListing({ intro, contactEmail }) {
  const response = await fetch(CONNECTIONS_API_URL, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      action: 'update-self',
      intro,
      contactEmail,
    }),
  });
  return parseAuthResponse(response, 'Could not update your directory listing.');
}

export async function removeDirectoryListing() {
  const response = await fetch(CONNECTIONS_API_URL, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ action: 'remove-self' }),
  });
  return parseAuthResponse(response, 'Could not remove your directory listing.');
}

export async function submitBirthVerification({ birthDate, idDocument, note }) {
  const form = new FormData();
  form.append('action', 'submit-birth-verification');
  form.append('birthDate', birthDate);
  if (note) form.append('note', note);
  form.append('idDocument', idDocument);
  const response = await fetch(AUTH_API_URL, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  return parseAuthResponse(response, 'Could not submit birth verification.');
}

export async function submitBirthTimeVerification({ birthTime, timeDocument, note }) {
  const form = new FormData();
  form.append('action', 'submit-birth-time-verification');
  form.append('birthTime', birthTime);
  if (note) form.append('note', note);
  form.append('timeDocument', timeDocument);
  const response = await fetch(AUTH_API_URL, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  return parseAuthResponse(response, 'Could not submit birth-time verification.');
}

if (typeof window !== 'undefined') {
  window.TotemAuth = {
    getAuthToken,
    setAuthToken,
    clearAuthToken,
    authHeaders,
    registerAccount,
    loginAccount,
    logoutAccount,
    fetchCurrentUser,
    updateAccount,
    saveBirthDetails,
    updateDirectoryListing,
    removeDirectoryListing,
    submitBirthVerification,
    submitBirthTimeVerification,
  };
}
