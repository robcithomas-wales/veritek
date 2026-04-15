import { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { enqueue } from '../../../lib/mutation-queue/queue';
import { flushQueue } from '../../../lib/mutation-queue/sync';
import { qk } from '../../../lib/query-client';

// Signature is captured as a simple text confirmation (customer name)
// A canvas-based signature pad can be layered in once react-native-signature-canvas is installed.
export default function SignatureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [customerName, setCustomerName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleComplete() {
    if (!customerName.trim()) { Alert.alert('Please enter the customer name'); return; }
    setSubmitting(true);
    enqueue(`/service-orders/${id}/complete`, 'POST', { signedBy: customerName.trim() });
    await flushQueue();
    await queryClient.invalidateQueries({ queryKey: qk.serviceOrder(id) });
    await queryClient.invalidateQueries({ queryKey: qk.workList() });
    setSubmitting(false);
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Customer Sign-Off</Text>
      <Text style={styles.sub}>Please ask the customer to confirm their name</Text>

      <View style={styles.signatureBox}>
        <Text style={styles.signatureLabel}>Customer name</Text>
        <View style={styles.nameInput}>
          <Text style={{ fontSize: 16, color: '#111827', flex: 1 }}>{customerName || ' '}</Text>
        </View>
        <View style={styles.keyboard}>
          {'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz'.split('').map((c) => (
            <TouchableOpacity
              key={c + Math.random()}
              style={styles.key}
              onPress={() => setCustomerName((n) => n + c)}
            >
              <Text style={styles.keyText}>{c === ' ' ? '⎵' : c}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.key, { backgroundColor: '#fee2e2' }]} onPress={() => setCustomerName((n) => n.slice(0, -1))}>
            <Text style={[styles.keyText, { color: '#dc2626' }]}>⌫</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleComplete}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>{submitting ? 'Completing...' : 'Complete Job'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16 },
  heading: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 },
  sub: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  signatureBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20 },
  signatureLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: 8 },
  nameInput: { borderBottomWidth: 2, borderBottomColor: '#1d4ed8', paddingBottom: 8, marginBottom: 16, minHeight: 36 },
  keyboard: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  key: { borderRadius: 4, backgroundColor: '#f3f4f6', padding: 6, minWidth: 28, alignItems: 'center' },
  keyText: { fontSize: 13, color: '#374151' },
  button: { backgroundColor: '#16a34a', borderRadius: 10, padding: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
