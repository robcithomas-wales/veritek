# Veritek Field Service Platform — Project Context

This file provides persistent context for Claude Code. Read it before acting on any prompt in this repository.

---

## What this project is

A ground-up replacement for the Astea field service management platform used by Veritek Global. The system manages field engineers across the UK — dispatching jobs, tracking parts, recording time, and capturing customer sign-off. The replacement adds a first-class integration layer that Astea could not provide.

There are three consumer surfaces:

- A mobile app used by field engineers (iOS and Android)
- A back office web portal used by dispatch and operations staff
- An integration API used by third-party systems via API keys and webhooks

---

## Repository structure

```
apps/
  mobile/        Expo (React Native) — field engineer mobile app
  web/           Next.js (App Router) — back office portal, hosted on Vercel
  api/           NestJS — REST API, hosted on Railway
packages/
  types/         Shared TypeScript types and interfaces
  validators/    Shared Zod validation schemas
  api-client/    Shared typed fetch wrapper for calling the NestJS API
```

---

## Stack

| Layer | Technology | Version |
|---|---|---|
| Mobile | Expo (React Native) with Expo Router | SDK 52+ |
| Web | Next.js App Router | 15+ |
| API | NestJS | 10+ |
| ORM | Prisma | 5+ |
| Database | PostgreSQL via Supabase | — |
| Auth | Supabase Auth | — |
| Mobile storage | expo-sqlite | — |
| Mobile data fetching | React Query (TanStack Query) | v5 |
| Validation | Zod (shared across all surfaces) | v3 |
| Monorepo | Turborepo | latest |
| Package manager | pnpm | — |
| Language | TypeScript (strict mode) throughout | 5+ |

---

## The single most important architectural rule

**The NestJS API is the sole data gateway. No consumer — mobile app, web portal, or integration partner — ever connects directly to the database.**

Every read and every write goes through the API. This is non-negotiable. It is what makes the integration layer complete and what keeps all business logic in one place.

The one deliberate exception: Supabase Realtime subscriptions are used directly from the Expo mobile app for read-only event subscriptions (new job assignments appearing on the work list). This is a read-only subscription only — no writes ever bypass the API.

---

## NestJS API — module structure

Each module owns its controllers, services, and Prisma queries. Nothing leaks across module boundaries except through injected services.

| Module | Responsibility |
|---|---|
| `auth` | JWT validation guard (Supabase), API key guard, RBAC decorator |
| `users` | Engineer and back office user profiles, preferences |
| `service-orders` | Core domain — receiving, accepting, previewing, completing jobs |
| `activities` | Travel and work time recording against a service order |
| `items` | Equipment registered against a service order, site item lists |
| `materials` | Parts fitted, ordered, returned, transferred — all disposition states |
| `inventory` | Van stock management, part search across warehouse locations |
| `shipping` | Parts returns, on-site collection requests, ship lines |
| `clock` | Shift start and end recording |
| `private-activities` | Non-job time blocks — travel home, training, absences |
| `checklists` | Dynamic checklist questions per item type, answer recording |
| `sites` | Site details, lookup by ID, assigned site lists |
| `sync` | Accepts batched offline mutations, processes queue in order |
| `notifications` | Push notification delivery via APNs and FCM |
| `events` | Internal EventEmitter2 bus — emits domain events |
| `webhooks` | Webhook subscription registry, delivery queue, retry logic |
| `api-keys` | API key issuance, hashing, scope management, usage logging |
| `worker` | Background job processor — runs as a separate Railway service |

---

## Authentication — two strategies

**Supabase JWT (field engineers and back office staff)**
- Supabase Auth issues a short-lived JWT on login
- Every API request carries the token in the `Authorization: Bearer <token>` header
- The `AuthGuard` in the `auth` module validates the JWT against the Supabase JWT secret
- User identity and role are attached to the request context after validation

**API key (integration partners)**
- Long-lived keys issued via the back office portal
- Stored hashed in PostgreSQL — never in plaintext
- Carried in the `X-API-Key` header
- Each key has a scopes array — e.g. `['service-orders:read', 'materials:read']`
- A separate `ApiKeyGuard` handles these requests
- Rate limiting applied per key via `@nestjs/throttler`

---

## Domain events

Every meaningful state transition emits a domain event on the internal EventEmitter2 bus. Domain modules emit events without knowing what is listening. The webhooks and notifications modules subscribe independently.

```
job.assigned
job.accepted
job.rejected
travel.started
work.started
job.completed
part.ordered
part.fitted
part.returned
clock.in
clock.out
private-activity.created
private-activity.completed
item.installed
item.removed
```

---

## Mobile app — network-resilient strategy

**Do not implement offline-first (full local replica). Use optimistic-first.**

The three mechanisms that make this work:

1. **Optimistic UI** — every action writes to the local mutation queue immediately and updates the UI at once. The API call happens in the background. The engineer never waits.

2. **Selective caching via React Query** — cache on login: today's and tomorrow's work list, van stock, all reference data (stop codes, checklists, product catalogue, delivery types, warehouses). Cache on first access: full service order details for any job the engineer opens. Never cache: other engineers' data, back office config, historical reports.

3. **Persistent mutation queue via expo-sqlite** — failed writes (due to no connectivity) are queued to a local SQLite table. The queue survives app restarts. On connectivity return, the queue is flushed to the `/sync` endpoint in order.

**React Query configuration guidelines**
- Reference data (stop codes, checklists, catalogue): `staleTime: Infinity`, `cacheTime: 24h`
- Work list: `staleTime: 2min`, `cacheTime: 4h`
- Service order detail: `staleTime: 5min`, `cacheTime: 8h`
- Van stock: `staleTime: 5min`, `cacheTime: 4h`

---

## Webhook delivery

- Webhook subscriptions stored in `webhook_subscriptions` table
- On domain event: look up all subscriptions for that event type, serialise payload, insert into `webhook_deliveries` table with status `pending`
- Worker service polls `webhook_deliveries` every 30 seconds
- On delivery attempt: POST to subscriber endpoint, update status to `delivered` or `failed`
- Retry schedule: 30s, 2min, 10min, 1h, 4h — max 5 attempts then mark `dead`
- All payloads signed with HMAC-SHA256 using per-subscription secret
- Signature sent in `X-Veritek-Signature` header
- Full delivery log visible in back office portal

---

## Database conventions (Prisma)

- All table names in `snake_case` (Prisma `@@map`)
- All model names in `PascalCase`
- All timestamps: `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`
- All primary keys: `id String @id @default(cuid())`
- Soft deletes where audit trail matters: `deletedAt DateTime?`
- No raw SQL unless Prisma cannot express the query — document why when used

---

## Naming conventions

- **Files**: `kebab-case` throughout
- **TypeScript types and interfaces**: `PascalCase`
- **Variables and functions**: `camelCase`
- **Database columns**: `snake_case` (via Prisma `@map`)
- **API routes**: `/kebab-case` e.g. `/service-orders`, `/private-activities`
- **Environment variables**: `SCREAMING_SNAKE_CASE`
- **Zod schemas**: suffix with `Schema` e.g. `CreateServiceOrderSchema`
- **NestJS DTOs**: suffix with `Dto` e.g. `CreateServiceOrderDto`
- **Domain events**: `noun.verb` in lowercase e.g. `job.completed`

---

## Environment variables

**API (Railway)**
```
DATABASE_URL
SUPABASE_URL
SUPABASE_JWT_SECRET
SUPABASE_SERVICE_ROLE_KEY
API_KEY_HASH_SECRET
WEBHOOK_SIGNING_SECRET
APNS_KEY_ID
APNS_TEAM_ID
APNS_PRIVATE_KEY
FCM_SERVER_KEY
PORT
NODE_ENV
```

**Web (Vercel)**
```
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Mobile (Expo)**
```
EXPO_PUBLIC_API_URL
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

---

## What not to do

- Do not add direct Supabase client queries in the web or mobile apps for anything other than auth and the one Realtime subscription described above
- Do not use `any` in TypeScript — use `unknown` and narrow, or fix the type
- Do not put business logic in controllers — controllers validate input and delegate to services
- Do not put business logic in Prisma queries — queries return data, services apply rules
- Do not use `console.log` in production code — use the NestJS `Logger` service
- Do not create new API routes without a corresponding Zod schema in `packages/validators`
- Do not bypass the mutation queue on mobile — all writes go through the queue even when online, so the flow is consistent and testable

---

## Reference documents

- `docs/ARCHITECTURE.md` — full architectural narrative with diagrams description, delivery phases, and infrastructure detail
- `docs/astea-mobile-guide.md` — functional reference for the mobile app workflow (derived from the Astea user guide)
- `docs/domain-events.md` — full event payload schemas once defined
- `docs/api-key-scopes.md` — full scope definitions once defined
