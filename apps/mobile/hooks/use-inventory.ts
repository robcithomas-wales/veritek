import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { qk } from '../lib/query-client';
import { useMutation } from './use-mutation';

export function useVanStock() {
  return useQuery({
    queryKey: qk.vanStock(),
    queryFn: () => api.inventory.vanStock(),
    staleTime: 5 * 60 * 1000,
    gcTime: 4 * 60 * 60 * 1000,
  });
}

export function useAdjustStock() {
  return useMutation({
    endpoint: () => '/inventory/adjust',
    method: 'POST',
    invalidateKeys: [qk.vanStock()],
  });
}

export function useTransferStock() {
  return useMutation({
    endpoint: () => '/inventory/transfer',
    method: 'POST',
    invalidateKeys: [qk.vanStock()],
  });
}
