import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { qk } from '../lib/query-client';

export function useClockToday() {
  return useQuery({
    queryKey: qk.clockToday(),
    queryFn: () => api.clock.today(),
    staleTime: 60 * 1000,
  });
}
