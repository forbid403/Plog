/**
 * Streak (B3 / G5.4) and This Week (B4) calculations. Pure, no I/O — the
 * Home screen fetches sessions and passes them in.
 *
 * Dates are compared as local calendar-day keys (`YYYY-MM-DD`), never as
 * timestamps, so midnight and week boundaries follow the right time zone:
 * - streak days use each session's own stored `timezone` (G5.4, claude.md)
 * - the This Week strip uses the device time zone (B4)
 */

export type SessionDay = {
  startedAt: string;
  timezone: string;
};

export type WeekDayStatus = 'plogged' | 'missed' | 'today' | 'future';

export type WeekDay = {
  dateKey: string;
  dayOfMonth: number;
  status: WeekDayStatus;
};

/** `YYYY-MM-DD` for the calendar day `iso` falls on in `timeZone`. */
export function localDateKey(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Calendar arithmetic on a `YYYY-MM-DD` key (UTC-based, so DST can't shift it). */
export function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * G5.4: consecutive plogging days ending today. If today has no session
 * yet, a streak that ran through yesterday is still alive (until midnight);
 * one missed day resets it to 0.
 */
export function computeCurrentStreak(sessions: SessionDay[], todayKey: string): number {
  const days = new Set(sessions.map((s) => localDateKey(s.startedAt, s.timezone)));
  let cursor = days.has(todayKey) ? todayKey : addDays(todayKey, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** B4: the Monday–Sunday week containing `todayKey`, one status per day. */
export function computeThisWeek(sessions: SessionDay[], todayKey: string, deviceTimeZone: string): WeekDay[] {
  const days = new Set(sessions.map((s) => localDateKey(s.startedAt, deviceTimeZone)));
  const [y, m, d] = todayKey.split('-').map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  const monday = addDays(todayKey, -((weekday + 6) % 7));

  return Array.from({ length: 7 }, (_, i) => {
    const dateKey = addDays(monday, i);
    let status: WeekDayStatus;
    if (days.has(dateKey)) status = 'plogged';
    else if (dateKey < todayKey) status = 'missed';
    else if (dateKey === todayKey) status = 'today';
    else status = 'future';
    return { dateKey, dayOfMonth: Number(dateKey.slice(8, 10)), status };
  });
}

/**
 * G5.4 streak badges: the longest run of consecutive plogging days ever,
 * each session's day in its own time zone. Badges are permanent, so the
 * best-ever run (not today's) decides whether a streak badge is earned.
 */
export function computeLongestStreak(sessions: SessionDay[]): number {
  const days = [...new Set(sessions.map((s) => localDateKey(s.startedAt, s.timezone)))].sort();
  let longest = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && addDays(days[i - 1], 1) === days[i] ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return longest;
}
