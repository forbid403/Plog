import * as Location from 'expo-location';

export type LocalWeather = {
  /** Reverse-geocoded suburb; null if the lookup found nothing. */
  suburb: string | null;
  tempC: number;
  /** Expected rainfall over the next 3 hours (B2 [Recommended]). */
  precipitationMm: number;
};

type OpenMeteoResponse = {
  current: { temperature_2m: number };
  hourly: { precipitation: number[] };
};

// B2 [Proposed]: refresh on entering Home, 30-minute cache.
const CACHE_MS = 30 * 60 * 1000;
let cache: { fetchedAt: number; value: LocalWeather } | null = null;

/**
 * B2 weather card. Temperature and rain come from Open-Meteo (free, no API
 * key); the suburb from the OS's reverse geocoder (expo-location, needs the
 * foreground location permission the caller already checked).
 */
export async function getLocalWeather(coords: { latitude: number; longitude: number }): Promise<LocalWeather> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) return cache.value;

  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${coords.latitude}&longitude=${coords.longitude}` +
    '&current=temperature_2m&hourly=precipitation&forecast_hours=3&timezone=auto';

  const [response, places] = await Promise.all([
    fetch(url),
    // A failed suburb lookup shouldn't hide the weather itself.
    Location.reverseGeocodeAsync(coords).catch(() => []),
  ]);
  if (!response.ok) throw new Error(`Open-Meteo request failed: ${response.status}`);
  const json = (await response.json()) as OpenMeteoResponse;

  const place = places[0];
  const value: LocalWeather = {
    suburb: place?.city ?? place?.district ?? place?.subregion ?? null,
    tempC: json.current.temperature_2m,
    precipitationMm: json.hourly.precipitation.reduce((sum, mm) => sum + (mm ?? 0), 0),
  };
  cache = { fetchedAt: Date.now(), value };
  return value;
}
