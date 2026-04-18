import { View, Text, StyleSheet } from 'react-native';
import type { ServiceOrderPriority } from '@veritek/types';

interface Props { priority: ServiceOrderPriority }

const CONFIG: Record<ServiceOrderPriority, { text: string; color: string }> = {
  critical: { text: 'CRITICAL', color: '#dc2626' },
  high:     { text: 'HIGH',     color: '#ea580c' },
  medium:   { text: 'MEDIUM',   color: '#ca8a04' },
  low:      { text: 'LOW',      color: '#16a34a' },
};

export function PriorityBadge({ priority }: Props) {
  const { text, color } = CONFIG[priority] ?? CONFIG.medium;
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
});
