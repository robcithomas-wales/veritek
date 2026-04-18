import { createSupabaseServerClient } from './supabase/server';

const BASE = process.env.NEXT_PUBLIC_API_URL!;

async function getToken(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  return session.access_token;
}

async function req<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  const token = await getToken();
  const url = new URL(`${BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const adminApi = {
  serviceOrders: {
    stats: () => req<AdminStats>('GET', '/admin/service-orders/stats'),
    list: (params?: AdminOrderQuery) => req<AdminOrderList>('GET', '/admin/service-orders', undefined, params as any),
    get: (id: string) => req<AdminOrderDetail>('GET', `/admin/service-orders/${id}`),
    create: (body: CreateOrderBody) => req<AdminOrderDetail>('POST', '/admin/service-orders', body),
    assign: (id: string, engineerId: string, eta?: string) =>
      req<AdminOrderDetail>('PATCH', `/admin/service-orders/${id}/assign`, { engineerId, eta }),
    setEta: (id: string, eta: string) =>
      req<AdminOrderDetail>('PATCH', `/admin/service-orders/${id}/eta`, { eta }),
    close: (id: string) => req<AdminOrderDetail>('PATCH', `/admin/service-orders/${id}/close`, {}),
  },
  users: {
    me: () => req<AdminMe>('GET', '/admin/users/me'),
    list: (params?: { role?: string }) => req<AdminUser[]>('GET', '/admin/users', undefined, params as any),
    get: (id: string) => req<AdminUserDetail>('GET', `/admin/users/${id}`),
    create: (body: CreateUserBody) => req<AdminUser>('POST', '/admin/users', body),
    update: (id: string, body: UpdateUserBody) => req<AdminUser>('PATCH', `/admin/users/${id}`, body),
    deactivate: (id: string) => req<AdminUser>('PATCH', `/admin/users/${id}/deactivate`, {}),
    warehouses: () => req<Warehouse[]>('GET', '/admin/users/warehouses'),
  },
  sites: {
    list: (params?: { search?: string }) => req<Site[]>('GET', '/admin/sites', undefined, params as any),
    get: (id: string) => req<Site>('GET', `/admin/sites/${id}`),
    create: (body: CreateSiteBody) => req<Site>('POST', '/admin/sites', body),
    update: (id: string, body: UpdateSiteBody) => req<Site>('PATCH', `/admin/sites/${id}`, body),
  },
  webhooks: {
    list: () => req<WebhookSubscription[]>('GET', '/webhooks'),
    get: (id: string) => req<WebhookSubscriptionDetail>('GET', `/webhooks/${id}`),
    create: (body: CreateWebhookBody) => req<WebhookSubscription>('POST', '/webhooks', body),
    update: (id: string, body: UpdateWebhookBody) => req<WebhookSubscription>('PATCH', `/webhooks/${id}`, body),
    remove: (id: string) => req<void>('DELETE', `/webhooks/${id}`),
    retry: (id: string, deliveryId: string) => req<void>('POST', `/webhooks/${id}/retry/${deliveryId}`, {}),
  },
  apiKeys: {
    list: () => req<ApiKey[]>('GET', '/api-keys'),
    create: (body: CreateApiKeyBody) => req<ApiKeyCreated>('POST', '/api-keys', body),
    usage: (id: string, params?: { page?: number }) => req<ApiKeyUsagePage>('GET', `/api-keys/${id}/usage`, undefined, params as any),
    suspend: (id: string) => req<ApiKey>('PATCH', `/api-keys/${id}/suspend`, {}),
    activate: (id: string) => req<ApiKey>('PATCH', `/api-keys/${id}/activate`, {}),
    revoke: (id: string) => req<void>('DELETE', `/api-keys/${id}`),
  },
  materials: {
    list: (params?: AdminMaterialsQuery) =>
      req<AdminMaterial[]>('GET', '/admin/materials', undefined, params as any),
  },
  reports: {
    get: (params?: ReportsQuery) =>
      req<ReportsData>('GET', '/admin/service-orders/reports', undefined, params as any),
  },
};

// ─── Response shape types (back office only) ─────────────────────────────────

export interface AdminStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  slaAtRisk: number;
  engineersClockedIn: number;
  recentlyCompleted: AdminOrderSummary[];
}

export interface AdminOrderSummary {
  id: string;
  reference: string;
  siteName: string;
  engineerName: string | null;
  status: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderList {
  data: AdminOrderSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminOrderDetail extends AdminOrderSummary {
  description: string;
  eta: string | null;
  assignedTo: { id: string; firstName: string; lastName: string; email: string } | null;
  site: { id: string; name: string; address: string };
  activities: unknown[];
  materials: unknown[];
  items: unknown[];
}

export interface AdminOrderQuery {
  status?: string;
  priority?: string;
  engineerId?: string;
  siteId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  query?: string;
}

export interface CreateOrderBody {
  siteId: string;
  description: string;
  priority: number;
  engineerId?: string;
  eta?: string;
}

export interface AdminMe {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'dispatcher' | 'engineer';
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  warehouseId: string | null;
  clockedIn: boolean;
  currentOrderId: string | null;
}

export interface AdminUserDetail extends AdminUser {
  vanStockCount: number;
  todayClockEvents: unknown[];
  currentOrder: AdminOrderSummary | null;
}

export interface WebhookSubscription {
  id: string;
  name: string;
  endpointUrl: string;
  eventTypes: string[];
  isActive: boolean;
  lastDeliveryStatus: string | null;
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  eventType: string;
  status: string;
  attempts: number;
  responseCode: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookSubscriptionDetail extends WebhookSubscription {
  deliveries: WebhookDelivery[];
}

export interface CreateWebhookBody { name: string; endpointUrl: string; eventTypes: string[] }
export interface UpdateWebhookBody { endpointUrl?: string; eventTypes?: string[]; isActive?: boolean }

export interface ApiKey {
  id: string;
  name: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  requestCount: number;
  createdAt: string;
}

export interface ApiKeyCreated extends ApiKey { plaintext: string }

export interface ApiKeyUsagePage {
  data: { id: string; endpoint: string; responseCode: number; timestamp: string }[];
  total: number;
}

export interface CreateApiKeyBody { name: string; scopes: string[]; expiresAt?: string }

export interface AdminMaterialsQuery {
  status?: string;
  engineerId?: string;
  serviceOrderId?: string;
  from?: string;
  to?: string;
}

export interface AdminMaterial {
  id: string;
  qty: number;
  status: string;
  disposition: string;
  returnable: boolean;
  createdAt: string;
  updatedAt: string;
  returnReason: string | null;
  product: { id: string; sku: string; name: string };
  serviceOrder: {
    id: string;
    reference: string;
    status: string;
    siteName: string | null;
    engineerName: string | null;
  };
}

export interface ReportsQuery {
  period?: '7d' | '30d' | '90d';
  from?: string;
  to?: string;
}

export interface CreateUserBody {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  warehouseId?: string;
}

export interface UpdateUserBody {
  firstName?: string;
  lastName?: string;
  role?: string;
  warehouseId?: string | null;
}

export interface Warehouse {
  id: string;
  name: string;
}

export interface Site {
  id: string;
  name: string;
  address: string | null;
  postcode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSiteBody { name: string; address?: string; postcode?: string }
export interface UpdateSiteBody { name?: string; address?: string; postcode?: string }

export interface ReportsData {
  period: { from: string; to: string };
  completed: {
    total: number;
    withinSla: number;
    slaPct: number;
    byDay: Record<string, number>;
    orders: {
      id: string;
      reference: string;
      priority: number;
      siteName: string;
      engineerName: string | null;
      completedAt: string;
      withinSla: boolean;
    }[];
  };
  partsUsage: { id: string; sku: string; name: string; qty: number }[];
}
