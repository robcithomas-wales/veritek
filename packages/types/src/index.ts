// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole = 'engineer' | 'dispatcher' | 'admin';

export type ServiceOrderStatus =
  | 'received'
  | 'accepted'
  | 'in_route'
  | 'in_progress'
  | 'completed'
  | 'closed';

export type ActivityType =
  | 'break_fix'
  | 'preventive_maintenance'
  | 'installation'
  | 'other';

export type ActivityStatus = 'open' | 'travel' | 'work' | 'complete';

export type MaterialStatus =
  | 'needed'
  | 'allocated'
  | 'back_ordered'
  | 'fulfilled'
  | 'not_used'
  | 'cancelled';

export type MaterialDisposition = 'open' | 'fulfilled' | 'not_used' | 'doa';

export type PrivateActivityType =
  | 'travel'
  | 'training'
  | 'holiday'
  | 'absence'
  | 'other';

export type ClockEventType = 'clock_in' | 'clock_out';

export type ShippingRequestType = 'return' | 'on_site_collection';

export type ShippingRequestStatus = 'pending' | 'collected' | 'cancelled';

export type WebhookDeliveryStatus = 'pending' | 'delivered' | 'failed' | 'dead';

export type DomainEvent =
  | 'job.assigned'
  | 'job.accepted'
  | 'job.rejected'
  | 'travel.started'
  | 'work.started'
  | 'job.completed'
  | 'part.ordered'
  | 'part.fitted'
  | 'part.returned'
  | 'clock.in'
  | 'clock.out'
  | 'private-activity.created'
  | 'private-activity.completed'
  | 'item.installed'
  | 'item.removed';

// ─── Core entities ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  warehouseId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Site {
  id: string;
  name: string;
  address: string | null;
  postcode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrder {
  id: string;
  assignedToId: string;
  siteId: string;
  priority: number;
  status: ServiceOrderStatus;
  description: string | null;
  reference: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrderWithRelations extends ServiceOrder {
  assignedTo: User;
  site: Site;
  activities: Activity[];
  items: Item[];
  materials: Material[];
  attachments: Attachment[];
}

export interface Activity {
  id: string;
  serviceOrderId: string;
  type: ActivityType;
  status: ActivityStatus;
  startTravel: string | null;
  startWork: string | null;
  endWork: string | null;
  travelDistance: number;
  stopCode: string | null;
  comments: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  serviceOrderId: string;
  siteId: string;
  productId: string;
  serialNumber: string | null;
  tagNumber: string | null;
  installDate: string | null;
  warrantyExpiry: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: string;
  serviceOrderId: string;
  productId: string;
  qty: number;
  status: MaterialStatus;
  disposition: MaterialDisposition;
  returnable: boolean;
  returnProduct: ReturnProduct | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnProduct {
  id: string;
  materialId: string;
  reason: string;
  warehouseId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  serviceOrderId: string;
  url: string;
  filename: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shipment {
  id: string;
  userId: string;
  siteId: string;
  destinationId: string;
  type: ShippingRequestType;
  status: ShippingRequestStatus;
  shipLines: ShipLine[];
  createdAt: string;
  updatedAt: string;
}

export interface ShipLine {
  id: string;
  shipmentId: string;
  productId: string;
  serialNumber: string | null;
  qty: number;
  createdAt: string;
  updatedAt: string;
}

export interface PrivateActivity {
  id: string;
  userId: string;
  type: PrivateActivityType;
  startTime: string;
  endTime: string | null;
  done: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClockEvent {
  id: string;
  userId: string;
  type: ClockEventType;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export interface StockItem {
  id: string;
  userId: string;
  warehouseId: string;
  productId: string;
  serialNumber: string | null;
  qty: number;
  createdAt: string;
  updatedAt: string;
}

export interface VanStockItem extends StockItem {
  product: Product;
}

export interface StockAdjustment {
  id: string;
  userId: string;
  productId: string;
  delta: number;
  reason: string;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  returnable: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Checklists ───────────────────────────────────────────────────────────────

export interface ChecklistQuestion {
  id: string;
  itemType: string;
  question: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistResponse {
  id: string;
  activityId: string;
  questionId: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Webhooks ─────────────────────────────────────────────────────────────────

export interface WebhookSubscription {
  id: string;
  name: string;
  eventTypes: DomainEvent[];
  endpointUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDelivery {
  id: string;
  subscriptionId: string;
  eventType: DomainEvent;
  payload: Record<string, unknown>;
  status: WebhookDeliveryStatus;
  attempts: number;
  nextRetryAt: string | null;
  responseCode: number | null;
  responseBody: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── API Keys ─────────────────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  name: string;
  scopes: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ApiKeyUsage {
  id: string;
  apiKeyId: string;
  endpoint: string;
  responseCode: number;
  timestamp: string;
  createdAt: string;
}

// ─── Reference data ───────────────────────────────────────────────────────────

export interface StopCode {
  code: string;
  description: string;
}

export interface DeliveryType {
  id: string;
  name: string;
  description: string | null;
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

export interface MutationQueueEntry {
  id: number;
  createdAt: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body: string;
  status: 'pending' | 'processing' | 'failed';
  attempts: number;
  lastError: string | null;
}

export interface SyncRequest {
  mutations: Array<{
    id: number;
    endpoint: string;
    method: string;
    body: unknown;
    createdAt: string;
  }>;
}

export interface SyncResponse {
  results: Array<{
    id: number;
    success: boolean;
    error?: string;
  }>;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}
