import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ButtonRound from '../src/components/ButtonRound';
import { useCurrentLocation } from '../src/hooks/useCurrentLocation';
import { usePlogSession } from '../src/hooks/usePlogSession';
import { formatDistanceKm, formatDuration } from '../src/lib/format';
import { getPointsForSession, type PlogPointRow } from '../src/lib/plogPointsDb';
import { computeDistanceKm, type RoutePoint } from '../src/lib/plogSessionDistance';
import { colors, spacing, typography } from '../src/theme';

// C3 doesn't give a number for "weak" — reusing C5's own low-accuracy
// cutoff (points worse than this are excluded from distance anyway).
const WEAK_SIGNAL_ACCURACY_M = 30;
const POINTS_POLL_INTERVAL_MS = 2000;

function toRoutePoint(row: PlogPointRow): RoutePoint {
  return { lat: row.lat, lng: row.lng, accuracy: row.accuracy, isPaused: row.is_paused === 1 };
}

/**
 * Recording screen (C3). Outside the (tabs) group so the floating tab bar
 * hides (spec 0.3). GPS points are written by the background location task
 * (C3.1, backgroundLocationTask.ts) straight to SQLite — this screen only
 * *reads* them (polling plog_points), per spec. `useCurrentLocation` here
 * is foreground-only and just drives the camera-follow + status pill, it
 * doesn't record anything itself (recording keeps going if this screen
 * unmounts/the app backgrounds; the DB is the source of truth).
 */
export default function PlogSessionScreen() {
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const { status, sessionId, elapsedSec, pause } = usePlogSession();
  const { location } = useCurrentLocation();
  const mapRef = useRef<MapView>(null);
  const [points, setPoints] = useState<PlogPointRow[]>([]);

  // No in-progress session (finished/discarded, or landed here directly) — bail to idle.
  useEffect(() => {
    if (status === 'idle') router.back();
  }, [status]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    const poll = () => {
      getPointsForSession(db, sessionId).then((rows) => {
        if (!cancelled) setPoints(rows);
      });
    };

    poll();
    const interval = setInterval(poll, POINTS_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [db, sessionId]);

  useEffect(() => {
    if (!location) return;
    mapRef.current?.animateCamera({
      center: { latitude: location.coords.latitude, longitude: location.coords.longitude },
    });
  }, [location]);

  const accuracy = location?.coords.accuracy ?? null;
  const gpsOk = accuracy !== null && accuracy <= WEAK_SIGNAL_ACCURACY_M;
  const distanceKm = computeDistanceKm(points.map(toRoutePoint));

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
