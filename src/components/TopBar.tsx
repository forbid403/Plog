import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CircleIconButton from './CircleIconButton';
import CaretLeftIcon from './icons/CaretLeftIcon';
import DotsThreeVerticalIcon from './icons/DotsThreeVerticalIcon';
import { colors, spacing, typography } from '../theme';

type TopBarBase = {
  title: string;
  style?: StyleProp<ViewStyle>;
};

export type TopBarProps =
  | (TopBarBase & {
      /** Figma "1 Depth" — root screen: title + avatar. */
      depth: 1;
      avatarSource: ImageSourcePropType;
      onAvatarPress?: () => void;
    })
  | (TopBarBase & {
      /** Figma "2 Depth" — sub screen: back button + centered title + optional overflow menu. */
      depth: 2;
      onBackPress?: () => void;
      showRightIcon?: boolean;
      onMenuPress?: () => void;
    });

/** Screen header (Figma: Plog Design System, node 257:91). */
export default function TopBar(props: TopBarProps) {
  const insets = useSafeAreaInsets();
  const containerStyle = [styles.container, { paddingTop: insets.top + spacing.s }, props.style];

  if (props.depth === 1) {
    return (
      <View style={containerStyle}>
        <Text style={styles.title}>{props.title}</Text>
        <Pressable
          disabled={!props.onAvatarPress}
          onPress={props.onAvatarPress}
          accessibilityRole={props.onAvatarPress ? 'button' : undefined}
        >
          <Image source={props.avatarSource} style={styles.avatar} />
        </Pressable>
      </View>
    );
  }

  const showRightIcon = props.showRightIcon ?? true;

  return (
    <View style={containerStyle}>
      <CircleIconButton
        accessibilityLabel="Back"
        onPress={props.onBackPress}
        icon={({ color, size }) => <CaretLeftIcon color={color} size={size} />}
      />
      <Text style={[styles.title, styles.centeredTitle]}>{props.title}</Text>
      {showRightIcon ? (
        <CircleIconButton
          accessibilityLabel="More"
          onPress={props.onMenuPress}
          icon={({ color, size }) => <DotsThreeVerticalIcon color={color} size={size} />}
        />
      ) : (
        <View style={styles.rightSpacer} />
      )}
    </View>
  );
}

const AVATAR_SIZE = 36;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.opacity.grey8,
  },
  title: {
    fontFamily: typography.body.baseBold.fontFamily,
    fontWeight: typography.body.baseBold.fontWeight,
    fontSize: typography.body.baseBold.fontSize,
    letterSpacing: typography.body.baseBold.letterSpacing,
    color: colors.greyScale['900'],
  },
  centeredTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: spacing.full,
    borderWidth: 1,
    borderColor: colors.greyScale['400'],
  },
  rightSpacer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
});
