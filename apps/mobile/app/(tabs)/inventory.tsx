import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import type { VanStockItem } from '@veritek/types';
import { useVanStock } from '../../hooks/use-inventory';

function StockRow({ item }: { item: VanStockItem }) {
  const qtyColor = item.qty === 0 ? '#dc2626' : item.qty <= 2 ? '#d97706' : '#16a34a';

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowName}>{item.product.name}</Text>
        <Text style={styles.rowSku}>{item.product.sku}</Text>
      </View>
      <View style={styles.qtyBadge}>
        <Text style={[styles.qtyText, { color: qtyColor }]}>{item.qty}</Text>
      </View>
    </View>
  );
}

export default function InventoryScreen() {
  const [search, setSearch] = useState('');
  const { data: stock, isLoading, refetch, isRefetching } = useVanStock();

  const filtered = (stock ?? []).filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.product.name.toLowerCase().includes(q) ||
      item.product.sku.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading van stock...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or SKU..."
          placeholderTextColor="#9ca3af"
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <StockRow item={item} />}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={
          filtered.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>
              {search ? 'No items match your search' : 'No van stock loaded'}
            </Text>
            {!search && (
              <Text style={styles.muted}>Pull down to refresh</Text>
            )}
          </View>
        }
        ListHeaderComponent={
          filtered.length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                {filtered.length} item{filtered.length !== 1 ? 's' : ''}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { color: '#6b7280', fontSize: 14 },
  emptyTitle: { color: '#374151', fontSize: 17, fontWeight: '600', marginBottom: 6 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  listContent: { paddingBottom: 16 },

  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 15,
    color: '#111827',
  },

  listHeader: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  listHeaderText: { fontSize: 12, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' },

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
  rowName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  rowSku: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  qtyBadge: {
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontSize: 20, fontWeight: '700' },
});
