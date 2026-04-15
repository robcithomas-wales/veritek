import { useQueryClient } from '@tanstack/react-query';
import { enqueue } from '../lib/mutation-queue/queue';
import { flushQueue } from '../lib/mutation-queue/sync';

// All writes go through the mutation queue — even when online.
// This keeps the flow consistent and makes optimistic updates trivial.
export function useMutation<TVariables, TOptimistic = void>({
  endpoint,
  method,
  invalidateKeys,
  optimisticUpdate,
}: {
  endpoint: (vars: TVariables) => string;
  method: 'POST' | 'PATCH' | 'DELETE';
  invalidateKeys?: (string | string[])[];
  optimisticUpdate?: (vars: TVariables) => TOptimistic;
}) {
  const queryClient = useQueryClient();

  return {
    mutate: async (vars: TVariables, body?: unknown) => {
      const ep = endpoint(vars);

      // Optimistic update
      if (optimisticUpdate) {
        optimisticUpdate(vars);
      }

      // Enqueue
      enqueue(ep, method, body ?? vars);

      // Attempt immediate flush
      await flushQueue();

      // Invalidate affected queries
      if (invalidateKeys) {
        await Promise.all(
          invalidateKeys.map((key) =>
            queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] }),
          ),
        );
      }
    },
  };
}
