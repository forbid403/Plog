/**
 * Recommended Routes (B5): filtering, nearest-first sorting and the map
 * framing for the route cards. Pure — the screen fetches routes and passes
 * them in.
 */

export type RouteType = 'loop' | 'one_way';
export type RouteFilter = 'all' | RouteType;

export type LatLng = { lat: number; lng: number };

export type RecommendedRoute = {
  id: string;
  name: string;
  type: RouteType;
  distanceKm: number;
  elevationGainM: number | null;
  start: LatLng;
  /** Line segments, each a list of points (see the routes migration). */
  path: LatLng[][];
};

/** B5 [Proposed]: up to 10, nearest start point first. */
export const MAX_RECOMMENDED_ROUTES = 10;

const EARTH_RADIUS_M = 6371000;
const toRadians = (deg: number) => (deg * Math.PI) / 180;

function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function pickRecommendedRoutes(routes: RecommendedRoute[], origin: LatLng, filter: RouteFilter): RecommendedRoute[] {
  return routes
    .filter((r) => filter === 'all' || r.type === filter)
    .map((r) => ({ route: r, meters: haversineMeters(origin, r.start) }))
    .sort((a, b) => a.meters - b.meters)
    .slice(0, MAX_RECOMMENDED_ROUTES)
    .map((x) => x.route);
}
