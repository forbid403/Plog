import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNavigation, { type BottomNavigationTab } from '../../src/components/BottomNavigation';

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
 * Tab bar visibility per spec 0.3: hidden on Plog recording/finish sheet,
 * Litter log, Impact card, etc. — those are pushed as stack screens outside
 * this (tabs) group rather than toggled here, so this group's tab bar is
 * always the floating BottomNavigation.
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
