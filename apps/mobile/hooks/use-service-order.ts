import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { qk } from '../lib/query-client';

export function useServiceOrder(id: string) {
  return useQuery({
    queryKey: qk.serviceOrder(id),
    queryFn: () => api.serviceOrders.get(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 8 * 60 * 60 * 1000,
  });
}

export function useItems(serviceOrderId: string) {
  return useQuery({
    queryKey: qk.items(serviceOrderId),
    queryFn: () => api.items.list(serviceOrderId),
    staleTime: 5 * 60 * 1000,
    gcTime: 8 * 60 * 60 * 1000,
  });
}

export function useMaterials(serviceOrderId: string) {
  return useQuery({
    queryKey: qk.materials(serviceOrderId),
    queryFn: () => api.materials.list(serviceOrderId),
    staleTime: 5 * 60 * 1000,
    gcTime: 8 * 60 * 60 * 1000,
  });
}

export function useStopCodes() {
  return useQuery({
    queryKey: qk.stopCodes(),
    queryFn: () => api.reference.stopCodes(),
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });
}

export function useChecklists(itemType: string) {
  return useQuery({
    queryKey: qk.checklists(itemType),
    queryFn: () => api.reference.checklists(itemType),
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
    enabled: !!itemType,
  });
}
