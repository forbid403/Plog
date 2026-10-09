import { useState } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components';
import { colors, spacing, typography } from '../src/theme';

// Figma: Plog Design, node 685:2741 ("Onboarding - 3") / 685:2750
// ("Onboarding - 4"). Photos downloaded from those frames (image 12),
// resized/recompressed for bundle size — originals were 2700px+ PNGs.
const SLIDE_1_PHOTO = require('../assets/onboarding/slide1.jpg');
const SLIDE_2_PHOTO = require('../assets/onboarding/slide2.jpg');

type Slide = {
  photo: number;
  title: string;
  body: string;
  buttonLabel: string;
};

const SLIDES: Slide[] = [
  {
    photo: SLIDE_1_PHOTO,
    title: 'Run.\nPick up litter.\nRepeat.',
    body: 'Plogging is picking up litter while you run, jog, or walk.',
    buttonLabel: 'Continue',
  },
  {
    photo: SLIDE_2_PHOTO,
    title: 'See your impact.',
    body: 'Every litre you collect adds up to something you can picture.',
    buttonLabel: 'Get Started',
  },
];

// The 3rd dot represents the sign-up step (app/onboarding-profile.tsx) —
// confirmed directly: there are only 2 slides here, the 3rd step is
// reached by navigating off this screen entirely.
const TOTAL_STEPS = 3;
const SLIDE_IN_MS = 320;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * A1-A2: one screen, not a horizontal pager — confirmed directly: only
 * the background photo slides in (from the right, covering the previous
 * one); the indicator and title/body update immediately, no fade (Figma:
 * Plog Design, node 685:2741/685:2750 — "Onboarding - 3/4"). No separate
 * location-permission primer (A3) — confirmed directly there isn't one in
 * the design; location permission is requested wherever it's actually
 * needed instead (already built: useCurrentLocation, used by the Plog
 * idle screen).
 */
export default function OnboardingSlidesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [slide, setSlide] = useState(0);
  const [translateX] = useState(() => new Animated.Value(0));

  const handlePress = () => {
    if (slide === SLIDES.length - 1) {
      router.push('/onboarding-profile');
      return;
    }
    setSlide((current) => current + 1);
    translateX.setValue(SCREEN_WIDTH);
    Animated.timing(translateX, { toValue: 0, duration: SLIDE_IN_MS, useNativeDriver: true }).start();
  };

  const current = SLIDES[slide];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.photoWrapper, { transform: [{ translateX }] }]}>
        <Image key={slide} source={current.photo} style={styles.photo} resizeMode="cover" />
        <View style={styles.overlay} />
      </Animated.View>

      <Text style={[styles.logo, { top: insets.top + 32 }]}>Plog</Text>

      <View style={[styles.indicatorRow, { top: insets.top + 113 }]}>
        {Array.from({ length: TOTAL_STEPS }, (_, dot) => (
          <View key={dot} style={[styles.indicatorDot, dot === slide && styles.indicatorDotActive]} />
        ))}
      </View>

      <View style={[styles.content, { top: insets.top + 211 }]}>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.body}>{current.body}</Text>
      </View>

      <View style={[styles.buttonWrapper, { bottom: insets.bottom + 54 }]}>
        <Button
          label={current.buttonLabel}
          size="full"
          variant={slide === SLIDES.length - 1 ? 'fill' : 'glass'}
          onPress={handlePress}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.greyScale['950'],
  },
  // Explicit numeric width/height rather than StyleSheet.absoluteFill —
  // confirmed directly the photo was rendering far more zoomed-in than a
  // correct "cover" fit (not just a framing/crop preference, an actual
  // oversized render), on both slides, surviving the key={slide} fix
  // below. Edge-pinned (0/0/0/0) absolute positioning nested two levels
  // deep (this wrapper, then Image) under an Animated transform is the
  // one dimension-less link in the chain — giving Image a real number
  // removes the ambiguity rather than guessing further at the cause.
  photoWrapper: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  photo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.opacity.black50,
  },
  logo: {
    position: 'absolute',
    left: 30,
    // Afacad (not an SF Pro typography token) — loaded in app/_layout.tsx.
    fontFamily: 'Afacad_500Medium',
    fontSize: 30,
    letterSpacing: -0.75,
    color: colors.brand.primary['300'],
  },
  indicatorRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 4,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: spacing.full,
    backgroundColor: colors.opacity.white50,
  },
  indicatorDotActive: {
    width: 20,
    backgroundColor: colors.base.white,
  },
  content: {
    position: 'absolute',
    left: 30,
    width: 339,
    gap: 29,
  },
  title: {
    fontFamily: 'Afacad_600SemiBold',
    fontSize: 50,
    lineHeight: 54,
    color: colors.base.white,
  },
  body: {
    fontFamily: typography.body.base.fontFamily,
    fontWeight: typography.body.base.fontWeight,
    fontSize: typography.body.base.fontSize,
    letterSpacing: typography.body.base.letterSpacing,
    color: colors.base.white,
  },
  buttonWrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
});
