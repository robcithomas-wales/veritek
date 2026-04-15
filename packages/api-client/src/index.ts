import type {
  ServiceOrder,
  ServiceOrderWithRelations,
  Activity,
  Item,
  Material,
  ClockEvent,
  User,
  Site,
  StopCode,
  DeliveryType,
  ChecklistQuestion,
  PaginatedResponse,
  SyncRequest,
  SyncResponse,
} from '@veritek/types';
import type {
  RejectServiceOrderDto,
  CreateActivityDto,
  StartWorkDto,
  StopWorkDto,
  SubmitChecklistDto,
  CreateMaterialDto,
  UpdateMaterialDto,
  ClockEventDto,
  SyncRequestDto,
} from '@veritek/validators';

// ─── Client factory ───────────────────────────────────────────────────────────

export interface ApiClientConfig {
  baseUrl: string;
  getToken: () => Promise<string | null>;
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

async function request<T>(
  config: ApiClientConfig,
  method: HttpMethod,
  path: string,
  body?: unknown,
  params?: Record<string, string>,
): Promise<T> {
  const token = await config.getToken();
  const url = new URL(path, config.baseUrl);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, text);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── API client ───────────────────────────────────────────────────────────────

export function createApiClient(config: ApiClientConfig) {
  const get = <T>(path: string, params?: Record<string, string>) =>
    request<T>(config, 'GET', path, undefined, params);
  const post = <T>(path: string, body?: unknown) =>
    request<T>(config, 'POST', path, body);
  const patch = <T>(path: string, body?: unknown) =>
    request<T>(config, 'PATCH', path, body);
  const del = <T>(path: string) =>
    request<T>(config, 'DELETE', path);

  return {
    // ── Users ──────────────────────────────────────────────────────────────
    users: {
      me: () => get<User>('/users/me'),
    },

    // ── Sites ──────────────────────────────────────────────────────────────
    sites: {
      get: (id: string) => get<Site>(`/sites/${id}`),
    },

    // ── Service orders ─────────────────────────────────────────────────────
    serviceOrders: {
      list: () => get<ServiceOrder[]>('/service-orders'),
      get: (id: string) => get<ServiceOrderWithRelations>(`/service-orders/${id}`),
      accept: (id: string) => patch<ServiceOrder>(`/service-orders/${id}/accept`),
      reject: (id: string, body: RejectServiceOrderDto) =>
        patch<ServiceOrder>(`/service-orders/${id}/reject`, body),
      history: (params: Record<string, string>) =>
        get<PaginatedResponse<ServiceOrder>>('/service-orders/history', params),
    },

    // ── Activities ─────────────────────────────────────────────────────────
    activities: {
      create: (serviceOrderId: string, body: CreateActivityDto) =>
        post<Activity>(`/service-orders/${serviceOrderId}/activities`, body),
      startTravel: (id: string) =>
        patch<Activity>(`/activities/${id}/start-travel`),
      startWork: (id: string, body: StartWorkDto) =>
        patch<Activity>(`/activities/${id}/start-work`, body),
      stopWork: (id: string, body: StopWorkDto) =>
        patch<Activity>(`/activities/${id}/stop-work`, body),
      submitChecklist: (id: string, body: SubmitChecklistDto) =>
        post<void>(`/activities/${id}/checklist-responses`, body),
    },

    // ── Items ──────────────────────────────────────────────────────────────
    items: {
      list: (serviceOrderId: string) =>
        get<Item[]>(`/service-orders/${serviceOrderId}/items`),
    },

    // ── Materials ──────────────────────────────────────────────────────────
    materials: {
      list: (serviceOrderId: string) =>
        get<Material[]>(`/service-orders/${serviceOrderId}/materials`),
      create: (serviceOrderId: string, body: CreateMaterialDto) =>
        post<Material>(`/service-orders/${serviceOrderId}/materials`, body),
      update: (id: string, body: UpdateMaterialDto) =>
        patch<Material>(`/materials/${id}`, body),
    },

    // ── Clock ──────────────────────────────────────────────────────────────
    clock: {
      event: (body: ClockEventDto) => post<ClockEvent>('/clock', body),
      today: () => get<ClockEvent | null>('/clock/today'),
    },

    // ── Reference data ─────────────────────────────────────────────────────
    reference: {
      stopCodes: () => get<StopCode[]>('/reference/stop-codes'),
      deliveryTypes: () => get<DeliveryType[]>('/reference/delivery-types'),
      checklists: (itemType: string) =>
        get<ChecklistQuestion[]>('/reference/checklists', { itemType }),
    },

    // ── Sync ───────────────────────────────────────────────────────────────
    sync: {
      flush: (body: SyncRequestDto) => post<SyncResponse>('/sync', body),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
