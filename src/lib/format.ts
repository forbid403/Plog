/**
 * Shared display formatters (spec 0.2 "Common display rules"). Implemented
 * once here and imported everywhere, per claude.md's domain-rules
 * convention — never re-derive these inline in a screen.
 */

/** `mm:ss`, or `h:mm:ss` once the duration reaches an hour (0.2). */
export function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/**
 * 0.2: "1 decimal place in lists and detail; 2 decimal places while
 * recording, in the finish sheet and on the Impact card" — caller picks
 * which, the rule differs by context, there's no single right default.
 */
export function formatDistanceKm(km: number, decimals: 1 | 2): string {
  return km.toFixed(decimals);
}

/** `m′ss″` per km (0.2), e.g. 362 → `6′02″`. */
export function formatPace(secPerKm: number): string {
  const sec = Math.max(0, Math.round(secPerKm));
  return `${Math.floor(sec / 60)}′${String(sec % 60).padStart(2, '0')}″`;
}

/**
 * Impact card date (0.2): `D Mon YYYY`, e.g. `26 Aug 2026` — uses the
 * session's stored timezone, not the device's (0.2's timezone rule).
 */
export function formatImpactCardDate(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: timezone }).format(
    new Date(iso)
  );
}

/** Litres (G3.2/0.2): 1 decimal place, dropped when whole — `15 L`, `37.5 L`. */
export function formatLiters(liters: number): string {
  const rounded = Math.round(liters * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} L`;
}

/** Streak value (B3): `1 day`, `5 days`. */
export function formatStreakDays(days: number): string {
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

/** Weather temperature (B2): integer `°C`, e.g. `12°C`. */
export function formatTemperatureC(tempC: number): string {
  const rounded = Math.round(tempC);
  return `${rounded === 0 ? 0 : rounded}°C`;
}

/**
 * Expected rainfall (B2): `0mm` when none. Same 1-decimal-dropped-when-whole
 * rule as litres (0.2) so light drizzle reads `0.4mm`, not a misleading `0mm`.
 */
export function formatPrecipitationMm(mm: number): string {
  const rounded = Math.round(Math.max(0, mm) * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}mm`;
}

/** Route distance (B5): 1 decimal place, omitted when whole — `9.4 km`, `10 km`. */
export function formatRouteDistanceKm(km: number): string {
  const rounded = Math.round(km * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} km`;
}

/** Elevation gain (B5): whole metres, `67m`. */
export function formatElevationM(meters: number): string {
  return `${Math.round(meters)}m`;
}
