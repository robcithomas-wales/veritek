import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { qk } from '../lib/query-client';
import { useMutation } from './use-mutation';

export function useShipments() {
  return useQuery({
    queryKey: qk.shipping(),
    queryFn: () => api.shipping.list(),
    staleTime: 2 * 60 * 1000,
    gcTime: 4 * 60 * 60 * 1000,
  });
}

export function useCreateShipment() {
  return useMutation({
    endpoint: () => '/shipping',
    method: 'POST',
    invalidateKeys: [qk.shipping()],
  });
}

export function useUpdateShipmentStatus() {
  return useMutation<string, void>({
    endpoint: (id) => `/shipping/${id}`,
    method: 'PATCH',
    invalidateKeys: [qk.shipping()],
  });
}
