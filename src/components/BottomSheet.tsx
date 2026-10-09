import GorhomBottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

export type BottomSheetHandle = {
  open: () => void;
  close: () => void;
};

export type BottomSheetProps = {
  children: React.ReactNode;
  /** Snap points, tallest-content-first is fine — gorhom sorts them. Defaults to a single point that fits the content. */
  snapPoints?: (string | number)[];
  /** Figma's "handles" prop — hide the drag handle (e.g. for a sheet that isn't draggable). */
  showHandle?: boolean;
  /** Pan-down-to-close and tap-backdrop-to-close. Defaults to true. Set false for a sheet that's a fixed part of the screen (e.g. Impact card's always-open share sheet) rather than a transient one the user can dismiss. */
  dismissible?: boolean;
  onDismiss?: () => void;
};

/**
 * Interactive bottom sheet: backdrop + open/close animation + drag-to-dismiss,
 * built on @gorhom/bottom-sheet. Visuals match Figma's "Sheet Panel" (node
 * 132:148) — rounded top corners, subtle background, 90×4 handle.
 *
 * Must be rendered under <BottomSheetModalProvider> (see App.tsx).
 */
const BottomSheet = forwardRef<BottomSheetHandle, BottomSheetProps>(function BottomSheet(
  { children, snapPoints, showHandle = true, dismissible = true, onDismiss },
  ref
) {
  const sheetRef = useRef<GorhomBottomSheet>(null);
  const insets = useSafeAreaInsets();

  useImperativeHandle(ref, () => ({
    open: () => sheetRef.current?.expand(),
    close: () => sheetRef.current?.close(),
  }));

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />,
    []
  );

  return (
    <GorhomBottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enableDynamicSizing={!snapPoints}
      enablePanDownToClose={dismissible}
      onClose={onDismiss}
      // A non-dismissible sheet is a fixed part of the screen (e.g.
      // Impact card's always-open share sheet) — no dimming backdrop
      // implying it can be tapped away.
      backdropComponent={dismissible ? renderBackdrop : undefined}
      backgroundStyle={styles.background}
      handleStyle={styles.handleArea}
      handleIndicatorStyle={styles.handleIndicator}
      handleComponent={showHandle ? undefined : null}
    >
      <BottomSheetView style={[styles.content, { paddingBottom: insets.bottom || spacing.m }]}>
        {children}
      </BottomSheetView>
    </GorhomBottomSheet>
  );
});

export default BottomSheet;

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.greyScale['50'],
    borderTopLeftRadius: spacing.xl,
    borderTopRightRadius: spacing.xl,
  },
  handleArea: {
    paddingTop: 10,
    paddingBottom: spacing.l,
  },
  handleIndicator: {
    width: 90,
    height: 4,
    borderRadius: spacing.xs,
    backgroundColor: colors.greyScale['400'],
  },
  content: {
    paddingHorizontal: spacing.l,
  },
});
