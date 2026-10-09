import { computeDistanceKm, splitActiveSegments, type RoutePoint } from './plogSessionDistance';

const point = (lat: number, lng: number, overrides: Partial<RoutePoint> = {}): RoutePoint => ({
  lat,
  lng,
  alt: null,
  accuracy: 5,
  isPaused: false,
  ...overrides,
});

describe('computeDistanceKm', () => {
  it('is 0 for fewer than 2 points', () => {
    expect(computeDistanceKm([])).toBe(0);
    expect(computeDistanceKm([point(0, 0)])).toBe(0);
  });

  it('sums distance between consecutive points (roughly, via known lat delta)', () => {
    // 0.01 degrees latitude is ~1.11km
    const km = computeDistanceKm([point(0, 0), point(0.01, 0)]);
    expect(km).toBeCloseTo(1.11, 1);
  });

  it('excludes points with accuracy worse than 30m without breaking the route', () => {
    const withBadPoint = computeDistanceKm([point(0, 0), point(0.005, 0, { accuracy: 50 }), point(0.01, 0)]);
    const withoutBadPoint = computeDistanceKm([point(0, 0), point(0.01, 0)]);
    expect(withBadPoint).toBeCloseTo(withoutBadPoint, 5);
  });

  it('measures nothing across a pause', () => {
    // Moved ~1.11km while paused: neither the paused leg nor the straight
    // line from pause to resume counts — only the two active legs.
    const km = computeDistanceKm([
      point(0, 0),
      point(0.001, 0),
      point(0.005, 0, { isPaused: true }),
      point(0.011, 0),
      point(0.012, 0),
    ]);
    expect(km).toBeCloseTo(0.222, 2);
  });

  it('treats null accuracy as unusable', () => {
    const km = computeDistanceKm([point(0, 0), point(0.01, 0, { accuracy: null })]);
    expect(km).toBe(0);
  });
});

describe('splitActiveSegments', () => {
  it('is one segment with no pauses', () => {
    expect(splitActiveSegments([point(0, 0), point(1, 0)])).toHaveLength(1);
  });

  it('splits at paused points and drops them', () => {
    const segments = splitActiveSegments([
      point(0, 0),
      point(1, 0),
      point(2, 0, { isPaused: true }),
      point(3, 0, { isPaused: true }),
      point(4, 0),
      point(5, 0),
    ]);
    expect(segments.map((s) => s.map((p) => p.lat))).toEqual([
      [0, 1],
      [4, 5],
    ]);
  });

  it('drops segments too short to draw', () => {
    expect(splitActiveSegments([point(0, 0), point(1, 0, { isPaused: true }), point(2, 0)])).toEqual([]);
  });
});
