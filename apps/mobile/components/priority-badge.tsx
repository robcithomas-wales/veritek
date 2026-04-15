import { View, Text, StyleSheet } from 'react-native';

interface Props { priority: number }

function label(p: number): { text: string; color: string } {
  if (p >= 80) return { text: 'URGENT', color: '#7c3aed' };
  if (p >= 60) return { text: 'CRITICAL', color: '#dc2626' };
  if (p >= 40) return { text: 'HIGH', color: '#ea580c' };
  if (p >= 20) return { text: 'MEDIUM', color: '#ca8a04' };
  return { text: 'LOW', color: '#16a34a' };
}

export function PriorityBadge({ priority }: Props) {
  const { text, color } = label(priority);
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
});
