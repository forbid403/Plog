import { StyleSheet, Text, View } from 'react-native';

// Placeholder — Plog session flow (spec Part C) isn't built yet.
export default function PlogScreen() {
  return (
    <View style={styles.container}>
      <Text>Plog</Text>
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
