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
