import { addDays, computeCurrentStreak, computeThisWeek, localDateKey } from './streak';

const SYD = 'Australia/Sydney';
// Noon Sydney time (UTC+11 in October) on the given day.
const at = (dateKey: string, tz = SYD) => ({ startedAt: `${dateKey}T01:00:00Z`, timezone: tz });

describe('localDateKey', () => {
  it('uses the given time zone, not UTC', () => {
    // 13:30 UTC on the 11th is 00:30 on the 12th in Sydney
    expect(localDateKey('2026-10-11T13:30:00Z', SYD)).toBe('2026-10-12');
    expect(localDateKey('2026-10-11T13:30:00Z', 'UTC')).toBe('2026-10-11');
  });
});

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });
  it('is not shifted by the Sydney DST change (4 Oct 2026)', () => {
    expect(addDays('2026-10-03', 1)).toBe('2026-10-04');
    expect(addDays('2026-10-05', -1)).toBe('2026-10-04');
  });
});

describe('computeCurrentStreak', () => {
  const today = '2026-10-12';

  it('is 0 with no sessions', () => expect(computeCurrentStreak([], today)).toBe(0));

  it('counts consecutive days ending today', () => {
    expect(computeCurrentStreak([at('2026-10-10'), at('2026-10-11'), at('2026-10-12')], today)).toBe(3);
  });

  it('stays alive today when the streak ran through yesterday', () => {
    expect(computeCurrentStreak([at('2026-10-10'), at('2026-10-11')], today)).toBe(2);
  });

  it('resets after one missed day', () => {
    expect(computeCurrentStreak([at('2026-10-09'), at('2026-10-10')], today)).toBe(0);
  });

  it('counts several sessions on one day once', () => {
    expect(computeCurrentStreak([at('2026-10-12'), at('2026-10-12')], today)).toBe(1);
  });

  it("uses each session's own time zone for its day", () => {
    // 23:30 Perth time on the 11th (= 02:30 on the 12th in Sydney) counts as the 11th
    const perthLateNight = { startedAt: '2026-10-11T15:30:00Z', timezone: 'Australia/Perth' };
    expect(computeCurrentStreak([perthLateNight, at('2026-10-12')], today)).toBe(2);
  });
});

describe('computeThisWeek', () => {
  // Thursday 15 Oct 2026; the week is Mon 12 – Sun 18.
  const today = '2026-10-15';

  it('starts on Monday and covers 7 days', () => {
    const week = computeThisWeek([], today, SYD);
    expect(week.map((d) => d.dayOfMonth)).toEqual([12, 13, 14, 15, 16, 17, 18]);
  });

  it('assigns plogged / missed / today / future', () => {
    const week = computeThisWeek([at('2026-10-12'), at('2026-10-13')], today, SYD);
    expect(week.map((d) => d.status)).toEqual(['plogged', 'plogged', 'missed', 'today', 'future', 'future', 'future']);
  });

  it('shows today as plogged once there is a session', () => {
    expect(computeThisWeek([at('2026-10-15')], today, SYD)[3].status).toBe('plogged');
  });

  it('keeps Sunday in the week that started the Monday before', () => {
    const week = computeThisWeek([], '2026-10-18', SYD);
    expect(week[0].dateKey).toBe('2026-10-12');
    expect(week[6].status).toBe('today');
  });

  it('ignores sessions from other weeks', () => {
    const week = computeThisWeek([at('2026-10-11'), at('2026-10-19')], today, SYD);
    expect(week.some((d) => d.status === 'plogged')).toBe(false);
  });
});
