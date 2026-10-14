/**
 * Map framing shared by every screen that draws a route on a small,
 * non-interactive map (Impact card, Recommended Routes cards). Returns the
 * shape react-native-maps' `Region` expects.
 */

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const SYDNEY_CBD: MapRegion = { latitude: -33.8688, longitude: 151.2093, latitudeDelta: 0.01, longitudeDelta: 0.01 };
const MIN_SPAN_DEG = 0.002;
const PADDING_FACTOR = 1.4;

/** Fits all points with some padding; Sydney CBD when there are none. */
export function regionForPoints(points: { lat: number; lng: number }[]): MapRegion {
  if (points.length === 0) return SYDNEY_CBD;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const p of points) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  }
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(maxLat - minLat, MIN_SPAN_DEG) * PADDING_FACTOR,
    longitudeDelta: Math.max(maxLng - minLng, MIN_SPAN_DEG) * PADDING_FACTOR,
  };
}
