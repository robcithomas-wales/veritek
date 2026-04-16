import { Tabs } from 'expo-router';
import { useRouter } from 'expo-router';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useClockToday } from '../../hooks/use-clock';
import { supabase } from '../../lib/supabase';
import Logo from '../../components/Logo';

export default function TabsLayout() {
  const router = useRouter();
  const { data: clockEvent } = useClockToday();
  const isClockedIn = clockEvent?.type === 'clock_in';

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1d4ed8',
        headerLeft: () => (
          <View style={styles.headerLeft}>
            <Logo width={90} height={32} />
            <TouchableOpacity
              style={styles.clockButton}
              onPress={() => router.push('/clock')}
            >
              <Text style={[styles.clockText, { color: isClockedIn ? '#16a34a' : '#6b7280' }]}>
                {isClockedIn ? '● Clocked In' : '○ Clock In'}
              </Text>
            </TouchableOpacity>
          </View>
        ),
        headerRight: () => (
          <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', marginLeft: 12, gap: 10 },
  clockButton: {},
  clockText: { fontSize: 13, fontWeight: '600' },
  signOutButton: { marginRight: 12 },
  signOutText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
});
