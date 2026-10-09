import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import Share, { Social } from 'react-native-share';
import MapView, { Polyline, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSessionDetail, type RoutePoint, type SessionDetail } from '../src/api/sessions';
import {
  Button,
  BottomSheet,
  CircleIconButton,
  DownloadSimpleIcon,
  InstagramLogoIcon,
  LinkIcon,
  TelegramLogoIcon,
  WhatsappLogoIcon,
  type BottomSheetHandle,
} from '../src/components';
import CaretLeftIcon from '../src/components/icons/CaretLeftIcon';
import { formatDistanceKm, formatDuration, formatImpactCardDate, formatLiters } from '../src/lib/format';
import { colors, spacing, typography } from '../src/theme';

const CARD_WIDTH = 320;
// Figma's own pixel sizes for this card (Plog Design, node 681:1985) — not
// on the spacing scale, same precedent as litter-log.tsx's bag/stepper sizes.
const MAP_WIDTH = 184;
const MAP_HEIGHT = 147;
const PHOTO_WIDTH = 100;
const PHOTO_HEIGHT = 121;

// Figma's card glow ("Shine": drop-shadow, 10px blur, 6px spread,
// border/lighter = brand.primary.300) isn't one of shadows.strong/emphasize/
// normal — same kind of token gap as BottomNavigation's glass shadow
// (claude.md "Known token gap"), approximated directly rather than guessing
// a token that doesn't exist.
const cardGlowStyle = {
  shadowColor: colors.brand.primary['300'],
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 1,
  shadowRadius: 10,
  elevation: 10,
};

// Figma's root background (rgba(4,59,20,0.81)) isn't a design token either
// (get_design_context returned a literal, no CSS var) — flattened to an
// opaque hex since there's nothing beneath this screen to show through.
const DARK_GREEN_BG = '#0c4b1f';

function regionForRoute(points: { lat: number; lng: number }[]): Region {
  if (points.length === 0) {
    return { latitude: -33.8688, longitude: 151.2093, latitudeDelta: 0.01, longitudeDelta: 0.01 };
  }
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
  const latSpan = Math.max(maxLat - minLat, 0.002);
  const lngSpan = Math.max(maxLng - minLng, 0.002);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latSpan * 1.4,
    longitudeDelta: lngSpan * 1.4,
  };
}

function shareText(liters: number | null): string {
  // Spec's own example copy (E4), not a literal spec string — liters is
  // formatted the same way the card itself shows it.
  return `I picked up ${formatLiters(liters ?? 0)} of litter with Plog 🌿`;
}

/**
 * Impact card (E1-E4). Reached from Litter log's Submit/"I didn't collect
 * any"/Leave (all three save via updateLitter then push here) — pushed, not
 * replaced, so Back (E3) pops to Litter log with its input still intact,
 * per spec ("Back to Litter log to edit, input kept").
 *
 * Not built: the public card web page / server-side impactCardUrl (E4's
 * own note says ship client-side share first) — Copy Link has no URL to
 * copy yet, left as a flagged no-op rather than guessed at. Place name
 * (reverse geocoding) isn't computed server-side yet either (Backend
 * gaps) — the location line is omitted when `placeName` is null instead
 * of showing a fake one.
 */
export default function ImpactCardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loadError, setLoadError] = useState(false);
  const cardRef = useRef<ViewShotRef>(null);
  const shareSheetRef = useRef<BottomSheetHandle>(null);

  useEffect(() => {
    if (!sessionId) return;
    getSessionDetail(sessionId)
      .then(setSession)
      .catch((e) => {
        console.error('[impact-card] failed to load session:', e);
        setLoadError(true);
      });
  }, [sessionId]);

  // Empty-deps would fire before `session` loads — the BottomSheet below
  // is behind the `if (!session) return ...` early-return, so its ref
  // wouldn't be attached yet and this would silently no-op. Confirmed
  // directly the sheet never appeared.
  useEffect(() => {
    if (session) shareSheetRef.current?.open();
  }, [session]);

  // Spec: "capture the card component" (not the whole screen) — exact
  // 1080×1920 Stories sizing isn't implemented (E4 [Proposed]), this
  // captures at the card's native resolution instead. Flagged, not a
  // silent approximation.
  const captureCard = async (): Promise<string> => {
    const uri = await cardRef.current?.capture?.();
    if (!uri) throw new Error('Card capture failed');
    return uri;
  };

  const handleDownload = async () => {
    try {
      const { granted } = await MediaLibrary.requestPermissionsAsync(true);
      if (!granted) {
        Alert.alert('Permission needed', 'Plog needs photo library access to save your Impact card.');
        return;
      }
      const uri = await captureCard();
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved to Photos');
    } catch (e) {
      console.error('[impact-card] download failed:', e);
      Alert.alert('Could not save the card', 'Please try again.');
    }
  };

  // WhatsApp/Telegram: shareSingle targets that app directly, no extra
  // config needed. Falls back to the generic system share sheet if the
  // app isn't installed (e.g. always, on the Simulator) rather than
  // failing silently — spec's "hide if not installed" isn't implemented.
  const shareToSocial = async (social: Social.Whatsapp | Social.Telegram) => {
    try {
      const uri = await captureCard();
      await Share.shareSingle({ social, url: uri, message: shareText(session?.liters ?? null) });
    } catch (e) {
      try {
        const uri = await captureCard();
        await Share.open({ url: uri, message: shareText(session?.liters ?? null) });
      } catch (fallbackError) {
        console.error('[impact-card] share failed:', e, fallbackError);
      }
    }
  };

  // Instagram Stories' dedicated share target needs a Meta App ID
  // (shareSingle's typings require it) that isn't configured (spec 0.5
  // prerequisite, not confirmed) — goes straight to the generic share
  // sheet instead of attempting the dedicated target first.
  const shareToInstagram = async () => {
    try {
      const uri = await captureCard();
      await Share.open({ url: uri, message: shareText(session?.liters ?? null) });
    } catch (e) {
      console.error('[impact-card] share failed:', e);
    }
  };

  const handleDone = () => {
    // E3: "Go to Home" [Proposed]. Doesn't clear plog/litter-log from the
    // stack beneath — same simplification litter-log.tsx's own navigation
    // already makes.
    router.replace('/');
  };

  if (loadError) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Could not load this card.</Text>
      </View>
    );
  }

  if (!session) {
    return <View style={[styles.container, { paddingTop: insets.top }]} />;
  }

  const route: RoutePoint[] = session.route;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ gestureEnabled: false }} />

      <View style={[styles.header, { paddingTop: insets.top + spacing.s }]}>
        <CircleIconButton accessibilityLabel="Back" onPress={() => router.back()} icon={({ size }) => <CaretLeftIcon color={colors.base.white} size={size} />} style={styles.headerGlassButton} />
        <Text style={styles.headerTitle}>Impact card</Text>
        <Button label="Done" size="small" variant="glass" onPress={handleDone} />
      </View>

      <View style={styles.cardWrapper}>
        <ViewShot ref={cardRef} options={{ format: 'png', quality: 0.92 }} style={[styles.card, cardGlowStyle]}>
          <View style={styles.dateRow}>
            <Text style={styles.dateText}>{formatImpactCardDate(session.startedAt, session.timezone)}</Text>
          </View>

          <View style={styles.summary}>
            <Text style={styles.collectedLabel}>You collected</Text>
            <Text style={styles.litersValue}>{session.liters !== null ? formatLiters(session.liters) : '– L'}</Text>
            <Text style={styles.collectedSubtitle}>Litter off the street</Text>
          </View>

          <View style={styles.routeAndPics}>
            <View style={styles.mapFrame}>
              <MapView
                style={StyleSheet.absoluteFill}
                initialRegion={regionForRoute(route)}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
                pointerEvents="none"
              >
                {route.length > 1 && (
                  <Polyline coordinates={route.map((p) => ({ latitude: p.lat, longitude: p.lng }))} strokeColor={colors.red['500']} strokeWidth={3} />
                )}
              </MapView>
            </View>
            {/* Spec: "Map only, larger, if no photo" [Proposed] — not
                implemented, the map frame stays the same size either way. */}
            {session.photoUrl && (
              <View style={styles.photoFrame}>
                <Image source={{ uri: session.photoUrl }} style={styles.photoImage} resizeMode="cover" />
              </View>
            )}
          </View>

          {session.placeName && (
            <View style={styles.locationRow}>
              <Text style={styles.locationText}>{session.placeName}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.numbersGrid}>
            <View style={styles.numberColumn}>
              <Text style={styles.numberValue}>{formatDuration(session.durationSec)}</Text>
              <Text style={styles.numberLabel}>Time</Text>
            </View>
            <View style={styles.numberColumn}>
              <Text style={styles.numberValue}>{formatDistanceKm(session.distanceKm, 2)}</Text>
              <Text style={styles.numberLabel}>Distance (km)</Text>
            </View>
            <View style={styles.numberColumn}>
              <Text style={styles.numberValue}>{session.elevationGainM ?? 0}</Text>
              <Text style={styles.numberLabel}>Elev.gain(m)</Text>
            </View>
          </View>
        </ViewShot>
      </View>

      <View style={styles.footerNote}>
        <View style={styles.footerDot} />
        <Text style={styles.footerNoteText}>You can find this card later in your plog history</Text>
      </View>

      <BottomSheet ref={shareSheetRef} showHandle={false}>
        <Text style={styles.shareTitle}>Share to</Text>
        <View style={styles.shareRow}>
          <ShareButton
            label="Instagram Story"
            background="#dd2a7b"
            icon={(color) => <InstagramLogoIcon color={color} />}
            onPress={shareToInstagram}
          />
          <ShareButton label="WhatsApp" background="#00e510" icon={(color) => <WhatsappLogoIcon color={color} />} onPress={() => shareToSocial(Social.Whatsapp)} />
          <ShareButton label="Telegram" background="#00b0f2" icon={(color) => <TelegramLogoIcon color={color} />} onPress={() => shareToSocial(Social.Telegram)} />
        </View>
        <View style={styles.shareRow}>
          <ShareButton
            label="Copy Link"
            background={colors.greyScale['50']}
            iconColor={colors.greyScale['900']}
            icon={(color) => <LinkIcon color={color} />}
            // No public card URL to copy yet (E4's own note: ship
            // client-side share first, wire the public URL later).
            onPress={() => Alert.alert('Not available yet', "This card's shareable link isn't ready yet.")}
          />
          <ShareButton label="Download" background={colors.greyScale['50']} iconColor={colors.greyScale['900']} icon={(color) => <DownloadSimpleIcon color={color} />} onPress={handleDownload} />
        </View>
      </BottomSheet>
    </View>
  );
}

function ShareButton({
  label,
  background,
  iconColor = colors.base.white,
  icon,
  onPress,
}: {
  label: string;
  background: string;
  iconColor?: string;
  icon: (color: string) => React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.shareButton}>
      <View style={[styles.shareIconCircle, { backgroundColor: background }]}>{icon(iconColor)}</View>
      <Text style={styles.shareButtonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_GREEN_BG,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: typography.body.base.fontFamily,
    fontWeight: typography.body.base.fontWeight,
    fontSize: typography.body.base.fontSize,
    color: colors.base.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.s,
  },
  headerGlassButton: {
    backgroundColor: colors.opacity.white50,
  },
  headerTitle: {
    fontFamily: typography.body.baseBold.fontFamily,
    fontWeight: typography.body.baseBold.fontWeight,
    fontSize: typography.body.baseBold.fontSize,
    color: colors.base.white,
  },
  cardWrapper: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.brand.primary['50'],
    borderRadius: spacing.xs,
    padding: spacing.l,
    gap: spacing.s,
  },
  dateRow: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontFamily: typography.caption.fontFamily,
    fontWeight: typography.caption.fontWeight,
    fontSize: typography.caption.fontSize,
    color: colors.base.black,
  },
  summary: {
    paddingHorizontal: spacing.xs,
    gap: spacing['3xs'],
  },
  collectedLabel: {
    fontFamily: typography.body.base.fontFamily,
    fontWeight: typography.body.base.fontWeight,
    fontSize: typography.body.base.fontSize,
    color: colors.base.black,
  },
  litersValue: {
    fontFamily: typography.titles.display.fontFamily,
    fontWeight: '700',
    fontSize: 48,
    lineHeight: 58,
    color: colors.brand.primary['500'],
  },
  collectedSubtitle: {
    fontFamily: typography.headline.fontFamily,
    fontWeight: typography.headline.fontWeight,
    fontSize: typography.headline.fontSize,
    color: colors.brand.primary['700'],
  },
  routeAndPics: {
    height: MAP_HEIGHT + 24,
    justifyContent: 'center',
  },
  mapFrame: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    borderRadius: spacing.xs,
    overflow: 'hidden',
  },
  photoFrame: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
    borderRadius: spacing.xs,
    overflow: 'hidden',
    transform: [{ rotate: '12deg' }],
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  locationRow: {
    paddingHorizontal: spacing.xs,
  },
  locationText: {
    fontFamily: typography.body.small.fontFamily,
    fontWeight: typography.body.small.fontWeight,
    fontSize: typography.body.small.fontSize,
    color: colors.base.black,
  },
  divider: {
    height: 1,
    backgroundColor: colors.brand.primary['200'],
  },
  numbersGrid: {
    flexDirection: 'row',
  },
  numberColumn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing['3xs'],
  },
  numberValue: {
    fontFamily: typography.titles.medium.fontFamily,
    fontWeight: typography.titles.medium.fontWeight,
    fontSize: typography.titles.medium.fontSize,
    lineHeight: typography.titles.medium.lineHeight,
    color: colors.base.black,
  },
  numberLabel: {
    fontFamily: typography.body.extraSmall.fontFamily,
    fontWeight: typography.body.extraSmall.fontWeight,
    fontSize: typography.body.extraSmall.fontSize,
    color: colors.base.black,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    marginTop: spacing.l,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: spacing.full,
    backgroundColor: colors.base.white,
  },
  footerNoteText: {
    fontFamily: typography.caption.fontFamily,
    fontWeight: typography.caption.fontWeight,
    fontSize: typography.caption.fontSize,
    color: colors.base.white,
  },
  shareTitle: {
    fontFamily: typography.body.base.fontFamily,
    fontWeight: typography.body.base.fontWeight,
    fontSize: typography.body.base.fontSize,
    color: colors.greyScale['800'],
    marginBottom: spacing.m,
  },
  shareRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.l,
  },
  shareButton: {
    alignItems: 'center',
    gap: spacing.s,
    width: 62,
  },
  shareIconCircle: {
    width: 44,
    height: 44,
    borderRadius: spacing.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonLabel: {
    fontFamily: typography.body.extraSmall.fontFamily,
    fontWeight: typography.body.extraSmall.fontWeight,
    fontSize: 10,
    color: colors.greyScale['800'],
    textAlign: 'center',
  },
});
