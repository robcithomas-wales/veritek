import { useState } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { api } from '../lib/api';
import { qk } from '../lib/query-client';
import { ServiceOrderCard } from '../components/service-order-card';

export default function HistoryScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: qk.history({ query: debouncedQuery }),
    queryFn: () => api.serviceOrders.history(debouncedQuery ? { query: debouncedQuery } : {}),
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    enabled: true,
  });

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Search by reference, site..."
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            clearTimeout((global as any).__historyDebounce);
            (global as any).__historyDebounce = setTimeout(() => setDebouncedQuery(t), 400);
          }}
          returnKeyType="search"
        />
      </View>
      {isLoading ? (
        <View style={styles.center}><Text>Loading...</Text></View>
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => <ServiceOrderCard order={item as any} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<View style={styles.center}><Text style={styles.empty}>No results</Text></View>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  searchBar: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', gap: 8 },
  back: { color: '#1d4ed8', fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 10, fontSize: 15 },
  list: { paddingVertical: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  empty: { color: '#6b7280', fontSize: 15 },
});
