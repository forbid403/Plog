import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import MapView, { Circle, Polyline } from 'react-native-maps';
import { regionForPoints } from '../lib/map-region';
import { colors } from '../theme';

export type RouteMapPreviewProps = {
  points: { lat: number; lng: number }[];
  /** F2: start and end markers on the route. */
  showEndpoints?: boolean;
  style?: StyleProp<ViewStyle>;
};

const ENDPOINT_RADIUS_M = 12;

/** Non-interactive map fitted to a session's route (feed thumbnail, session detail). */
export default function RouteMapPreview({ points, showEndpoints = false, style }: RouteMapPreviewProps) {
  const coords = points.map((p) => ({ latitude: p.lat, longitude: p.lng }));
  const start = coords[0];
  const end = coords[coords.length - 1];

  return (
    <View style={[styles.frame, style]} pointerEvents="none">
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={regionForPoints(points)}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        toolbarEnabled={false}
        liteMode
      >
        {coords.length > 1 && <Polyline coordinates={coords} strokeColor={colors.red['500']} strokeWidth={3} />}
        {showEndpoints && start && (
          <Circle center={start} radius={ENDPOINT_RADIUS_M} fillColor={colors.brand.primary['500']} strokeColor={colors.base.white} strokeWidth={2} />
        )}
        {showEndpoints && end && coords.length > 1 && (
          <Circle center={end} radius={ENDPOINT_RADIUS_M} fillColor={colors.red['500']} strokeColor={colors.base.white} strokeWidth={2} />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
  },
});
