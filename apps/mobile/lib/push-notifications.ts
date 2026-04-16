import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { api } from './api';

const TOKEN_KEY = 'veritek_push_token';

/**
 * Request notification permission, get the device push token, and register
 * it with the API. Skips re-registration if the token hasn't changed.
 */
export async function registerPushToken(): Promise<void> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  const stored = await SecureStore.getItemAsync(TOKEN_KEY).catch(() => null);
  if (stored === token) return; // already registered

  await api.notifications.registerToken({
    token,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
  });

  await SecureStore.setItemAsync(TOKEN_KEY, token).catch(() => {/* best effort */});
}
