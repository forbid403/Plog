import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { deleteAccount } from '../../src/api';
import { colors, spacing, typography } from '../../src/theme';

// Placeholder — My tab (spec Part G) isn't built yet. Account deletion is
// not in the spec either (Apple 5.1.1(v) / Google Play both require it for
// an app that creates accounts), so it's just a bare button here rather
// than waiting for the real My tab design.
export default function MyScreen() {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    Alert.alert('Delete your account?', 'This permanently deletes your profile, sessions, and photos. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: confirmDelete },
    ]);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      // Onboarding's own "seen once" flag (A2) is device-level, not
      // account-level — deliberately left alone. Only the account itself
      // is gone, so straight to profile setup (not the marketing slides)
      // to set up a new one.
      router.replace('/onboarding-profile');
    } catch (e) {
      console.error('[my] account deletion failed:', e);
      Alert.alert('Could not delete your account', 'Check your connection and try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My</Text>
      <Pressable onPress={handleDelete} disabled={deleting} style={styles.deleteButton} accessibilityRole="button">
        {deleting ? <ActivityIndicator color={colors.red['700']} /> : <Text style={styles.deleteText}>Delete account</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['4xl'],
  },
  title: {
    fontFamily: typography.titles.large.fontFamily,
    fontWeight: typography.titles.large.fontWeight,
    fontSize: typography.titles.large.fontSize,
    color: colors.greyScale['900'],
  },
  deleteButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.m,
  },
  deleteText: {
    fontFamily: typography.body.base.fontFamily,
    fontWeight: typography.body.base.fontWeight,
    fontSize: typography.body.base.fontSize,
    color: colors.red['700'],
    textDecorationLine: 'underline',
  },
});
