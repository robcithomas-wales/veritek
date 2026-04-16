import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import type { Shipment } from '@veritek/types';
import { useShipments, useUpdateShipmentStatus } from '../../hooks/use-shipping';

// Temporary type alias until types package export is updated
type ShipmentWithLines = Shipment & { shipLines?: Array<{ id: string; qty: number; product?: { name: string } }> };

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  collected: 'Collected',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#d97706',
  collected: '#16a34a',
  cancelled: '#6b7280',
};

const TYPE_LABELS: Record<string, string> = {
  return: 'Parts Return',
  on_site_collection: 'On-Site Collection',
};

function ShipmentCard({
  item,
  onMarkCollected,
  onCancel,
}: {
  item: ShipmentWithLines;
  onMarkCollected: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const statusColor = STATUS_COLORS[item.status] ?? '#6b7280';
  const statusLabel = STATUS_LABELS[item.status] ?? item.status;
  const typeLabel = TYPE_LABELS[item.type] ?? item.type;
  const lineCount = item.shipLines?.length ?? 0;
  const date = new Date(item.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardType}>{typeLabel}</Text>
          <Text style={styles.cardMeta}>
            {date} · {lineCount} line{lineCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={[styles.statusBadge, { borderColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {item.shipLines && item.shipLines.length > 0 && (
        <View style={styles.lines}>
          {item.shipLines.slice(0, 3).map((line) => (
            <Text key={line.id} style={styles.lineText}>
              {line.product?.name ?? 'Unknown'} × {line.qty}
            </Text>
          ))}
          {item.shipLines.length > 3 && (
            <Text style={styles.lineMore}>+{item.shipLines.length - 3} more</Text>
          )}
        </View>
      )}

      {item.status === 'pending' && (
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.collectBtn}
            onPress={() => onMarkCollected(item.id)}
          >
            <Text style={styles.collectBtnText}>Mark Collected</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => onCancel(item.id)}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function ShippingScreen() {
  const { data: shipments, isLoading, refetch, isRefetching } = useShipments();
  const { mutate: updateStatus } = useUpdateShipmentStatus();

  function handleCollected(id: string) {
    Alert.alert('Mark as collected?', 'This confirms the parts have been picked up.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () => updateStatus(id, { status: 'collected' }),
      },
    ]);
  }

  function handleCancel(id: string) {
    Alert.alert('Cancel shipment?', 'This request will be marked as cancelled.', [
      { text: 'Back', style: 'cancel' },
      {
        text: 'Cancel Request',
        style: 'destructive',
        onPress: () => updateStatus(id, { status: 'cancelled' }),
      },
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
    <FlatList
      data={(shipments ?? []) as ShipmentWithLines[]}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ShipmentCard
          item={item}
          onMarkCollected={handleCollected}
          onCancel={handleCancel}
        />
      )}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
      contentContainerStyle={
        !shipments?.length ? styles.emptyContainer : styles.listContent
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No shipping requests</Text>
          <Text style={styles.muted}>Parts returns are created from job materials</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { color: '#6b7280', fontSize: 14 },
  emptyTitle: { color: '#374151', fontSize: 17, fontWeight: '600', marginBottom: 6 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  listContent: { paddingVertical: 8, backgroundColor: '#f9fafb' },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardType: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardMeta: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: { fontSize: 12, fontWeight: '600' },

  lines: { marginBottom: 12 },
  lineText: { fontSize: 13, color: '#374151', paddingVertical: 2 },
  lineMore: { fontSize: 13, color: '#6b7280', fontStyle: 'italic' },

  cardActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  collectBtn: {
    flex: 1,
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  collectBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#374151', fontSize: 14 },
});
