import { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useServiceOrder, useRejectionCodes } from '../../../hooks/use-service-order';
import { PriorityBadge } from '../../../components/priority-badge';
import { enqueue } from '../../../lib/mutation-queue/queue';
import { flushQueue } from '../../../lib/mutation-queue/sync';
import { qk } from '../../../lib/query-client';

export default function ServiceOrderDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: order, isLoading } = useServiceOrder(id);
  const { data: rejectionCodes = [] } = useRejectionCodes();
  const [rejecting, setRejecting] = useState(false);
  const [selectedCode, setSelectedCode] = useState('');
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
    if (!selectedCode) { Alert.alert('Rejection code required', 'Please select a reason before confirming.'); return; }
    setSubmitting(true);
    enqueue(`/service-orders/${id}/reject`, 'PATCH', { rejectionCode: selectedCode });
    await flushQueue();
    await queryClient.invalidateQueries({ queryKey: qk.workList() });
    setSubmitting(false);
    setRejecting(false);
    setSelectedCode('');
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
              <Text style={styles.codeLabel}>Select rejection reason</Text>
              <View style={styles.codeGrid}>
                {rejectionCodes.map((rc) => (
                  <TouchableOpacity
                    key={rc.code}
                    style={[styles.codeBtn, selectedCode === rc.code && styles.codeBtnSelected]}
                    onPress={() => setSelectedCode(rc.code)}
                  >
                    <Text style={[styles.codeText, selectedCode === rc.code && styles.codeTextSelected]}>{rc.code}</Text>
                    <Text style={[styles.codeDesc, selectedCode === rc.code && styles.codeTextSelected]} numberOfLines={2}>{rc.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setRejecting(false); setSelectedCode(''); }}>
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
      {(order.contactName || order.contactPhone) && (
        <Section title="On-site contact">
          {order.contactName && <Text style={styles.value}>{order.contactName}</Text>}
          {order.contactPhone && <Text style={styles.sub}>{order.contactPhone}</Text>}
        </Section>
      )}
      {(order.shortDescription || order.problemDescription || order.description) && (
        <Section title="Problem">
          {order.shortDescription && <Text style={styles.value}>{order.shortDescription}</Text>}
          {order.problemDescription && <Text style={[styles.sub, { marginTop: 4 }]}>{order.problemDescription}</Text>}
          {!order.shortDescription && order.description && <Text style={styles.value}>{order.description}</Text>}
        </Section>
      )}
      {(order.reference || order.svNumber) && (
        <Section title="Reference">
          {order.svNumber && <Text style={styles.value}>SV: {order.svNumber}</Text>}
          {order.reference && <Text style={styles.sub}>{order.reference}</Text>}
        </Section>
      )}
      {order.customerDueDate && (
        <Section title="Customer due">
          <Text style={styles.value}>{new Date(order.customerDueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
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
  actionCard: { backgroundColor: '#eff6ff', borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#bfdbfe' },
  actionHeading: { fontSize: 15, fontWeight: '700', color: '#1e3a8a', marginBottom: 4 },
  actionSub: { fontSize: 13, color: '#3b82f6', marginBottom: 12 },
  codeLabel: { fontSize: 12, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  codeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  codeBtn: { borderRadius: 8, borderWidth: 1.5, borderColor: '#d1d5db', padding: 8, minWidth: 80, flex: 1, maxWidth: '48%', backgroundColor: '#fff' },
  codeBtnSelected: { borderColor: '#dc2626', backgroundColor: '#fef2f2' },
  codeText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  codeDesc: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  codeTextSelected: { color: '#dc2626' },
  actionRow: { flexDirection: 'row', gap: 10 },
  acceptBtn: { flex: 1, backgroundColor: '#16a34a', borderRadius: 8, padding: 12, alignItems: 'center' },
  acceptBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  rejectBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#dc2626' },
  rejectBtnText: { color: '#dc2626', fontSize: 14, fontWeight: '600' },
  rejectConfirmBtn: { flex: 1, backgroundColor: '#dc2626', borderRadius: 8, padding: 12, alignItems: 'center' },
  rejectConfirmBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cancelBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db' },
  cancelBtnText: { color: '#6b7280', fontSize: 14 },
  btnDisabled: { opacity: 0.6 },
});
