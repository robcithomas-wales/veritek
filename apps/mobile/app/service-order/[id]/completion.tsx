import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useStopCodes } from '../../../hooks/use-service-order';
import { enqueue } from '../../../lib/mutation-queue/queue';
import { flushQueue } from '../../../lib/mutation-queue/sync';
import { qk } from '../../../lib/query-client';

export default function CompletionScreen() {
  const { id, activityId } = useLocalSearchParams<{ id: string; activityId?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: stopCodes } = useStopCodes();
  const [selectedCode, setSelectedCode] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleStopWork() {
    if (!selectedCode) { Alert.alert('Stop code required'); return; }
    if (!activityId) return;
    setSubmitting(true);
    enqueue(`/activities/${activityId}/stop-work`, 'PATCH', { stopCode: selectedCode, comments });
    await flushQueue();
    await queryClient.invalidateQueries({ queryKey: qk.serviceOrder(id) });
    setSubmitting(false);
    router.push(`/service-order/${id}/resolution`);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Stop Code</Text>
      <View style={styles.codeGrid}>
        {(stopCodes ?? []).map((sc) => (
          <TouchableOpacity
            key={sc.code}
            style={[styles.codeBtn, selectedCode === sc.code && styles.codeBtnSelected]}
            onPress={() => setSelectedCode(sc.code)}
          >
            <Text style={[styles.codeText, selectedCode === sc.code && styles.codeTextSelected]}>
              {sc.code}
            </Text>
            <Text style={[styles.codeDesc, selectedCode === sc.code && styles.codeTextSelected]} numberOfLines={1}>
              {sc.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Comments</Text>
      <TextInput
        style={styles.textarea}
        multiline
        numberOfLines={4}
        placeholder="Work summary, notes..."
        value={comments}
        onChangeText={setComments}
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleStopWork}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>{submitting ? 'Saving...' : 'Stop Work → Signature'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 8 },
  codeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  codeBtn: { borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', padding: 10, minWidth: 80, alignItems: 'center', backgroundColor: '#fff' },
  codeBtnSelected: { borderColor: '#1d4ed8', backgroundColor: '#eff6ff' },
  codeText: { fontSize: 14, fontWeight: '700', color: '#374151' },
  codeDesc: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  codeTextSelected: { color: '#1d4ed8' },
  textarea: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', padding: 12, fontSize: 15, minHeight: 100, marginBottom: 20 },
  button: { backgroundColor: '#dc2626', borderRadius: 10, padding: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
