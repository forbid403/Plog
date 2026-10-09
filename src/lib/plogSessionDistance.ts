/**
 * Distance calculation (C5): "Sum of distances between consecutive GPS
 * points, excluding low-accuracy points (error > 30m) and paused periods."
 * Pure/unit-tested.
 */

export type RoutePoint = {
  lat: number;
  lng: number;
  alt: number | null;
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

/** Paused or low-accuracy points are excluded from every C5 calculation. */
export function isUsablePoint(point: RoutePoint): boolean {
  return !point.isPaused && point.accuracy !== null && point.accuracy <= MAX_ACCEPTABLE_ACCURACY_M;
}

/**
 * Low-accuracy points are skipped without breaking the route — the next
 * valid point is measured from the last valid one. A pause does break it:
 * nothing is measured across a paused period, or movement during the
 * pause would count as a straight line from pause to resume.
 */
export function computeDistanceKm(points: RoutePoint[]): number {
  let totalMeters = 0;
  let previous: RoutePoint | null = null;

  for (const point of points) {
    if (point.isPaused) previous = null;
    if (!isUsablePoint(point)) continue;
    if (previous) totalMeters += haversineMeters(previous, point);
    previous = point;
  }

  return totalMeters / 1000;
}

/**
 * Splits the route at paused points into separately drawn segments, so
 * nothing is drawn for a pause (not even a straight line across it).
 * Segments with fewer than 2 points can't be drawn and are dropped.
 */
export function splitActiveSegments(points: RoutePoint[]): RoutePoint[][] {
  const segments: RoutePoint[][] = [];
  let current: RoutePoint[] = [];
  for (const point of points) {
    if (point.isPaused) {
      segments.push(current);
      current = [];
    } else {
      current.push(point);
    }
  }
  segments.push(current);
  return segments.filter((segment) => segment.length > 1);
}
