import type { ConfigContext, ExpoConfig } from 'expo/config';

// Extends app.json with values that must not be committed — set them in
// .env locally and as EAS environment variables for store builds.
export default ({ config }: ConfigContext): ExpoConfig =>
  ({
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      ['react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY }],
    ],
  }) as ExpoConfig;
