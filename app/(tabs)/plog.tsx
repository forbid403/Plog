import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../src/components/Button';
import ButtonRound from '../../src/components/ButtonRound';
import CircleIconButton from '../../src/components/CircleIconButton';
import LocateIcon from '../../src/components/icons/LocateIcon';
import { useCurrentLocation } from '../../src/hooks/useCurrentLocation';
import { usePlogSession } from '../../src/hooks/usePlogSession';
import { shadowLayerToStyle } from '../../src/lib/shadow';
import { formatDistanceKm, formatDuration } from '../../src/lib/format';
import { getPointsForSession, type PlogPointRow } from '../../src/lib/plogPointsDb';
import { computeDistanceKm, type RoutePoint } from '../../src/lib/plogSessionDistance';
import { colors, shadows, spacing, typography } from '../../src/theme';

// [Proposed] — spec (C2) says "until accuracy is acceptable" without a
// number; 20m horizontal accuracy is our own threshold, not Figma/spec.
const ACCEPTABLE_ACCURACY_M = 20;
// C3 doesn't give a number for "weak" either — reusing C5's own low-accuracy
// cutoff (points worse than this are excluded from distance anyway).
const WEAK_SIGNAL_ACCURACY_M = 30;
const POINTS_POLL_INTERVAL_MS = 2000;

// The re-centre button needs to read clearly over a busy map, so it's solid
// white + a real shadow here instead of CircleIconButton's default "glass"
// look (shared with TopBar's back/menu buttons, which sit over a flat
// header bg, not a map).
const recentreShadowStyle = shadowLayerToStyle(shadows.normal[1]);

// Sydney — reasonable fallback center before the first GPS fix arrives.
const FALLBACK_REGION = {
  latitude: -33.8688,
  longitude: 151.2093,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

function toRoutePoint(row: PlogPointRow): RoutePoint {
  return { lat: row.lat, lng: row.lng, accuracy: row.accuracy, isPaused: row.is_paused === 1 };
}

/**
 * Plog tab (C1-C3): idle and recording are one screen, branching on
 * usePlogSession().status, rather than a route change between them — a
 * separate /plog-session route had a whole class of navigation/hydration
 * races (see git history) that just don't exist with no navigation at all.
 * Tab bar hiding while recording (spec 0.3) is handled by
 * app/(tabs)/_layout.tsx reading this same status, not by leaving this
 * route group.
 */
export default function PlogScreen() {
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const { permission, location } = useCurrentLocation();
  const { status, sessionId, elapsedSec, start, pause } = usePlogSession();
  const mapRef = useRef<MapView>(null);
  const [following, setFollowing] = useState(true);
  const [points, setPoints] = useState<PlogPointRow[]>([]);

  const recording = status !== 'idle';

  useEffect(() => {
    if (!location || !following) return;
    mapRef.current?.animateCamera({
      center: { latitude: location.coords.latitude, longitude: location.coords.longitude },
    });
  }, [location, following]);

  // GPS points are only relevant once a session exists — polls plog_points
  // (written by the background task, C3.1) while recording/paused. No need
  // to reset `points` to [] when sessionId goes null: that only happens
  // leaving `recording`, which is exactly when this data stops being
  // rendered, and the next session's first poll overwrites it anyway.
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

  const recentre = () => setFollowing(true);

  if (permission === 'denied') {
    return (
      <View style={styles.permissionContainer}>
        {/* Exact copy isn't in the spec (C2 just says "permission message") — flagging rather than inventing final copy. */}
        <Text style={styles.permissionText}>Plog needs your location to record a session.</Text>
        <Button label="Open Settings" onPress={() => Linking.openSettings()} />
      </View>
    );
  }

  const accuracy = location?.coords.accuracy ?? null;
  const gpsReady = accuracy !== null && accuracy <= ACCEPTABLE_ACCURACY_M;
  const gpsOk = accuracy !== null && accuracy <= WEAK_SIGNAL_ACCURACY_M;
  const distanceKm = computeDistanceKm(points.map(toRoutePoint));

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={FALLBACK_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        zoomEnabled
        zoomTapEnabled
        onPanDrag={() => setFollowing(false)}
      >
        {recording && points.length > 1 && (
          <Polyline
            coordinates={points.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
            strokeColor={colors.brand.primary['500']}
            strokeWidth={4}
          />
        )}
      </MapView>

      {recording ? (
        <View style={[styles.pill, styles.statusPill, { top: insets.top + spacing.s }]}>
          <Text style={styles.pillText}>{gpsOk ? 'Session on track' : 'Weak GPS signal'}</Text>
        </View>
      ) : (
        // Spec (C2) says show this only after panning [Recommended, not
        // Confirmed] — always-visible is the more discoverable, more common
        // pattern (Google/Apple Maps etc.) and matches direct testing
        // feedback that the conditional version was easy to miss.
        <CircleIconButton
          accessibilityLabel="Re-centre on my location"
          onPress={recentre}
          icon={({ color, size }) => <LocateIcon color={color} size={size} />}
          style={[styles.recentreButton, recentreShadowStyle, { bottom: insets.bottom + 82 + spacing.l }]}
        />
      )}

      {/* No Figma reference for this screen's exact layout — bottom offset is
          sized to clear the floating BottomNavigation (~82px tall incl. its
          own bottom gap) plus a margin, not a spec'd number. */}
      {recording ? (
        <View style={[styles.bottomBar, { bottom: insets.bottom + spacing.xl }]}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{formatDuration(elapsedSec)}</Text>
          </View>

          <ButtonRound size="display" variant="fill" tone="secondary" label="Pause" icon={null} onPress={pause} />

          <View style={styles.pill}>
            <Text style={styles.pillText}>{formatDistanceKm(distanceKm, 2)} km</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.startButtonWrapper, { bottom: insets.bottom + 82 + spacing.l }]}>
          <ButtonRound
            size="display"
            variant="fill"
            label={gpsReady ? 'Start' : 'Finding GPS…'}
            icon={null}
            disabled={!gpsReady}
            onPress={start}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  recentreButton: {
    position: 'absolute',
    right: spacing.l,
    backgroundColor: colors.base.white,
    borderColor: colors.base.white,
  },
  statusPill: {
    position: 'absolute',
    alignSelf: 'center',
  },
  startButtonWrapper: {
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
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    gap: spacing.l,
  },
  permissionText: {
    fontFamily: typography.body.base.fontFamily,
    fontWeight: typography.body.base.fontWeight,
    fontSize: typography.body.base.fontSize,
    letterSpacing: typography.body.base.letterSpacing,
    color: colors.greyScale['800'],
    textAlign: 'center',
  },
});
