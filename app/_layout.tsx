// GestureHandlerRootView must be the first import — react-native-gesture-handler
// requirement (app/_layout.tsx is effectively the app's real entry point under
// Expo Router), satisfied by importing it before anything else below.
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// Side-effect import — TaskManager.defineTask must run at module/global scope
// (C3.1), and this guarantees it happens even if the OS relaunches the app
// in the background to deliver a location update.
import '../src/lib/backgroundLocationTask';
import { PlogSessionProvider } from '../src/hooks/usePlogSession';
import { PLOG_POINTS_SCHEMA } from '../src/lib/plogPointsDb';
import { PLOG_SESSION_SCHEMA } from '../src/lib/plogSessionDb';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        {/* usePlogSession (C1) and the background location task (C3.1) both read/write this DB. */}
        <SQLiteProvider databaseName="plog.db" onInit={(db) => db.execAsync(PLOG_SESSION_SCHEMA + PLOG_POINTS_SCHEMA)}>
          {/* Shared status — the Plog tab and (tabs)/_layout.tsx's tab bar
              both need to see the same live session state, not their own
              independent copies. Inside SQLiteProvider: depends on it. */}
          <PlogSessionProvider>
            <BottomSheetModalProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </BottomSheetModalProvider>
          </PlogSessionProvider>
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
