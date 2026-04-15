import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { qk } from '../lib/query-client';

export function useWorkList() {
  return useQuery({
    queryKey: qk.workList(),
    queryFn: () => api.serviceOrders.list(),
    staleTime: 2 * 60 * 1000,
    gcTime: 4 * 60 * 60 * 1000,
  });
}
