import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../src/components/Button';
import { usePlogSession } from '../src/hooks/usePlogSession';

// Placeholder destination for C2's Start button, outside the (tabs) group so
// the floating tab bar is hidden while recording (spec 0.3). Real content —
// status pill, live route, time/distance, Pause button — is C3, not built
// yet; this just proves the state machine + navigation work end-to-end and
// gives a way back out (Discard) so testing C2 doesn't leave you stuck here.
export default function PlogSessionScreen() {
  const { status, elapsedSec, discard } = usePlogSession();

  useEffect(() => {
    if (status === 'idle') router.back();
  }, [status]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Recording — {elapsedSec}s elapsed</Text>
      <Text style={styles.text}>(C3 screen isn&apos;t built yet)</Text>
      <Button
        label="Discard session"
        variant="outlined"
        onPress={async () => {
          await discard();
          router.back();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    fontSize: 17,
  },
});
