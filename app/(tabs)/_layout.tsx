import { BlurView } from 'expo-blur';
import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { StackActions } from 'expo-router/react-navigation';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNavigation, { type BottomNavigationTab } from '../../src/components/BottomNavigation';
import { spacing } from '../../src/theme';
import { usePlogSession } from '../../src/hooks/usePlogSession';

const ROUTE_TO_TAB: Record<string, BottomNavigationTab> = {
  index: 'Home',
  plog: 'Plog',
  my: 'My',
};
const TAB_TO_ROUTE = Object.fromEntries(Object.entries(ROUTE_TO_TAB).map(([route, tab]) => [tab, route])) as Record<
  BottomNavigationTab,
  string
>;

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  // Spec 0.3: tab bar hidden while Plog is recording/paused. The Plog tab
  // (app/(tabs)/plog.tsx) is a single screen that branches on this same
  // status rather than navigating to a different route — so hiding it here
  // means reading the same hook, not reacting to which route is active.
  const { status } = usePlogSession();
  if (status !== 'idle') return null;

  const activeTab = ROUTE_TO_TAB[state.routes[state.index].name] ?? 'Home';
  // Figma puts the bar 29pt from the screen bottom on a 34pt home-indicator
  // phone, i.e. dipping slightly into the safe area. Phones without a home
  // indicator (insets.bottom 0) keep a 16pt gap.
  const tabBarBottom = Math.max(insets.bottom - spacing['2xs'], spacing.l);

  return (
    <>
      {/* Figma "Bottom Safe Area" (e.g. node 562:4488): a light blur strip
          behind the floating bar, from the screen bottom up to its top edge.
          Content scrolls under it blurred, and it swallows taps so nothing
          half-hidden behind the bar gets pressed by accident. */}
      <View style={[styles.bottomSafeArea, { height: tabBarBottom + TAB_BAR_HEIGHT }]} onStartShouldSetResponder={() => true}>
        <BlurView intensity={BOTTOM_BLUR_INTENSITY} tint="light" style={StyleSheet.absoluteFill} />
      </View>
      <BottomNavigation
        active={activeTab}
        onChange={(tab) => {
          const routeName = TAB_TO_ROUTE[tab];
          // A tab tap always lands on that tab's root screen, like a standard
          // tab bar — e.g. My while on Your Impact goes back to My (the My
          // tab is a nested stack, app/(tabs)/my/_layout.tsx).
          const nested = state.routes.find((r) => r.name === routeName)?.state;
          if (nested?.key && (nested.index ?? 0) > 0) {
            navigation.dispatch({ ...StackActions.popToTop(), target: nested.key });
          }
          navigation.navigate(routeName);
        }}
        style={[styles.tabBar, { bottom: tabBarBottom }]}
      />
    </>
  );
}

/**
 * Tab bar visibility per spec 0.3: hidden while Plog is recording/paused
 * (CustomTabBar above), and on fully separate screens like Litter log /
 * Impact card that are pushed outside this (tabs) group entirely.
 */
export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="plog" options={{ title: 'Plog' }} />
      <Tabs.Screen name="my" options={{ title: 'My' }} />
    </Tabs>
  );
}

const TAB_BAR_HEIGHT = 66; // BottomNavigation: 8 + 50 + 8
// Figma's strip is a 2.5px backdrop blur — a light touch, not frosted glass.
const BOTTOM_BLUR_INTENSITY = 10;

const styles = StyleSheet.create({
  bottomSafeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  tabBar: {
    position: 'absolute',
    alignSelf: 'center',
  },
});
