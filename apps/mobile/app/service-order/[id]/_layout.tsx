import { useLocalSearchParams, useRouter } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useServiceOrder } from '../../../hooks/use-service-order';
import { StatusBadge } from '../../../components/status-badge';

const Tab = createMaterialTopTabNavigator();

export default function ServiceOrderLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: order } = useServiceOrder(id);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <Text style={styles.ref}>{order?.reference ?? id.slice(-8).toUpperCase()}</Text>
          {order && <StatusBadge status={order.status as any} />}
        </View>
        <Text style={styles.site}>{order?.site?.name ?? '...'}</Text>
      </View>
      <Tab.Navigator
        screenOptions={{
          tabBarScrollEnabled: true,
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
          tabBarActiveTintColor: '#1d4ed8',
        }}
      >
        <Tab.Screen name="index" options={{ title: 'Details' }} />
        <Tab.Screen name="activities" options={{ title: 'Activities' }} />
        <Tab.Screen name="items" options={{ title: 'Items' }} />
        <Tab.Screen name="materials" options={{ title: 'Materials' }} />
        <Tab.Screen name="completion" options={{ title: 'Completion' }} />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  back: { color: '#1d4ed8', fontSize: 14, marginBottom: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  ref: { fontSize: 18, fontWeight: '700', color: '#111827' },
  site: { fontSize: 14, color: '#6b7280' },
});
