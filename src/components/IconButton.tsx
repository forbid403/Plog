import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../theme';

export type IconButtonRenderIconProps = { color: string; size: number; selected: boolean };

export type IconButtonProps = {
  /** Render prop so any icon (HouseIcon, etc.) can be swapped in — see src/components/icons/. */
  icon: (props: IconButtonRenderIconProps) => React.ReactNode;
  label?: string;
  selected?: boolean;
  showLabel?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

const ICON_SIZE = 32;
const DEFAULT_COLOR = colors.greyScale['600'];
const SELECTED_COLOR = colors.brand.primary['500'];

/**
 * Icon + label button used in the bottom nav (Figma: Plog Design System, node 85:14504).
 * Default/Selected states swap both the icon colour and the label colour.
 */
export default function IconButton({
  icon,
  label,
  selected = false,
  showLabel = true,
  onPress,
  accessibilityLabel,
  style,
}: IconButtonProps) {
  const color = selected ? SELECTED_COLOR : DEFAULT_COLOR;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={[styles.container, style]}
    >
      {icon({ color, size: ICON_SIZE, selected })}
      {showLabel && label ? <Text style={[styles.label, { color }]}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 45,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['3xs'],
  },
  label: {
    fontFamily: typography.body.extraSmall.fontFamily,
    fontWeight: typography.body.extraSmall.fontWeight,
    fontSize: typography.body.extraSmall.fontSize,
    letterSpacing: typography.body.extraSmall.letterSpacing,
    textAlign: 'center',
  },
});
