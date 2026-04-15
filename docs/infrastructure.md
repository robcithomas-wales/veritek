# Infrastructure

## Supabase — Auth & Database

**Project:** Veritek Dev
**Project ref:** `mpyzgyitzzppvoqltrwb`
**Region:** eu-west-2
**URL:** `https://mpyzgyitzzppvoqltrwb.supabase.co`

### Connection strings
- **Transaction pooler** (runtime): `postgresql://postgres.mpyzgyitzzppvoqltrwb:[password]@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true`
- **Direct** (migrations): `postgresql://postgres:[password]@db.mpyzgyitzzppvoqltrwb.supabase.co:5432/postgres`

> Note: Port 5432 (direct connection) is blocked on the Veritek office network. Run migrations via the Supabase SQL editor or from Railway/a machine without the restriction. Port 6543 (pooler) is accessible everywhere.

### Schema
Applied manually via Supabase SQL editor (port 5432 blocked locally). For future migrations, generate SQL with:
```bash
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script
```
Then paste into the Supabase SQL editor and run.

---

## Railway — API Hosting

**Project ID:** `920a40a3-2310-4405-9ad8-b681351e6973`
**Project name:** Veritek
**Environment:** production
**GitHub:** connected to `@veritek/api` (monorepo root)
**Public URL:** `https://veritekapi-production.up.railway.app`

### Services
| Service | Purpose | Deploy? |
|---|---|---|
| `@veritek/api` | NestJS REST API | Yes |
| `@veritek/mobile` | Expo mobile app | No — delete this service. Mobile apps run on-device, not on Railway. |

### Environment variables to set in Railway (`@veritek/api`)
```
DATABASE_URL
DIRECT_URL
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET
API_KEY_HASH_SECRET
WEBHOOK_SIGNING_SECRET
PORT             (Railway sets this automatically)
NODE_ENV=production
```

### Build configuration
Railway should be pointed at `apps/api` within the monorepo with:
- **Root directory:** `/` (monorepo root)
- **Build command:** `pnpm --filter @veritek/api build`
- **Start command:** `pnpm --filter @veritek/api start`

---

## Vercel — Back Office Portal

Not yet configured. Required for Phase 3.

**Planned project name:** Veritek Web
**GitHub:** to be connected to `apps/web`
**Environment variables needed:**
```
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
