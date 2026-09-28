import { BlurView } from 'expo-blur';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
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

const SELECTOR_WIDTH = 120;
const SELECTOR_HEIGHT = 56;
const EDGE_OFFSET = 6;

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

  return (
    <View style={[styles.shadowWrapper, shadowStyle, style]}>
      <BlurView intensity={20} tint="light" style={styles.blur}>
        <View
          style={[
            styles.selector,
            activeIndex === 0 && { left: EDGE_OFFSET },
            activeIndex === 1 && { left: '50%', transform: [{ translateX: -SELECTOR_WIDTH / 2 }] },
            activeIndex === 2 && { right: EDGE_OFFSET },
          ]}
        />
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
    width: 338,
    borderRadius: spacing.full,
    backgroundColor: colors.opacity.white50,
  },
  blur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: spacing.full,
    overflow: 'hidden',
    paddingHorizontal: 22,
    paddingVertical: spacing.s,
  },
  selector: {
    position: 'absolute',
    top: '50%',
    width: SELECTOR_WIDTH,
    height: SELECTOR_HEIGHT,
    marginTop: -SELECTOR_HEIGHT / 2,
    borderRadius: spacing.full,
    backgroundColor: colors.greyScale['100'],
  },
  tab: {
    flex: 1,
    width: undefined,
  },
});
