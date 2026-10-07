/**
 * Distance calculation (C5): "Sum of distances between consecutive GPS
 * points, excluding low-accuracy points (error > 30m) and paused periods."
 * Pure/unit-tested. Only the distance piece of C5 — pace/elevation/place
 * name/title aren't built yet.
 */

export type RoutePoint = {
  lat: number;
  lng: number;
  accuracy: number | null;
  isPaused: boolean;
};

const MAX_ACCEPTABLE_ACCURACY_M = 30; // C5's own stated cutoff
const EARTH_RADIUS_M = 6371000;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Excluded (paused or low-accuracy) points are skipped — they don't break
 * the route, the next valid point is still measured from the last valid
 * one, just not from the excluded one itself.
 */
export function computeDistanceKm(points: RoutePoint[]): number {
  let totalMeters = 0;
  let previous: RoutePoint | null = null;

  for (const point of points) {
    const usable = !point.isPaused && point.accuracy !== null && point.accuracy <= MAX_ACCEPTABLE_ACCURACY_M;
    if (!usable) continue;
    if (previous) totalMeters += haversineMeters(previous, point);
    previous = point;
  }

  return totalMeters / 1000;
}
