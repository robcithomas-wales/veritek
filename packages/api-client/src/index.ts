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
  ProblemCode,
  CauseCode,
  RepairCode,
  ResolveCode,
  RejectionCode,
  DeliveryType,
  ChecklistQuestion,
  PaginatedResponse,
  SyncRequest,
  SyncResponse,
  PrivateActivity,
  VanStockItem,
  StockAdjustment,
  Shipment,
  Warehouse,
  Attachment,
} from '@veritek/types';
import type {
  RejectServiceOrderDto,
  RejectServiceOrderWithCodeDto,
  CompleteServiceOrderDto,
  CreateActivityDto,
  StartWorkDto,
  StopWorkDto,
  SubmitChecklistDto,
  CreateMaterialDto,
  UpdateMaterialDto,
  ClockEventDto,
  SyncRequestDto,
  CreatePrivateActivityDto,
  CompletePrivateActivityDto,
  AdjustStockDto,
  SearchInventoryDto,
  TransferStockDto,
  CreateShipmentDto,
  UpdateShipmentStatusDto,
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
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const res = await fetch(url.toString(), {
    method,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
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
      reject: (id: string, body: RejectServiceOrderWithCodeDto) =>
        patch<ServiceOrder>(`/service-orders/${id}/reject`, body),
      complete: (id: string, body: CompleteServiceOrderDto) =>
        post<ServiceOrder>(`/service-orders/${id}/complete`, body),
      history: (params: Record<string, string>) =>
        get<PaginatedResponse<ServiceOrder>>('/service-orders/history', params),
      addAttachment: (id: string, formData: FormData) =>
        request<Attachment>(config, 'POST', `/service-orders/${id}/attachments`, formData),
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
      problemCodes: () => get<ProblemCode[]>('/reference/problem-codes'),
      causeCodes: () => get<CauseCode[]>('/reference/cause-codes'),
      repairCodes: () => get<RepairCode[]>('/reference/repair-codes'),
      resolveCodes: () => get<ResolveCode[]>('/reference/resolve-codes'),
      rejectionCodes: () => get<RejectionCode[]>('/reference/rejection-codes'),
    },

    // ── Sync ───────────────────────────────────────────────────────────────
    sync: {
      flush: (body: SyncRequestDto) => post<SyncResponse>('/sync', body),
    },

    // ── Private activities ─────────────────────────────────────────────────
    privateActivities: {
      list: (params?: Record<string, string>) =>
        get<PaginatedResponse<PrivateActivity>>('/private-activities', params),
      create: (body: CreatePrivateActivityDto) =>
        post<PrivateActivity>('/private-activities', body),
      complete: (id: string, body: CompletePrivateActivityDto) =>
        patch<PrivateActivity>(`/private-activities/${id}/complete`, body),
      remove: (id: string) => del<{ success: boolean }>(`/private-activities/${id}`),
    },

    // ── Inventory ──────────────────────────────────────────────────────────
    inventory: {
      vanStock: () => get<VanStockItem[]>('/inventory/van-stock'),
      search: (params: SearchInventoryDto) =>
        get<VanStockItem[]>('/inventory/search', params as Record<string, string>),
      adjust: (body: AdjustStockDto) =>
        post<StockAdjustment>('/inventory/adjust', body),
      transfer: (body: TransferStockDto) =>
        post<void>('/inventory/transfer', body),
      warehouses: () => get<Warehouse[]>('/inventory/warehouses'),
    },

    // ── Shipping ───────────────────────────────────────────────────────────
    shipping: {
      list: () => get<Shipment[]>('/shipping'),
      get: (id: string) => get<Shipment>(`/shipping/${id}`),
      create: (body: CreateShipmentDto) => post<Shipment>('/shipping', body),
      updateStatus: (id: string, body: UpdateShipmentStatusDto) =>
        patch<Shipment>(`/shipping/${id}`, body),
      removeLine: (id: string, lineId: string) =>
        del<void>(`/shipping/${id}/lines/${lineId}`),
    },

    // ── Notifications ──────────────────────────────────────────────────────
    notifications: {
      registerToken: (body: { token: string; platform: 'ios' | 'android' }) =>
        post<void>('/notifications/register', body),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
