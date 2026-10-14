import { supabase } from './supabase';
import type { LatLng, RecommendedRoute, RouteType } from '../lib/routes';

type RouteRow = {
  id: string;
  name: string;
  type: RouteType;
  distance_km: number | string;
  elevation_gain_m: number | null;
  start_lat: number;
  start_lng: number;
  path: LatLng[][];
};

/**
 * B5: the whole curated routes catalog (a few dozen rows at most —
 * filtering and nearest-first sorting happen in src/lib/routes.ts).
 */
export async function listRoutes(): Promise<RecommendedRoute[]> {
  const { data, error } = await supabase
    .from('routes')
    .select('id, name, type, distance_km, elevation_gain_m, start_lat, start_lng, path');
  if (error) throw error;
  return (data as RouteRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    // numeric columns can arrive as strings from PostgREST
    distanceKm: Number(row.distance_km),
    elevationGainM: row.elevation_gain_m,
    start: { lat: row.start_lat, lng: row.start_lng },
    path: row.path,
  }));
}
