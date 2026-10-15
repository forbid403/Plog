import { Stack } from 'expo-router';

/**
 * The My tab is a small stack: My (tab root) → Your Impact detail. Living
 * inside (tabs) keeps the floating tab bar on Your Impact with `My` active
 * (G6). Session detail is pushed outside the tabs (Figma 681:2562 has no
 * tab bar).
 */
export default function MyStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
