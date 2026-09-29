import { BlurView } from 'expo-blur';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import IconButton from './IconButton';
import HouseIcon from './icons/HouseIcon';
import SneakerMoveIcon from './icons/SneakerMoveIcon';
import UserIcon from './icons/UserIcon';
import { colors, shadows, spacing } from '../theme';
import { shadowLayerToStyle } from '../lib/shadow';

export type BottomNavigationTab = 'Home' | 'Plog' | 'My';

export type BottomNavigationProps = {
  active: BottomNavigationTab;
  onChange?: (tab: BottomNavigationTab) => void;
  style?: StyleProp<ViewStyle>;
};

const TABS: { key: BottomNavigationTab; label: string; Icon: typeof HouseIcon }[] = [
  { key: 'Home', label: 'Home', Icon: HouseIcon },
  { key: 'Plog', label: 'Plog', Icon: SneakerMoveIcon },
  { key: 'My', label: 'My', Icon: UserIcon },
];

const CONTAINER_WIDTH = 338;
const SELECTOR_WIDTH = 120;
const SELECTOR_HEIGHT = 56;
const EDGE_OFFSET = 6;
const ROW_VERTICAL_PADDING = spacing.s; // 8 — matches styles.blur's paddingVertical
const TAB_HEIGHT = 50; // IconButton's fixed height

// Absolute `left` per tab index — the selector sits inside the (unpadded,
// 338px-wide) BlurView box, same basis Figma used for its own left/center/right.
const TAB_LEFT_POSITIONS = [EDGE_OFFSET, (CONTAINER_WIDTH - SELECTOR_WIDTH) / 2, CONTAINER_WIDTH - SELECTOR_WIDTH - EDGE_OFFSET];

// A fixed pixel top, not `top: '50%'` — the blur row has no explicit height
// (it's sized by its content), and percentage `top` on an absolutely
// positioned child of an auto-height parent resolves unreliably in Yoga
// before the parent's own height is finalized. This is the same value that
// centering would produce, computed directly instead.
const SELECTOR_TOP = ROW_VERTICAL_PADDING - (SELECTOR_HEIGHT - TAB_HEIGHT) / 2;

// Figma's Glass_Button effect has no drop-shadow token in tokens.json (it's a
// single un-tokenized layer, 0/0/10/0 #0000001a) — using shadows.normal's
// middle layer as the closest existing token, per product decision.
const shadowStyle = shadowLayerToStyle(shadows.normal[1]);

/**
 * Floating pill bottom nav (Figma: Plog Design System, node 94:51).
 * Note: the "Home" active-state instance in Figma has a leftover "My" label
 * on the Home tab (reused an old IconButton instance) — the other two active
 * states agree the label should be "Home", which is what's implemented here.
 */
export default function BottomNavigation({ active, onChange, style }: BottomNavigationProps) {
  const activeIndex = TABS.findIndex((tab) => tab.key === active);

  const animatedSelectorStyle = useAnimatedStyle(() => ({
    left: withTiming(TAB_LEFT_POSITIONS[activeIndex], { duration: 220, easing: Easing.out(Easing.cubic) }),
  }));

  return (
    <View style={[styles.shadowWrapper, shadowStyle, style]}>
      <BlurView intensity={20} tint="light" style={styles.blur}>
        <Animated.View style={[styles.selector, animatedSelectorStyle]} />
        {TABS.map(({ key, label, Icon }) => (
          <IconButton
            key={key}
            label={label}
            selected={key === active}
            icon={({ color, size, selected }) => <Icon color={color} size={size} weight={selected ? 'fill' : 'regular'} />}
            onPress={() => onChange?.(key)}
            style={styles.tab}
          />
        ))}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrapper: {
    width: CONTAINER_WIDTH,
    borderRadius: spacing.full,
    backgroundColor: colors.opacity.white50,
  },
  blur: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: spacing.full,
    overflow: 'hidden',
    paddingHorizontal: 22,
    paddingVertical: spacing.s,
    gap: spacing.l, // matches Figma's gap-x-16 between the 3 tab columns — the
    // selector's left/center/right positions (TAB_LEFT_POSITIONS) are computed
    // against this same gapped layout, so dropping this gap misaligns them.
  },
  selector: {
    position: 'absolute',
    top: SELECTOR_TOP,
    width: SELECTOR_WIDTH,
    height: SELECTOR_HEIGHT,
    borderRadius: spacing.full,
    backgroundColor: colors.greyScale['100'],
  },
  tab: {
    flex: 1,
    width: undefined,
  },
});
