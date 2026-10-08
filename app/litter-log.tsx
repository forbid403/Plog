import { useEffect, useState } from 'react';
import { Alert, BackHandler, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { updateLitter } from '../src/api/sessions';
import { Button, CameraOutlineIcon, Chip, MinusIcon, PlusIcon, TopBar, XCircleIcon } from '../src/components';
import { computeLiters, BAG_SIZES_L, FILL_LEVELS } from '../src/lib/litter';
import { colors, spacing, typography } from '../src/theme';

const BAG_EMPTY = require('../assets/litter/bag-empty.png');
const BAG_FULL = require('../assets/litter/bag-full.png');

// Fixed sizes straight from Figma (Plog Design 681:1945), not spacing values.
const BAG_WIDTH = 177;
const BAG_HEIGHT = 173;
const STEPPER_BUTTON_SIZE = 40;
const STEPPER_LABEL_WIDTH = 146;
const PHOTO_FRAME_HEIGHT = 100;
const PHOTO_MAX_EDGE_PX = 2048; // D5 [Proposed]

const MAX_LEVEL = FILL_LEVELS.length - 1;

type Photo = { uri: string };

async function resizeToMaxEdge(asset: ImagePicker.ImagePickerAsset): Promise<Photo> {
  if (Math.max(asset.width, asset.height) <= PHOTO_MAX_EDGE_PX) return { uri: asset.uri };
  const size = asset.width >= asset.height ? { width: PHOTO_MAX_EDGE_PX } : { height: PHOTO_MAX_EDGE_PX };
  const image = await ImageManipulator.manipulate(asset.uri).resize(size).renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
  return { uri: saved.uri };
}

/**
 * Litter log (D1-D7). Layout and copy follow Figma (Plog Design, node
 * 681:1945) over spec D1 where they differ — bag size first, no quick-pick
 * chips, stepper starts at `None` (decided 2026-10-08).
 *
 * `sessionId` (route param) is the Supabase row C6 already created at
 * "Finish & Log litter" time (app/(tabs)/plog.tsx's handleGuardFinish) —
 * this screen only ever updates it (D7's updateLitter), never creates one.
 *
 * Not wired yet: the Impact card (E) this should navigate to doesn't
 * exist, so a successful save just goes Home instead — flagged below, not
 * guessed at. Edit mode (D8) also has no entry point yet.
 */
export default function LitterLogScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const insets = useSafeAreaInsets();
  const [bagSizeL, setBagSizeL] = useState<number | null>(null);
  const [level, setLevel] = useState(0);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [saving, setSaving] = useState(false);

  const { ratio, label } = FILL_LEVELS[level];
  // Any litter needs a bag size to become litres; `None` is 0 L regardless.
  const canSubmit = level === 0 || bagSizeL !== null;

  // D8 claude.md: "0 L sessions are real sessions" — leaving, "I didn't
  // collect any", and `None` + Submit are all the same explicit-zero save
  // (liters: 0, not null), just reached by different buttons.
  const saveZeroLitter = async () => {
    if (!sessionId) return;
    setSaving(true);
    try {
      await updateLitter(sessionId, { fillRatio: 0, bagSizeLiters: null, liters: 0 });
      // E (Impact card) isn't built — going Home instead of into it.
      router.replace('/');
    } catch (e) {
      console.error('[litter-log] failed to save:', e);
      Alert.alert('Could not save', 'Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  // D6: leaving saves 0 L and goes Home; cancel keeps input.
  const confirmLeave = () => {
    Alert.alert('Leave without logging litter?', 'You can add it later.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', onPress: saveZeroLitter },
    ]);
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmLeave();
      return true;
    });
    return () => sub.remove();
  });

  const submit = async () => {
    if (!sessionId || !canSubmit) return;
    if (level === 0) {
      await saveZeroLitter();
      return;
    }
    setSaving(true);
    try {
      await updateLitter(sessionId, {
        fillRatio: ratio,
        bagSizeLiters: bagSizeL,
        liters: computeLiters(ratio, bagSizeL as number),
        photoUri: photo?.uri,
      });
      // E (Impact card) isn't built — going Home instead of into it.
      router.replace('/');
    } catch (e) {
      console.error('[litter-log] failed to save:', e);
      Alert.alert('Could not save', 'Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const noLitter = saveZeroLitter;

  const pick = async (source: 'camera' | 'library') => {
    if (source === 'camera') {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'] };
    const result =
      source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;
    setPhoto(await resizeToMaxEdge(result.assets[0]));
  };

  const choosePhotoSource = () => {
    Alert.alert('Add Photo', undefined, [
      { text: 'Take photo', onPress: () => pick('camera') },
      { text: 'Choose from library', onPress: () => pick('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <TopBar depth={2} title="Litter Log" showRightIcon={false} onBackPress={confirmLeave} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.section}>
          <View style={styles.instruction}>
            <Text style={styles.title}>What size bag did you use to collect?</Text>
            <Text style={styles.subtitle}>Select the bag’s full capacity.</Text>
          </View>
          <View style={styles.bagSizes}>
            <View style={styles.chipRow}>
              {BAG_SIZES_L.map((size) => (
                <Chip key={size} label={`${size}L`} selected={bagSizeL === size} onPress={() => setBagSizeL(size)} />
              ))}
            </View>
            {/* Figma-only: custom bag size has no spec'd input/limits yet — not wired. */}
            <Pressable style={styles.addSizeChip} accessibilityRole="button">
              <PlusIcon color={colors.greyScale['700']} size={18} />
              <Text style={styles.addSizeLabel}>Add other size</Text>
            </Pressable>
          </View>
        </View>

        <View>
          <View style={[styles.instruction, styles.fullnessInstruction]}>
            <Text style={styles.title}>How full was it when you finished?</Text>
            <Text style={styles.subtitle}>A rough guess is perfectly fine — no counting required. </Text>
          </View>
          <View style={styles.bagIndicator}>
            <View style={styles.bag}>
              <Image source={BAG_EMPTY} style={styles.bagImage} />
              {/* D2: the full bag shows through from the bottom by ratio. */}
              <View style={[styles.bagFill, { height: BAG_HEIGHT * ratio }]}>
                <Image source={BAG_FULL} style={styles.bagImage} />
              </View>
            </View>
            <Text style={styles.motivator}>Every piece counts</Text>
            <View style={styles.stepper}>
              <StepperButton
                accessibilityLabel="Less"
                disabled={level === 0}
                onPress={() => setLevel(level - 1)}
                icon={(color) => <MinusIcon color={color} />}
              />
              <Text style={styles.stepperLabel}>{label}</Text>
              <StepperButton
                accessibilityLabel="More"
                disabled={level === MAX_LEVEL}
                onPress={() => setLevel(level + 1)}
                icon={(color) => <PlusIcon color={color} />}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.instruction}>
            <Text style={styles.title}>Add Photo</Text>
            <Text style={styles.subtitle}>Great to see your impact!</Text>
          </View>
          <Pressable style={styles.photoFrame} onPress={choosePhotoSource} accessibilityRole="button" accessibilityLabel="Add photo">
            {photo ? (
              <>
                <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                <Pressable
                  style={styles.removePhoto}
                  onPress={() => setPhoto(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Remove photo"
                >
                  <XCircleIcon color={colors.base.white} />
                </Pressable>
              </>
            ) : (
              <>
                <CameraOutlineIcon color={colors.greyScale['400']} />
                <Text style={styles.photoHint}>Add a photo of the bag</Text>
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.actions}>
          <Button label="Submit" size="full" disabled={!canSubmit || saving} onPress={submit} />
          <Button label="I didn't collect any this time" size="full" variant="outlined" disabled={saving} onPress={noLitter} />
        </View>
      </ScrollView>
    </View>
  );
}

function StepperButton({
  disabled,
  onPress,
  icon,
  accessibilityLabel,
}: {
  disabled: boolean;
  onPress: () => void;
  icon: (color: string) => React.ReactNode;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={[styles.stepperButton, { backgroundColor: disabled ? colors.greyScale['200'] : colors.brand.primary['50'] }]}
    >
      {icon(disabled ? colors.greyScale['300'] : colors.brand.primary['700'])}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base.white,
  },
  content: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.l,
    gap: spacing['3xl'],
  },
  section: {
    gap: spacing.l,
  },
  instruction: {
    gap: spacing.s,
  },
  fullnessInstruction: {
    paddingVertical: spacing.m,
  },
  title: {
    fontFamily: typography.titles.medium.fontFamily,
    fontWeight: typography.titles.medium.fontWeight,
    fontSize: typography.titles.medium.fontSize,
    lineHeight: typography.titles.medium.lineHeight,
    letterSpacing: typography.titles.medium.letterSpacing,
    color: colors.greyScale['900'],
  },
  subtitle: {
    fontFamily: typography.body.base.fontFamily,
    fontWeight: typography.body.base.fontWeight,
    fontSize: typography.body.base.fontSize,
    letterSpacing: typography.body.base.letterSpacing,
    color: colors.greyScale['600'],
  },
  bagSizes: {
    gap: spacing.s,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s, // Figma: 10, not on the spacing scale
  },
  addSizeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.s,
    backgroundColor: colors.greyScale['100'],
    borderRadius: spacing.full,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
  },
  addSizeLabel: {
    fontFamily: typography.body.baseBold.fontFamily,
    fontWeight: typography.body.baseBold.fontWeight,
    fontSize: typography.body.baseBold.fontSize,
    letterSpacing: typography.body.baseBold.letterSpacing,
    color: colors.greyScale['600'],
  },
  bagIndicator: {
    alignItems: 'center',
    gap: spacing['3xs'],
  },
  bag: {
    width: BAG_WIDTH,
    height: BAG_HEIGHT,
  },
  bagImage: {
    width: BAG_WIDTH,
    height: BAG_HEIGHT,
  },
  bagFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  motivator: {
    fontFamily: typography.caption.fontFamily,
    fontWeight: typography.caption.fontWeight,
    fontSize: typography.caption.fontSize,
    letterSpacing: typography.caption.letterSpacing,
    color: colors.brand.primary['700'],
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s, // Figma: 10, not on the spacing scale
  },
  stepperButton: {
    width: STEPPER_BUTTON_SIZE,
    height: STEPPER_BUTTON_SIZE,
    borderRadius: spacing.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperLabel: {
    width: STEPPER_LABEL_WIDTH,
    textAlign: 'center',
    fontFamily: typography.body.baseBold.fontFamily,
    fontWeight: typography.body.baseBold.fontWeight,
    fontSize: typography.body.baseBold.fontSize,
    letterSpacing: typography.body.baseBold.letterSpacing,
    color: colors.base.black,
  },
  photoFrame: {
    height: PHOTO_FRAME_HEIGHT,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['3xs'],
    overflow: 'hidden',
    backgroundColor: colors.brand.primary['50'],
    borderWidth: 2,
    borderColor: colors.brand.primary['100'],
    borderRadius: spacing.xs,
  },
  photoHint: {
    fontFamily: typography.caption.fontFamily,
    fontWeight: typography.caption.fontWeight,
    fontSize: typography.caption.fontSize,
    letterSpacing: typography.caption.letterSpacing,
    color: colors.greyScale['500'],
  },
  removePhoto: {
    position: 'absolute',
    top: spacing.s,
    right: spacing.s,
  },
  actions: {
    gap: spacing.s, // Figma: 10, not on the spacing scale
  },
});
