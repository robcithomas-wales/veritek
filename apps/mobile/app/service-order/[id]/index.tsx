import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useServiceOrder } from '../../../hooks/use-service-order';
import { PriorityBadge } from '../../../components/priority-badge';

export default function ServiceOrderDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading } = useServiceOrder(id);

  if (isLoading || !order) {
    return <View style={styles.center}><Text>Loading...</Text></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Section title="Priority">
        <PriorityBadge priority={order.priority} />
      </Section>
      <Section title="Site">
        <Text style={styles.value}>{order.site.name}</Text>
        {order.site.address && <Text style={styles.sub}>{order.site.address}</Text>}
        {order.site.postcode && <Text style={styles.sub}>{order.site.postcode}</Text>}
      </Section>
      {order.description && (
        <Section title="Description">
          <Text style={styles.value}>{order.description}</Text>
        </Section>
      )}
      {order.reference && (
        <Section title="Reference">
          <Text style={styles.value}>{order.reference}</Text>
        </Section>
      )}
      <Section title="Assigned to">
        <Text style={styles.value}>{order.assignedTo.firstName} {order.assignedTo.lastName}</Text>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  label: { fontSize: 11, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  value: { fontSize: 15, color: '#111827' },
  sub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
});
