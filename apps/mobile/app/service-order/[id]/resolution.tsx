import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useProblemCodes,
  useCauseCodes,
  useRepairCodes,
  useResolveCodes,
} from '../../../hooks/use-service-order';

type CodeItem = { code: string; description: string };

function CodePicker({
  label,
  codes,
  selected,
  onSelect,
}: {
  label: string;
  codes: CodeItem[];
  selected: string;
  onSelect: (code: string) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <View style={styles.codeGrid}>
        {codes.map((c) => (
          <TouchableOpacity
            key={c.code}
            style={[styles.codeBtn, selected === c.code && styles.codeBtnSelected]}
            onPress={() => onSelect(c.code)}
          >
            <Text style={[styles.codeText, selected === c.code && styles.codeTextSelected]}>
              {c.code}
            </Text>
            <Text style={[styles.codeDesc, selected === c.code && styles.codeTextSelected]} numberOfLines={2}>
              {c.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function ResolutionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: problemCodes = [] } = useProblemCodes();
  const { data: causeCodes = [] } = useCauseCodes();
  const { data: repairCodes = [] } = useRepairCodes();
  const { data: resolveCodes = [] } = useResolveCodes();

  const [problemCode, setProblemCode] = useState('');
  const [causeCode, setCauseCode] = useState('');
  const [repairCode, setRepairCode] = useState('');
  const [resolveCode, setResolveCode] = useState('');
  const [resolveText, setResolveText] = useState('');
  const [fullyResolved, setFullyResolved] = useState(true);

  function handleContinue() {
    if (!problemCode || !causeCode || !repairCode || !resolveCode) {
      Alert.alert('All codes required', 'Please select a problem, cause, repair, and resolve code before continuing.');
      return;
    }
    if (!resolveText.trim()) {
      Alert.alert('Resolve text required', 'Please summarise what was found and done.');
      return;
    }
    router.push({
      pathname: `/service-order/${id}/signature`,
      params: { problemCode, causeCode, repairCode, resolveCode, resolveText, fullyResolved: fullyResolved ? '1' : '0' },
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Resolution Codes</Text>
      <Text style={styles.sub}>Record what was found, why it failed, and how it was fixed</Text>

      <CodePicker label="Problem Code" codes={problemCodes} selected={problemCode} onSelect={setProblemCode} />
      <CodePicker label="Cause Code" codes={causeCodes} selected={causeCode} onSelect={setCauseCode} />
      <CodePicker label="Repair Code" codes={repairCodes} selected={repairCode} onSelect={setRepairCode} />
      <CodePicker label="Resolve Code" codes={resolveCodes} selected={resolveCode} onSelect={setResolveCode} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resolve Text</Text>
        <TextInput
          style={styles.textarea}
          multiline
          numberOfLines={4}
          placeholder="Summarise what was found, what was done, and any parts used or ordered…"
          placeholderTextColor="#9ca3af"
          value={resolveText}
          onChangeText={setResolveText}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.resolvedRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.resolvedLabel}>Job fully resolved?</Text>
          <Text style={styles.resolvedSub}>Turn off if a follow-up visit is needed</Text>
        </View>
        <Switch
          value={fullyResolved}
          onValueChange={setFullyResolved}
          trackColor={{ true: '#16a34a' }}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue to Signature →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 },
  sub: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  codeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  codeBtn: { borderRadius: 8, borderWidth: 1.5, borderColor: '#d1d5db', padding: 10, minWidth: 90, flex: 1, maxWidth: '48%', backgroundColor: '#fff' },
  codeBtnSelected: { borderColor: '#1d4ed8', backgroundColor: '#eff6ff' },
  codeText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  codeDesc: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  codeTextSelected: { color: '#1d4ed8' },
  textarea: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    color: '#111827',
  },
  resolvedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    padding: 16,
    marginBottom: 24,
  },
  resolvedLabel: { fontSize: 15, fontWeight: '600', color: '#111827' },
  resolvedSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  button: { backgroundColor: '#1d4ed8', borderRadius: 10, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
