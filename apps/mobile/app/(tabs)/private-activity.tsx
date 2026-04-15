import { View, Text, StyleSheet } from 'react-native';
export default function PrivateActivityScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>My Time — coming in Phase 2</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { color: '#6b7280', fontSize: 15 },
});
