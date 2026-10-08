import { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components';
import { colors, spacing, typography } from '../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
// confirmed directly: this screen's own indicator is 3 dots even though
// only 2 pages are swipeable here, the 3rd page isn't part of this
// horizontal pager (it has a text input + white background, not a photo
// slide), it's reached by navigating off this screen entirely.
const TOTAL_STEPS = 3;

/**
 * A1-A2: two full-screen onboarding slides (Figma: Plog Design, node
 * 685:2741/685:2750 — "Onboarding - 3/4"). No separate location-permission
 * primer (A3) — confirmed directly there isn't one in the design; location
 * permission is requested wherever it's actually needed instead (already
 * built: useCurrentLocation, used by the Plog idle screen).
 */
export default function OnboardingSlidesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [slide, setSlide] = useState(0);

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setSlide(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
  };

  const handlePress = (index: number) => {
    if (index === SLIDES.length - 1) {
      router.push('/onboarding-profile');
      return;
    }
    scrollRef.current?.scrollTo({ x: (index + 1) * SCREEN_WIDTH, animated: true });
    setSlide(index + 1);
  };

  return (
    <View style={styles.container}>
      <ScrollView ref={scrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onMomentumScrollEnd}>
        {SLIDES.map((s, i) => (
          <View key={i} style={{ width: SCREEN_WIDTH }}>
            <Image source={s.photo} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <View style={styles.overlay} />

            <Text style={[styles.logo, { top: insets.top + 32 }]}>Plog</Text>

            <View style={[styles.indicatorRow, { top: insets.top + 113 }]}>
              {Array.from({ length: TOTAL_STEPS }, (_, dot) => (
                <View key={dot} style={[styles.indicatorDot, dot === i && styles.indicatorDotActive]} />
              ))}
            </View>

            <View style={[styles.content, { paddingBottom: insets.bottom + 54 }]}>
              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.body}>{s.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.buttonWrapper, { bottom: insets.bottom + 54 }]} pointerEvents="box-none">
        <Button
          label={SLIDES[slide].buttonLabel}
          size="full"
          variant={slide === SLIDES.length - 1 ? 'fill' : 'glass'}
          onPress={() => handlePress(slide)}
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
    top: 211,
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
