import { useCallback, useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { deleteSession, getMySession, saveSessionEdits, type MySession } from '../../src/api';
import {
  BagFillIcon,
  Button,
  ButtonRound,
  CameraPlusIcon,
  CircleIconButton,
  DashboardGlow,
  ExportIcon,
  GlassSurface,
  RouteMapPreview,
  TopBar,
  XIcon,
} from '../../src/components';
import { formatDetailDate, formatDistanceKm, formatDuration, formatElevationM, formatLiters, formatPace } from '../../src/lib/format';
import { colors, spacing, typography } from '../../src/theme';

/** A photo on screen: already saved (url) or just picked on the device (local uri, uploaded on Save). */
type PhotoItem = { kind: 'saved'; url: string } | { kind: 'new'; uri: string };

const TITLE_MAX_LENGTH = 40;
const SAVED_NOTICE_MS = 2500;
const MAP_ASPECT_RATIO = 354 / 307; // Figma 681:2572
const PHOTO_HEIGHT = 323; // Figma 681:2610

/**
 * Session detail (Figma: Plog Design, node 681:2562 "My page - Plog Detail").
 * Product decision 2026-10-14: the full Figma version — rename, several
 * photos, Save and Delete — beyond spec F (see the
 * 20261014000000_session_photos_and_rename migration). Heart rate and
 * calories have no data source yet (spec C: out of MVP), so they show `–`.
 */
export default function SessionDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<MySession | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [title, setTitle] = useState('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [busy, setBusy] = useState<'saving' | 'deleting' | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  // The glass header floats over the page; content starts below it and
  // scrolls underneath (that's what makes the glass visible).
  const [headerHeight, setHeaderHeight] = useState(0);
  const [noticeOpacity] = useState(() => new Animated.Value(0));

  const apply = useCallback((s: MySession) => {
    setSession(s);
    setTitle(s.title);
    setPhotos(s.photoUrls.map((url) => ({ kind: 'saved', url })));
    setLoadFailed(false);
  }, []);

  const onLoadError = useCallback((e: unknown) => {
    console.error('[session] load failed:', e);
    setLoadFailed(true);
  }, []);

  const load = useCallback(() => getMySession(id).then(apply).catch(onLoadError), [id, apply, onLoadError]);

  useEffect(() => {
    let cancelled = false;
    getMySession(id)
      .then((s) => !cancelled && apply(s))
      .catch((e) => !cancelled && onLoadError(e));
    return () => {
      cancelled = true;
    };
  }, [id, apply, onLoadError]);

  const trimmedTitle = title.trim();
  const savedUrls = photos.flatMap((p) => (p.kind === 'saved' ? [p.url] : []));
  const newUris = photos.flatMap((p) => (p.kind === 'new' ? [p.uri] : []));
  const removedUrls = session ? session.photoUrls.filter((url) => !savedUrls.includes(url)) : [];
  const dirty = !!session && (trimmedTitle !== session.title || newUris.length > 0 || removedUrls.length > 0);
  const canSave = dirty && trimmedTitle.length > 0 && busy === null;

  const pick = async (source: 'camera' | 'library') => {
    if (source === 'camera') {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'] };
    const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;
    // Resized/re-encoded (EXIF stripped) at upload — src/lib/photo-upload.ts.
    setPhotos((prev) => [...prev, { kind: 'new', uri: result.assets[0].uri }]);
  };

  // Same choice the Litter Log offers (litter-log.tsx).
  const addPhoto = () => {
    Alert.alert('Add Photo', undefined, [
      { text: 'Take photo', onPress: () => pick('camera') },
      { text: 'Choose from library', onPress: () => pick('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removePhoto = (index: number) => setPhotos((prev) => prev.filter((_, i) => i !== index));

  // Confirmation after Save — fades in, holds, fades out. No Figma state for
  // this; wording is ours.
  const showSavedNotice = (message: string) => {
    setSavedNotice(message);
    AccessibilityInfo.announceForAccessibility(message);
    noticeOpacity.stopAnimation();
    noticeOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(noticeOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(SAVED_NOTICE_MS),
      Animated.timing(noticeOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(({ finished }) => finished && setSavedNotice(null));
  };

  const save = async () => {
    if (!session || !canSave) return;
    const renamed = trimmedTitle !== session.title;
    const photosChanged = newUris.length > 0 || removedUrls.length > 0;
    setBusy('saving');
    try {
      await saveSessionEdits(session.id, {
        title: trimmedTitle,
        keptPhotoUrls: savedUrls,
        newPhotoUris: newUris,
        removedPhotoUrls: removedUrls,
      });
      await load();
      showSavedNotice(renamed && photosChanged ? 'Changes saved' : renamed ? 'Session name updated' : 'Photos updated');
    } catch (e) {
      console.error('[session] save failed:', e);
      Alert.alert('Could not save', 'Check your connection and try again.');
    } finally {
      setBusy(null);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete this session?', 'Its photos and stats will be removed for good. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  const doDelete = async () => {
    if (!session) return;
    setBusy('deleting');
    try {
      await deleteSession(session.id, session.photoUrls);
      router.back();
    } catch (e) {
      console.error('[session] delete failed:', e);
      Alert.alert('Could not delete', 'Check your connection and try again.');
      setBusy(null);
    }
  };

  const share = () => session && router.push({ pathname: '/impact-card', params: { sessionId: session.id } });

  return (
    <View style={styles.screen}>
      <View style={styles.glow} pointerEvents="none">
        <DashboardGlow />
      </View>

      {loadFailed && !session ? (
        <View style={[styles.message, { paddingTop: headerHeight }]}>
          <Text style={[textStyle(typography.body.base), styles.subtitleText]}>Couldn&apos;t load this session.</Text>
          <Button label="Retry" size="small" variant="outlined" onPress={load} />
        </View>
      ) : !session ? (
        <ActivityIndicator style={[styles.message, { paddingTop: headerHeight }]} color={colors.greyScale['600']} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: headerHeight + spacing.l, paddingBottom: insets.bottom + spacing['3xl'] }]}
          scrollIndicatorInsets={{ top: headerHeight }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <RouteMapPreview points={session.route} showEndpoints style={styles.map} />

          <View style={styles.summary}>
            <View style={styles.nameField}>
              <Text style={[textStyle(typography.caption), styles.subtitleText]}>Plog session name</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="eg. Friday Afternoon Run"
                placeholderTextColor={colors.greyScale['500']}
                maxLength={TITLE_MAX_LENGTH}
                returnKeyType="done"
                style={[textStyle(typography.body.baseBold), styles.nameInput]}
              />
            </View>

            <View style={styles.dateRow}>
              <Text style={[textStyle(typography.body.small), styles.bodyText]}>
                {formatDetailDate(session.startedAt, session.timezone)}
              </Text>
              {session.placeName ? (
                <>
                  <Text style={[textStyle(typography.body.small), styles.bodyText]}>|</Text>
                  <Text style={[textStyle(typography.body.small), styles.bodyText]} numberOfLines={1}>
                    {session.placeName}
                  </Text>
                </>
              ) : null}
            </View>

            <View style={styles.litter}>
              <BagFillIcon fill={session.fillRatio ?? 0} height={80} />
              <Text style={[textStyle(typography.body.baseBold), styles.collectedText]}>
                {session.liters !== null ? `${formatLiters(session.liters)} Collected` : '– L Collected'}
              </Text>
            </View>

            <View style={styles.metrics}>
              <View style={styles.metricRow}>
                <Metric value={`${formatDistanceKm(session.distanceKm, 1)} km`} label="Distance" />
                <Metric value={formatDuration(session.durationSec)} label="Time" />
                <Metric value={session.avgPaceSecPerKm !== null ? formatPace(session.avgPaceSecPerKm) : '–'} label="Avg.Pace" />
              </View>
              <View style={styles.metricRow}>
                <Metric value={session.elevationGainM !== null ? formatElevationM(session.elevationGainM) : '–'} label="Elevation" />
                <Metric value="–" label="Heart Rate" />
                <Metric value="–" label="Calories" />
              </View>
            </View>
          </View>

          {photos.map((photo, i) => (
            <View key={photo.kind === 'saved' ? photo.url : photo.uri} style={styles.photo}>
              <Image source={{ uri: photo.kind === 'saved' ? photo.url : photo.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <ButtonRound
                size="small"
                variant="glass"
                accessibilityLabel="Remove photo"
                icon={({ color, size }) => <XIcon color={color} size={size} />}
                onPress={() => removePhoto(i)}
                style={styles.removePhoto}
              />
            </View>
          ))}

          <Pressable onPress={addPhoto} accessibilityRole="button" style={styles.addPhoto}>
            <CameraPlusIcon color={colors.brand.primary['100']} />
            <Text style={[textStyle(typography.body.small), styles.addPhotoText]}>Add more photo</Text>
          </Pressable>

          <View style={styles.actions}>
            {savedNotice && (
              <Animated.View style={[styles.notice, { opacity: noticeOpacity }]} accessibilityLiveRegion="polite">
                <Text style={[textStyle(typography.body.smallBold), styles.noticeText]}>{savedNotice}</Text>
              </Animated.View>
            )}
            {busy === 'saving' ? (
              <ActivityIndicator color={colors.greyScale['600']} style={styles.saving} />
            ) : (
              // Not `disabled`: the dimmed glass label was hard to read. Save
              // with nothing changed is a no-op (save() checks canSave).
              <Button label="Save" size="full" variant="glass" labelColor={colors.greyScale['800']} onPress={save} />
            )}
            <Pressable onPress={confirmDelete} disabled={busy !== null} accessibilityRole="button" hitSlop={spacing.s}>
              {busy === 'deleting' ? (
                <ActivityIndicator color={colors.orange['700']} />
              ) : (
                <Text style={[textStyle(typography.body.baseBold), styles.deleteText]}>Delete this session</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* Figma 681:2618 Top Title Bar — glass over the scrolling page. */}
      <View style={styles.header} onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
        <GlassSurface style={StyleSheet.absoluteFill} />
        <TopBar
          depth={2}
          title={session?.title ?? ''}
          onBackPress={() => router.back()}
          right={
            <CircleIconButton
              accessibilityLabel="Share"
              onPress={share}
              icon={({ color, size }) => <ExportIcon color={color} size={size} />}
            />
          }
          style={styles.topBar}
        />
      </View>
    </View>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={[textStyle(typography.body.baseBold), styles.bodyText]}>{value}</Text>
      <Text style={[textStyle(typography.body.extraSmall), styles.bodyText]}>{label}</Text>
    </View>
  );
}

function textStyle(t: { fontFamily: string; fontWeight: string; fontSize: number; letterSpacing: number }): TextStyle {
  return {
    fontFamily: t.fontFamily,
    fontWeight: t.fontWeight as TextStyle['fontWeight'],
    fontSize: t.fontSize,
    letterSpacing: t.letterSpacing,
  };
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    // Figma #E7FFAC isn't a token yet — same nearest token as Home's dashboard.
    backgroundColor: colors.green['100'],
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topBar: {
    borderBottomWidth: 0,
  },
  message: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.l,
  },
  content: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.l,
    gap: spacing.l,
  },
  map: {
    width: '100%',
    aspectRatio: MAP_ASPECT_RATIO,
    borderRadius: spacing.l,
  },
  summary: {
    backgroundColor: colors.base.white,
    borderRadius: spacing.l,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
    gap: spacing.l,
  },
  nameField: {
    gap: spacing['2xs'],
  },
  nameInput: {
    height: 46,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.brand.primary['700'],
    borderRadius: spacing.s,
    backgroundColor: colors.opacity.white50,
    color: colors.greyScale['800'],
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.s,
    paddingHorizontal: spacing['3xs'],
  },
  litter: {
    alignItems: 'center',
    gap: spacing['3xs'],
  },
  collectedText: {
    color: colors.brand.primary['700'],
  },
  metrics: {
    gap: spacing.s,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    minWidth: 62,
  },
  bodyText: {
    color: colors.greyScale['800'],
  },
  subtitleText: {
    color: colors.greyScale['600'],
  },
  photo: {
    height: PHOTO_HEIGHT,
    borderRadius: spacing.xl,
    overflow: 'hidden',
    backgroundColor: colors.greyScale['100'],
  },
  removePhoto: {
    position: 'absolute',
    top: spacing.l,
    right: spacing.l,
  },
  addPhoto: {
    alignItems: 'center',
    gap: spacing['3xs'],
    paddingVertical: spacing.xl,
    borderRadius: spacing.xl,
    // Figma rgba(245,255,220,0.31) isn't a token — nearest translucent white.
    backgroundColor: colors.opacity.white12,
  },
  addPhotoText: {
    color: colors.brand.primary['50'],
  },
  actions: {
    alignItems: 'center',
    gap: spacing['3xl'],
    marginTop: spacing.l,
  },
  notice: {
    position: 'absolute',
    top: -(spacing['3xl'] + spacing.s),
    alignSelf: 'center',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    borderRadius: spacing.full,
    backgroundColor: colors.brand.primary['50'],
    borderWidth: 1,
    borderColor: colors.brand.primary['500'],
  },
  noticeText: {
    color: colors.brand.primary['700'],
  },
  saving: {
    height: 58,
  },
  deleteText: {
    color: colors.orange['700'],
  },
});
