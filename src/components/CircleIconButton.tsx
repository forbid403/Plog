import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import GlassSurface, { LIQUID_GLASS_AVAILABLE } from './GlassSurface';
import { colors, spacing } from '../theme';

export type CircleIconButtonProps = {
  icon: (props: { color: string; size: number }) => React.ReactNode;
  onPress?: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
};

const SIZE = 36;
const ICON_SIZE = 24;
const ICON_COLOR = colors.greyScale['600'];

/** Glass circle button used for back/overflow-menu actions (Figma: TopBar "Back Button"). */
export default function CircleIconButton({ icon, onPress, accessibilityLabel, style }: CircleIconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.button, !LIQUID_GLASS_AVAILABLE && styles.fallbackBorder, style]}
    >
      <GlassSurface style={StyleSheet.absoluteFill} />
      {icon({ color: ICON_COLOR, size: ICON_SIZE })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: spacing.full,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Liquid Glass draws its own edge; the hairline border is only for the
  // blur fallback (Android / iOS < 26), as before.
  fallbackBorder: {
    borderWidth: 1,
    borderColor: colors.opacity.grey8,
  },
});
