import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useServiceOrder } from '../../../hooks/use-service-order';
import { PriorityBadge } from '../../../components/priority-badge';
import { enqueue } from '../../../lib/mutation-queue/queue';
import { flushQueue } from '../../../lib/mutation-queue/sync';
import { qk } from '../../../lib/query-client';

export default function ServiceOrderDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: order, isLoading } = useServiceOrder(id);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isLoading || !order) {
    return <View style={styles.center}><ActivityIndicator color="#1d4ed8" /></View>;
  }

  async function handleAccept() {
    setSubmitting(true);
    enqueue(`/service-orders/${id}/accept`, 'PATCH', {});
    await flushQueue();
    await queryClient.invalidateQueries({ queryKey: qk.serviceOrder(id) });
    await queryClient.invalidateQueries({ queryKey: qk.workList() });
    setSubmitting(false);
  }

  async function handleReject() {
    if (!rejectReason.trim()) { Alert.alert('Reason required'); return; }
    setSubmitting(true);
    enqueue(`/service-orders/${id}/reject`, 'PATCH', { reason: rejectReason.trim() });
    await flushQueue();
    await queryClient.invalidateQueries({ queryKey: qk.workList() });
    setSubmitting(false);
    setRejecting(false);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Accept / Reject — shown only when order is newly received */}
      {order.status === 'received' && (
        <View style={styles.actionCard}>
          <Text style={styles.actionHeading}>New Job Assignment</Text>
          <Text style={styles.actionSub}>Accept this job to begin work, or reject if you cannot attend.</Text>
          {rejecting ? (
            <>
              <TextInput
                style={styles.reasonInput}
                placeholder="Reason for rejection..."
                value={rejectReason}
                onChangeText={setRejectReason}
                multiline
                autoFocus
              />
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setRejecting(false); setRejectReason(''); }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rejectConfirmBtn, submitting && styles.btnDisabled]}
                  onPress={handleReject}
                  disabled={submitting}
                >
                  <Text style={styles.rejectConfirmBtnText}>{submitting ? '...' : 'Confirm Reject'}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => setRejecting(true)}>
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.acceptBtn, submitting && styles.btnDisabled]}
                onPress={handleAccept}
                disabled={submitting}
              >
                <Text style={styles.acceptBtnText}>{submitting ? '...' : 'Accept Job'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

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
  // Accept / Reject action card
  actionCard: { backgroundColor: '#eff6ff', borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#bfdbfe' },
  actionHeading: { fontSize: 15, fontWeight: '700', color: '#1e3a8a', marginBottom: 4 },
  actionSub: { fontSize: 13, color: '#3b82f6', marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 10 },
  acceptBtn: { flex: 1, backgroundColor: '#16a34a', borderRadius: 8, padding: 12, alignItems: 'center' },
  acceptBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  rejectBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#dc2626' },
  rejectBtnText: { color: '#dc2626', fontSize: 14, fontWeight: '600' },
  rejectConfirmBtn: { flex: 1, backgroundColor: '#dc2626', borderRadius: 8, padding: 12, alignItems: 'center' },
  rejectConfirmBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cancelBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db' },
  cancelBtnText: { color: '#6b7280', fontSize: 14 },
  reasonInput: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', padding: 10, fontSize: 14, minHeight: 72, marginBottom: 10, textAlignVertical: 'top' },
  btnDisabled: { opacity: 0.6 },
});
