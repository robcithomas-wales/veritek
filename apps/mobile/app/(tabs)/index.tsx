import { FlatList, View, Text, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useWorkList } from '../../hooks/use-work-list';
import { ServiceOrderCard } from '../../components/service-order-card';

export default function WorkListScreen() {
  const router = useRouter();
  const { data: orders, isLoading, refetch, isRefetching } = useWorkList();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>Loading work list...</Text>
      </View>
    );
  }

  if (!orders?.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No active jobs</Text>
        <TouchableOpacity onPress={() => router.push('/history')}>
          <Text style={styles.historyLink}>View history</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(o) => o.id}
      renderItem={({ item }) => <ServiceOrderCard order={item as any} />}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
      ListFooterComponent={
        <TouchableOpacity style={styles.historyBtn} onPress={() => router.push('/history')}>
          <Text style={styles.historyBtnText}>View job history</Text>
        </TouchableOpacity>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loading: { color: '#6b7280', fontSize: 15 },
  empty: { color: '#374151', fontSize: 17, fontWeight: '600' },
  historyLink: { color: '#1d4ed8', fontSize: 14 },
  historyBtn: { margin: 16, alignItems: 'center' },
  historyBtnText: { color: '#1d4ed8', fontSize: 14 },
});
