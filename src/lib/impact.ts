/**
 * Your Impact numbers (spec G3, G5). Pure — screens fetch sessions/badges
 * and pass them in. The My summary card (all time) and Your Impact detail
 * (one year) share these functions (G3.2).
 */
import { computeLongestStreak, localDateKey } from './streak';

// G3.1 conversion basis — kept here as configuration so another country's
// bottle/bin sizes are a one-line change.
export const BOTTLE_VOLUME_L = 0.5; // 500ml plastic bottle
export const BIN_VOLUME_L = 240; // Australian standard wheelie bin

export type ImpactSession = {
  startedAt: string;
  timezone: string;
  /** null until litter is logged — counts as 0. */
  liters: number | null;
  distanceKm: number;
};

export type ImpactStats = {
  liters: number;
  distanceKm: number;
  /** G5.2: dates with at least one session (session's own time zone). */
  ploggingDays: number;
  /** Litres per month, Jan..Dec (always 12; only meaningful for a single year). */
  monthly: number[];
};

const yearOf = (s: ImpactSession) => Number(localDateKey(s.startedAt, s.timezone).slice(0, 4));

/** Totals for one year, or all time when `year` is null. */
export function computeImpact(sessions: ImpactSession[], year: number | null): ImpactStats {
  const inPeriod = year === null ? sessions : sessions.filter((s) => yearOf(s) === year);
  const days = new Set<string>();
  const monthly = Array.from({ length: 12 }, () => 0);
  let liters = 0;
  let distanceKm = 0;
  for (const s of inPeriod) {
    const key = localDateKey(s.startedAt, s.timezone);
    days.add(key);
    liters += s.liters ?? 0;
    distanceKm += s.distanceKm;
    monthly[Number(key.slice(5, 7)) - 1] += s.liters ?? 0;
  }
  const round1 = (n: number) => Math.round(n * 10) / 10;
  return { liters: round1(liters), distanceKm: round1(distanceKm), ploggingDays: days.size, monthly: monthly.map(round1) };
}

/** G5.1: years that have sessions, plus the current year, newest first. */
export function availableYears(sessions: ImpactSession[], currentYear: number): number[] {
  return [...new Set([currentYear, ...sessions.map(yearOf)])].sort((a, b) => b - a);
}

/** G3.1/G3.2: `1 bottle`, `75 bottles`, `4,200 bottles` (noun is the screen's wording). */
export function formatBottles(liters: number, noun: { one: string; many: string } = { one: 'bottle', many: 'bottles' }): string {
  const bottles = Math.floor(liters / BOTTLE_VOLUME_L);
  return `${bottles.toLocaleString('en-AU')} ${bottles === 1 ? noun.one : noun.many}`;
}

/** G3.1/G3.2: `16% of a bin`, `<1% of a bin`, `1 bin`, `2.3 bins`. */
export function formatBins(liters: number): string {
  if (liters <= 0) return '0% of a bin';
  const bins = liters / BIN_VOLUME_L;
  if (bins < 1) {
    const pct = Math.round(bins * 100);
    if (pct === 0) return '<1% of a bin';
    if (pct < 100) return `${pct}% of a bin`;
  }
  const rounded = Math.round(bins * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text} ${rounded === 1 ? 'bin' : 'bins'}`;
}

/**
 * G5.3 y-axis: 0 to a clean maximum in 5 equal steps (0–10 when there's no
 * data). Returns the top value; ticks are top/5 apart.
 */
export function chartAxisMax(values: number[]): number {
  const max = Math.max(0, ...values);
  if (max === 0) return 10;
  const rawStep = max / 5;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rawStep) ?? 10 * magnitude;
  return step * 5;
}

export type Badge = {
  id: string;
  type: 'streak' | 'distance';
  threshold: number;
};

export type BadgeStatus = Badge & { earned: boolean };

/**
 * G5.4: streak badges by longest-ever run, distance badges by all-time km.
 * Derived from session history on the device (the server-side award job
 * isn't built yet). Deleting sessions can therefore take a badge away.
 */
export function computeBadges(badges: Badge[], sessions: ImpactSession[]): BadgeStatus[] {
  const longestStreak = computeLongestStreak(sessions);
  const totalKm = sessions.reduce((sum, s) => sum + s.distanceKm, 0);
  return badges.map((b) => ({ ...b, earned: (b.type === 'streak' ? longestStreak : totalKm) >= b.threshold }));
}

/** Figma badge wording: `5 Streaks`, `1 km`. */
export function formatBadgeLabel(badge: Badge): string {
  return badge.type === 'streak' ? `${badge.threshold} Streaks` : `${badge.threshold} km`;
}
