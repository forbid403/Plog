import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
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
      style={[styles.button, style]}
    >
      {icon({ color: ICON_COLOR, size: ICON_SIZE })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: spacing.full,
    borderWidth: 1,
    borderColor: colors.opacity.grey8,
    backgroundColor: colors.opacity.white50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
