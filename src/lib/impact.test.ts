import {
  availableYears,
  chartAxisMax,
  computeBadges,
  computeImpact,
  formatBadgeLabel,
  formatBins,
  formatBottles,
  type ImpactSession,
} from './impact';

const SYD = 'Australia/Sydney';
const s = (day: string, liters: number | null, distanceKm = 1): ImpactSession => ({
  startedAt: `${day}T01:00:00Z`,
  timezone: SYD,
  liters,
  distanceKm,
});

describe('computeImpact', () => {
  const sessions = [s('2026-01-05', 7.5, 3), s('2026-01-05', 2.5, 1), s('2026-03-10', null, 2), s('2025-12-31', 10, 4)];

  it('totals one year', () => {
    const y = computeImpact(sessions, 2026);
    expect(y.liters).toBe(10);
    expect(y.distanceKm).toBe(6);
    expect(y.ploggingDays).toBe(2);
    expect(y.monthly[0]).toBe(10);
    expect(y.monthly[2]).toBe(0);
    expect(y.monthly).toHaveLength(12);
  });

  it('totals all time with null year', () => {
    expect(computeImpact(sessions, null).liters).toBe(20);
  });

  it('puts a session in the year of its own time zone', () => {
    // 31 Dec 14:00 UTC = 1 Jan 01:00 in Sydney
    const nye = { startedAt: '2025-12-31T14:00:00Z', timezone: SYD, liters: 1, distanceKm: 1 };
    expect(computeImpact([nye], 2026).liters).toBe(1);
  });

  it('is all zeros with no sessions', () => {
    const y = computeImpact([], 2026);
    expect(y).toEqual({ liters: 0, distanceKm: 0, ploggingDays: 0, monthly: Array(12).fill(0) });
  });
});

describe('availableYears', () => {
  it('includes the current year and dedupes, newest first', () => {
    expect(availableYears([s('2024-05-01', 1), s('2026-01-01', 1), s('2024-06-01', 1)], 2026)).toEqual([2026, 2024]);
  });
});

describe('formatBottles', () => {
  it('floors to whole bottles', () => expect(formatBottles(37.5)).toBe('75 bottles'));
  it('uses the singular for one', () => expect(formatBottles(0.9)).toBe('1 bottle'));
  it('adds a thousands separator', () => expect(formatBottles(2100)).toBe('4,200 bottles'));
  it('takes the screen wording', () =>
    expect(formatBottles(37.5, { one: 'Plastic bottle', many: 'Plastic bottles' })).toBe('75 Plastic bottles'));
});

describe('formatBins', () => {
  it('shows a percentage under one bin', () => expect(formatBins(37.5)).toBe('16% of a bin'));
  it('shows <1% when it rounds to 0', () => expect(formatBins(1)).toBe('<1% of a bin'));
  it('shows 0% for nothing', () => expect(formatBins(0)).toBe('0% of a bin'));
  it('switches to bins at one', () => expect(formatBins(240)).toBe('1 bin'));
  it('uses 1 decimal above one', () => expect(formatBins(552)).toBe('2.3 bins'));
  it('does not show 100% of a bin', () => expect(formatBins(239)).toBe('1 bin'));
});

describe('chartAxisMax', () => {
  it('is 10 with no data', () => expect(chartAxisMax([0, 0])).toBe(10));
  it('rounds up to a clean number', () => {
    expect(chartAxisMax([37.5])).toBe(50);
    expect(chartAxisMax([100])).toBe(100);
    expect(chartAxisMax([12])).toBe(12.5);
    expect(chartAxisMax([3])).toBe(5);
  });
});

describe('computeBadges', () => {
  const catalog = [
    { id: 'streak_5', type: 'streak' as const, threshold: 5 },
    { id: 'distance_1', type: 'distance' as const, threshold: 1 },
    { id: 'distance_5', type: 'distance' as const, threshold: 5 },
  ];

  it('earns distance badges from all-time km, inclusive', () => {
    const result = computeBadges(catalog, [s('2026-01-01', 0, 0.6), s('2026-02-01', 0, 0.4)]);
    expect(result.map((b) => b.earned)).toEqual([false, true, false]);
  });

  it('keeps a streak badge after the streak breaks', () => {
    const days = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05', '2026-02-01'];
    expect(computeBadges(catalog, days.map((d) => s(d, 0, 0)))[0].earned).toBe(true);
  });
});

describe('formatBadgeLabel', () => {
  it('uses the Figma wording', () => {
    expect(formatBadgeLabel({ id: 'streak_5', type: 'streak', threshold: 5 })).toBe('5 Streaks');
    expect(formatBadgeLabel({ id: 'distance_1', type: 'distance', threshold: 1 })).toBe('1 km');
  });
});
