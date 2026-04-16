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
        <Text style={styles.rowType}>{typeLabel}</Text>
        <Text style={styles.rowMeta}>
          {startLabel} · {duration}
          {item.notes ? ` · ${item.notes}` : ''}
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

function NewActivityModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (type: PrivateActivityType, notes: string) => void;
}) {
  const [type, setType] = useState<PrivateActivityType>('travel');
  const [notes, setNotes] = useState('');

  function handleSubmit() {
    onSubmit(type, notes.trim());
    setNotes('');
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
              <Text
                style={[styles.typeChipText, type === t.value && styles.typeChipTextActive]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Notes (optional)</Text>
        <TextInput
          style={styles.textInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. WFH training day"
          placeholderTextColor="#9ca3af"
          multiline
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>Start</Text>
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

  function handleCreate(type: PrivateActivityType, notes: string) {
    create(
      {} as any,
      { type, startTime: new Date().toISOString(), ...(notes ? { notes } : {}) },
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
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  submitBtn: {
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
