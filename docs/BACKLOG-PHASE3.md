# Phase 3 Backlog — Back Office Portal

The back office is a Next.js 15 App Router application deployed on Vercel. It is used by dispatch staff and operations managers to manage service orders, assign engineers, monitor SLA, manage parts, and administer webhooks and API keys.

All data fetching goes through the NestJS API — server components call the API server-side using the user's session token. Mutations use React Server Actions. No direct Supabase database queries from the web app.

---

## Current state

The `apps/web` directory exists but contains only an empty `src/` folder. Everything needs to be built from scratch.

The NestJS API currently has only engineer-scoped routes (each route returns data for the authenticated engineer only). The back office needs dispatcher/admin-scoped routes added to the API before the portal pages can work.

---

## Epic 1 — Web App Scaffold

### P3-001 — Scaffold Next.js 15 app
**Layer:** `apps/web`
**Status:** ⬜ Todo
**Depends on:** nothing

Bootstrap the Next.js application:
- `package.json` — Next.js 15, React 19, TypeScript, Tailwind CSS, `@supabase/ssr`, `@veritek/api-client` workspace dep
- `next.config.ts` — `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `tailwind.config.ts` + `postcss.config.mjs`
- `tsconfig.json` — strict mode, path alias `@/*` → `./src/*`
- `src/app/layout.tsx` — root layout, global CSS
- `src/app/globals.css` — Tailwind base/components/utilities
- `.env.local` — local env vars pointing at Railway API
- `vercel.json` — root directory override to `apps/web`

---

### P3-002 — Auth: Supabase SSR session and middleware
**Layer:** `apps/web`
**Status:** ⬜ Todo
**Depends on:** P3-001

- `src/lib/supabase/server.ts` — `createServerClient` using `@supabase/ssr` cookie helpers for use in Server Components and Server Actions
- `src/lib/supabase/client.ts` — `createBrowserClient` for use in Client Components
- `src/middleware.ts` — refresh session cookie on every request; redirect unauthenticated requests to `/login`; only engineers with role `dispatcher` or `admin` may access back office (return 403 for `engineer` role)
- `src/app/login/page.tsx` — email/password login form using Supabase Auth; Server Action submits credentials; redirects to `/` on success
- `src/lib/auth.ts` — `getUser()` helper that reads session in Server Components and throws if unauthenticated

---

### P3-003 — Shared layout: sidebar and header
**Layer:** `apps/web`
**Status:** ⬜ Todo
**Depends on:** P3-002

- `src/app/(portal)/layout.tsx` — authenticated portal layout wrapping all back office pages
- `src/components/sidebar.tsx` — navigation links: Dashboard, Service Orders, Dispatch, Materials, Engineers, Reports, Webhooks, API Keys; active state highlight; Veritek logo top-left
- `src/components/header.tsx` — page title (from breadcrumb), current user name, sign out button
- `src/components/ui/` — shared primitives: `Badge`, `Button`, `Card`, `Table`, `StatusBadge` (maps service order status to colour), `PriorityBadge`

---

## Epic 2 — API: Back Office Endpoints

All new routes are protected by `@Roles('dispatcher', 'admin')` on top of `JwtAuthGuard`. The existing engineer routes are unchanged.

### P3-004 — API: dispatcher service-orders routes
**Layer:** `apps/api`
**Status:** ⬜ Todo
**Depends on:** nothing (additive to existing module)

Add to `service-orders` module (new controller or new methods on existing):
- `GET /admin/service-orders` — paginated list of ALL orders; filter by `status`, `priority`, `engineerId`, `siteId`, `from`, `to`; include assigned engineer name and site name
- `POST /admin/service-orders` — create a new service order (dispatcher raises a job)
- `GET /admin/service-orders/:id` — full detail including activities, materials, items, engineer
- `PATCH /admin/service-orders/:id/assign` — assign or reassign an engineer; emits `job.assigned`
- `PATCH /admin/service-orders/:id/eta` — set or update ETA
- `PATCH /admin/service-orders/:id/close` — close a completed order
- `GET /admin/service-orders/stats` — aggregate counts by status, count of SLA-breached orders (open orders older than 4h), counts by priority

Add validators: `CreateServiceOrderSchema`, `AssignServiceOrderSchema`, `SetEtaSchema`, `AdminServiceOrderQuerySchema`.

---

### P3-005 — API: admin users routes
**Layer:** `apps/api`
**Status:** ⬜ Todo
**Depends on:** nothing (additive to existing module)

Add to `users` module:
- `GET /admin/users` — list all users; filter by `role`; include current clock status (clocked in/out)
- `GET /admin/users/:id` — engineer detail: profile, current clock status, today's work list, van stock summary
- `POST /admin/users` — create a user record (Supabase user creation is separate — this links a Supabase ID to a role/warehouse)
- `PATCH /admin/users/:id` — update role or warehouse assignment

Add validator: `AdminCreateUserSchema`, `AdminUpdateUserSchema`.

---

### P3-006 — API: webhooks module
**Layer:** `apps/api`
**Status:** ⬜ Todo
**Depends on:** Prisma models for `WebhookSubscription` and `WebhookDelivery` (check schema)

Create `apps/api/src/webhooks/`:
- `webhooks.module.ts`
- `webhooks.controller.ts`
- `webhooks.service.ts`

Routes (all require `admin` role):
- `POST /webhooks` — create subscription; generate HMAC secret; store hashed
- `GET /webhooks` — list subscriptions with last delivery status
- `GET /webhooks/:id` — detail with delivery log (paginated)
- `PATCH /webhooks/:id` — update endpoint URL or event types
- `DELETE /webhooks/:id` — deactivate subscription
- `POST /webhooks/:id/retry` — re-queue a `dead` or `failed` delivery

The `WebhooksListener` (subscribes to EventEmitter2 and inserts into `webhook_deliveries`) should live in this module.

Add validators: `CreateWebhookSchema`, `UpdateWebhookSchema`.

---

### P3-007 — API: api-keys module
**Layer:** `apps/api`
**Status:** ⬜ Todo
**Depends on:** Prisma models for `ApiKey` and `ApiKeyUsage` (check schema)

Create `apps/api/src/api-keys/`:
- `api-keys.module.ts`
- `api-keys.controller.ts` — with `ApiKeyGuard` and `JwtAuthGuard`
- `api-keys.service.ts`

Routes (all require `admin` role via JWT):
- `POST /api-keys` — generate key; return plaintext once; store only the hash
- `GET /api-keys` — list keys (masked); include last-used timestamp, request count
- `GET /api-keys/:id/usage` — paginated usage log
- `PATCH /api-keys/:id/suspend` — disable key
- `PATCH /api-keys/:id/activate` — re-enable key
- `DELETE /api-keys/:id` — revoke permanently

Add validators: `CreateApiKeySchema` (name, scopes array, expiresAt?).

---

### P3-008 — API: tests for new admin endpoints
**Layer:** `apps/api`
**Status:** ⬜ Todo
**Depends on:** P3-004, P3-005, P3-006, P3-007

Service unit tests for:
- `service-orders` admin methods: stats aggregation, assign (emits event), close
- `users` admin methods: list with clock status, detail
- `webhooks` service: create (secret generation), retry delivery re-queue
- `api-keys` service: create (key hashing), suspend/activate guard logic

---

## Epic 3 — Back Office Pages

### P3-009 — Dashboard
**Layer:** `apps/web`
**Status:** ⬜ Todo
**Depends on:** P3-001, P3-002, P3-003, P3-004 (stats endpoint)

`src/app/(portal)/page.tsx` — the default `/` route.

Sections:
- KPI row: total open orders, in-progress orders, SLA at-risk count (open > 4h), engineers clocked in today
- Status breakdown: card per status (Received, Accepted, In Route, In Progress) with count and link to filtered service orders list
- Priority breakdown: LOW / MEDIUM / HIGH / CRITICAL / URGENT counts
- Recent activity: last 10 completed orders (SO ref, site, engineer, completed at)

All data fetched server-side from `GET /admin/service-orders/stats` and `GET /admin/service-orders?status=completed&pageSize=10`.

---

### P3-010 — Service orders list
**Layer:** `apps/web`
**Status:** ⬜ Todo
**Depends on:** P3-001, P3-002, P3-003, P3-004

`src/app/(portal)/service-orders/page.tsx`

- Server component; reads filter params from `searchParams`
- Filterable by: status (multi-select), priority, engineer (select from list), site (text search), date range
- Paginated table: SO ref, site, priority badge, status badge, assigned engineer, created date, last updated
- Each row links to detail page
- "New order" button → modal or separate page (P3-011 creation flow)
- Filter state synced to URL params for bookmarkability

---

### P3-011 — Service order detail
**Layer:** `apps/web`
**Status:** ⬜ Todo
**Depends on:** P3-010

`src/app/(portal)/service-orders/[id]/page.tsx`

Tabs:
- **Overview** — site details, description, priority, status, assigned engineer, ETA, created/updated timestamps; "Assign engineer" and "Set ETA" action buttons (Server Actions)
- **Activities** — timeline of travel/work periods with durations; stop code and resolution comments
- **Materials** — parts list: product, qty, status, disposition; outstanding demand highlighted
- **Items** — equipment on the order: serial numbers, install dates
- **History** — audit trail of status transitions with timestamps

---

### P3-012 — Dispatch page
**Layer:** `apps/web`
**Status:** ⬜ Todo
**Depends on:** P3-010, P3-005

`src/app/(portal)/dispatch/page.tsx`

Two-column layout:
- Left: unassigned and recently-received orders (sorted by priority DESC, created ASC); each card shows priority, site, description
- Right: engineer roster with current status (clocked in/out, current job if any)
- Drag or click-to-assign: selecting an order and clicking an engineer triggers `PATCH /admin/service-orders/:id/assign` Server Action
- Assigned confirmation toast; both columns refresh via `router.refresh()`

---

### P3-013 — Materials page
**Layer:** `apps/web`
**Status:** ⬜ Todo
**Depends on:** P3-010

`src/app/(portal)/materials/page.tsx`

- Flat list of all materials across all open orders with status `needed` or `back-ordered`
- Group by service order; show: product name/SKU, qty, status, which engineer's order
- Filter by status, engineer, date range
- "Back-ordered" items highlighted in amber
- Links through to parent service order detail

---

### P3-014 — Engineers page
**Layer:** `apps/web`
**Status:** ⬜ Todo
**Depends on:** P3-005

`src/app/(portal)/engineers/page.tsx`

- Table of all engineers: name, clock status (green dot = clocked in), current job (SO ref + site), van stock item count
- Click row → engineer detail sheet/modal: full profile, today's clock events, van stock list with quantities

---

### P3-015 — Webhooks page
**Layer:** `apps/web`
**Status:** ⬜ Todo
**Depends on:** P3-006

`src/app/(portal)/webhooks/page.tsx`

- List of webhook subscriptions: endpoint URL, event types, status (active/inactive), last delivery result
- "New subscription" button → form: endpoint URL, event type checkboxes, save triggers `POST /webhooks`
- Expand row → delivery log: last 20 deliveries with status, response code, timestamp, retry button for dead deliveries
- Deactivate/delete actions per subscription

---

### P3-016 — API keys page
**Layer:** `apps/web`
**Status:** ⬜ Todo
**Depends on:** P3-007

`src/app/(portal)/api-keys/page.tsx`

- List of API keys: name, scopes, created date, last used, status (active/suspended/revoked)
- "Issue new key" button → form: name, scope checkboxes (from `docs/api-key-scopes.md`), optional expiry date
- On create: modal shows the full plaintext key once with a copy button; warns it won't be shown again
- Suspend / activate / revoke actions per key
- Click key → usage log drawer: last 50 requests with endpoint, response code, timestamp

---

### P3-017 — Reports page
**Layer:** `apps/web`
**Status:** ⬜ Todo
**Depends on:** P3-004

`src/app/(portal)/reports/page.tsx`

Three report views (tab-switched, all server-rendered from query params):
- **Completed jobs** — count and list by period (day/week/month); filterable by engineer and site
- **SLA performance** — % of jobs completed within 4h of assignment, by engineer and overall; table + simple bar chart using CSS (no chart library dependency)
- **Parts usage** — top 20 parts by quantity fitted in the selected period; back-ordered rate per product

All reports driven by date range picker synced to URL params.

---

## Epic 4 — Deploy

### P3-018 — Deploy to Vercel
**Layer:** `apps/web`, infra
**Status:** ⬜ Todo
**Depends on:** All above

- `vercel.json` at repo root — `rootDirectory: apps/web`
- Add environment variables in Vercel dashboard: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Link GitHub repo in Vercel project; auto-deploy on push to `main`
- Set `NEXT_PUBLIC_API_URL` to `https://veritekapi-production.up.railway.app`
- Verify preview deployment works on PR

---

## Delivery order

```
P3-001 → P3-002 → P3-003          (scaffold, auth, layout — unblocks all pages)
P3-004 → P3-005 → P3-006 → P3-007 (API endpoints — can run in parallel with scaffold)
P3-008                             (tests — after all API endpoints done)
P3-009 → P3-010 → P3-011          (core pages — dashboard, list, detail)
P3-012 → P3-013 → P3-014          (operational pages — dispatch, materials, engineers)
P3-015 → P3-016                   (admin pages — webhooks, API keys)
P3-017                             (reports — last, depends on volume of real data)
P3-018                             (deploy — after all pages verified)
```
