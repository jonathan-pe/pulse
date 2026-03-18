# ADR-004: Migrate from Local PostgreSQL to Supabase

## Status

**Proposed** - Migration guide prepared, awaiting production deployment

## Context

Pulse currently uses a local PostgreSQL database (via Docker Compose) for development and requires manual deployment of a production PostgreSQL instance. This approach has several limitations:

- Requires separate database hosting and management
- Manual backup/restore processes
- No built-in connection pooling
- Developer setup complexity with Docker
- Scaling and replication require manual configuration
- No built-in admin UI for database inspection

Supabase offers a hosted PostgreSQL solution with:

- Managed database with automatic backups
- Built-in connection pooling (port 6543)
- Direct connection for migrations (port 5432)
- Web-based database management UI
- Free tier suitable for development/small production
- Seamless scaling without infrastructure changes

### Decision Drivers

- Reduce operational complexity of database management
- Improve developer onboarding (no Docker required)
- Enable connection pooling for better performance
- Get automatic backups and point-in-time recovery
- Maintain Prisma compatibility (Supabase is PostgreSQL)

## Decision

Migrate to **Supabase** hosted PostgreSQL using:

1. **Connection pooler** (port 6543) for application queries via `DATABASE_URL`
2. **Direct connection** (port 5432) for Prisma migrations via `DIRECT_URL`

### Migration Approach

- Update environment variables in all deployment environments
- Run Prisma migrations against Supabase using `DIRECT_URL`
- Optional: Export/import existing data or start fresh with seed
- Deploy application with updated connection strings

### Alternatives Considered

| Option                    | Rejected Because                                     |
| ------------------------- | ---------------------------------------------------- |
| Self-hosted PostgreSQL    | Requires infrastructure management, backups, scaling |
| Neon                      | Less mature ecosystem, fewer features than Supabase  |
| PlanetScale               | MySQL-based, would require schema changes            |
| Railway/Render PostgreSQL | Higher cost at scale, less feature-rich              |

## Consequences

### Positive

- ✅ **Zero infrastructure management** - Supabase handles backups, updates, scaling
- ✅ **Built-in connection pooling** - Better performance under load
- ✅ **Web-based admin UI** - Easy database inspection and queries
- ✅ **Automatic backups** - Point-in-time recovery without configuration
- ✅ **Simplified dev setup** - No Docker required for local development
- ✅ **Free tier suitable** - Development and small production workloads
- ✅ **Seamless scaling** - Can upgrade plan without migration

### Negative

- ⚠️ **Vendor lock-in (mild)** - Supabase-specific features if adopted later
- ⚠️ **Network latency** - Remote database vs. co-located local instance
- ⚠️ **Connection limits** - Free tier has connection restrictions
- ⚠️ **Cost at scale** - Paid tiers required for high traffic

### Neutral

- 📋 **Standard PostgreSQL** - Can migrate away easily if needed
- 📋 **Prisma compatibility** - No schema changes required
- 📋 **Two connection strings** - Must manage both pooler and direct URLs

## Migration Guide

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Find the **Connection String** section
4. You'll need two connection strings:
   - **Connection pooling** (for `DATABASE_URL`) - Uses port 6543
   - **Direct connection** (for `DIRECT_URL`) - Uses port 5432

Example:

```bash
# Connection pooling (for queries)
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Direct connection (for migrations)
postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

## Step 2: Update Environment Variables

Update both `packages/db/.env` and `apps/api/.env`:

```bash
# Connection pooler for queries (transaction mode)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"

# Direct connection for migrations
DIRECT_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
```

**Important:**

- Replace `[password]` with your actual database password
- Replace `[project-ref]` with your Supabase project reference
- Replace `[region]` with your project's region

## Step 3: Run Migrations on Supabase

```bash
# Generate Prisma Client with new connection
pnpm db:generate

# Deploy migrations to Supabase
pnpm db:migrate
```

Prisma will use `DIRECT_URL` for migrations.

## Step 4: (Optional) Migrate Existing Data

If you have data in your local database you want to keep:

### Option A: Export/Import via pg_dump

```bash
# 1. Export from local database
docker exec -t pulse-postgres pg_dump -U pulse pulse_dev > backup.sql

# 2. Import to Supabase (replace with your direct connection string)
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" < backup.sql
```

### Option B: Use Prisma Studio

1. Open local Prisma Studio: `pnpm db:studio`
2. Export data as needed
3. Update `DATABASE_URL` to point to Supabase
4. Open Prisma Studio again and import data

### Option C: Fresh Start

Just seed your Supabase database:

```bash
# With DATABASE_URL pointing to Supabase
pnpm db:seed
```

## Step 5: Update Production Environment

For your deployed API (Vercel, Railway, etc.):

1. Add environment variables in your hosting platform:

   ```text
   DATABASE_URL=<supabase-pooler-url>
   DIRECT_URL=<supabase-direct-url>
   ```

2. Deploy your application

## Step 6: Keep Local Development

You can still use local PostgreSQL for development:

1. Keep two sets of `.env` files:
   - `.env` - Points to Supabase (for production)
   - `.env.local` - Points to local database (for development)

2. Use `.env.local` when developing:

   ```bash
   # In packages/db and apps/api
   cp .env .env.production
   cp .env.local .env
   ```

## Verification

After migration, verify everything works:

```bash
# 1. Check Prisma can connect
pnpm db:generate

# 2. Open Prisma Studio
pnpm db:studio
# Should show your Supabase data

# 3. Test your API
pnpm dev:api
# Make some API calls
```

## Rollback

If something goes wrong:

```bash
# 1. Revert environment variables
DATABASE_URL="postgresql://pulse:pulse_dev_password@localhost:5432/pulse_dev"
# Comment out DIRECT_URL

# 2. Start local database
pnpm db:up

# 3. Regenerate client
pnpm db:generate
```

## Performance Tips

### Connection Pooling

Supabase uses PgBouncer for connection pooling. Recommended settings:

- Use **Transaction mode** for pooler (port 6543)
- Set reasonable connection limits
- Monitor your connection count in Supabase dashboard

### Prisma Configuration

In `packages/db/prisma/schema/base.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
  // Optional: For better performance
  previewFeatures = ["relationJoins"]
}
```

## Supabase Features to Explore

Once migrated, you can leverage:

- **Row Level Security (RLS)** - Fine-grained access control
- **Realtime subscriptions** - Live database updates
- **Storage** - File uploads
- **Auth** - Alternative to Clerk (if needed)
- **Edge Functions** - Serverless functions

## Cost Considerations

- **Free tier**: 500 MB database, 2 GB bandwidth
- **Pro tier** ($25/mo): 8 GB database, 50 GB bandwidth
- **Pause inactive projects**: Free tier projects pause after 1 week of inactivity

## Troubleshooting

### Connection Timeout

```bash
# Check if your IP is allowed
# Supabase → Settings → Database → Connection Pooling → Restrict IPs
```

### SSL Required

Supabase requires SSL. Prisma handles this automatically, but if you get SSL errors:

```bash
DATABASE_URL="postgresql://...?sslmode=require"
```

### Migration Conflicts

If migrations fail due to existing tables:

```bash
# Option 1: Drop all tables in Supabase (DESTRUCTIVE!)
# Use Supabase SQL editor to drop tables

# Option 2: Mark migrations as applied
pnpm dlx prisma migrate resolve --applied <migration-name>
```

## Support

- [Supabase Docs](https://supabase.com/docs)
- [Prisma with Supabase](https://www.prisma.io/docs/guides/database/supabase)
- [Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
