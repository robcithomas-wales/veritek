import { FlatList, View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMaterials } from '../../../hooks/use-service-order';

const STATUS_COLORS: Record<string, string> = {
  needed: '#ca8a04', allocated: '#2563eb', 'back-ordered': '#dc2626',
  fulfilled: '#16a34a', 'not-used': '#6b7280', cancelled: '#374151',
};

export default function MaterialsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: materials, isLoading } = useMaterials(id);

  if (isLoading) return <View style={styles.center}><Text>Loading...</Text></View>;
  if (!materials?.length) return <View style={styles.center}><Text style={styles.empty}>No parts on this order</Text></View>;

  return (
    <FlatList
      data={materials}
      keyExtractor={(m) => m.id}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => {
        const color = STATUS_COLORS[item.status] ?? '#6b7280';
        return (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{(item as any).product?.name ?? item.productId}</Text>
              <Text style={[styles.status, { color }]}>{item.status}</Text>
            </View>
            <Text style={styles.meta}>Qty: {item.qty}</Text>
            {item.returnable && <Text style={styles.returnable}>Returnable</Text>}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#6b7280', fontSize: 15 },
  content: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
  status: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  meta: { fontSize: 13, color: '#374151' },
  returnable: { fontSize: 12, color: '#2563eb', marginTop: 4 },
});
