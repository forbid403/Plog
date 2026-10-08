import * as SecureStore from 'expo-secure-store';

/**
 * A2: onboarding is shown once per install, not once per account — stored
 * on-device (not in the profiles table), so a reinstall shows it again
 * even though the Supabase session/profile might otherwise persist.
 */
const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';

export async function hasCompletedOnboarding(): Promise<boolean> {
  return (await SecureStore.getItemAsync(ONBOARDING_COMPLETED_KEY)) === 'true';
}

export async function setOnboardingCompleted(): Promise<void> {
  await SecureStore.setItemAsync(ONBOARDING_COMPLETED_KEY, 'true');
}
