import { regionForPoints } from './map-region';

describe('regionForPoints', () => {
  it('falls back to Sydney CBD with no points', () => {
    expect(regionForPoints([]).latitude).toBeCloseTo(-33.8688);
  });

  it('centres on the bounding box with padding', () => {
    const r = regionForPoints([
      { lat: -33.9, lng: 151.2 },
      { lat: -33.8, lng: 151.3 },
    ]);
    expect(r.latitude).toBeCloseTo(-33.85);
    expect(r.longitude).toBeCloseTo(151.25);
    expect(r.latitudeDelta).toBeCloseTo(0.14);
  });

  it('keeps a minimum span for a single point', () => {
    expect(regionForPoints([{ lat: -33.9, lng: 151.2 }]).latitudeDelta).toBeCloseTo(0.0028);
  });
});
