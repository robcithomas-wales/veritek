import { FlatList, View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useItems } from '../../../hooks/use-service-order';

export default function ItemsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: items, isLoading } = useItems(id);

  if (isLoading) return <View style={styles.center}><Text>Loading...</Text></View>;
  if (!items?.length) return <View style={styles.center}><Text style={styles.empty}>No equipment on this order</Text></View>;

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.name}>{(item as any).product?.name ?? item.productId}</Text>
          <Text style={styles.sku}>SKU: {(item as any).product?.sku ?? '—'}</Text>
          {item.serialNumber && <Text style={styles.meta}>Serial: {item.serialNumber}</Text>}
          {item.tagNumber && <Text style={styles.meta}>Tag: {item.tagNumber}</Text>}
          {item.warrantyExpiry && (
            <Text style={styles.meta}>Warranty expires: {new Date(item.warrantyExpiry).toLocaleDateString()}</Text>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#6b7280', fontSize: 15 },
  content: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  name: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  sku: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  meta: { fontSize: 13, color: '#374151' },
});
