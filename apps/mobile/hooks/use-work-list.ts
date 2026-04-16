import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { qk } from '../lib/query-client';

export function useWorkList() {
  return useQuery({
    queryKey: qk.workList(),
    queryFn: async () => {
      console.log('[useWorkList] API URL:', process.env.EXPO_PUBLIC_API_URL);
      try {
        const health = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/health`);
        console.log('[useWorkList] health:', health.status);
      } catch (e) {
        console.log('[useWorkList] health FAILED:', String(e));
      }
      try {
        const result = await api.serviceOrders.list();
        console.log('[useWorkList] result:', result.length);
        return result;
      } catch (e) {
        console.log('[useWorkList] error:', String(e));
        throw e;
      }
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 4 * 60 * 60 * 1000,
  });
}
