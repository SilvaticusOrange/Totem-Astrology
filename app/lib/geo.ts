import { formatPlaceLabel, searchCities } from '../../js/timezones.js';

export type GeoPlace = {
  name: string;
  admin1?: string;
  country: string;
  timezone?: string;
  lat: number;
  lon: number;
};

export function normalizeGeoPlace(result: {
  name: string;
  admin1?: string;
  country: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lon?: number;
}): GeoPlace | null {
  const lat = Number(result.latitude ?? result.lat);
  const lon = Number(result.longitude ?? result.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return {
    name: result.name,
    admin1: result.admin1,
    country: result.country,
    timezone: result.timezone,
    lat,
    lon,
  };
}

export function formatGeoPlaceLabel(place: GeoPlace): string {
  return formatPlaceLabel(place);
}

export function searchGeoCities(query: string): Promise<GeoPlace[]> {
  return searchCities(query).then((raw: Array<{
    name: string;
    admin1?: string;
    country: string;
    timezone?: string;
    latitude?: number;
    longitude?: number;
  }>) =>
    raw
      .map(normalizeGeoPlace)
      .filter((place: GeoPlace | null): place is GeoPlace => Boolean(place)),
  );
}

/** Great-circle distance in kilometers. */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
}
