import type { TotemProfile } from '../types';
import { authHeaders } from './auth-api';
import type { GeoPlace } from './geo';

export const CONNECTIONS_API_URL = 'https://totemastrology.com/api/connections.php';

export type DirectoryLocation = {
  city: string;
  region: string;
  country: string;
  label: string;
  lat?: number;
  lon?: number;
};

export type DirectoryProfile = TotemProfile & {
  id: string;
  displayName: string;
  intro?: string;
  hasEmail?: boolean;
  contactEmail?: string;
  createdAt?: number;
  birthVerified?: boolean;
  birthTimeVerified?: boolean;
  location?: DirectoryLocation;
  distanceKm?: number;
};

type ListResponse = {
  profiles: DirectoryProfile[];
  apiVersion?: number;
  nearby?: { lat: number; lon: number; radiusKm: number };
  error?: string;
};

type JoinResponse = {
  ok?: boolean;
  id?: string;
  status?: string;
  message?: string;
  error?: string;
  profile?: DirectoryProfile & { status?: string };
};

export async function fetchDirectoryProfiles(options?: {
  lat?: number;
  lon?: number;
  radiusKm?: number;
}): Promise<{ profiles: DirectoryProfile[]; nearby?: ListResponse['nearby'] }> {
  const params = new URLSearchParams();
  if (
    options?.lat !== undefined &&
    options?.lon !== undefined &&
    Number.isFinite(options.lat) &&
    Number.isFinite(options.lon)
  ) {
    params.set('lat', String(options.lat));
    params.set('lon', String(options.lon));
    if (options.radiusKm) params.set('radiusKm', String(options.radiusKm));
  }

  const url = params.toString()
    ? `${CONNECTIONS_API_URL}?${params.toString()}`
    : CONNECTIONS_API_URL;

  const response = await fetch(url);
  const data = (await response.json()) as ListResponse;
  if (!response.ok) {
    throw new Error(data.error || 'Could not load the connections directory.');
  }
  return {
    profiles: Array.isArray(data.profiles) ? data.profiles : [],
    nearby: data.nearby,
  };
}

export async function joinDirectory(input: {
  profile: TotemProfile;
  intro?: string;
  contactEmail?: string;
  location?: GeoPlace | null;
}): Promise<JoinResponse> {
  const body: Record<string, unknown> = {
    spirit: input.profile.spirit,
    mental: input.profile.mental,
    emotional: input.profile.emotional,
    physical: input.profile.physical,
    elements: input.profile.elements ?? {},
    intro: input.intro ?? '',
    contactEmail: input.contactEmail ?? '',
    consent: true,
  };

  if (input.location) {
    body.location = {
      city: input.location.name,
      region: input.location.admin1 ?? '',
      country: input.location.country,
      lat: input.location.lat,
      lon: input.location.lon,
    };
  }

  const response = await fetch(CONNECTIONS_API_URL, {
    method: 'POST',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as JoinResponse;
  if (!response.ok) {
    throw new Error(data.error || 'Could not join the directory.');
  }
  return data;
}

export async function removeDirectoryListing(input?: {
  displayName?: string;
  profile?: TotemProfile;
}): Promise<{ user?: import('./auth-api').AccountUser }> {
  const response = await fetch(CONNECTIONS_API_URL, {
    method: 'POST',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      action: 'remove-self',
      displayName: input?.displayName,
      spirit: input?.profile?.spirit,
      mental: input?.profile?.mental,
      emotional: input?.profile?.emotional,
      physical: input?.profile?.physical,
      elements: input?.profile?.elements ?? {},
    }),
  });
  const data = (await response.json()) as { error?: string; user?: import('./auth-api').AccountUser };
  if (!response.ok) {
    throw new Error(data.error || 'Could not remove your listing.');
  }
  return data;
}

export async function updateDirectoryListing(input: {
  intro?: string;
  contactEmail?: string;
}): Promise<{
  ok?: boolean;
  message?: string;
  status?: string;
  profile?: DirectoryProfile & { status?: string };
  user?: import('./auth-api').AccountUser;
}> {
  const response = await fetch(CONNECTIONS_API_URL, {
    method: 'POST',
    headers: await authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      action: 'update-self',
      intro: input.intro ?? '',
      contactEmail: input.contactEmail ?? '',
    }),
  });
  const data = (await response.json()) as {
    ok?: boolean;
    message?: string;
    status?: string;
    error?: string;
    profile?: DirectoryProfile & { status?: string };
    user?: import('./auth-api').AccountUser;
  };
  if (!response.ok) {
    throw new Error(data.error || 'Could not update your directory listing.');
  }
  return data;
}
