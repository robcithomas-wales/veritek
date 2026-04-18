import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { api } from './api';
import type { QueryClient } from '@tanstack/react-query';
import { qk } from './query-client';

const TOKEN_KEY = 'veritek_push_token';

/**
 * Configure how notifications appear when the app is in the foreground.
 * Must be called once at app startup before any notification arrives.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Listen for the user tapping a notification.
 * Performs a targeted React Query invalidation for just the affected job
 * rather than a full work-list refresh, per §4.3 of the architecture spec.
 *
 * Returns a cleanup function — call it on unmount.
 */
export function addNotificationResponseListener(
  queryClient: QueryClient,
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data as Record<
        string,
        unknown
      >;
      const serviceOrderId =
        typeof data?.serviceOrderId === 'string' ? data.serviceOrderId : null;

      if (serviceOrderId) {
        // Targeted invalidation — fetch only the new/updated job
        queryClient.invalidateQueries({ queryKey: qk.serviceOrder(serviceOrderId) });
      }
      // Always refresh the work list so the new card appears
      queryClient.invalidateQueries({ queryKey: qk.workList() });
    },
  );

  return () => subscription.remove();
}

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
