import { isUsablePoint, type RoutePoint } from './plogSessionDistance';

const NOISE_THRESHOLD_M = 3; // C5: "changes under 3m ignored as noise"

/**
 * Elevation gain (C5): sum of positive altitude changes, ignoring changes
 * under 3m. Changes are measured from the last *accepted* altitude, so a
 * slow climb of 1m steps still counts once it adds up to 3m. Same point
 * exclusions as distance, plus points with no altitude.
 */
export function computeElevationGainM(points: RoutePoint[]): number {
  let gain = 0;
  let reference: number | null = null;

  for (const point of points) {
    if (!isUsablePoint(point) || point.alt === null) continue;
    if (reference === null) {
      reference = point.alt;
      continue;
    }
    const change = point.alt - reference;
    if (Math.abs(change) < NOISE_THRESHOLD_M) continue;
    if (change > 0) gain += change;
    reference = point.alt;
  }

  return Math.round(gain);
}
