import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNavigation, { type BottomNavigationTab } from '../../src/components/BottomNavigation';
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

  return (
    <BottomNavigation
      active={activeTab}
      onChange={(tab) => navigation.navigate(TAB_TO_ROUTE[tab])}
      style={[styles.tabBar, { bottom: insets.bottom + 16 }]}
    />
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

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    alignSelf: 'center',
  },
});
