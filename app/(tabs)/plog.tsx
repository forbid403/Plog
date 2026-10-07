import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../src/components/Button';
import ButtonRound from '../../src/components/ButtonRound';
import CircleIconButton from '../../src/components/CircleIconButton';
import CaretDownIcon from '../../src/components/icons/CaretDownIcon';
import LocateIcon from '../../src/components/icons/LocateIcon';
import PauseIcon from '../../src/components/icons/PauseIcon';
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
// Figma: Shadow_Emphasize on the status pill (Plog Design, node 681:2047).
const statusPillShadowStyle = shadowLayerToStyle(shadows.emphasize[0]);

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
 *
 * Recording UI matches Figma (Plog Design, node 681:2047 "Track - On
 * going") — a bottom sheet with Time/Pause/Distance, not the floating
 * pills an earlier version had before that reference existed. Idle UI has
 * no Figma reference, unchanged from before.
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
            strokeColor={colors.blue['500']}
            strokeWidth={4}
          />
        )}
      </MapView>

      {recording ? (
        <>
          {/* Figma doesn't document what this does (no "Expand" state was
              given, just this "Collapse" one) — wired to re-centre as the
              most useful existing action, not a guessed new feature. */}
          <CircleIconButton
            accessibilityLabel="Collapse"
            onPress={recentre}
            icon={({ size }) => <CaretDownIcon color={colors.brand.primary['700']} size={size} />}
            style={[styles.collapseButton, { top: insets.top + spacing.s }]}
          />

          <View style={[styles.statusPill, statusPillShadowStyle, { top: insets.top + spacing.s }]}>
            {/* Figma only shows the happy path ("session on track") — spec
                C3 also defines a "Weak GPS signal" state [Proposed], kept
                from the earlier implementation rather than dropped. */}
            <Text style={styles.statusPillText}>{gpsOk ? 'session on track' : 'Weak GPS signal'}</Text>
          </View>

          <View style={[styles.sheet, { paddingBottom: insets.bottom || spacing.m }]}>
            <View style={styles.handle} />
            <View style={styles.sheetGrid}>
              <View style={styles.metricColumn}>
                <Text style={styles.metricValue}>{formatDuration(elapsedSec)}</Text>
                <Text style={styles.metricLabel}>Time</Text>
              </View>

              <ButtonRound
                size="big"
                variant="fill"
                tone="secondary"
                icon={({ color, size }) => <PauseIcon color={color} size={size} />}
                onPress={pause}
                accessibilityLabel="Pause"
              />

              <View style={styles.metricColumn}>
                <Text style={styles.metricValue}>{formatDistanceKm(distanceKm, 2)}</Text>
                <Text style={styles.metricLabel}>Distance (km)</Text>
              </View>
            </View>
          </View>
        </>
      ) : (
        <>
          {/* Spec (C2) says show this only after panning [Recommended, not
              Confirmed] — always-visible is the more discoverable, more
              common pattern (Google/Apple Maps etc.) and matches direct
              testing feedback that the conditional version was easy to miss. */}
          <CircleIconButton
            accessibilityLabel="Re-centre on my location"
            onPress={recentre}
            icon={({ color, size }) => <LocateIcon color={color} size={size} />}
            style={[styles.recentreButton, recentreShadowStyle, { bottom: insets.bottom + 82 + spacing.l }]}
          />

          {/* No Figma reference for the idle screen's exact layout — bottom
              offset clears the floating BottomNavigation (~82px tall incl.
              its own gap), not a spec'd number. */}
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
        </>
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
  startButtonWrapper: {
    position: 'absolute',
    alignSelf: 'center',
  },
  collapseButton: {
    position: 'absolute',
    left: spacing['2xl'],
    backgroundColor: colors.brand.primary['50'],
    borderColor: colors.brand.primary['50'],
  },
  statusPill: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: colors.brand.primary['300'],
    borderWidth: 1,
    borderColor: colors.brand.primary['100'],
    borderRadius: spacing.full,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
  },
  statusPillText: {
    fontFamily: typography.body.base.fontFamily,
    fontWeight: typography.body.base.fontWeight,
    fontSize: typography.body.base.fontSize,
    letterSpacing: typography.body.base.letterSpacing,
    color: colors.greyScale['800'],
    textAlign: 'center',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    backgroundColor: colors.greyScale['50'],
    borderTopLeftRadius: spacing.xl,
    borderTopRightRadius: spacing.xl,
    paddingHorizontal: spacing.l,
  },
  handle: {
    width: 90,
    height: 4,
    borderRadius: spacing.xs,
    backgroundColor: colors.greyScale['400'],
    marginTop: 10,
    marginBottom: spacing.l,
  },
  sheetGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
    paddingBottom: spacing.l,
  },
  metricColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.m,
    gap: spacing['3xs'],
  },
  metricValue: {
    fontFamily: typography.titles.display.fontFamily,
    fontWeight: typography.titles.display.fontWeight,
    fontSize: typography.titles.display.fontSize,
    lineHeight: typography.titles.display.lineHeight,
    color: colors.base.black,
    textAlign: 'center',
  },
  metricLabel: {
    fontFamily: typography.body.small.fontFamily,
    fontWeight: typography.body.small.fontWeight,
    fontSize: typography.body.small.fontSize,
    letterSpacing: typography.body.small.letterSpacing,
    color: colors.base.black,
    textAlign: 'center',
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
