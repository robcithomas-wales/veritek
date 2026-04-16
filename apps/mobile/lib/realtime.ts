import { supabase } from './supabase';
import { queryClient } from './query-client';
import { qk } from './query-client';
import type { RealtimeChannel } from '@supabase/supabase-js';

let channel: RealtimeChannel | null = null;

/**
 * Subscribe to new job assignments for the current engineer.
 * This is the one deliberate exception to API-first: a read-only Realtime
 * subscription so new jobs appear on the work list without a manual refresh.
 */
export function subscribeToJobAssignments(engineerId: string) {
  if (channel) return; // already subscribed

  channel = supabase
    .channel('job-assignments')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'service_orders',
        filter: `assigned_to_id=eq.${engineerId}`,
      },
      () => {
        // Invalidate the work list so it refetches
        queryClient.invalidateQueries({ queryKey: qk.workList() });
      },
    )
    .subscribe();
}

export function unsubscribeFromJobAssignments() {
  if (!channel) return;
  supabase.removeChannel(channel);
  channel = null;
}
