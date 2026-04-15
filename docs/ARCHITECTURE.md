# Veritek Field Service Platform — Architecture

## Background

Veritek Global operates a fleet of field engineers across the UK who service and maintain equipment at customer sites. The platform that manages this operation — Astea — is end-of-life. It can no longer receive updates or security patches, and it provides no mechanism for data integrations, which customers and partners are actively requesting.

This document describes the architecture of the replacement platform. It covers the three consumer surfaces (mobile app, back office portal, integration API), the hosting infrastructure, the data strategy, and the delivery phasing.

---

## Guiding principles

**API-first, always.** Every consumer — mobile app, back office, and integration partners — communicates exclusively with the NestJS API. No direct database connections from clients. This keeps all business logic in one place and makes the integration layer complete by design.

**Network-resilient, not offline-first.** The mobile app assumes connectivity and behaves as if online. It handles signal loss gracefully through a persistent local mutation queue, without the complexity of a full bidirectional sync engine.

**Events as first-class citizens.** Every meaningful state transition emits a domain event. Webhooks, push notifications, and background jobs all subscribe to those events independently of the domain modules that emit them.

**Shared patterns with Metabrix.** This platform uses the same hosting stack, deployment pipeline, and architectural conventions as the Metabrix platform already in production. The incremental scope is the mobile application and the integration layer.

---

## System overview

```
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│   Expo mobile app   │   │  Vercel back office  │   │ Integration partners│
│   iOS · Android     │   │  Next.js App Router  │   │ API key · webhooks  │
└──────────┬──────────┘   └──────────┬───────────┘   └──────────┬──────────┘
           │                         │                            │
           │         HTTPS           │         HTTPS             │
           └─────────────────────────┴────────────────────────────┘
                                     │
                    ┌────────────────┴───────────────┐
                    │           Railway               │
                    │    ┌─────────────────────┐     │
                    │    │    NestJS API        │     │
                    │    │  Auth · Domains      │     │
                    │    │  Events · Webhooks   │     │
                    │    │  API keys · Sync     │     │
                    │    └──────────┬───────────┘     │
                    │               │ private network  │
                    │    ┌──────────┴───────────┐     │
                    │    │   Worker service    │     │
                    │    │  Retries · Alerts   │     │
                    │    │  Push · Reports     │     │
                    │    └─────────────────────┘     │
                    └────────────────┬───────────────┘
                                     │
                    ┌────────────────┴───────────────┐
                    │           Supabase              │
                    │   Auth · JWT · RLS              │
                    │   PostgreSQL · PgBouncer        │
                    └─────────────────────────────────┘
```

---

## Hosting infrastructure

### Supabase — auth and database

Supabase provides two services: authentication and a managed PostgreSQL instance.

Authentication uses Supabase Auth. On login, Supabase issues a short-lived JWT. The NestJS API validates that JWT on every request using the Supabase JWT secret. Row-level security is configured as a defence-in-depth measure at the database layer, supplementing the access control enforced in application code.

The PostgreSQL instance is accessed exclusively by the NestJS API via Prisma. PgBouncer handles connection pooling, preventing connection limit issues as the number of API instances scales.

### Railway — API and worker

Railway hosts two services within a single project connected by a private network:

The **NestJS API** is the primary service. It handles all inbound requests from the mobile app, the back office, and integration partners. It owns all business logic, all database queries (via Prisma), and all domain event emission.

The **worker service** is a separate lightweight process that handles background work that should not block the API request cycle. Its responsibilities are:

- Processing the webhook delivery queue (polling every 30 seconds, applying exponential backoff on failures)
- Monitoring SLA breach thresholds and emitting alerts
- Flushing offline mutation queues submitted by the sync endpoint
- Sending scheduled reports by email
- Dispatching push notifications via APNs and FCM
- Sending transactional emails (job reports to customers, part return confirmations)

Both services share environment variables via Railway's project-level configuration and communicate over the private network without exposing ports publicly.

### Vercel — back office portal

The Next.js back office is deployed on Vercel. Server components handle data fetching from the NestJS API, keeping the client bundle small and the back office fast. Every pull request generates a preview deployment automatically, allowing functional review before merging.

### Turborepo monorepo

All code lives in a single Turborepo monorepo. The `packages/` layer contains shared TypeScript types, Zod validation schemas, and an API client that all three consumer apps import. This ensures that a type change in the API propagates to the mobile app and back office at compile time, not at runtime.

---

## Authentication

Two authentication strategies are supported, selected by NestJS guards based on the incoming request headers.

### Supabase JWT — internal users

Used by field engineers (via Expo) and back office staff (via Next.js).

1. User logs in via Supabase Auth (email/password or SSO)
2. Supabase issues a signed JWT with the user's ID, email, and role
3. All subsequent API requests carry `Authorization: Bearer <token>`
4. The `JwtAuthGuard` in NestJS validates the signature and attaches the user to the request
5. Role-based decorators (`@Roles('engineer')`, `@Roles('dispatcher')`) restrict access at the route level

### API key — integration partners

Used by third-party systems connecting via the integration API.

1. Veritek staff issue a key via the back office portal
2. The key is generated, hashed with bcrypt, and stored in the `api_keys` table — the plaintext is shown once and never stored
3. Integration partners carry `X-API-Key: <key>` on all requests
4. The `ApiKeyGuard` looks up the hash, validates the key, and checks the request against the key's scopes
5. Every request is logged to `api_key_usage` with timestamp, endpoint, and response code
6. Rate limiting is applied per key via `@nestjs/throttler`

---

## Domain model

The core entities and their relationships.

```
User
  ├── role: engineer | dispatcher | admin
  └── warehouse (van stock location)

ServiceOrder
  ├── assigned to User (engineer)
  ├── site: Site
  ├── priority: 1-99 (1-19 low, 20-39 medium, 40-59 high, 60-79 critical, 80+ urgent)
  ├── status: received | accepted | in-route | in-progress | completed | closed
  ├── Activities[]
  ├── Items[] (equipment on the order)
  ├── Materials[] (parts against the order)
  └── Attachments[]

Activity
  ├── belongs to ServiceOrder
  ├── type: break-fix | preventive-maintenance | installation | ...
  ├── status: open | travel | work | complete
  ├── startTravel: DateTime?
  ├── startWork: DateTime?
  ├── endWork: DateTime?
  ├── travelDistance: Int (miles)
  ├── stopCode: String
  ├── comments: String
  └── checklist: ChecklistResponse[]

Item (equipment)
  ├── belongs to ServiceOrder and Site
  └── productId, serialNumber, tagNumber, installDate, warrantyExpiry

Material (part)
  ├── belongs to ServiceOrder
  ├── status: needed | allocated | back-ordered | fulfilled | not-used | cancelled
  ├── disposition: open | fulfilled | not-used | doa
  ├── returnable: Boolean
  └── ReturnProduct?

Shipment (parts return)
  ├── belongs to User (engineer)
  ├── site: Site
  ├── destination: Warehouse
  └── ShipLines[]

PrivateActivity
  ├── belongs to User
  ├── type: travel | training | holiday | absence | ...
  ├── startTime, endTime
  └── done: Boolean

ClockEvent
  ├── belongs to User
  ├── type: clock-in | clock-out
  └── timestamp: DateTime

WebhookSubscription
  ├── eventTypes: String[]
  ├── endpointUrl: String
  ├── secret: String (hashed)
  └── WebhookDeliveries[]

ApiKey
  ├── keyHash: String
  ├── scopes: String[]
  ├── isActive: Boolean
  └── ApiKeyUsage[]
```

---

## Domain events

Events are emitted on the internal EventEmitter2 bus. Domain modules emit; the webhooks, notifications, and worker modules subscribe.

| Event | Emitted when | Payload includes |
|---|---|---|
| `job.assigned` | Dispatcher assigns a service order to an engineer | orderId, engineerId, siteId, priority, eta |
| `job.accepted` | Engineer accepts a service order on device | orderId, engineerId, acceptedAt |
| `job.rejected` | Engineer rejects a service order | orderId, engineerId, reason |
| `travel.started` | Engineer taps Start Travel | orderId, activityId, startedAt |
| `work.started` | Engineer taps Start Work | orderId, activityId, startedAt, travelDistance |
| `job.completed` | Engineer exits the service order after sign-off | orderId, activityId, stopCode, resolvedAt, signedBy |
| `part.ordered` | Material demand raised against a service order | orderId, productId, qty, deliveryType |
| `part.fitted` | Part fulfilled from van stock or allocated shipment | orderId, materialId, productId, serialNumber |
| `part.returned` | Part marked for return to repair warehouse | orderId, materialId, returnReason, warehouseId |
| `clock.in` | Engineer starts their shift | userId, timestamp |
| `clock.out` | Engineer ends their shift | userId, timestamp |
| `private-activity.created` | New private activity block created | userId, type, startTime |
| `private-activity.completed` | Private activity marked done | userId, activityId, endTime |

---

## Mobile application

### Technology

- Expo SDK with Expo Router (file-based navigation, mirrors Next.js App Router)
- React Query v5 for server state, caching, and background refetch
- expo-sqlite for the persistent local mutation queue
- Supabase Realtime (read-only subscription for live job assignment only)
- expo-notifications for APNs and FCM push notification handling
- expo-camera for photo attachments
- expo-location for travel distance context

### Screen structure (Expo Router)

```
app/
  (auth)/
    login.tsx
  (tabs)/
    index.tsx              Work list (home)
    inventory.tsx          Van stock
    private-activity.tsx   Non-job time
    shipping.tsx           Parts returns
  service-order/
    [id]/
      index.tsx            Details tab
      activities.tsx       Activities tab
      items.tsx            Items tab
      materials.tsx        Materials tab
      completion.tsx       Completion tab
      signature.tsx        Customer sign-off
      checklist.tsx        Checklist
  clock.tsx                Clock in / out modal
  history.tsx              Job history search
  messenger.tsx            Dispatch messages
```

### Mutation queue schema (expo-sqlite)

```sql
CREATE TABLE mutation_queue (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at  TEXT NOT NULL,
  endpoint    TEXT NOT NULL,
  method      TEXT NOT NULL,
  body        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',
  attempts    INTEGER NOT NULL DEFAULT 0,
  last_error  TEXT
);
```

The queue is flushed by posting to `POST /sync` with the full array of pending mutations. The API processes them in `created_at` order and returns per-mutation success/failure. Successfully processed entries are deleted from the local queue.

### Caching strategy

| Data | Cache on | Stale after | Evict after |
|---|---|---|---|
| Work list | Login + background | 2 minutes | 4 hours |
| Reference data (stop codes, checklists, catalogue, delivery types) | Login | Never (app version) | App update |
| Van stock | Login + background | 5 minutes | 4 hours |
| Service order detail | First open | 5 minutes | 8 hours |
| Site details | First access | 30 minutes | 24 hours |
| History results | On search | 10 minutes | 1 hour |

---

## Back office portal

### Technology

- Next.js 15 App Router on Vercel
- Server components for all data fetching (calls NestJS API server-side)
- React Server Actions for mutations
- Supabase Auth for authentication (same JWT strategy as the API)

### Key pages

- **Dashboard** — open service orders, SLA status, engineer locations
- **Service orders** — list, search, filter by status/priority/engineer/site, detail view
- **Dispatch** — assign engineers to service orders, update ETAs
- **Materials** — outstanding part orders, allocation management
- **Engineers** — user list, van stock per engineer, shift history
- **Webhooks** — subscription management, delivery log, retry controls
- **API keys** — issue, scope, suspend, revoke integration credentials
- **Reports** — completed jobs by period, SLA performance, parts usage

---

## Webhook delivery

Webhook delivery is handled entirely by the worker service on Railway.

```
1. Domain event fires on EventEmitter2 bus
2. WebhooksListener queries webhook_subscriptions for matching eventTypes
3. For each matching subscription: insert row into webhook_deliveries (status: pending)
4. Worker polls webhook_deliveries WHERE status = 'pending' every 30s
5. For each pending delivery:
   a. Serialise payload as JSON
   b. Compute HMAC-SHA256 signature using subscription secret
   c. POST to endpointUrl with X-Veritek-Signature header
   d. On 2xx: update status to 'delivered', record responseCode
   e. On non-2xx or timeout: increment attempts, calculate next_retry_at
      Retry schedule: 30s → 2min → 10min → 1h → 4h
      After 5 attempts: status = 'dead'
6. All delivery attempts logged with timestamp, responseCode, responseBody (truncated)
```

### Payload envelope

```json
{
  "id": "evt_01hx...",
  "type": "job.completed",
  "created_at": "2026-04-15T14:32:00Z",
  "data": {
    "orderId": "...",
    "engineerId": "...",
    ...
  }
}
```

---

## Delivery phases

| Phase | Scope | Outcome |
|---|---|---|
| 1 — Mobile MVP | Full job workflow: clock in, receive work, accept, travel, start work, manage items and materials, checklist, stop work, customer sign-off, clock out | Field engineers have a working tool. Core business operations unblocked. |
| 2 — Mobile complete | Private activities, inventory, shipping/parts returns, push notifications, Supabase Realtime job assignments | Full mobile feature parity with Astea. Real-time dispatch. |
| 3 — Back office portal | Dispatch, service order management, materials, SLA monitoring, reporting | Operations and dispatch teams fully migrated off Astea back office. |
| 4 — Integration platform | API key management, webhook subscriptions, delivery dashboard, developer documentation | Third-party integrations enabled. Veritek can say yes to integration requests for the first time. |

---

## Key decisions and rationale

**Why not offline-first?** The original Astea app was built for 2G/3G. UK engineers in 2025 have 4G/5G for the vast majority of their working day. Full offline-first adds bidirectional sync complexity, conflict resolution logic, and a large login payload for a scenario — extended offline working — that is now rare and brief. The optimistic-first approach handles the real failure modes (basements, rural dead zones, tunnels) without that complexity.

**Why API keys and not OAuth for integrations?** The integration use cases described (CRM, ERP, payroll, customer portals) are server-to-server. OAuth is designed for delegated user authentication. API keys with scopes are the appropriate credential for server-to-server integrations and are what enterprise integration teams expect to work with.

**Why Postgres as the webhook queue rather than Redis/BullMQ?** At the expected scale, Postgres polling every 30 seconds is entirely sufficient and keeps the infrastructure simple — no additional Railway service, no additional operational surface. If volume grows to the point where this becomes a bottleneck, BullMQ with a Railway Redis service can be added behind the same queue interface without changing anything above it.

**Why Supabase Realtime as the exception to API-first?** The alternative is a WebSocket server on Railway. Supabase Realtime is already in the stack, it handles this use case natively, and it is read-only — no writes bypass the API. The pragmatic exception costs nothing and avoids additional infrastructure.

---

## Reference

- `CLAUDE.md` — project context, conventions, and rules for Claude Code
- Astea Mobile User Guide (DOC204o) — functional reference for all field engineer workflows
- Astea Back Office Screenshots — reference for the back office portal UI and data fields
- Astea Mobile Rebuild Additional Info — customer priorities and offline requirements
