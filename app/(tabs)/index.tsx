import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { hasCompletedOnboarding } from '../../src/lib/onboardingStorage';

// Placeholder — Home screen content (spec Part B) isn't built yet.
export default function HomeScreen() {
  const router = useRouter();
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
