import { BlurView } from 'expo-blur';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { colors, shadows, spacing, typography } from '../theme';
import { shadowLayerToStyle } from '../lib/shadow';

export type ButtonSize = 'small' | 'medium' | 'large' | 'full';
export type ButtonVariant = 'fill' | 'outlined' | 'glass';
export type ButtonRenderIconProps = { color: string; size: number };

export type ButtonProps = {
  label: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  disabled?: boolean;
  onPress?: () => void;
  leadIcon?: (props: ButtonRenderIconProps) => React.ReactNode;
  tailIcon?: (props: ButtonRenderIconProps) => React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

type Typo = {
  fontFamily: string;
  fontWeight: TextStyle['fontWeight'];
  fontSize: number;
  letterSpacing: number;
  textTransform: string;
  textDecorationLine: string;
};

const SIZES: Record<
  ButtonSize,
  { height: number; paddingHorizontal: number; paddingVertical: number; iconSize: number; typo: Typo; width?: number | 'stretch' }
> = {
  small: { height: 36, paddingHorizontal: spacing.l, paddingVertical: spacing.s, iconSize: 18, typo: typography.body.extraSmall },
  medium: { height: 44, paddingHorizontal: spacing.xl, paddingVertical: 10, iconSize: 22, typo: typography.label.default },
  large: { height: 52, paddingHorizontal: spacing['2xl'], paddingVertical: spacing.m, iconSize: 28, typo: typography.label.large, width: 200 },
  full: { height: 58, paddingHorizontal: spacing['2xl'], paddingVertical: 18, iconSize: 30, typo: typography.label.large, width: 'stretch' },
};

// Figma's Glass_Button drop-shadow isn't tokenized (see BottomNavigation/known
// token gap in claude.md) — same shadows.normal[1] approximation.
const glassShadowStyle = shadowLayerToStyle(shadows.normal[1]);

function resolveColors(variant: ButtonVariant, disabled: boolean) {
  if (variant === 'outlined') {
    return {
      background: 'transparent',
      border: disabled ? colors.greyScale['400'] : colors.brand.primary['300'],
      content: disabled ? colors.greyScale['400'] : colors.greyScale['900'],
    };
  }
  if (variant === 'glass') {
    // Figma has no disabled state for Glass buttons; dim it as a fallback.
    return { background: colors.opacity.white50, border: undefined, content: colors.greyScale['900'] };
  }
  return {
    background: disabled ? colors.greyScale['200'] : colors.brand.primary['500'],
    border: undefined,
    content: disabled ? colors.greyScale['400'] : colors.greyScale['900'],
  };
}

/** Pill button (Figma: Plog Design System, node 106:588 "Button/Default"). */
export default function Button({ label, size = 'medium', variant = 'fill', disabled = false, onPress, leadIcon, tailIcon, style }: ButtonProps) {
  const dims = SIZES[size];
  const palette = resolveColors(variant, disabled);

  const content = (
    <>
      {leadIcon?.({ color: palette.content, size: dims.iconSize })}
      <Text
        style={{
          fontFamily: dims.typo.fontFamily,
          fontWeight: dims.typo.fontWeight,
          fontSize: dims.typo.fontSize,
          letterSpacing: dims.typo.letterSpacing,
          color: palette.content,
        }}
      >
        {label}
      </Text>
      {tailIcon?.({ color: palette.content, size: dims.iconSize })}
    </>
  );

  const sizeStyle: ViewStyle = {
    height: dims.height,
    paddingHorizontal: dims.paddingHorizontal,
    paddingVertical: dims.paddingVertical,
    width: dims.width === 'stretch' ? undefined : dims.width,
    alignSelf: dims.width === 'stretch' ? 'stretch' : 'flex-start',
  };

  if (variant === 'glass') {
    return (
      <View style={[styles.glassShadowWrapper, glassShadowStyle, sizeStyle, disabled && styles.disabledOpacity, style]}>
        <BlurView intensity={20} tint="light" style={styles.glassBlur}>
          <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ disabled }}
            style={[
              styles.content,
              styles.glassPressable,
              { backgroundColor: palette.background, paddingHorizontal: dims.paddingHorizontal, paddingVertical: dims.paddingVertical },
            ]}
          >
            {content}
          </Pressable>
        </BlurView>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[
        styles.content,
        sizeStyle,
        { backgroundColor: palette.background },
        variant === 'outlined' && { borderWidth: 1, borderColor: palette.border },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    borderRadius: spacing.full,
  },
  glassShadowWrapper: {
    borderRadius: spacing.full,
  },
  glassBlur: {
    flex: 1,
    borderRadius: spacing.full,
    overflow: 'hidden',
  },
  glassPressable: {
    flex: 1,
  },
  disabledOpacity: {
    opacity: 0.5,
  },
});
