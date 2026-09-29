import { StyleSheet, Text, View } from 'react-native';

// Placeholder — My tab (spec Part G) isn't built yet.
export default function MyScreen() {
  return (
    <View style={styles.container}>
      <Text>My</Text>
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
