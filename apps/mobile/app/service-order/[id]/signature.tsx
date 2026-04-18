import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Dimensions, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';
import { enqueue } from '../../../lib/mutation-queue/queue';
import { flushQueue } from '../../../lib/mutation-queue/sync';
import { qk } from '../../../lib/query-client';

const PAD_WIDTH = Dimensions.get('window').width - 32;
const PAD_HEIGHT = 200;

export default function SignatureScreen() {
  const {
    id,
    problemCode,
    causeCode,
    repairCode,
    resolveCode,
    resolveText,
    fullyResolved: fullyResolvedParam,
  } = useLocalSearchParams<{
    id: string;
    problemCode: string;
    causeCode: string;
    repairCode: string;
    resolveCode: string;
    resolveText: string;
    fullyResolved: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [signedByName, setSignedByName] = useState('');
  const [strokes, setStrokes] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onBegin((e) => {
      setCurrentPath(`M ${e.x.toFixed(1)} ${e.y.toFixed(1)}`);
    })
    .onUpdate((e) => {
      setCurrentPath((p) => `${p} L ${e.x.toFixed(1)} ${e.y.toFixed(1)}`);
    })
    .onEnd(() => {
      setStrokes((s) => [...s, currentPath]);
      setCurrentPath('');
    });

  function buildSvg() {
    const pathEls = strokes
      .filter(Boolean)
      .map((d) => `<path d="${d}" stroke="#111827" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)
      .join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${PAD_WIDTH}" height="${PAD_HEIGHT}">${pathEls}</svg>`;
  }

  async function handleComplete() {
    if (!signedByName.trim()) {
      Alert.alert('Name required', 'Please ask the customer to print their name.');
      return;
    }
    if (strokes.length === 0) {
      Alert.alert('Signature required', 'Please ask the customer to sign before completing.');
      return;
    }
    setSubmitting(true);
    enqueue(`/service-orders/${id}/complete`, 'POST', {
      signedByName: signedByName.trim(),
      signatureData: buildSvg(),
      resolution: {
        problemCode,
        causeCode,
        repairCode,
        resolveCode,
        resolveText,
        fullyResolved: fullyResolvedParam === '1',
      },
    });
    await flushQueue();
    await queryClient.invalidateQueries({ queryKey: qk.serviceOrder(id) });
    await queryClient.invalidateQueries({ queryKey: qk.workList() });
    setSubmitting(false);
    router.replace('/(tabs)');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Customer Sign-Off</Text>
        <Text style={styles.sub}>Please hand the device to the customer</Text>

        <Text style={styles.label}>Printed name</Text>
        <TextInput
          style={styles.nameInput}
          placeholder="Customer's full name"
          placeholderTextColor="#9ca3af"
          value={signedByName}
          onChangeText={setSignedByName}
          autoCapitalize="words"
          returnKeyType="done"
        />

        <Text style={[styles.label, { marginTop: 20 }]}>Signature</Text>
        <View style={styles.padWrapper}>
          <GestureDetector gesture={pan}>
            <View style={styles.pad} collapsable={false}>
              <Svg width={PAD_WIDTH} height={PAD_HEIGHT}>
                {strokes.map((d, i) => (
                  <Path key={i} d={d} stroke="#111827" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                ))}
                {currentPath ? (
                  <Path d={currentPath} stroke="#111827" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                ) : null}
              </Svg>
            </View>
          </GestureDetector>
          <View style={styles.baseline} />
          {strokes.length === 0 && (
            <Text style={styles.placeholder}>Sign here</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.clearBtn}
          onPress={() => { setStrokes([]); setCurrentPath(''); }}
        >
          <Text style={styles.clearText}>Clear signature</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>{submitting ? 'Completing...' : 'Complete Job'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 },
  sub: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '600', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  nameInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  padWrapper: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  pad: { width: PAD_WIDTH, height: PAD_HEIGHT },
  baseline: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  placeholder: {
    position: 'absolute',
    bottom: 48,
    left: 20,
    fontSize: 14,
    color: '#d1d5db',
    pointerEvents: 'none',
  },
  clearBtn: { alignSelf: 'flex-end', marginBottom: 24, padding: 4 },
  clearText: { fontSize: 14, color: '#6b7280' },
  button: { backgroundColor: '#16a34a', borderRadius: 10, padding: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
