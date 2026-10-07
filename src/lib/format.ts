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
