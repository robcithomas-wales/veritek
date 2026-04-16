import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useServiceOrder } from '../../../hooks/use-service-order';
import { enqueue } from '../../../lib/mutation-queue/queue';
import { flushQueue } from '../../../lib/mutation-queue/sync';
import { qk } from '../../../lib/query-client';
import type { Activity } from '@veritek/types';

const STATUS_LABEL: Record<string, string> = {
  open: 'Open', travel: 'Travelling', work: 'Working', complete: 'Complete',
};
const TYPE_LABEL: Record<string, string> = {
  break_fix: 'Break Fix', preventive_maintenance: 'PM', installation: 'Install', other: 'Other',
};

export default function ActivitiesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: order, isLoading } = useServiceOrder(id);

  async function doAction(endpoint: string, method: 'POST' | 'PATCH', body?: unknown) {
    enqueue(endpoint, method, body ?? {});
    await flushQueue();
    await queryClient.invalidateQueries({ queryKey: qk.serviceOrder(id) });
  }

  if (isLoading || !order) return <View style={styles.center}><Text>Loading...</Text></View>;

  const activeActivity = order.activities.find(
    (a) => a.status === 'travel' || a.status === 'work',
  );
  const canCreate = !activeActivity && order.status !== 'completed' && order.status !== 'closed';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {order.activities.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          orderId={id}
          onAction={doAction}
          router={router}
        />
      ))}
      {canCreate && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            Alert.alert('Create Activity', 'Select type', [
              { text: 'Break Fix', onPress: () => doAction(`/service-orders/${id}/activities`, 'POST', { type: 'break_fix' }) },
              { text: 'Preventive Maintenance', onPress: () => doAction(`/service-orders/${id}/activities`, 'POST', { type: 'preventive_maintenance' }) },
              { text: 'Installation', onPress: () => doAction(`/service-orders/${id}/activities`, 'POST', { type: 'installation' }) },
              { text: 'Cancel', style: 'cancel' },
            ]);
          }}
        >
          <Text style={styles.addButtonText}>+ New Activity</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function ActivityCard({
  activity, orderId, onAction, router,
}: {
  activity: Activity;
  orderId: string;
  onAction: (ep: string, m: 'POST' | 'PATCH', b?: unknown) => Promise<void>;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.activityType}>{TYPE_LABEL[activity.type] ?? activity.type}</Text>
        <View style={[styles.statusDot, { backgroundColor: activity.status === 'complete' ? '#16a34a' : '#f59e0b' }]} />
        <Text style={styles.statusText}>{STATUS_LABEL[activity.status]}</Text>
      </View>
      <View style={styles.actions}>
        {activity.status === 'open' && (
          <ActionButton label="Start Travel" color="#1d4ed8" onPress={() => onAction(`/activities/${activity.id}/start-travel`, 'PATCH')} />
        )}
        {activity.status === 'travel' && (
          <ActionButton label="Start Work" color="#7c3aed" onPress={() => {
            Alert.prompt('Travel Distance', 'Miles travelled', (miles) => {
              onAction(`/activities/${activity.id}/start-work`, 'PATCH', { travelDistance: parseInt(miles ?? '0', 10) });
            });
          }} />
        )}
        {activity.status === 'work' && (
          <ActionButton label="Checklist" color="#ea580c" onPress={() => router.push(`/service-order/${orderId}/checklist?activityId=${activity.id}`)} />
        )}
        {activity.status === 'work' && (
          <ActionButton label="Stop Work" color="#dc2626" onPress={() => router.push(`/service-order/${orderId}/completion?activityId=${activity.id}`)} />
        )}
      </View>
    </View>
  );
}

function ActionButton({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.actionBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  activityType: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, color: '#6b7280' },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  addButton: { borderRadius: 10, borderWidth: 1, borderColor: '#1d4ed8', borderStyle: 'dashed', padding: 14, alignItems: 'center' },
  addButtonText: { color: '#1d4ed8', fontSize: 15, fontWeight: '600' },
});
