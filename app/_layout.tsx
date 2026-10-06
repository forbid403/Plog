// GestureHandlerRootView must be the first import — react-native-gesture-handler
// requirement (app/_layout.tsx is effectively the app's real entry point under
// Expo Router), satisfied by importing it before anything else below.
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PLOG_SESSION_SCHEMA } from '../src/lib/plogSessionDb';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        {/* usePlogSession (C1) reads/writes this DB via useSQLiteContext(). */}
        <SQLiteProvider databaseName="plog.db" onInit={(db) => db.execAsync(PLOG_SESSION_SCHEMA)}>
          <BottomSheetModalProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </BottomSheetModalProvider>
        </SQLiteProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
