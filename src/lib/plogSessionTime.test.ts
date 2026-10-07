import { computeActiveElapsedSec, computeAvgPaceSecPerKm, computePauseDurationSec } from './plogSessionTime';

describe('computeActiveElapsedSec', () => {
  it('counts straight wall-clock time when never paused', () => {
    const sec = computeActiveElapsedSec({
      startedAt: '2026-01-01T00:00:00.000Z',
      pausedDurationSec: 0,
      pausedAt: null,
      now: new Date('2026-01-01T00:05:00.000Z'),
    });
    expect(sec).toBe(300);
  });

  it('excludes completed pause periods', () => {
    const sec = computeActiveElapsedSec({
      startedAt: '2026-01-01T00:00:00.000Z',
      pausedDurationSec: 60, // paused for 1 of those 5 minutes
      pausedAt: null,
      now: new Date('2026-01-01T00:05:00.000Z'),
    });
    expect(sec).toBe(240);
  });

  it('freezes at pausedAt while currently paused, ignoring `now`', () => {
    const sec = computeActiveElapsedSec({
      startedAt: '2026-01-01T00:00:00.000Z',
      pausedDurationSec: 0,
      pausedAt: '2026-01-01T00:02:00.000Z',
      now: new Date('2026-01-01T00:10:00.000Z'), // way later — should be ignored
    });
    expect(sec).toBe(120);
  });

  it('is 0 at the exact start', () => {
    const sec = computeActiveElapsedSec({
      startedAt: '2026-01-01T00:00:00.000Z',
      pausedDurationSec: 0,
      pausedAt: null,
      now: new Date('2026-01-01T00:00:00.000Z'),
    });
    expect(sec).toBe(0);
  });

  it('never goes negative (clock skew safety)', () => {
    const sec = computeActiveElapsedSec({
      startedAt: '2026-01-01T00:00:10.000Z',
      pausedDurationSec: 0,
      pausedAt: null,
      now: new Date('2026-01-01T00:00:00.000Z'), // now before startedAt
    });
    expect(sec).toBe(0);
  });
});

describe('computePauseDurationSec', () => {
  it('measures the gap between pausing and resuming', () => {
    const sec = computePauseDurationSec('2026-01-01T00:00:00.000Z', new Date('2026-01-01T00:01:30.000Z'));
    expect(sec).toBe(90);
  });

  it('never goes negative', () => {
    const sec = computePauseDurationSec('2026-01-01T00:01:00.000Z', new Date('2026-01-01T00:00:00.000Z'));
    expect(sec).toBe(0);
  });
});

describe('computeAvgPaceSecPerKm', () => {
  it('is time ÷ distance', () => {
    expect(computeAvgPaceSecPerKm(2400, 4)).toBe(600);
  });

  it('is null with no distance', () => {
    expect(computeAvgPaceSecPerKm(60, 0)).toBeNull();
  });
});
