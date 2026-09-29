import { Image, Pressable, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import CameraIcon from './icons/CameraIcon';
import UserIcon from './icons/UserIcon';
import { colors, shadows, spacing } from '../theme';
import { shadowLayerToStyle } from '../lib/shadow';

export type AvatarSize = 'small' | 'medium' | 'large';

export type AvatarProps = {
  size?: AvatarSize;
  /** Omit (or pass undefined) to render the empty/placeholder state. */
  source?: ImageSourcePropType;
  onPress?: () => void;
  /** Shows the camera edit badge (Figma only defines this for size="large"). */
  editable?: boolean;
  onEditPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

const SIZES: Record<AvatarSize, { container: number; borderWidth: number; iconSize: number }> = {
  small: { container: 36, borderWidth: 1, iconSize: 20 },
  medium: { container: 48, borderWidth: 1, iconSize: 28 },
  large: { container: 80, borderWidth: 1.667, iconSize: 46.667 },
};

const BADGE_SIZE = 32;
// Position ratio taken from Figma's Large/Empty instance (badge at 63.33,58.33
// within a 92px container) and reapplied to our 80px large size.
const BADGE_POSITION_RATIO = { left: 63.33 / 92, top: 58.33 / 92 };

// Same shadow-isn't-tokenized situation as Glass_Button (see claude.md "Known
// token gap") — the badge's shadow colors match shadows.normal exactly, just
// scaled oddly by Figma's nested-instance scaling, so reusing it as-is.
const badgeShadowStyle = shadowLayerToStyle(shadows.normal[1]);

/** Profile avatar (Figma: Plog Design System, node 327:400). */
export default function Avatar({ size = 'small', source, onPress, editable = false, onEditPress, accessibilityLabel, style }: AvatarProps) {
  const dims = SIZES[size];
  const containerStyle = {
    width: dims.container,
    height: dims.container,
    borderRadius: spacing.full,
  };

  const avatar = source ? (
    <Image
      source={source}
      style={[containerStyle, { borderWidth: dims.borderWidth, borderColor: colors.greyScale['400'] }]}
    />
  ) : (
    <View
      style={[
        containerStyle,
        styles.empty,
        { borderWidth: dims.borderWidth, borderColor: colors.opacity.grey12 },
      ]}
    >
      <UserIcon color={colors.opacity.grey50} size={dims.iconSize} weight="regular" />
    </View>
  );

  return (
    <View style={[{ width: dims.container, height: dims.container }, style]}>
      <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={accessibilityLabel}>
        {avatar}
      </Pressable>
      {editable ? (
        <Pressable
          onPress={onEditPress}
          accessibilityRole="button"
          accessibilityLabel="Change photo"
          style={[
            styles.badge,
            badgeShadowStyle,
            {
              left: dims.container * BADGE_POSITION_RATIO.left,
              top: dims.container * BADGE_POSITION_RATIO.top,
            },
          ]}
        >
          <CameraIcon color={colors.opacity.grey50} size={20} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    backgroundColor: colors.base.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: spacing.full,
    backgroundColor: colors.base.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
