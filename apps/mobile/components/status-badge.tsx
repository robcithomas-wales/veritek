import { View, Text, StyleSheet } from 'react-native';
import type { ServiceOrderStatus } from '@veritek/types';

const STATUS_COLORS: Record<ServiceOrderStatus, string> = {
  received: '#6b7280',
  accepted: '#2563eb',
  'in-route': '#7c3aed',
  'in-progress': '#ea580c',
  completed: '#16a34a',
  closed: '#374151',
};

const STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  received: 'Received',
  accepted: 'Accepted',
  'in-route': 'En Route',
  'in-progress': 'In Progress',
  completed: 'Completed',
  closed: 'Closed',
};

interface Props { status: ServiceOrderStatus }

export function StatusBadge({ status }: Props) {
  const color = STATUS_COLORS[status] ?? '#6b7280';
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{STATUS_LABELS[status] ?? status}</Text>
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
  text: { fontSize: 11, fontWeight: '600' },
});
