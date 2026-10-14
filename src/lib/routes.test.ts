import { MAX_RECOMMENDED_ROUTES, pickRecommendedRoutes, type RecommendedRoute } from './routes';

const route = (id: string, type: RecommendedRoute['type'], lat: number, lng: number): RecommendedRoute => ({
  id,
  name: id,
  type,
  distanceKm: 5,
  elevationGainM: 10,
  start: { lat, lng },
  path: [],
});

const surryHills = { lat: -33.8886, lng: 151.2094 };
const bondi = route('bondi', 'one_way', -33.8915, 151.2767);
const bayRun = route('bayRun', 'loop', -33.8578, 151.1393);
const paddington = route('paddington', 'loop', -33.8847, 151.2265);

describe('pickRecommendedRoutes', () => {
  it('sorts by distance from the user to each start point', () => {
    expect(pickRecommendedRoutes([bondi, bayRun, paddington], surryHills, 'all').map((r) => r.id)).toEqual([
      'paddington',
      'bondi',
      'bayRun',
    ]);
  });

  it('filters by type', () => {
    expect(pickRecommendedRoutes([bondi, bayRun, paddington], surryHills, 'loop').map((r) => r.id)).toEqual(['paddington', 'bayRun']);
    expect(pickRecommendedRoutes([bondi, bayRun, paddington], surryHills, 'one_way').map((r) => r.id)).toEqual(['bondi']);
  });

  it('returns an empty list when nothing matches', () => {
    expect(pickRecommendedRoutes([bayRun], surryHills, 'one_way')).toEqual([]);
  });

  it(`caps at ${MAX_RECOMMENDED_ROUTES}`, () => {
    const many = Array.from({ length: 15 }, (_, i) => route(`r${i}`, 'loop', -33.88 - i * 0.01, 151.2));
    expect(pickRecommendedRoutes(many, surryHills, 'all')).toHaveLength(MAX_RECOMMENDED_ROUTES);
  });
});
