import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../theme';

export type ChipProps = {
  label: string;
  size?: 'medium' | 'small';
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Toggleable filter/label pill (Figma: Plog Design System, node 212:2119). */
export default function Chip({ label, size = 'medium', selected = false, disabled = false, onPress, style }: ChipProps) {
  // Figma's status enum is mutually exclusive (Default/Select/Disable) — disabled wins over selected.
  const status = disabled ? 'disabled' : selected ? 'selected' : 'default';
  const textStyle = size === 'small' ? typography.body.small : typography.body.base;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={[styles.chip, STATUS_STYLES[status].chip, style]}
    >
      <Text
        style={{
          fontFamily: textStyle.fontFamily,
          fontWeight: textStyle.fontWeight,
          fontSize: textStyle.fontSize,
          letterSpacing: textStyle.letterSpacing,
          color: STATUS_STYLES[status].textColor,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const STATUS_STYLES = {
  default: {
    chip: { backgroundColor: colors.greyScale['100'], borderWidth: 0 },
    textColor: colors.greyScale['800'],
  },
  selected: {
    chip: { backgroundColor: colors.brand.primary['50'], borderWidth: 1, borderColor: colors.brand.primary['500'] },
    textColor: colors.brand.primary['700'],
  },
  disabled: {
    chip: { backgroundColor: colors.greyScale['200'], borderWidth: 1, borderColor: colors.greyScale['300'] },
    textColor: colors.greyScale['400'],
  },
} as const;

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderRadius: spacing.full,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
  },
});
