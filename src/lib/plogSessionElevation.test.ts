import type { RoutePoint } from './plogSessionDistance';
import { computeElevationGainM } from './plogSessionElevation';

const at = (alt: number | null, overrides: Partial<RoutePoint> = {}): RoutePoint => ({
  lat: 0,
  lng: 0,
  alt,
  accuracy: 5,
  isPaused: false,
  ...overrides,
});

describe('computeElevationGainM', () => {
  it('is 0 for fewer than 2 points', () => {
    expect(computeElevationGainM([])).toBe(0);
    expect(computeElevationGainM([at(10)])).toBe(0);
  });

  it('sums only positive changes', () => {
    expect(computeElevationGainM([at(10), at(20), at(5), at(15)])).toBe(20);
  });

  it('ignores jitter under 3m', () => {
    expect(computeElevationGainM([at(10), at(12), at(10), at(12.9), at(10)])).toBe(0);
  });

  it('counts exactly 3m', () => {
    expect(computeElevationGainM([at(10), at(13)])).toBe(3);
  });

  it('counts a slow climb once it adds up to 3m', () => {
    expect(computeElevationGainM([at(10), at(11), at(12), at(13), at(14)])).toBe(3);
  });

  it('skips paused, low-accuracy and no-altitude points', () => {
    expect(
      computeElevationGainM([at(10), at(50, { isPaused: true }), at(50, { accuracy: 50 }), at(null), at(10)])
    ).toBe(0);
  });
});
