import { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useChecklists } from '../../../hooks/use-service-order';
import { enqueue } from '../../../lib/mutation-queue/queue';
import { flushQueue } from '../../../lib/mutation-queue/sync';
import { qk } from '../../../lib/query-client';

const ANSWERS = ['Pass', 'Fail', 'N/A'];
const ANSWER_COLORS: Record<string, string> = { Pass: '#16a34a', Fail: '#dc2626', 'N/A': '#6b7280' };

export default function ChecklistScreen() {
  const { id, activityId, itemType } = useLocalSearchParams<{ id: string; activityId: string; itemType?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: questions } = useChecklists(itemType ?? 'default');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function setAnswer(questionId: string, answer: string) {
    setResponses((r) => ({ ...r, [questionId]: answer }));
  }

  async function handleSubmit() {
    const missing = (questions ?? []).filter((q) => !responses[q.id]);
    if (missing.length) {
      Alert.alert('Incomplete', `${missing.length} question(s) unanswered`);
      return;
    }
    setSubmitting(true);
    const payload = {
      responses: Object.entries(responses).map(([questionId, answer]) => ({ questionId, answer })),
    };
    enqueue(`/activities/${activityId}/checklist-responses`, 'POST', payload);
    await flushQueue();
    await queryClient.invalidateQueries({ queryKey: qk.serviceOrder(id) });
    setSubmitting(false);
    router.back();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Checklist</Text>
      {(questions ?? []).map((q, idx) => (
        <View key={q.id} style={styles.question}>
          <Text style={styles.qText}>{idx + 1}. {q.question}</Text>
          <View style={styles.answerRow}>
            {ANSWERS.map((a) => (
              <TouchableOpacity
                key={a}
                style={[
                  styles.answerBtn,
                  responses[q.id] === a && { backgroundColor: ANSWER_COLORS[a], borderColor: ANSWER_COLORS[a] },
                ]}
                onPress={() => setAnswer(q.id, a)}
              >
                <Text style={[styles.answerText, responses[q.id] === a && { color: '#fff' }]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
      {!questions?.length && (
        <Text style={styles.empty}>No checklist questions for this item type</Text>
      )}
      <TouchableOpacity
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>{submitting ? 'Saving...' : 'Submit Checklist'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16 },
  heading: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 16 },
  question: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10 },
  qText: { fontSize: 14, color: '#374151', marginBottom: 10 },
  answerRow: { flexDirection: 'row', gap: 8 },
  answerBtn: { flex: 1, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', padding: 8, alignItems: 'center' },
  answerText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  empty: { color: '#6b7280', textAlign: 'center', marginVertical: 20 },
  button: { backgroundColor: '#1d4ed8', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
