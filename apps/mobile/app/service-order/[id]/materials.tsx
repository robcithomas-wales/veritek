import { useState } from 'react';
import { FlatList, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useMaterials } from '../../../hooks/use-service-order';
import { enqueue } from '../../../lib/mutation-queue/queue';
import { flushQueue } from '../../../lib/mutation-queue/sync';
import { qk } from '../../../lib/query-client';
import type { Material } from '@veritek/types';

const STATUS_COLORS: Record<string, string> = {
  needed: '#ca8a04', allocated: '#2563eb', back_ordered: '#dc2626',
  fulfilled: '#16a34a', not_used: '#6b7280', cancelled: '#374151',
};

export default function MaterialsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: materials, isLoading } = useMaterials(id);

  const [serialPrompt, setSerialPrompt] = useState<{ materialId: string; productName: string } | null>(null);
  const [serialInput, setSerialInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) return <View style={styles.center}><Text>Loading...</Text></View>;
  if (!materials?.length) return <View style={styles.center}><Text style={styles.empty}>No parts on this order</Text></View>;

  async function fitPart(material: Material) {
    const product = (material as any).product;
    if (product?.serialized) {
      setSerialPrompt({ materialId: material.id, productName: product.name });
      setSerialInput('');
      return;
    }
    await submitFit(material.id, undefined);
  }

  async function submitFit(materialId: string, serialNumber: string | undefined) {
    setSubmitting(true);
    enqueue(`/materials/${materialId}`, 'PATCH', {
      status: 'fulfilled',
      qtyFitted: 1,
      ...(serialNumber ? { serialNumber } : {}),
    });
    await flushQueue();
    await queryClient.invalidateQueries({ queryKey: qk.materials(id) });
    setSubmitting(false);
    setSerialPrompt(null);
  }

  async function confirmSerial() {
    if (!serialInput.trim()) {
      Alert.alert('Serial number required', 'This part must have a serial number recorded before fitting.');
      return;
    }
    if (!serialPrompt) return;
    await submitFit(serialPrompt.materialId, serialInput.trim());
  }

  return (
    <>
      <FlatList
        data={materials}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => {
          const color = STATUS_COLORS[item.status] ?? '#6b7280';
          const product = (item as any).product;
          const canFit = ['allocated', 'needed'].includes(item.status);
          return (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.name}>{product?.name ?? item.productId}</Text>
                <Text style={[styles.status, { color }]}>{item.status.replace('_', ' ')}</Text>
              </View>
              <Text style={styles.meta}>Qty needed: {item.qty}{item.qtyFitted > 0 ? `  ·  Fitted: ${item.qtyFitted}` : ''}</Text>
              {item.serialNumber && <Text style={styles.serial}>Serial: {item.serialNumber}</Text>}
              {item.isConsigned && <Text style={styles.consigned}>Consigned</Text>}
              {item.returnable && <Text style={styles.returnable}>Returnable</Text>}
              {canFit && (
                <TouchableOpacity style={styles.fitBtn} onPress={() => fitPart(item)} disabled={submitting}>
                  <Text style={styles.fitBtnText}>Mark as Fitted</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      {/* Serial number prompt modal */}
      <Modal visible={!!serialPrompt} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Serial Number Required</Text>
            <Text style={styles.modalSub}>{serialPrompt?.productName} is a serialised part. Record the serial number before fitting.</Text>
            <TextInput
              style={styles.serialInput}
              placeholder="e.g. SN-ABC-12345"
              placeholderTextColor="#9ca3af"
              value={serialInput}
              onChangeText={setSerialInput}
              autoFocus
              autoCapitalize="characters"
            />
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setSerialPrompt(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirm, submitting && styles.btnDisabled]} onPress={confirmSerial} disabled={submitting}>
                <Text style={styles.modalConfirmText}>{submitting ? 'Saving...' : 'Confirm & Fit'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#6b7280', fontSize: 15 },
  content: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
  status: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  meta: { fontSize: 13, color: '#374151', marginBottom: 4 },
  serial: { fontSize: 12, color: '#374151', marginBottom: 2 },
  consigned: { fontSize: 12, color: '#7c3aed', marginBottom: 2 },
  returnable: { fontSize: 12, color: '#2563eb' },
  fitBtn: { marginTop: 10, backgroundColor: '#16a34a', borderRadius: 8, padding: 10, alignItems: 'center' },
  fitBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 8 },
  modalSub: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  serialInput: { borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, color: '#111827', marginBottom: 16 },
  modalRow: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, alignItems: 'center' },
  modalCancelText: { color: '#6b7280', fontSize: 14 },
  modalConfirm: { flex: 1, backgroundColor: '#16a34a', borderRadius: 8, padding: 12, alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
