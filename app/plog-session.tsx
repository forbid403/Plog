import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ButtonRound from '../src/components/ButtonRound';
import { useCurrentLocation } from '../src/hooks/useCurrentLocation';
import { usePlogSession } from '../src/hooks/usePlogSession';
import { formatDistanceKm, formatDuration } from '../src/lib/format';
import { computeDistanceKm, type RoutePoint } from '../src/lib/plogSessionDistance';
import { colors, spacing, typography } from '../src/theme';

// C3 doesn't give a number for "weak" — reusing C5's own low-accuracy
// cutoff (points worse than this are excluded from distance anyway).
const WEAK_SIGNAL_ACCURACY_M = 30;

/**
 * Recording screen (C3). Outside the (tabs) group so the floating tab bar
 * hides (spec 0.3). Points are accumulated here via *foreground*
 * useCurrentLocation — C3.1's background/expo-task-manager + expo-sqlite
 * point persistence isn't built yet, so recording doesn't survive
 * backgrounding or an app kill yet; usePlogSession's status/timing does.
 */
export default function PlogSessionScreen() {
  const insets = useSafeAreaInsets();
  const { status, elapsedSec, pause } = usePlogSession();
  const { permission } = useCurrentLocation(); // only need the permission check here, not its `location`
  const mapRef = useRef<MapView>(null);
  const [points, setPoints] = useState<RoutePoint[]>([]);

  // No in-progress session (finished/discarded, or landed here directly) — bail to idle.
  useEffect(() => {
    if (status === 'idle') router.back();
  }, [status]);

  // Points are appended from the watchPositionAsync callback, not the effect
  // body itself, so this isn't a synchronous setState-during-render pattern
  // — it's "subscribe to an external system, setState when it reports a change".
  useEffect(() => {
    if (status !== 'recording' || permission !== 'granted') return;
    let cancelled = false;
    let subscription: Location.LocationSubscription | undefined;

    Location.watchPositionAsync({ accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 5 }, (loc) => {
      if (cancelled) return;
      setPoints((prev) => [
        ...prev,
        { lat: loc.coords.latitude, lng: loc.coords.longitude, accuracy: loc.coords.accuracy, isPaused: false },
      ]);
      mapRef.current?.animateCamera({ center: { latitude: loc.coords.latitude, longitude: loc.coords.longitude } });
    }).then((sub) => {
      if (cancelled) sub.remove();
      else subscription = sub;
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [status, permission]);

  const accuracy = points.at(-1)?.accuracy ?? null;
  const gpsOk = accuracy !== null && accuracy <= WEAK_SIGNAL_ACCURACY_M;
  const distanceKm = computeDistanceKm(points);

  const onPause = async () => {
    await pause();
    // C4's finish sheet isn't built yet — this is the next checkbox.
  };

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={StyleSheet.absoluteFill} showsUserLocation showsMyLocationButton={false}>
        {points.length > 1 && (
          <Polyline
            coordinates={points.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
            strokeColor={colors.brand.primary['500']}
            strokeWidth={4}
          />
        )}
      </MapView>

      <View style={[styles.pill, styles.statusPill, { top: insets.top + spacing.s }]}>
        <Text style={styles.pillText}>{gpsOk ? 'Session on track' : 'Weak GPS signal'}</Text>
      </View>

      <View style={[styles.bottomBar, { bottom: insets.bottom + spacing.xl }]}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{formatDuration(elapsedSec)}</Text>
        </View>

        <ButtonRound size="display" variant="fill" tone="secondary" label="Pause" icon={null} onPress={onPause} />

        <View style={styles.pill}>
          <Text style={styles.pillText}>{formatDistanceKm(distanceKm, 2)} km</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusPill: {
    position: 'absolute',
    alignSelf: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: spacing.l,
    right: spacing.l,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  pill: {
    backgroundColor: colors.base.white,
    borderRadius: spacing.full,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
  },
  pillText: {
    fontFamily: typography.label.default.fontFamily,
    fontWeight: typography.label.default.fontWeight,
    fontSize: typography.label.default.fontSize,
    letterSpacing: typography.label.default.letterSpacing,
    color: colors.greyScale['900'],
  },
});
