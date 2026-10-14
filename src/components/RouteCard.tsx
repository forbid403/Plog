import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { formatElevationM, formatRouteDistanceKm } from '../lib/format';
import { regionForPoints } from '../lib/map-region';
import type { RecommendedRoute } from '../lib/routes';
import { colors, spacing, typography } from '../theme';

export type RouteCardProps = {
  route: RecommendedRoute;
  style?: StyleProp<ViewStyle>;
};

// Figma thumbnail aspect (Plog Design, node 618:3977 "image 9": 200×142).
const MAP_ASPECT_RATIO = 200 / 142;

/**
 * Recommended route card (B5; Figma: Plog Design, node 618:3976). The
 * thumbnail is a live, non-interactive map with the route drawn on it,
 * not a static image. Card tap (C7 route guide) isn't built yet.
 */
export default function RouteCard({ route, style }: RouteCardProps) {
  const points = route.path.flat();

  return (
    <View style={[styles.card, style]}>
      <View style={styles.map}>
        <MapView
          style={StyleSheet.absoluteFill}
          initialRegion={regionForPoints(points)}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
          toolbarEnabled={false}
          liteMode
          pointerEvents="none"
        >
          {route.path.map((segment, i) => (
            <Polyline
              key={i}
              coordinates={segment.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
              strokeColor={colors.red['500']}
              strokeWidth={3}
            />
          ))}
        </MapView>
      </View>

      <View style={styles.description}>
        <Text style={styles.name} numberOfLines={2}>
          {route.name}
        </Text>
        <View style={styles.numbers}>
          <View style={styles.stat}>
            <Text style={styles.value}>{formatRouteDistanceKm(route.distanceKm)}</Text>
            <Text style={styles.label}>Distance</Text>
          </View>
          {route.elevationGainM !== null && (
            <View style={styles.stat}>
              <Text style={styles.value}>{formatElevationM(route.elevationGainM)}</Text>
              <Text style={styles.label}>Elevation</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    // Figma uses #EBFBC9, which isn't in tokens.json yet — nearest token
    // until it's added in Tokens Studio.
    backgroundColor: colors.green['50'],
    borderRadius: spacing.xl,
    overflow: 'hidden',
    paddingBottom: spacing.m,
    gap: spacing.m,
  },
  map: {
    width: '100%',
    aspectRatio: MAP_ASPECT_RATIO,
    borderTopLeftRadius: spacing.l,
    borderTopRightRadius: spacing.l,
    overflow: 'hidden',
  },
  description: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.l,
    gap: spacing.s,
  },
  name: {
    fontFamily: typography.headline.fontFamily,
    fontWeight: typography.headline.fontWeight,
    fontSize: typography.headline.fontSize,
    letterSpacing: typography.headline.letterSpacing,
    color: colors.greyScale['800'],
  },
  numbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    minWidth: '45%',
  },
  value: {
    fontFamily: typography.body.smallBold.fontFamily,
    fontWeight: typography.body.smallBold.fontWeight,
    fontSize: typography.body.smallBold.fontSize,
    letterSpacing: typography.body.smallBold.letterSpacing,
    color: colors.greyScale['800'],
  },
  label: {
    fontFamily: typography.body.extraSmall.fontFamily,
    fontWeight: typography.body.extraSmall.fontWeight,
    fontSize: typography.body.extraSmall.fontSize,
    letterSpacing: typography.body.extraSmall.letterSpacing,
    color: colors.greyScale['500'],
  },
});
