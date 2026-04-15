import { Tabs } from 'expo-router';
import { useRouter } from 'expo-router';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useClockToday } from '../../hooks/use-clock';

export default function TabsLayout() {
  const router = useRouter();
  const { data: clockEvent } = useClockToday();
  const isClockedIn = clockEvent?.type === 'clock_in';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1d4ed8',
        headerRight: () => (
          <TouchableOpacity
            style={styles.clockButton}
            onPress={() => router.push('/clock')}
          >
            <Text style={[styles.clockText, { color: isClockedIn ? '#16a34a' : '#6b7280' }]}>
              {isClockedIn ? '● Clocked In' : '○ Clock In'}
            </Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Work List' }} />
      <Tabs.Screen name="inventory" options={{ title: 'Inventory' }} />
      <Tabs.Screen name="private-activity" options={{ title: 'My Time' }} />
      <Tabs.Screen name="shipping" options={{ title: 'Shipping' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  clockButton: { marginRight: 16 },
  clockText: { fontSize: 13, fontWeight: '600' },
});
