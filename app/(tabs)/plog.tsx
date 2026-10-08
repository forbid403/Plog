import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { type BottomSheetHandle } from '../../src/components/BottomSheet';
import Button from '../../src/components/Button';
import ButtonRound from '../../src/components/ButtonRound';
import CircleIconButton from '../../src/components/CircleIconButton';
import ArrowRightIcon from '../../src/components/icons/ArrowRightIcon';
import CaretDownIcon from '../../src/components/icons/CaretDownIcon';
import FlagCheckeredIcon from '../../src/components/icons/FlagCheckeredIcon';
import LocateIcon from '../../src/components/icons/LocateIcon';
import PauseIcon from '../../src/components/icons/PauseIcon';
import PlayIcon from '../../src/components/icons/PlayIcon';
import { useCurrentLocation } from '../../src/hooks/useCurrentLocation';
import { usePlogSession } from '../../src/hooks/usePlogSession';
import { shadowLayerToStyle } from '../../src/lib/shadow';
import { formatDistanceKm, formatDuration, formatPace } from '../../src/lib/format';
import { createSession } from '../../src/api/sessions';
import { deletePointsForSession, getPointsForSession, type PlogPointRow } from '../../src/lib/plogPointsDb';
import { computeDistanceKm, type RoutePoint } from '../../src/lib/plogSessionDistance';
import { computeElevationGainM } from '../../src/lib/plogSessionElevation';
import { computeAvgPaceSecPerKm } from '../../src/lib/plogSessionTime';
import { colors, shadows, spacing, typography } from '../../src/theme';

// [Proposed] — spec (C2) says "until accuracy is acceptable" without a
// number; 20m horizontal accuracy is our own threshold, not Figma/spec.
const ACCEPTABLE_ACCURACY_M = 20;
// C3 doesn't give a number for "weak" either — reusing C5's own low-accuracy
// cutoff (points worse than this are excluded from distance anyway).
const WEAK_SIGNAL_ACCURACY_M = 30;
const POINTS_POLL_INTERVAL_MS = 2000;
// C4's minimum session: under 1 minute or under 0.1 km cannot be saved.
const MIN_SESSION_SEC = 60;
const MIN_SESSION_KM = 0.1;

// The re-centre button needs to read clearly over a busy map, so it's solid
// white + a real shadow here instead of CircleIconButton's default "glass"
// look (shared with TopBar's back/menu buttons, which sit over a flat
// header bg, not a map).
const recentreShadowStyle = shadowLayerToStyle(shadows.normal[1]);
// Figma: Shadow_Emphasize on the status pill (Plog Design, node 681:2047).
const statusPillShadowStyle = shadowLayerToStyle(shadows.emphasize[0]);

// No Figma reference for this element while recording (117:518's sheet
// frames don't include it) — clears the collapsed sheet's approximate
// height (handle + button row + padding), not a spec'd number. Doesn't
// track the sheet's expanded height; expanding covers it, same tradeoff
// the idle screen's own approximated offset already makes.
const RECORDING_RECENTRE_BOTTOM = 150;

// Sydney — reasonable fallback center before the first GPS fix arrives.
const FALLBACK_REGION = {
  latitude: -33.8688,
  longitude: 151.2093,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

function toRoutePoint(row: PlogPointRow): RoutePoint {
  return { lat: row.lat, lng: row.lng, alt: row.alt, accuracy: row.accuracy, isPaused: row.is_paused === 1 };
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
 * going" + node 117:518 "TrackingBottomSheet" for its Collapse/Expand ×
 * Default/Paused states). Idle UI has no Figma reference, unchanged.
 */
export default function PlogScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useSQLiteContext();
  const { permission, location } = useCurrentLocation();
  const { status, sessionId, elapsedSec, start, pause, resume, finish, discard } = usePlogSession();
  const mapRef = useRef<MapView>(null);
  const finishSheetRef = useRef<BottomSheetHandle>(null);
  const [following, setFollowing] = useState(true);
  const [points, setPoints] = useState<PlogPointRow[]>([]);
  const [expanded, setExpanded] = useState(false);

  const recording = status !== 'idle';
  const paused = status === 'paused';

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

  // Shared by the back button (confirmed directly, not from Figma's export
  // — the back button isn't part of the guard sheet below) and the guard
  // sheet's own "Discard this session" link (node 681:2058) — same copy,
  // same destructive action either way.
  const confirmDiscard = () => {
    Alert.alert('Discard this session?', "This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => discard() },
    ]);
  };

  // Figma (node 117:518): expand/collapse is a drag on the sheet's own
  // "Drag Area" handle, not a tap — swipe the handle up to expand, down to
  // collapse. 20px is an unspec'd threshold, same kind of approximation as
  // this screen's other unnumbered gesture/accuracy constants.
  const dragResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy < -20) setExpanded(true);
          else if (gesture.dy > 20) setExpanded(false);
        },
      }),
    []
  );

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
  const routePoints = points.map(toRoutePoint);
  const distanceKm = computeDistanceKm(routePoints);
  const distanceText = formatDistanceKm(distanceKm, 2);
  const elevGainM = computeElevationGainM(routePoints);
  const elevGainText = String(elevGainM);
  const avgPaceSecPerKm = computeAvgPaceSecPerKm(elapsedSec, distanceKm);
  // Spec doesn't define pace before any distance exists — 0′00″ until then.
  const paceText = formatPace(avgPaceSecPerKm ?? 0);

  // C4: tapping Finish on a too-short session shows the "too short" message
  // with Resume/Discard instead of saving — no Figma reference for this
  // state (unlike the guard sheet below), so it's a plain Alert rather
  // than a guessed-at sheet layout. Otherwise opens the real "Finished
  // your plog session?" guard sheet (Figma node 681:2058, named
  // "Accidental-tap guard").
  const handleFinishPress = () => {
    if (elapsedSec < MIN_SESSION_SEC || distanceKm < MIN_SESSION_KM) {
      Alert.alert('This session is too short to save.', undefined, [
        { text: 'Resume', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => discard() },
      ]);
      return;
    }
    finishSheetRef.current?.open();
  };

  // Guard sheet's Resume: closes the sheet and un-pauses if paused
  // (resume() itself no-ops if not paused). Finish & Log litter: ends the
  // session, then continues into Litter log (D) for that session.
  const handleGuardResume = () => {
    finishSheetRef.current?.close();
    resume();
  };
  const handleGuardFinish = async () => {
    finishSheetRef.current?.close();
    const summary = await finish();
    try {
      // C6: creates the sessions row now (litter fields left null — D7's
      // updateLitter fills those in from the Litter log screen).
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const session = await createSession({
        startedAt: summary.startedAt,
        endedAt: summary.endedAt,
        timezone,
        durationSec: summary.durationSec,
        distanceKm,
        elevationGainM: elevGainM,
        avgPaceSecPerKm,
        route: points.map((p) => ({ lat: p.lat, lng: p.lng, alt: p.alt, t: p.t })),
      });
      // Only cleaned up on a successful save — see usePlogSession.finish()'s
      // own comment: C6 reads plog_points and cleans them up, not finish().
      await deletePointsForSession(db, summary.id);
      router.push({ pathname: '/litter-log', params: { sessionId: session.id } });
    } catch (e) {
      // C6's own flagged gap: "On network failure: keep locally, retry,
      // don't block Litter log" [Proposed] isn't built — this just surfaces
      // the failure. plog_points are deliberately left in place (not
      // deleted) so the route data isn't lost, but there's no retry UI yet
      // to act on that.
      console.error('[plog] failed to save session:', e);
      Alert.alert('Could not save your session', 'Check your connection and try again.');
    }
  };

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
          <CircleIconButton
            accessibilityLabel="Back"
            onPress={confirmDiscard}
            icon={({ size }) => <CaretDownIcon color={colors.brand.primary['700']} size={size} />}
            style={[styles.collapseButton, { top: insets.top + spacing.s }]}
          />

          {/* C2's "re-centre on my location" button (idle screen) applies
              here too — kept visible while recording, above the sheet. */}
          <CircleIconButton
            accessibilityLabel="Re-centre on my location"
            onPress={recentre}
            icon={({ color, size }) => <LocateIcon color={color} size={size} />}
            style={[
              styles.recentreButton,
              recentreShadowStyle,
              { bottom: insets.bottom + RECORDING_RECENTRE_BOTTOM },
            ]}
          />

          <View style={[styles.statusPill, statusPillShadowStyle, { top: insets.top + spacing.s }]}>
            {/* Figma only shows the happy path ("session on track") — spec
                C3 also defines a "Weak GPS signal" state [Proposed], kept
                from the earlier implementation rather than dropped. */}
            <Text style={styles.statusPillText}>{gpsOk ? 'session on track' : 'Weak GPS signal'}</Text>
          </View>

          <View
            style={[
              styles.sheet,
              { paddingBottom: insets.bottom || spacing.m },
              paused && { backgroundColor: colors.brand.secondary['200'] },
            ]}
          >
            <View
              {...dragResponder.panHandlers}
              style={styles.handleArea}
              accessibilityRole="adjustable"
              accessibilityLabel={expanded ? 'Collapse' : 'Expand'}
            >
              <View style={styles.handle} />
            </View>

            {expanded ? (
              // Distinct `key`s so expand/collapse fully unmounts and
              // remounts this subtree instead of React reusing the same
              // host Views across fundamentally different flex layouts
              // (width:'50%' grid vs flex:1 row) — without it, Yoga's
              // cached layout from the old shape bled into the new one on
              // toggle, skewing the collapsed row's column widths.
              <View key="expand" style={styles.expandContent}>
                <View style={styles.expandGrid}>
                  <View style={styles.expandMetricColumn}>
                    <Text style={styles.metricValue}>{formatDuration(elapsedSec)}</Text>
                    <Text style={styles.metricLabel}>Time</Text>
                  </View>
                  <View style={styles.expandMetricColumn}>
                    <Text style={styles.metricValue}>{distanceText}</Text>
                    <Text style={styles.metricLabel}>Distance (km)</Text>
                  </View>
                  <View style={styles.expandMetricColumn}>
                    <Text style={styles.metricValue}>{elevGainText}</Text>
                    <Text style={styles.metricLabel}>Elev.gain(m)</Text>
                  </View>
                  <View style={styles.expandMetricColumn}>
                    <Text style={styles.metricValue}>{paceText}</Text>
                    <Text style={styles.metricLabel}>Pace</Text>
                  </View>
                </View>

                <View style={styles.expandButtons}>
                  {paused ? (
                    <Button
                      label="Resume"
                      size="full"
                      onPress={resume}
                      leadIcon={({ size }) => <PlayIcon color={colors.greyScale['900']} size={size} />}
                      style={{ backgroundColor: colors.brand.primary['300'] }}
                    />
                  ) : (
                    <Button
                      label="Pause"
                      size="full"
                      onPress={pause}
                      leadIcon={({ size }) => <PauseIcon color={colors.greyScale['900']} size={size} />}
                      style={{ backgroundColor: colors.brand.secondary['300'] }}
                    />
                  )}
                  <Button
                    label="Finish"
                    size="full"
                    onPress={handleFinishPress}
                    leadIcon={({ size }) => <FlagCheckeredIcon color={colors.greyScale['900']} size={size} />}
                    style={{ backgroundColor: colors.orange['500'] }}
                  />
                </View>
              </View>
            ) : (
              <View key="collapse" style={styles.collapseGrid}>
                <View style={styles.collapseMetricColumn}>
                  <Text style={styles.metricValue}>{formatDuration(elapsedSec)}</Text>
                  <Text style={styles.metricLabel}>Time</Text>
                </View>

                {paused ? (
                  <ButtonRound
                    size="big"
                    variant="fill"
                    style={{ backgroundColor: colors.brand.primary['300'] }}
                    icon={({ size }) => <PlayIcon color={colors.greyScale['900']} size={size} />}
                    onPress={resume}
                    accessibilityLabel="Resume"
                  />
                ) : (
                  <ButtonRound
                    size="big"
                    variant="fill"
                    style={{ backgroundColor: colors.brand.secondary['300'] }}
                    icon={({ size }) => <PauseIcon color={colors.greyScale['900']} size={size} />}
                    onPress={pause}
                    accessibilityLabel="Pause"
                  />
                )}

                <View style={styles.collapseMetricColumn}>
                  <Text style={styles.metricValue}>{distanceText}</Text>
                  <Text style={styles.metricLabel}>Distance (km)</Text>
                </View>
              </View>
            )}
          </View>

          {/* "Finished your plog session?" guard sheet (Figma node
              681:2058, "Accidental-tap guard") — only reachable once the
              session clears the minimum-length check in
              handleFinishPress. */}
          <BottomSheet ref={finishSheetRef}>
            <Text style={styles.guardTitle}>Finished your plog session?</Text>
            <View style={styles.guardGrid}>
              <View style={styles.guardMetricColumn}>
                <Text style={styles.guardMetricValue}>{formatDuration(elapsedSec)}</Text>
                <Text style={styles.guardMetricLabel}>Time</Text>
              </View>
              <View style={styles.guardMetricColumn}>
                <Text style={styles.guardMetricValue}>{distanceText}</Text>
                <Text style={styles.guardMetricLabel}>Distance (km)</Text>
              </View>
              <View style={styles.guardMetricColumn}>
                <Text style={styles.guardMetricValue}>{elevGainText}</Text>
                <Text style={styles.guardMetricLabel}>Elev.gain(m)</Text>
              </View>
            </View>
            <View style={styles.guardButtons}>
              <Button label="Resume" size="medium" variant="outlined" onPress={handleGuardResume} style={styles.guardResumeButton} />
              <Button
                label="Finish & Log litter"
                size="medium"
                onPress={handleGuardFinish}
                tailIcon={({ color, size }) => <ArrowRightIcon color={color} size={size} />}
              />
            </View>
            <Pressable onPress={confirmDiscard} style={styles.guardDiscardWrapper}>
              <Text style={styles.guardDiscardText}>Discard this session</Text>
            </Pressable>
          </BottomSheet>
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
              onPress={() => {
                setExpanded(false); // each session starts collapsed, regardless of how the last one ended
                start();
              }}
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
    backgroundColor: colors.greyScale['50'],
    borderTopLeftRadius: spacing.xl,
    borderTopRightRadius: spacing.xl,
    paddingHorizontal: spacing.l,
  },
  handleArea: {
    alignSelf: 'center',
  },
  handle: {
    width: 90,
    height: 4,
    borderRadius: spacing.xs,
    backgroundColor: colors.greyScale['400'],
    marginTop: 10,
    marginBottom: spacing.l,
  },
  collapseGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
    paddingBottom: spacing.l,
  },
  expandContent: {
    width: '100%',
    gap: 10,
    paddingBottom: spacing.l,
  },
  expandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  expandButtons: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
    paddingTop: spacing.s,
  },
  collapseMetricColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.m,
    gap: spacing['3xs'],
  },
  expandMetricColumn: {
    width: '50%',
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
  guardTitle: {
    fontFamily: typography.titles.medium.fontFamily,
    fontWeight: typography.titles.medium.fontWeight,
    fontSize: typography.titles.medium.fontSize,
    lineHeight: typography.titles.medium.lineHeight,
    color: colors.base.black,
    textAlign: 'center',
    paddingTop: spacing.m,
    marginBottom: spacing['3xl'],
  },
  guardGrid: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.s,
    marginBottom: spacing.s,
  },
  guardMetricColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.m,
    gap: spacing['3xs'],
  },
  guardMetricValue: {
    fontFamily: typography.titles.medium.fontFamily,
    fontWeight: typography.titles.medium.fontWeight,
    fontSize: typography.titles.medium.fontSize,
    lineHeight: typography.titles.medium.lineHeight,
    color: colors.base.black,
    textAlign: 'center',
  },
  guardMetricLabel: {
    fontFamily: typography.body.extraSmall.fontFamily,
    fontWeight: typography.body.extraSmall.fontWeight,
    fontSize: typography.body.extraSmall.fontSize,
    letterSpacing: typography.body.extraSmall.letterSpacing,
    color: colors.base.black,
    textAlign: 'center',
  },
  guardButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  guardResumeButton: {
    flex: 1,
  },
  guardDiscardWrapper: {
    paddingTop: 10,
    paddingHorizontal: 28,
  },
  guardDiscardText: {
    fontFamily: typography.body.extraSmall.fontFamily,
    fontWeight: typography.body.extraSmall.fontWeight,
    fontSize: typography.body.extraSmall.fontSize,
    letterSpacing: typography.body.extraSmall.letterSpacing,
    color: colors.red['700'],
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});
