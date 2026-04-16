import { z } from 'zod';

// ─── Service Orders ───────────────────────────────────────────────────────────

export const RejectServiceOrderSchema = z.object({
  reason: z.string().min(1),
});

export const ServiceOrderHistoryQuerySchema = z.object({
  query: z.string().optional(),
  status: z.enum(['received','accepted','in_route','in_progress','completed','closed']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

// ─── Activities ───────────────────────────────────────────────────────────────

export const CreateActivitySchema = z.object({
  type: z.enum(['break_fix', 'preventive_maintenance', 'installation', 'other']),
});

export const StartWorkSchema = z.object({
  travelDistance: z.number().int().min(0),
});

export const StopWorkSchema = z.object({
  stopCode: z.string().min(1),
  comments: z.string().optional(),
});

// ─── Checklist ────────────────────────────────────────────────────────────────

export const SubmitChecklistSchema = z.object({
  responses: z.array(z.object({
    questionId: z.string().cuid(),
    answer: z.string().min(1),
  })).min(1),
});

// ─── Materials ────────────────────────────────────────────────────────────────

export const CreateMaterialSchema = z.object({
  productId: z.string().cuid(),
  qty: z.number().int().positive().default(1),
  returnable: z.boolean().default(false),
});

export const UpdateMaterialSchema = z.object({
  status: z.enum(['needed','allocated','back_ordered','fulfilled','not_used','cancelled']).optional(),
  disposition: z.enum(['open','fulfilled','not_used','doa']).optional(),
  serialNumber: z.string().optional(),
  returnReason: z.string().optional(),
  returnWarehouseId: z.string().cuid().optional(),
});

// ─── Clock ────────────────────────────────────────────────────────────────────

export const ClockEventSchema = z.object({
  type: z.enum(['clock_in', 'clock_out']),
  timestamp: z.string().datetime(),
});

// ─── Sync ─────────────────────────────────────────────────────────────────────

export const SyncMutationSchema = z.object({
  id: z.number().int(),
  createdAt: z.string().datetime(),
  endpoint: z.string().startsWith('/'),
  method: z.enum(['POST', 'PATCH', 'DELETE']),
  body: z.unknown(),
});

export const SyncRequestSchema = z.object({
  mutations: z.array(SyncMutationSchema).min(1).max(100),
});

// ─── Private Activities ───────────────────────────────────────────────────────

export const CreatePrivateActivitySchema = z.object({
  type: z.enum(['travel', 'training', 'holiday', 'absence', 'other']),
  startTime: z.string().datetime(),
  notes: z.string().optional(),
});

export const CompletePrivateActivitySchema = z.object({
  endTime: z.string().datetime(),
});

export const ListPrivateActivitiesSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

// ─── Inventory ────────────────────────────────────────────────────────────────

export const AdjustStockSchema = z.object({
  productId: z.string().cuid(),
  delta: z.number().int(),
  reason: z.string().min(1),
});

export const SearchInventorySchema = z.object({
  query: z.string().optional(),
  warehouseId: z.string().cuid().optional(),
});

export const TransferStockSchema = z.object({
  productId: z.string().cuid(),
  qty: z.number().int().positive(),
  toEngineerId: z.string().cuid(),
});

// ─── Shipping ─────────────────────────────────────────────────────────────────

export const ShipLineInputSchema = z.object({
  productId: z.string().cuid(),
  qty: z.number().int().positive(),
  serialNumber: z.string().optional(),
});

export const CreateShipmentSchema = z.object({
  siteId: z.string().cuid(),
  destinationId: z.string().cuid(),
  lines: z.array(ShipLineInputSchema).min(1),
});

export const UpdateShipmentStatusSchema = z.object({
  status: z.enum(['pending', 'collected', 'cancelled']),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type RejectServiceOrderDto = z.infer<typeof RejectServiceOrderSchema>;
export type ServiceOrderHistoryQuery = z.infer<typeof ServiceOrderHistoryQuerySchema>;
export type CreateActivityDto = z.infer<typeof CreateActivitySchema>;
export type StartWorkDto = z.infer<typeof StartWorkSchema>;
export type StopWorkDto = z.infer<typeof StopWorkSchema>;
export type SubmitChecklistDto = z.infer<typeof SubmitChecklistSchema>;
export type CreateMaterialDto = z.infer<typeof CreateMaterialSchema>;
export type UpdateMaterialDto = z.infer<typeof UpdateMaterialSchema>;
export type ClockEventDto = z.infer<typeof ClockEventSchema>;
export type SyncRequestDto = z.infer<typeof SyncRequestSchema>;
export type CreatePrivateActivityDto = z.infer<typeof CreatePrivateActivitySchema>;
export type CompletePrivateActivityDto = z.infer<typeof CompletePrivateActivitySchema>;
export type ListPrivateActivitiesDto = z.infer<typeof ListPrivateActivitiesSchema>;
export type AdjustStockDto = z.infer<typeof AdjustStockSchema>;
export type SearchInventoryDto = z.infer<typeof SearchInventorySchema>;
export type TransferStockDto = z.infer<typeof TransferStockSchema>;
export type CreateShipmentDto = z.infer<typeof CreateShipmentSchema>;
export type UpdateShipmentStatusDto = z.infer<typeof UpdateShipmentStatusSchema>;
