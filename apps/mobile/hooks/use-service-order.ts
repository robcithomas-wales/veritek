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

const refOpts = { staleTime: Infinity, gcTime: 24 * 60 * 60 * 1000 } as const;

export function useProblemCodes() {
  return useQuery({ queryKey: qk.problemCodes(), queryFn: () => api.reference.problemCodes(), ...refOpts });
}
export function useCauseCodes() {
  return useQuery({ queryKey: qk.causeCodes(), queryFn: () => api.reference.causeCodes(), ...refOpts });
}
export function useRepairCodes() {
  return useQuery({ queryKey: qk.repairCodes(), queryFn: () => api.reference.repairCodes(), ...refOpts });
}
export function useResolveCodes() {
  return useQuery({ queryKey: qk.resolveCodes(), queryFn: () => api.reference.resolveCodes(), ...refOpts });
}
export function useRejectionCodes() {
  return useQuery({ queryKey: qk.rejectionCodes(), queryFn: () => api.reference.rejectionCodes(), ...refOpts });
}
