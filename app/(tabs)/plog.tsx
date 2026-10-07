import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import MapView from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../src/components/Button';
import ButtonRound from '../../src/components/ButtonRound';
import CircleIconButton from '../../src/components/CircleIconButton';
import LocateIcon from '../../src/components/icons/LocateIcon';
import { usePlogSession } from '../../src/hooks/usePlogSession';
import { useCurrentLocation } from '../../src/hooks/useCurrentLocation';
import { colors, shadows, spacing, typography } from '../../src/theme';
import { shadowLayerToStyle } from '../../src/lib/shadow';

// [Proposed] — spec (C2) says "until accuracy is acceptable" without a
// number; 20m horizontal accuracy is our own threshold, not Figma/spec.
const ACCEPTABLE_ACCURACY_M = 20;

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

/** Idle screen (C2) — full-screen map, Start button. Spec's "Plog session" state flow begins here. */
export default function PlogScreen() {
  const insets = useSafeAreaInsets();
  const { permission, location } = useCurrentLocation();
  const { status, hydrated, start } = usePlogSession();
  const mapRef = useRef<MapView>(null);
  const [following, setFollowing] = useState(true);

  // C3.1 recovery, the idle-screen side of it: if a session is already
  // recording/paused (e.g. the app was relaunched, or a previous Start
  // landed here without navigating away — see that bugfix), go straight to
  // it instead of showing Start and risking a second plog_sessions row.
  // (status defaults to 'idle' pre-hydration, so this is gated the same
  // way as plog-session.tsx's redirect — not actually dangerous in this
  // direction, since the default is 'idle', but checking `hydrated` keeps
  // the two screens' logic consistent rather than relying on that.)
  useEffect(() => {
    if (hydrated && status !== 'idle') router.push('/plog-session');
  }, [hydrated, status]);

  useEffect(() => {
    if (!location || !following) return;
    mapRef.current?.animateCamera({
      center: { latitude: location.coords.latitude, longitude: location.coords.longitude },
    });
  }, [location, following]);

  const recentre = () => {
    setFollowing(true);
  };

  const onStart = async () => {
    await start();
    router.push('/plog-session');
  };

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
      />

      {/* Spec (C2) says show this only after panning [Recommended, not
          Confirmed] — always-visible is the more discoverable, more common
          pattern (Google/Apple Maps etc.) and matches direct testing
          feedback that the conditional version was easy to miss. */}
      <CircleIconButton
        accessibilityLabel="Re-centre on my location"
        onPress={recentre}
        icon={({ color, size }) => <LocateIcon color={color} size={size} />}
        style={[styles.recentreButton, recentreShadowStyle, { bottom: insets.bottom + 82 + spacing.l }]}
      />

      {/* No Figma reference for this screen's exact layout — bottom offset is
          sized to clear the floating BottomNavigation (~82px tall incl. its
          own bottom gap) plus a margin, not a spec'd number. */}
      <View style={[styles.startButtonWrapper, { bottom: insets.bottom + 82 + spacing.l }]}>
        <ButtonRound
          size="display"
          variant="fill"
          label={gpsReady ? 'Start' : 'Finding GPS…'}
          icon={null}
          disabled={!gpsReady}
          onPress={onStart}
        />
      </View>
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
