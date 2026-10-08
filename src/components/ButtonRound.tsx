import { BlurView } from 'expo-blur';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import CaretDownIcon from './icons/CaretDownIcon';
import { colors, shadows, spacing, typography } from '../theme';
import { shadowLayerToStyle } from '../lib/shadow';

export type ButtonRoundSize = 'small' | 'medium' | 'big' | 'display';
export type ButtonRoundVariant = 'fill' | 'glass';
/** 'fill' variant's color family — Figma's Button/Round only defines 'primary' (green);
 * 'secondary' (yellow) is needed for the Pause button (spec C3), same bg/icon shade
 * pattern (500/700) applied to Brand/Secondary instead of Brand/Primary. */
export type ButtonRoundTone = 'primary' | 'secondary';
export type ButtonRoundRenderIconProps = { color: string; size: number };

export type ButtonRoundProps = {
  size?: ButtonRoundSize;
  variant?: ButtonRoundVariant;
  tone?: ButtonRoundTone;
  disabled?: boolean;
  /** Defaults to CaretDownIcon (Figma's own default). Pass `null` to render no icon. */
  icon?: ((props: ButtonRoundRenderIconProps) => React.ReactNode) | null;
  label?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

type Typo = {
  fontFamily: string;
  fontWeight: TextStyle['fontWeight'];
  fontSize: number;
  letterSpacing: number;
  lineHeight?: number;
};

// container size and icon size both come straight from Figma
// (icon size = container − 2×padding, e.g. small: 40 − 2×10 = 20).
const SIZES: Record<ButtonRoundSize, { container: number; iconSize: number; typo: Typo }> = {
  small: { container: 40, iconSize: 20, typo: typography.body.extraSmall },
  medium: { container: 60, iconSize: 28, typo: typography.label.default },
  big: { container: 80, iconSize: 44, typo: typography.label.large },
  display: { container: 120, iconSize: 68, typo: typography.titles.display },
};

// Figma's Glass_Button drop-shadow isn't tokenized — same approximation as
// BottomNavigation/Button (see claude.md "Known token gap").
const glassShadowStyle = shadowLayerToStyle(shadows.normal[1]);

function resolveColors(variant: ButtonRoundVariant, tone: ButtonRoundTone, disabled: boolean) {
  if (disabled) {
    return { background: colors.greyScale['200'], icon: colors.greyScale['400'] };
  }
  if (variant === 'glass') {
    // Figma's glass icon uses a literal "stone" #343330 that isn't a token —
    // using greyScale.600 instead, matching CircleIconButton's glass icon color.
    return { background: colors.opacity.white50, icon: colors.greyScale['600'] };
  }
  const brand = colors.brand[tone];
  // 'primary' at .500 is Figma-verified (node 104:51's Active fill).
  // 'secondary' was originally guessed at .500 by analogy — corrected to
  // .300 once a real reference turned up (Plog Design node 681:2047's
  // Pause button, bg literally #ffe600 = secondary.300).
  return { background: tone === 'secondary' ? brand['300'] : brand['500'], icon: brand['700'] };
}

/**
 * Circular icon button / FAB (Figma: Plog Design System, node 104:51 "Button/Round").
 * Icon renders above the label — Figma's own source is inconsistent about this
 * (Display flips the order vs. Small/Medium/Big), treated as an authoring slip.
 */
export default function ButtonRound({
  size = 'display',
  variant = 'fill',
  tone = 'primary',
  disabled = false,
  icon,
  label,
  onPress,
  accessibilityLabel,
  style,
}: ButtonRoundProps) {
  const dims = SIZES[size];
  const palette = resolveColors(variant, tone, disabled);
  const renderIcon = icon === null ? null : (icon ?? ((p: ButtonRoundRenderIconProps) => <CaretDownIcon {...p} />));

  const content = (
    <>
      {renderIcon?.({ color: palette.icon, size: dims.iconSize })}
      {label ? (
        <Text
          style={{
            fontFamily: dims.typo.fontFamily,
            fontWeight: dims.typo.fontWeight,
            fontSize: dims.typo.fontSize,
            letterSpacing: dims.typo.letterSpacing,
            lineHeight: dims.typo.lineHeight,
            color: colors.greyScale['900'],
          }}
        >
          {label}
        </Text>
      ) : null}
    </>
  );

  const containerStyle: ViewStyle = { width: dims.container, height: dims.container, borderRadius: spacing.full };

  if (variant === 'glass') {
    // Same fix as Button.tsx's glass variant: BlurView+Pressable both
    // flex:1 (nested, nothing else sizing them) left Text/icon content
    // with no resolvable box — rendered as an empty circle. The Pressable
    // now gets the real size directly; BlurView is an absolutely-filled
    // backdrop layer instead of a flex ancestor.
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled }}
        style={[styles.centered, containerStyle, styles.clip, glassShadowStyle, disabled && styles.disabledOpacity, style]}
      >
        <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[styles.centered, StyleSheet.absoluteFill, { backgroundColor: palette.background }]}>{content}</View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      style={[styles.centered, containerStyle, { backgroundColor: palette.background }, style]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clip: {
    overflow: 'hidden',
  },
  disabledOpacity: {
    opacity: 0.5,
  },
});
