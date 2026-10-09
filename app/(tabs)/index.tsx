import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { usePlogSession } from '../../src/hooks/usePlogSession';
import { hasCompletedOnboarding } from '../../src/lib/onboardingStorage';

// Placeholder — Home screen content (spec Part B) isn't built yet.
export default function HomeScreen() {
  const router = useRouter();
  const { status, hydrated } = usePlogSession();
  const [checked, setChecked] = useState(false);

  // A2: onboarding is shown once per install, gated here since Home is
  // this app's actual entry point (no separate root index route — see
  // docs/todo-onboarding.md's "Routing" note for why).
  useEffect(() => {
    hasCompletedOnboarding().then((done) => {
      if (!done) router.replace('/onboarding');
      else setChecked(true);
    });
  }, [router]);

  // Relaunching the app always lands here (cold start has no "last tab"
  // memory), but the tab bar — the only way to reach the Plog tab — is
  // hidden the whole time a session is recording/paused (spec 0.3). With
  // no redirect, an in-progress session (C3.1's whole point: it survives
  // the app being killed) became unreachable: stuck on Home, no tab bar,
  // no way back to it. `hydrated` guards against usePlogSession's status
  // defaulting to 'idle' before its own async DB read finishes — without
  // it this fires on that false default and never redirects.
  useEffect(() => {
    if (checked && hydrated && status !== 'idle') router.replace('/plog');
  }, [checked, hydrated, status, router]);

  if (!checked) return null;

  return (
    <View style={styles.container}>
      <Text>Home</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
