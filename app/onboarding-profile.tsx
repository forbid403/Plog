import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signUp } from '../src/api/auth';
import { Avatar, Button, Input } from '../src/components';
import { setOnboardingCompleted } from '../src/lib/onboardingStorage';
import { colors, spacing, typography } from '../src/theme';

const MIN_NICKNAME_LENGTH = 2;
const MAX_NICKNAME_LENGTH = 20;

function randomNickname(): string {
  return `Plogger${Math.floor(1000 + Math.random() * 9000)}`;
}

/** A4 (Figma: Plog Design, node 685:2772 "Sign-up"). */
export default function OnboardingProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [nickname, setNickname] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const trimmed = nickname.trim();
  const canSubmit = trimmed.length >= MIN_NICKNAME_LENGTH && trimmed.length <= MAX_NICKNAME_LENGTH;

  const pickAvatar = async (source: 'camera' | 'library') => {
    if (source === 'camera') {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1] };
    const result =
      source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;
    setAvatarUri(result.assets[0].uri);
  };

  const choosePhotoSource = () => {
    Alert.alert('Profile photo', undefined, [
      { text: 'Take photo', onPress: () => pickAvatar('camera') },
      { text: 'Choose from library', onPress: () => pickAvatar('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const finishSignUp = async (nicknameToUse: string, avatar?: string) => {
    setSubmitting(true);
    try {
      await signUp(nicknameToUse, avatar);
      await setOnboardingCompleted();
      router.replace('/');
    } catch (e) {
      // A4: "On failure, show a message, keep input, allow retry."
      console.error('[onboarding-profile] signUp failed:', e);
      Alert.alert('Could not set up your profile', 'Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const save = () => canSubmit && finishSignUp(trimmed, avatarUri ?? undefined);
  // Figma's "Skip it for now" — still needs an account underneath (sessions
  // rows have a required profiles FK), so this signs up with a generated
  // nickname rather than literally skipping sign-up itself. Spec's A4 table
  // says nickname is required with no documented skip path; the design
  // adds one anyway — followed the design, flagged here since it's not in
  // spec text.
  const skip = () => finishSignUp(randomNickname());

  return (
    <View style={[styles.container, { paddingTop: insets.top + 62, paddingBottom: insets.bottom + spacing['2xl'] }]}>
      <View style={styles.content}>
        <Text style={styles.logo}>Plog</Text>
        <Text style={styles.title}>Set your profile</Text>

        <View style={styles.fields}>
          <Avatar size="large" source={avatarUri ? { uri: avatarUri } : undefined} editable onEditPress={choosePhotoSource} onPress={choosePhotoSource} style={styles.avatar} />
          <Input value={nickname} onChangeText={setNickname} placeholder="Nickname" maxLength={MAX_NICKNAME_LENGTH} leadIcon={null} autoCapitalize="none" autoCorrect={false} />
        </View>
      </View>

      <View style={styles.footer}>
        <Button label="Save" size="full" disabled={!canSubmit || submitting} onPress={save} />
        <Pressable onPress={skip} disabled={submitting} accessibilityRole="button">
          <Text style={styles.skipText}>Skip it for now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base.white,
    justifyContent: 'space-between',
    paddingHorizontal: spacing['2xl'],
  },
  content: {
    gap: 47,
  },
  logo: {
    fontFamily: 'Afacad_500Medium',
    fontSize: 30,
    letterSpacing: -0.75,
    color: colors.brand.primary['300'],
  },
  title: {
    fontFamily: 'Afacad_600SemiBold',
    fontSize: 40,
    color: colors.greyScale['900'],
  },
  fields: {
    alignItems: 'center',
    gap: spacing['3xl'],
  },
  avatar: {},
  footer: {
    alignItems: 'center',
    gap: spacing.m,
  },
  skipText: {
    fontFamily: typography.caption.fontFamily,
    fontWeight: typography.caption.fontWeight,
    fontSize: typography.caption.fontSize,
    color: colors.greyScale['600'],
  },
});
