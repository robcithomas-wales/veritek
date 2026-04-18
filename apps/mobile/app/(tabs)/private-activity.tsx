import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import type { PrivateActivity, PrivateActivityType } from '@veritek/types';
import {
  usePrivateActivities,
  useCreatePrivateActivity,
  useCompletePrivateActivity,
  useRemovePrivateActivity,
} from '../../hooks/use-private-activities';

const ACTIVITY_TYPES: { value: PrivateActivityType; label: string }[] = [
  { value: 'travel', label: 'Travel' },
  { value: 'training', label: 'Training' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'absence', label: 'Absence' },
  { value: 'other', label: 'Other' },
];

function formatDuration(start: string, end: string | null): string {
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : Date.now();
  const mins = Math.round((endMs - startMs) / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function ActivityRow({
  item,
  onComplete,
  onRemove,
}: {
  item: PrivateActivity;
  onComplete: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const typeLabel = ACTIVITY_TYPES.find((t) => t.value === item.type)?.label ?? item.type;
  const duration = formatDuration(item.startTime, item.endTime);
  const startLabel = formatTime(item.startTime);

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowType}>{typeLabel}{item.subject ? ` — ${item.subject}` : ''}</Text>
        <Text style={styles.rowMeta}>
          {startLabel} · {duration}
          {item.location ? ` · ${item.location}` : ''}
        </Text>
      </View>
      <View style={styles.rowActions}>
        {!item.done && (
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={() => onComplete(item.id)}
          >
            <Text style={styles.completeBtnText}>Done</Text>
          </TouchableOpacity>
        )}
        {item.done && <Text style={styles.doneBadge}>✓</Text>}
        <TouchableOpacity onPress={() => onRemove(item.id)}>
          <Text style={styles.removeBtn}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function parseHHMM(val: string, baseDate: Date = new Date()): Date | null {
  const m = val.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1]!, 10);
  const min = parseInt(m[2]!, 10);
  if (h > 23 || min > 59) return null;
  const d = new Date(baseDate);
  d.setHours(h, min, 0, 0);
  return d;
}

function NewActivityModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    type: PrivateActivityType,
    subject: string,
    location: string,
    startTime: string,
    endTime: string | undefined,
  ) => void;
}) {
  const [type, setType] = useState<PrivateActivityType>('travel');
  const [subject, setSubject] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState(nowHHMM);
  const [endTime, setEndTime] = useState('');

  function handleSubmit() {
    if (!subject.trim()) {
      Alert.alert('Subject required', 'Please enter a description for this time block.');
      return;
    }
    const start = parseHHMM(startTime);
    if (!start) {
      Alert.alert('Invalid start time', 'Enter a start time in HH:MM format, e.g. 09:30');
      return;
    }
    let end: Date | undefined;
    if (endTime.trim()) {
      const parsed = parseHHMM(endTime);
      if (!parsed) {
        Alert.alert('Invalid end time', 'Enter an end time in HH:MM format, e.g. 11:00');
        return;
      }
      if (parsed <= start) {
        Alert.alert('Invalid end time', 'End time must be after start time.');
        return;
      }
      end = parsed;
    }
    onSubmit(type, subject.trim(), location.trim(), start.toISOString(), end?.toISOString());
    setSubject('');
    setLocation('');
    setStartTime(nowHHMM());
    setEndTime('');
    setType('travel');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Log time block</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalClose}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.fieldLabel}>Type</Text>
        <View style={styles.typeGrid}>
          {ACTIVITY_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.typeChip, type === t.value && styles.typeChipActive]}
              onPress={() => setType(t.value)}
            >
              <Text style={[styles.typeChipText, type === t.value && styles.typeChipTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Subject <Text style={{ color: '#dc2626' }}>*</Text></Text>
        <TextInput
          style={[styles.textInput, styles.singleLine]}
          value={subject}
          onChangeText={setSubject}
          placeholder="e.g. Hydraulic systems refresher"
          placeholderTextColor="#9ca3af"
          returnKeyType="next"
        />

        <View style={styles.timeRow}>
          <View style={styles.timeField}>
            <Text style={styles.fieldLabel}>Start time <Text style={{ color: '#dc2626' }}>*</Text></Text>
            <TextInput
              style={[styles.textInput, styles.singleLine, styles.timeInput]}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="09:00"
              placeholderTextColor="#9ca3af"
              keyboardType="numbers-and-punctuation"
              returnKeyType="next"
              maxLength={5}
            />
          </View>
          <View style={styles.timeField}>
            <Text style={styles.fieldLabel}>End time <Text style={{ color: '#6b7280', fontWeight: '400' }}>(optional)</Text></Text>
            <TextInput
              style={[styles.textInput, styles.singleLine, styles.timeInput]}
              value={endTime}
              onChangeText={setEndTime}
              placeholder="11:30"
              placeholderTextColor="#9ca3af"
              keyboardType="numbers-and-punctuation"
              returnKeyType="next"
              maxLength={5}
            />
          </View>
        </View>
        <Text style={styles.timeHint}>
          {endTime.trim() ? 'This time block will be saved as completed.' : 'Leave end time blank to mark as done later.'}
        </Text>

        <Text style={styles.fieldLabel}>Location (optional)</Text>
        <TextInput
          style={[styles.textInput, styles.singleLine]}
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Birmingham depot"
          placeholderTextColor="#9ca3af"
          returnKeyType="done"
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>{endTime.trim() ? 'Save' : 'Start'}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default function PrivateActivityScreen() {
  const [showModal, setShowModal] = useState(false);
  const { data, isLoading, refetch, isRefetching } = usePrivateActivities();
  const { mutate: create } = useCreatePrivateActivity();
  const { mutate: complete } = useCompletePrivateActivity();
  const { mutate: remove } = useRemovePrivateActivity();

  const activities = (data as any)?.data ?? data ?? [];

  function handleCreate(
    type: PrivateActivityType,
    subject: string,
    location: string,
    startTime: string,
    endTime: string | undefined,
  ) {
    create(
      {} as any,
      {
        type,
        startTime,
        ...(endTime ? { endTime } : {}),
        subject,
        ...(location ? { location } : {}),
      },
    );
  }

  function handleComplete(id: string) {
    complete(id, { endTime: new Date().toISOString() });
  }

  function handleRemove(id: string) {
    Alert.alert('Remove', 'Remove this time block?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove(id) },
    ]);
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={activities as PrivateActivity[]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ActivityRow item={item} onComplete={handleComplete} onRemove={handleRemove} />
        )}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={
          activities.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>No time blocks today</Text>
            <Text style={styles.muted}>Tap + to log time away from jobs</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <NewActivityModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  listContent: { paddingVertical: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { color: '#6b7280', fontSize: 14 },
  emptyTitle: { color: '#374151', fontSize: 17, fontWeight: '600', marginBottom: 6 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  rowLeft: { flex: 1 },
  rowType: { fontSize: 15, fontWeight: '600', color: '#111827' },
  rowMeta: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  completeBtn: {
    backgroundColor: '#1d4ed8',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  completeBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  doneBadge: { color: '#16a34a', fontSize: 18, fontWeight: '700' },
  removeBtn: { color: '#9ca3af', fontSize: 16 },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1d4ed8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },

  modal: { flex: 1, padding: 24, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  modalClose: { color: '#1d4ed8', fontSize: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  typeChipActive: { borderColor: '#1d4ed8', backgroundColor: '#eff6ff' },
  typeChipText: { fontSize: 14, color: '#374151' },
  typeChipTextActive: { color: '#1d4ed8', fontWeight: '600' },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    marginBottom: 20,
  },
  singleLine: {
    minHeight: 44,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 0,
  },
  timeField: {
    flex: 1,
  },
  timeInput: {
    textAlign: 'center',
    letterSpacing: 1,
  },
  timeHint: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 20,
    marginTop: -12,
  },
  submitBtn: {
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
