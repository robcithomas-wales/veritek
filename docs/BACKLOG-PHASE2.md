# Phase 2 Backlog — Mobile Complete

Each ticket is self-contained. Dependencies are called out explicitly. Work can proceed on epics 1–4 in parallel; epic 5 (push notifications) depends on the worker service.

---

## Epic 1 — Private Activities (My Time tab)

### P2-001 — Types: PrivateActivity entity and related types
**Layer:** `packages/types`
**Status:** ✅ Done

`PrivateActivity` interface already existed in `packages/types/src/index.ts` with fields matching the Prisma schema (`startTime`, `endTime`, `done`, `notes`). No changes needed.

---

### P2-002 — Validators: private activity schemas
**Layer:** `packages/validators`
**Status:** ✅ Done

Added to `packages/validators/src/index.ts`:
- `CreatePrivateActivitySchema` — type, startTime (datetime), notes?
- `CompletePrivateActivitySchema` — endTime (datetime)
- `ListPrivateActivitiesSchema` — from?, to?, page, pageSize

---

### P2-003 — API: scaffold `private-activities` module
**Layer:** `apps/api`
**Status:** ✅ Done

Created `apps/api/src/private-activities/`:
- `private-activities.module.ts`
- `private-activities.controller.ts`
- `private-activities.service.ts`

Routes:
- `POST /private-activities` — create a new private activity block (emits `private-activity.created`)
- `GET /private-activities` — paginated list for the current engineer
- `PATCH /private-activities/:id/complete` — mark as complete (emits `private-activity.completed`)
- `DELETE /private-activities/:id` — hard delete (engineer owns the record)

Registered in `app.module.ts`.

---

### P2-004 — API: Prisma schema for private activities
**Layer:** `apps/api`
**Status:** ✅ Done (pre-existing)

`PrivateActivity` model and `PrivateActivityType` enum were already in `prisma/schema.prisma`. No migration needed.

---

### P2-005 — Mobile: My Time screen
**Layer:** `apps/mobile`
**Status:** ✅ Done

- Replaced stub at `apps/mobile/app/(tabs)/private-activity.tsx`
- Created `apps/mobile/hooks/use-private-activities.ts`
- List of time blocks showing type, start time, live duration
- FAB opens a modal — type picker (5 types) + optional notes field
- "Done" button on active blocks to complete them; swipe-style remove with confirmation
- React Query (`staleTime: 2min`, `gcTime: 4h`); all writes through mutation queue

---

## Epic 2 — Inventory (Van Stock tab)

### P2-006 — Types: inventory types
**Layer:** `packages/types`
**Status:** ✅ Done

Added to `packages/types/src/index.ts`:
- `VanStockItem` — extends `StockItem` with `product: Product` relation embedded
- `StockAdjustment` — id, userId, productId, delta, reason, createdAt

`Product` interface already existed.

---

### P2-007 — Validators: inventory schemas
**Layer:** `packages/validators`
**Status:** ✅ Done

Added to `packages/validators/src/index.ts`:
- `AdjustStockSchema` — productId, delta (positive or negative integer), reason
- `SearchInventorySchema` — query?, warehouseId?
- `TransferStockSchema` — productId, qty, toEngineerId

---

### P2-008 — API: scaffold `inventory` module
**Layer:** `apps/api`
**Status:** ✅ Done

Created `apps/api/src/inventory/`:
- `inventory.module.ts`
- `inventory.controller.ts`
- `inventory.service.ts`

Routes:
- `GET /inventory/van-stock` — current engineer's stock items with product relation
- `GET /inventory/search` — filter by query string and/or warehouseId
- `POST /inventory/adjust` — adjust qty with a reason; rejects negative resulting stock
- `POST /inventory/transfer` — atomic transfer between two engineers via `$transaction`
- `GET /inventory/warehouses` — list all warehouses

Registered in `app.module.ts`.

---

### P2-009 — API: Prisma schema for inventory
**Layer:** `apps/api`
**Status:** ✅ Done

`Product` and `StockItem` models already existed. Added:
- `StockAdjustment` model (`@@map("stock_adjustments")`) with reverse relations on `User` and `Product`

Prisma client regenerated (`pnpm db:generate`). Migration pending against production database.

---

### P2-010 — Mobile: Van Stock screen
**Layer:** `apps/mobile`
**Status:** ✅ Done

- Replaced stub at `apps/mobile/app/(tabs)/inventory.tsx`
- Created `apps/mobile/hooks/use-inventory.ts`
- Searchable flat list — client-side filter against cached van stock
- Qty colour coding: red = 0, amber = 1–2, green = 3+
- Pull-to-refresh; item count shown in list header
- Cache config: `staleTime: 5min`, `gcTime: 4h`

---

## Epic 3 — Shipping (Parts Returns tab)

### P2-011 — Types: shipping types
**Layer:** `packages/types`
**Status:** ✅ Done

Added to `packages/types/src/index.ts`:
- `ShippingRequestType` — `'return' | 'on_site_collection'`
- `ShippingRequestStatus` — `'pending' | 'collected' | 'cancelled'`

Updated existing `Shipment` interface to add `type: ShippingRequestType` and `status: ShippingRequestStatus` fields.

---

### P2-012 — Validators: shipping schemas
**Layer:** `packages/validators`
**Status:** ✅ Done

Added to `packages/validators/src/index.ts`:
- `ShipLineInputSchema` — productId, qty, serialNumber?
- `CreateShipmentSchema` — siteId, destinationId, lines (min 1)
- `UpdateShipmentStatusSchema` — status enum

---

### P2-013 — API: scaffold `shipping` module
**Layer:** `apps/api`
**Status:** ✅ Done

Created `apps/api/src/shipping/`:
- `shipping.module.ts`
- `shipping.controller.ts`
- `shipping.service.ts`

Routes:
- `POST /shipping` — create shipment with lines
- `GET /shipping` — list engineer's shipments (desc by date)
- `GET /shipping/:id` — detail with lines, site, and destination
- `PATCH /shipping/:id` — update status; rejects transitions from finalised states
- `DELETE /shipping/:id/lines/:lineId` — remove a line; only allowed when status is `pending`

Registered in `app.module.ts`.

---

### P2-014 — API: Prisma schema for shipping
**Layer:** `apps/api`
**Status:** ✅ Done

`Shipment` and `ShipLine` models already existed. Added:
- `type ShipmentType` enum (`return`, `on_site_collection`)
- `status ShipmentStatus` enum (`pending`, `collected`, `cancelled`)
- `type` and `status` fields added to `Shipment` model with defaults

Prisma client regenerated. Migration pending against production database.

---

### P2-015 — Mobile: Shipping screen
**Layer:** `apps/mobile`
**Status:** ✅ Done

- Replaced stub at `apps/mobile/app/(tabs)/shipping.tsx`
- Created `apps/mobile/hooks/use-shipping.ts`
- List of shipments with status badge (colour-coded), type label, date, line count
- Lines preview (first 3 + overflow count)
- "Mark Collected" and "Cancel" actions on pending shipments, both with confirmation dialogs
- Pull-to-refresh

---

## Epic 4 — Supabase Realtime (live job assignments)

### P2-016 — Mobile: Realtime subscription for job.assigned
**Layer:** `apps/mobile`
**Status:** ✅ Done

- Created `apps/mobile/lib/realtime.ts`
- Postgres changes subscription on `service_orders` INSERT filtered to `assigned_to_id = <userId>`
- On INSERT: invalidates `['service-orders', 'work-list']` React Query cache key
- `subscribeToJobAssignments(userId)` called on login in `AuthGate`
- `unsubscribeFromJobAssignments()` called on logout via `onAuthStateChange`

---

## Epic 5 — Push Notifications

Requires Railway env vars before real delivery works: `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_PRIVATE_KEY`, `FCM_SERVER_KEY`.

### P2-017 — API: scaffold `notifications` module
**Layer:** `apps/api`
**Status:** ✅ Done

Created `apps/api/src/notifications/`:
- `notifications.module.ts`
- `notifications.controller.ts` — `POST /notifications/register`
- `notifications.service.ts` — upserts device token; subscribes to `job.assigned` via `@OnEvent` decorator; `sendToUser(userId, title, body, data?)` dispatches per platform

APNs and FCM delivery stubs in place — actual HTTP/2 calls to APNs/FCM are wired in the worker service once env vars are provisioned.

Registered in `app.module.ts`.

---

### P2-018 — API: Prisma schema for device tokens
**Layer:** `apps/api`
**Status:** ✅ Done

Added `DeviceToken` model (`@@map("device_tokens")`):
- `token String @unique`
- `platform String` — `'ios'` or `'android'`
- Reverse relation added to `User`

Prisma client regenerated. Migration pending against production database.

---

### P2-019 — Worker service: scaffold separate Railway service
**Layer:** `apps/worker`
**Status:** ✅ Done

Created `apps/worker/` as a standalone NestJS application:
- `src/main.ts`, `src/app.module.ts`
- `src/prisma/` — own PrismaService pointing at shared schema (`../api/prisma/schema.prisma`)
- `src/webhook-delivery/webhook-delivery.service.ts` — `@Cron(EVERY_30_SECONDS)` polls `webhook_deliveries` WHERE `status = 'pending' AND nextRetryAt <= now()`; signs payload with HMAC-SHA256; applies retry schedule: 30s → 2min → 10min → 1h → 4h → `dead` after 5 attempts
- Uses `@nestjs/schedule` (`ScheduleModule.forRoot()`)

Deploy as a separate Railway service with the same `DATABASE_URL`.

---

### P2-020 — Mobile: register push token on login
**Layer:** `apps/mobile`
**Status:** ✅ Done

- Created `apps/mobile/lib/push-notifications.ts`
- Requests notification permission via `expo-notifications`
- Gets Expo push token; skips re-registration if token matches value stored in `expo-secure-store`
- POSTs to `POST /notifications/register` via API client
- `registerPushToken()` called on login in `AuthGate` (non-blocking, error is swallowed)

---

## Remaining before deploying Phase 2

| Action | Who |
|---|---|
| Run `pnpm db:migrate` against production database | DevOps / you |
| Add `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_PRIVATE_KEY` env vars to Railway API service | DevOps / you |
| Add `FCM_SERVER_KEY` env var to Railway API service | DevOps / you |
| Deploy `apps/worker` as a second Railway service pointing at same `DATABASE_URL` | DevOps / you |
| Wire real APNs/FCM HTTP calls in `notifications.service.ts` (stubs in place) | Engineering |
