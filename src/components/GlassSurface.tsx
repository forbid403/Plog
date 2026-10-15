import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../theme';

export type GlassSurfaceProps = {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

// Checked once: the answer can't change while the app runs.
const LIQUID_GLASS = isLiquidGlassAvailable();

/**
 * Figma "glass" surfaces. iOS 26+: Apple's own Liquid Glass (expo-glass-effect).
 * Android and older iOS: the blur + translucent white the app already uses
 * for Glass_Button and the tab bar (Button.tsx, BottomNavigation.tsx).
 */
export default function GlassSurface({ style, children }: GlassSurfaceProps) {
  if (LIQUID_GLASS) {
    // 'clear' = Apple's lighter, less frosted glass (product choice 2026-10-15).
    return (
      <GlassView glassEffectStyle="clear" style={style}>
        {children}
      </GlassView>
    );
  }
  return (
    <View style={[styles.fallback, style]}>
      <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.tint]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    overflow: 'hidden',
  },
  tint: {
    backgroundColor: colors.opacity.white50,
  },
});
