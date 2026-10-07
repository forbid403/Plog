/**
 * Elapsed-time math for the Plog session state machine (C1/C3/C4) — pure
 * so it's unit-testable without a real device/SQLite. Time excludes manual
 * pauses only (C3: "no auto-pause").
 */

export type ActiveElapsedParams = {
  startedAt: string; // ISO
  pausedDurationSec: number; // total seconds spent paused across *completed* pause periods
  pausedAt: string | null; // ISO, set while currently paused; null while recording
  now: Date;
};

/** Seconds of active (non-paused) recording time up to `now` — or up to `pausedAt` if currently paused. */
export function computeActiveElapsedSec({ startedAt, pausedDurationSec, pausedAt, now }: ActiveElapsedParams): number {
  const start = new Date(startedAt).getTime();
  const end = pausedAt ? new Date(pausedAt).getTime() : now.getTime();
  const wallClockSec = (end - start) / 1000;
  return Math.max(0, Math.round(wallClockSec - pausedDurationSec));
}

/** Seconds spent in the pause period that's ending now (pausedAt → resumedAt). */
export function computePauseDurationSec(pausedAt: string, resumedAt: Date): number {
  return Math.max(0, Math.round((resumedAt.getTime() - new Date(pausedAt).getTime()) / 1000));
}

/** Avg. pace (C5): time ÷ distance, seconds per km. Null with no distance yet — pace is undefined. */
export function computeAvgPaceSecPerKm(durationSec: number, distanceKm: number): number | null {
  return distanceKm > 0 ? durationSec / distanceKm : null;
}
