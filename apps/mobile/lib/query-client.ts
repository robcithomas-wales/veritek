import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 2 * 60 * 1000, // 2 minutes default
    },
  },
});

// Query key factories
export const qk = {
  workList: () => ['service-orders', 'work-list'] as const,
  serviceOrder: (id: string) => ['service-orders', id] as const,
  items: (serviceOrderId: string) => ['items', serviceOrderId] as const,
  materials: (serviceOrderId: string) => ['materials', serviceOrderId] as const,
  clockToday: () => ['clock', 'today'] as const,
  stopCodes: () => ['reference', 'stop-codes'] as const,
  deliveryTypes: () => ['reference', 'delivery-types'] as const,
  checklists: (itemType: string) => ['reference', 'checklists', itemType] as const,
  history: (params: Record<string, string>) => ['history', params] as const,
  privateActivities: (params?: Record<string, string>) =>
    params ? (['private-activities', params] as const) : (['private-activities'] as const),
  vanStock: () => ['inventory', 'van-stock'] as const,
  shipping: () => ['shipping'] as const,
  shipment: (id: string) => ['shipping', id] as const,
};
