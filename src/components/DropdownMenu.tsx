import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { shadowLayerToStyle } from '../lib/shadow';
import { colors, shadows, spacing, typography } from '../theme';

export type DropdownAnchor = { x: number; y: number; width: number; height: number };

export type DropdownMenuProps<K extends string | number> = {
  /** Where the trigger is on screen (measureInWindow); null = closed. */
  anchor: DropdownAnchor | null;
  options: { key: K; label: string }[];
  selected: K;
  onSelect: (key: K) => void;
  onClose: () => void;
  /** Line the menu up with the trigger's left or right edge. */
  align?: 'left' | 'right';
  accessibilityLabel?: string;
};

const MENU_GAP = spacing['2xs'];
const MENU_MIN_WIDTH = 200;

/**
 * Small floating menu under its trigger (sort options on My, year on Your
 * Impact). No Figma reference — styled with the card tokens. Rendered in a
 * Modal so it sits above the floating tab bar.
 */
export default function DropdownMenu<K extends string | number>({
  anchor,
  options,
  selected,
  onSelect,
  onClose,
  align = 'left',
  accessibilityLabel,
}: DropdownMenuProps<K>) {
  const { width: screenWidth } = useWindowDimensions();
  if (!anchor) return null;

  const position =
    align === 'right'
      ? { top: anchor.y + anchor.height + MENU_GAP, right: screenWidth - (anchor.x + anchor.width) }
      : { top: anchor.y + anchor.height + MENU_GAP, left: anchor.x };

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close menu" />
      <View
        style={[styles.menu, shadowLayerToStyle(shadows.normal[1]), position]}
        accessibilityRole="menu"
        accessibilityLabel={accessibilityLabel}
      >
        {options.map(({ key, label }) => {
          const isSelected = key === selected;
          return (
            <Pressable
              key={String(key)}
              onPress={() => {
                onSelect(key);
                onClose();
              }}
              accessibilityRole="menuitem"
              accessibilityState={{ selected: isSelected }}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            >
              <Text style={[styles.label, isSelected && styles.labelSelected]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  menu: {
    position: 'absolute',
    minWidth: MENU_MIN_WIDTH,
    paddingVertical: spacing.xs,
    borderRadius: spacing.m,
    borderWidth: 1,
    borderColor: colors.opacity.grey12,
    backgroundColor: colors.base.white,
  },
  option: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
  },
  optionPressed: {
    backgroundColor: colors.greyScale['50'],
  },
  label: {
    fontFamily: typography.body.base.fontFamily,
    fontWeight: typography.body.base.fontWeight,
    fontSize: typography.body.base.fontSize,
    letterSpacing: typography.body.base.letterSpacing,
    color: colors.greyScale['800'],
  },
  labelSelected: {
    fontFamily: typography.body.baseBold.fontFamily,
    fontWeight: typography.body.baseBold.fontWeight,
    color: colors.brand.primary['700'],
  },
});
