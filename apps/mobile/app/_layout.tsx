import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { queryClient } from '../lib/query-client';
import { initQueue } from '../lib/mutation-queue/db';
import { flushQueue } from '../lib/mutation-queue/sync';
import { supabase } from '../lib/supabase';
import {
  subscribeToJobAssignments,
  unsubscribeFromJobAssignments,
} from '../lib/realtime';
import { registerPushToken } from '../lib/push-notifications';
import { useRouter, useSegments } from 'expo-router';
import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';

function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    initQueue();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) unsubscribeFromJobAssignments();
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const inAuth = segments[0] === '(auth)';
    if (!session && !inAuth) router.replace('/(auth)/login');
    if (session && inAuth) {
      flushQueue();
      subscribeToJobAssignments(session.user.id);
      registerPushToken().catch(() => {/* non-critical */});
      router.replace('/(tabs)');
    }
  }, [session, ready, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="service-order/[id]" />
          <Stack.Screen name="clock" options={{ presentation: 'modal' }} />
          <Stack.Screen name="history" />
        </Stack>
        <StatusBar style="dark" />
      </AuthGate>
    </QueryClientProvider>
  );
}
