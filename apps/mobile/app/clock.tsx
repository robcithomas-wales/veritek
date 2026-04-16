import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useClockToday } from '../hooks/use-clock';
import { enqueue } from '../lib/mutation-queue/queue';
import { flushQueue } from '../lib/mutation-queue/sync';
import { qk } from '../lib/query-client';

export default function ClockModal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: lastEvent } = useClockToday();
  const [submitting, setSubmitting] = useState(false);

  const isClockedIn = lastEvent?.type === 'clock_in';

  async function handleClock() {
    const type = isClockedIn ? 'clock_out' : 'clock_in';
    const label = isClockedIn ? 'Clock Out' : 'Clock In';
    Alert.alert(label, `Confirm ${label.toLowerCase()}?`, [
      {
        text: 'Confirm',
        onPress: async () => {
          setSubmitting(true);
          enqueue('/clock', 'POST', { type, timestamp: new Date().toISOString() });
          await flushQueue();
          await queryClient.invalidateQueries({ queryKey: qk.clockToday() });
          setSubmitting(false);
          router.back();
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        {isClockedIn ? 'Currently Clocked In' : 'Not Clocked In'}
      </Text>
      {lastEvent && (
        <Text style={styles.lastEvent}>
          Last event: {lastEvent.type === 'clock_in' ? 'Clocked in' : 'Clocked out'} at{' '}
          {new Date(lastEvent.timestamp).toLocaleTimeString()}
        </Text>
      )}
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: isClockedIn ? '#dc2626' : '#16a34a' },
          submitting && styles.buttonDisabled,
        ]}
        onPress={handleClock}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>
          {submitting ? '...' : isClockedIn ? 'Clock Out' : 'Clock In'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancel} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#fff' },
  heading: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
  lastEvent: { fontSize: 14, color: '#6b7280', marginBottom: 32 },
  button: { borderRadius: 12, paddingHorizontal: 48, paddingVertical: 18, marginBottom: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  cancel: { padding: 12 },
  cancelText: { color: '#6b7280', fontSize: 16 },
});
