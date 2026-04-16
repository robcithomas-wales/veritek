import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { qk } from '../lib/query-client';
import { useMutation } from './use-mutation';

export function usePrivateActivities() {
  return useQuery({
    queryKey: qk.privateActivities(),
    queryFn: () => api.privateActivities.list(),
    staleTime: 2 * 60 * 1000,
    gcTime: 4 * 60 * 60 * 1000,
  });
}

export function useCreatePrivateActivity() {
  return useMutation({
    endpoint: () => '/private-activities',
    method: 'POST',
    invalidateKeys: [qk.privateActivities()],
  });
}

export function useCompletePrivateActivity() {
  return useMutation<string, void>({
    endpoint: (id) => `/private-activities/${id}/complete`,
    method: 'PATCH',
    invalidateKeys: [qk.privateActivities()],
  });
}

export function useRemovePrivateActivity() {
  return useMutation<string, void>({
    endpoint: (id) => `/private-activities/${id}`,
    method: 'DELETE',
    invalidateKeys: [qk.privateActivities()],
  });
}
