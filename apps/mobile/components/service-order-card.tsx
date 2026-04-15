import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { ServiceOrder } from '@veritek/types';
import { PriorityBadge } from './priority-badge';
import { StatusBadge } from './status-badge';

interface Props { order: ServiceOrder & { site: { name: string } } }

export function ServiceOrderCard({ order }: Props) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/service-order/${order.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.reference}>{order.reference ?? order.id.slice(-8).toUpperCase()}</Text>
        <PriorityBadge priority={order.priority} />
      </View>
      <Text style={styles.site}>{order.site.name}</Text>
      {order.description && (
        <Text style={styles.description} numberOfLines={2}>{order.description}</Text>
      )}
      <View style={styles.footer}>
        <StatusBadge status={order.status as any} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reference: { fontSize: 15, fontWeight: '700', color: '#111827' },
  site: { fontSize: 14, color: '#374151', marginBottom: 4 },
  description: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  footer: { flexDirection: 'row' },
});
